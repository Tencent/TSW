const WebSocket = require('ws');
const http = require('http');
const originCheck = require('./http.origin.js');

class webSocketServer extends WebSocket.Server {
    handleUpgrade(req, socket, head, cb) {
        if (originCheck(req) !== false) {
            super.handleUpgrade(req, socket, head, cb);
        } else {
            abortConnection(socket, 403);
        }
    }
}

module.exports = webSocketServer;

function abortConnection(socket, code, message) {
    if (socket.writable) {
        message = message || http.STATUS_CODES[code];
        socket.write(
            `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
            'Connection: close\r\n' +
            'Content-type: text/html\r\n' +
            `Content-Length: ${Buffer.byteLength(message)}\r\n` +
            '\r\n' + message
        );
    }

    socket.destroy();
}
