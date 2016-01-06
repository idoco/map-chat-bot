var vertx = require('./vertxbus');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var ElizaBot = require('./elizabot');

var possibleLocations = [
    {lat: 64.1417151, lng: -21.9318432},
    {lat: 41.7269933, lng: 44.7627975},
    {lat: 32.6575252, lng: -16.912832}
];

var randomAnswers = ["Bazinga!", "Did you see this? http://www.theuselessweb.com/"];

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
        timeout = null,
        sessionId;

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
        text = text.length > 255 ? text.slice(0,255) : text;

        if (timeout){
            clearTimeout(timeout);
        }

        timeout = setTimeout(function(){
            eventBus.publish("main", {
                lat: location.lat, lng: location.lng, text: text
            });
        }, text.length * 200);
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
                if (Math.random() >0.99){
                    answer = randomAnswers[Math.floor(Math.random()*randomAnswers.length)];
                }
                publish(answer);
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
