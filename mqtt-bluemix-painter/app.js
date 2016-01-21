
/**
 * Object that holds application data and functions.
 */
var app = {};

// BEWARE: The three values below are for a test account expiring 2016-02-08.
// You need to edit these values if you want to test the app with your own
// Bluemix account!
var orgId = '8q7k23';
// The username/password is the API-key and the corresponding authentication token.
var userName = 'a-8q7k23-r3eqe3bunc';
var password = 'W5UlH3X7-)v8F-ngD7';


// Standard port for MQTT is 1883, encrypted 8883
var port = 8883;

app.connected = false;
app.ready = false;

// Simple function to generate a color from the device UUID
app.generateColor = function(uuid) {
	var code = parseInt(uuid.split('-')[0], 16)
	var blue = (code >> 16) & 31;
	var green = (code >> 21) & 31;
	var red = (code >> 27) & 31;
	return "rgb(" + (red << 3) + "," + (green << 3) + "," + (blue << 3) + ")"
}

app.initialize = function() {
	document.addEventListener(
		'deviceready',
		app.onReady,
		false);
}

app.onReady = function() {
	if (!app.ready) {
		app.color = app.generateColor(device.uuid); // Generate our own color from UUID
		// See
		// https://docs.internetofthings.ibmcloud.com/messaging/applications.html#/publishing-device-events#publishing-device-events
		app.pubTopic = 'iot-2/type/phone/id/' + device.uuid + '/evt/paint/fmt/json'; // We publish to our own device topic
		app.subTopic = 'iot-2/type/phone/id/+/evt/paint/fmt/json'; // We subscribe to all devices using "+" wildcard
		app.setupCanvas();
		app.setupConnection();
		app.ready = true;
	}
}

app.setupCanvas = function() {
	app.canvas = document.getElementById("canvas");
	app.ctx = app.canvas.getContext('2d');
	var left, top;
	{
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var curElement = canvas;
		do {
			totalOffsetX += curElement.offsetLeft;
			totalOffsetY += curElement.offsetTop;
		} while (curElement = curElement.offsetParent)
		app.left = totalOffsetX;
		app.top = totalOffsetY;
	}
	
	// We want to remember the beginning of the touch as app.pos
	canvas.addEventListener("touchstart", function(event) {
		// Found the following hack to make sure some Androids produce
		// continuous touchmove events.
		if (navigator.userAgent.match(/Android/i)) {
			event.preventDefault();
		}
		var t = event.touches[0];
		var x = Math.floor(t.clientX) - app.left;
		var y = Math.floor(t.clientY) - app.top;
		app.pos = {x:x, y:y};
	});
	
	// Then we publish a line from-to with our color and remember our app.pos
	canvas.addEventListener("touchmove", function(event) {
		var t = event.touches[0];
		var x = Math.floor(t.clientX) - app.left;
		var y = Math.floor(t.clientY) - app.top;
		if (app.connected) {
			var msg = JSON.stringify({from: app.pos, to: {x:x, y:y}, color: app.color})
			app.publish(msg);
		}
		app.pos = {x:x, y:y};
	});
}

app.setupConnection = function() {
	// The hostname has the organisation id as prefix:
	// '<orgid>.messaging.internetofthings.ibmcloud.com'
	var hostname = orgId + '.messaging.internetofthings.ibmcloud.com';
	// See https://docs.internetofthings.ibmcloud.com/messaging/applications.html
	// The clientId is of the form 'a:<orgid>:<appid>'.
	// <appid> must be unique per client so we add device.uuid to it
	var clientId = 'a:'+ orgId + ':painter' + device.uuid;
	app.client = new Paho.MQTT.Client(hostname, port, clientId);
  app.status("Connecting to " + hostname + ":" + port);
	app.client.onConnectionLost = app.onConnectionLost;
	app.client.onMessageArrived = app.onMessageArrived;
	var options = {
    useSSL: true,
    userName: userName,
    password: password,
    onSuccess: app.onConnect,
    onFailure: app.onConnectFailure
  }
	app.client.connect(options);
}

app.publish = function(json) {
	message = new Paho.MQTT.Message(json);
	message.destinationName = app.pubTopic;
	app.client.send(message);
};

app.subscribe = function() {
	app.client.subscribe(app.subTopic);
	console.log("Subscribed: " + app.subTopic);
}

app.unsubscribe = function() {
	app.client.unsubscribe(app.subTopic);
	console.log("Unsubscribed: " + app.subTopic);
}

app.onMessageArrived = function(message) {
	var o = JSON.parse(message.payloadString);
	app.ctx.beginPath();
	app.ctx.moveTo(o.from.x, o.from.y);
	app.ctx.lineTo(o.to.x, o.to.y);
	app.ctx.strokeStyle = o.color;
	app.ctx.stroke();
}

app.onConnect = function(context) {
	app.subscribe();
	app.status("Connected!");
	app.connected = true;
}

app.onConnectFailure = function(e){
    console.log("Failed to connect: " + e);
  }

app.onConnectionLost = function(responseObject) {
	app.status("Connection lost!");
	console.log("Connection lost: "+responseObject.errorMessage);
	app.connected = false;
}

app.status = function(s) {
	console.log(s);
	var info = document.getElementById("info");
	info.innerHTML = s;
}

app.initialize();

