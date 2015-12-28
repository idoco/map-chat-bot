var vertx = require('./vertxbus');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var ElizaBot = require('./elizabot');

var possibleLocations = [
    {lat: 64.1417151, lng: -21.9318432},
    {lat: 41.7269933, lng: 44.7627975},
    {lat: 32.6575252, lng: -16.912832}
];
var location = possibleLocations[Math.floor(Math.random()*possibleLocations.length)];
var eliza = new ElizaBot();
init();

function init() {
    var eventBus = new vertx.EventBus("http://chatmap.cloudapp.net/chat");
    eventBus.onopen = onopen;
    eventBus.onclose = onclose;
    eventBus.retryCount = 10;
}

function onopen () {
    var eventBus = this,
        sessionId,
        lastMessageTime = 0;

    eventBus.registerHandler("main", function (msg) {
        if (sessionId) {
            handleMessage(msg);
        } else {
            sessionId = msg.newSessionId;
            console.log("First message received. sessionId is [" + sessionId + "]");
            publish("Hello world! :)");
        }
    });

    function publish(text) {
        var currentTime = new Date().getTime();
        if (currentTime - lastMessageTime < 1000) {
            console.log("Rate too high, dropping message");
            return;
        }
        eventBus.publish("main", {
            lat: location.lat, lng: location.lng, text: text
        });
        lastMessageTime = currentTime;
    }

    function handleMessage(msg) {
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
}

function onclose () {
    if (this.retryCount) {
        this.retryCount--;
        console.log('Connection lost, scheduling reconnect');
        setTimeout(init, 1000);
    } else{
        console.log('Connection lost, please restart :( ');
    }
}
