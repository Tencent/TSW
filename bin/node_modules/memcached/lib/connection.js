"use strict";

var EventEmitter = require('events').EventEmitter
  , spawn = require('child_process').spawn
  , Utils = require('./utils')
  , util = require('util');

exports.IssueLog = IssueLog;         // connection issue handling
exports.Available = ping;            // connection availablity

function ping (host, callback) {
  var pong = spawn('ping', [host]);

  pong.stdout.on('data', function stdoutdata (data) {
    callback(false, data.toString().split('\n')[0].substr(14));
    pong.kill();
  });

  pong.stderr.on('data', function stderrdata (data) {
    callback(new Error(data.toString().split('\n')[0].substr(14)), false);
    pong.kill();
  });
}

function IssueLog (args) {
  this.config = args;
  this.messages = [];
  this.failed = false;
  this.locked = false;
  this.isScheduledToReconnect = false;

  this.totalFailures = 0;
  this.retry = 0;
  this.totalReconnectsAttempted = 0;
  this.totalReconnectsSuccess = 0;

  Utils.merge(this, args);
  EventEmitter.call(this);
}

util.inherits(IssueLog, EventEmitter);
var issues = IssueLog.prototype;

issues.log = function log (message) {
  var issue = this;

  this.failed = true;
  this.messages.push(message || 'No message specified');

  // All failures must occur within `failuresTimeout` ms from the initial
  // failure in order for node to be disconnected or removed.
  if (this.failures && this.failures == this.config.failures)
    this.failuresResetId = setTimeout(issue.failuresReset.bind(issue), this.failuresTimeout);

  if (this.failures && !this.locked) {
    this.locked = true;
    setTimeout(issue.attemptRetry.bind(issue), this.retry);
    return this.emit('issue', this.details);
  }

  if (this.failuresResetId) clearTimeout(this.failuresResetId);

  if (this.remove) return this.emit('remove', this.details);

  if (!this.isScheduledToReconnect) {
      this.isScheduledToReconnect = true;
      setTimeout(issue.attemptReconnect.bind(issue), this.reconnect);
  }
};

issues.failuresReset = function failuresReset() {
  //this.failures = this.config.failures;
  Utils.merge(this, JSON.parse(JSON.stringify(this.config)));
};

Object.defineProperty(issues, 'details', {
  get: function getDetails () {
    var res = {};

    res.server = this.server;
    res.tokens = this.tokens;
    res.messages = this.messages;

    if (this.failures) {
      res.failures = this.failures;
      res.totalFailures = this.totalFailures;
    } else {
      res.totalReconnectsAttempted = this.totalReconnectsAttempted;
      res.totalReconnectsSuccess = this.totalReconnectsSuccess;
      res.totalReconnectsFailed = this.totalReconnectsAttempted - this.totalReconnectsSuccess;
      res.totalDownTime = (res.totalReconnectsFailed * this.reconnect) + (this.totalFailures * this.retry);
    }

    return res;
  }
});

issues.attemptRetry = function attemptRetry () {
  this.totalFailures++;
  this.failures--;
  this.failed = false;
  this.locked = false;
};

issues.attemptReconnect = function attemptReconnect () {
  var issue = this;
  this.totalReconnectsAttempted++;
  this.emit('reconnecting', this.details);

  // Ping the server
  ping(this.tokens[1], function pingpong (err) {
    // still no access to the server
    if (err) {
      issue.messages.push(err.message || 'No message specified');
      return setTimeout(issue.attemptReconnect.bind(issue), issue.reconnect);
    }

    issue.emit('reconnected', issue.details);

    issue.totalReconnectsSuccess++;
    issue.messages.length = 0;
    issue.failed = false;
    issue.isScheduledToReconnect = false;

    // we connected again, so we are going through the whole cycle again
    Utils.merge(issue, JSON.parse(JSON.stringify(issue.config)));
  });
};
