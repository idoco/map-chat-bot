var vertx = require('./vertxbus');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var ElizaBot = require('./elizabot');

// Hack!
// I've changed node_modules/sockjs-client/lib/transport/websocket.js:32
// to - new WebsocketDriver(this.url, [], {headers: {Origin: 'http://idoco.github.io/map-chat/'}});
// inorder to add the origin header to the websocket registration. Otherwise it will be rejected by the map-chat server

var eliza = new ElizaBot();
var eb, sessionId, retryCount = 10;

var possibleLocations = [
    {lat: 64.1417151, lng: -21.9318432},
    {lat: 41.7269933, lng: 44.7627975},
    {lat: 32.6575252, lng: -16.912832}
];
var location = possibleLocations[Math.floor(Math.random()*possibleLocations.length)]

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

var rateLimitTimer = 0;
function publish(text) {
    var currentTime = new Date().getTime();
    if (currentTime - rateLimitTimer < 1000) {
        console.log("Rate too high, dropping message");
        return;
    }
    eb.publish("main", {
        lat: location.lat, lng: location.lng, text: text
    });
    rateLimitTimer = currentTime;
}

function processMessage(msg) {
    var myMessage = msg.sessionId === sessionId;

    if (!myMessage) { // not my message
        var country = crg.get_country(msg.lat, msg.lng);
        var countryName = country && country.name ? country.name : 'unknown';
        if (msg.text) {
            console.log(countryName + " : " + msg.text);
        }

        var userFirstMessage = !msg.text;
        if (userFirstMessage) {
            publish("Hi there "+countryName + "!")
        } else {
            var answer = eliza.transform(msg.text);
            setTimeout(function(){
                publish(answer);
            }, 3000);
        }
    } else {
        console.log("myBot : " + msg.text);
    }
}





