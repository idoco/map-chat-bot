var vertx = require('./vertxbus');
var ElizaBot = require('./elizabot');

var crg = require('country-reverse-geocoding').country_reverse_geocoding();

// Hack!
// I've changed node_modules/sockjs-client/lib/transport/websocket.js:32
// to - new WebsocketDriver(this.url, [], {headers: {Origin: 'http://idoco.github.io/map-chat/'}});
// inorder to add the origin header to the websocket registration. Otherwise it will be rejected by the map-chat server

var eliza = new ElizaBot();
var eb, sessionId, retryCount = 10;

function initialiseEventBus() {
    eb = new vertx.EventBus("http://chatmap.cloudapp.net/chat");

    eb.onopen = function () {
        eb.registerHandler("main", function (msg) {
            if (sessionId) {
                processMessage(msg);

            } else {
                sessionId = msg.newSessionId;
                console.log("First message received. sessionId is [" + sessionId + "]");
                publish("Hello world! :)");
            }
        });
    };

    eb.onclose = function () {
        if (retryCount) {
            retryCount--;
            console.log('Connection lost, scheduling reconnect');
            setTimeout(initialiseEventBus, 1000);
        } else{
            console.log('Connection lost, please restart :( ');
        }
    };
}

initialiseEventBus();

function publish(text) {
    eb.publish("main", {
        lat: 64.1417151, lng: -21.9318432, text: text
    });
}

function processMessage(msg) {
    var country = crg.get_country(msg.lat, msg.lng);
    console.log("" + msg.sessionId + " from "+country.name+" : " + msg.text);

    if (msg.sessionId !== sessionId) { // not my message
        var userFirstMessage = !msg.text;
        if (userFirstMessage) {
            publish("Hi there "+country.name + "!")
        } else {
            var answer = eliza.transform(msg.text);
            setTimeout(function(){
                publish(answer);
            }, 1500);
        }
    }
}





