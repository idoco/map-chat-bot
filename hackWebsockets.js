
// Hack!
// I've changed node_modules/sockjs-client/lib/transport/websocket.js:32
// to - new WebsocketDriver(this.url, [], {headers: {Origin: 'http://idoco.github.io/map-chat/'}});
// inorder to add the origin header to the websocket registration. Otherwise it will be rejected by the map-chat server

var fs = require('fs');

var webSocketJs = "node_modules/sockjs-client/lib/transport/websocket.js";
fs.readFile(webSocketJs, 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    if (data.search(/map-chat/g) == -1) {
        var result = data.replace(/new WebsocketDriver\(this.url\)/g,
            'new WebsocketDriver(this.url, [], {headers: {Origin: \'http://idoco.github.io/map-chat/\'}})');
    } else {
        result = data;
    }

    fs.writeFile(webSocketJs, result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});