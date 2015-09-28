
var app = {};

app.initialize = function() {
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
}

// Called when device plugin functions are ready for use.
app.onDeviceReady =  function() {
	app.connect();
}

app.connect = function()
{
	document.getElementById('ArduinoStatus').innerHTML = 'Connecting...'
	console.log("create")
	chrome.sockets.tcp.create({}, function(createInfo)
	{
		var address = document.getElementById('ArduinoIpAddress').getAttribute('value')
		console.log("connect "+address)
		app.socketId = createInfo.socketId
		chrome.sockets.tcp.connect(
			app.socketId,
			address,
			3300,
			function(result)
			{
				console.log("result: "+result)
				var success = (0 === result)
				if(success) {
					document.getElementById('ArduinoStatus').innerHTML = 'Connected to the Arduino'
					console.log("Connected to the Arduino")
					chrome.sockets.tcp.send(app.socketId, new Uint8Array([64]).buffer, function(sendInfo)
					{
						console.log("sent 0")
					})
					chrome.sockets.tcp.onReceive.addListener(app.onReceive)
					chrome.sockets.tcp.onReceiveError.addListener(app.onReceiveError)
				} else {
					//$('#ArduinoStatus').html('Connection error: '+result)
				}
			}
		)
	})
}

app.disconnect = function()
{
	document.getElementById('ArduinoStatus').innerHTML = 'Disconnecting...'
	//console.log("setPaused...")
	//chrome.sockets.tcp.send(app.socketId, new Uint8Array([65]).buffer, function(sendInfo)
	//chrome.sockets.tcp.setPaused(app.socketId, true, function()
	//{
		console.log("close...")
		/*chrome.sockets.tcp.send(app.socketId, new Uint8Array([65]).buffer, function(sendInfo)
		{
		console.log("sent 1.")
		})*/
		chrome.sockets.tcp.close(app.socketId, function()
		{
			console.log("closed.")
			document.getElementById('ArduinoStatus').innerHTML = 'Disconnected'
		})
		/*chrome.sockets.tcp.send(app.socketId, new Uint8Array([65]).buffer, function(sendInfo)
		{
		console.log("sent 2.")
		})*/
	//})
}

app.onReceiveError = function(info)
{
	document.getElementById('ArduinoStatus').innerHTML = 'Read error: '+info.resultCode
}

app.inputLine = ''

app.onReceive = function(info)
{
	var data = app.bufferToString(info.data)
	//console.log("onReceive: "+data)
	for(var i=0; i<data.length; i+=1)
	{
		var c = data.charAt(i)
		if (c == '\n')
		{
			//console.log('  end of data.)
			// We have read all data, call the handler.
			var inputLine = app.inputLine
			app.inputLine = ''
			if(inputLine.length > 5) {
				console.log("WTF: "+evothings.util.typedArrayToHexString(info.data))
			}
			app.handleInputLine(inputLine)
		}
		else
		{
			//console.log('  got data: ' + c)
			// We got more data, continue to read.
			app.inputLine += c
		}
	}
}

app.handleInputLine = function(inputLine)
{
	var opcode = inputLine.charAt(0)
	if(opcode == 'A') {
		var value = inputLine.slice(1)

		// Display value in input field.
		document.getElementById('ArduinoStatus').innerHTML = 'Analog value is: ' + value

		// Convert analog value to percent value between 1 and 100.
		/*var width = parseInt(value) / 10
		width = Math.max(1, width)
		width = Math.min(100, width)
		$('#ArduinoAnalogValue').css('width', width + '%')*/

		// clamp to -90 < x < 90.
		lander.setRotation((value / 1023.0) * 180 - 90)
	}
	else if(opcode == 'D')
	{
		var value = inputLine.slice(1)
		//$('#DigitalStatus').html(value)
		if(gameState == PLAYING) {
			if(value == '0') {
				lander.thrust(1);
			} else if(value == '1') {
				lander.thrust(0);
			}
		} else if(value == '0') {
			newGame();
		}
	}
	else
	{
		console.log("Unknown input: "+evothings.util.typedArrayToHexString(app.stringToBuffer(inputLine)))
	}
}

app.bufferToString = function(buffer)
{
	return String.fromCharCode.apply(null, new Uint8Array(buffer))
}

app.stringToBuffer = function(string)
{
	var buffer = new ArrayBuffer(string.length)
	var bufferView = new Uint8Array(buffer);
	for (var i = 0; i < string.length; ++i)
	{
		bufferView[i] = string.charCodeAt(i) //string[i]
	}
	return buffer
}

app.initialize();
