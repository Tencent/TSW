const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const config = require('./config.js');

class webSocketServer extends WebSocket.Server {
    handleUpgrade(req, socket, head, cb) {
        const origin = req['headers']['origin'] || '';
        if (origin) {
            const obj = url.parse(origin);
            const host = req['headers']['host'];

            if (obj.host !== host) {
                const allowWebSocketOriginHost = config.allowWebSocketOriginHost || [];
                if (allowWebSocketOriginHost.length === 0) {
                    abortConnection(socket, 403);
                    return;
                }

                let i,
                    len,
                    v;
                for (i = 0, len = allowWebSocketOriginHost.length; i < len; i++) {
                    v = allowWebSocketOriginHost[i];

                    if (typeof v === 'string') {
                        if (v !== obj.host) {
                            abortConnection(socket, 403);
                            return;
                        }
                    } else if (typeof v === 'object') {
                        if (!v.test || (v.test && !v.test(obj.host))) {
                            abortConnection(socket, 403);
                            return;
                        }
                    }
                }
            }
        }

        super.handleUpgrade(req, socket, head, cb);
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
