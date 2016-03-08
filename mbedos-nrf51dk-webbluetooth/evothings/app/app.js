;(() => {

// Application object that exposes global functions.
window.app = {}

// UUIDs, see header files LEDService.h and ButtonService.h
var ledServiceUUID = '0000a000-0000-1000-8000-00805f9b34fb'
var ledCharacteristicUUID = '0000a001-0000-1000-8000-00805f9b34fb'
var buttonServiceUUID = '0000a002-0000-1000-8000-00805f9b34fb'
var buttonCharacteristicUUID = '0000a003-0000-1000-8000-00805f9b34fb'

// Variables.
var gattServer
var ledService
var buttonService
var vibrationTimer
var pollTimer

function showInfo(info) {
	document.getElementById('info').innerHTML = info	
}

function log(message) {
	console.log(message)
}

function init() {
  console.log('@@@ app.init')
}

document.addEventListener('deviceready', init, false)

app.start = () => {
	showInfo('Started polling')
	app.poll()
}

app.nextPoll = () => {
  pollTimer = setTimeout(() => { app.poll() }, 1000)
}

app.startVibration = () => {
  if (!vibrationTimer) {
	  vibrationTimer = setInterval(() => { app.vibrate() }, 300)
	}
}

app.stopVibration = () => {
  if (vibrationTimer) {
  	clearInterval(vibrationTimer)
  	vibrationTimer = null
  }
}

app.vibrate = () => {
  navigator.notification.vibrate(20)
}

app.poll = () => {
  showInfo('Request device...')
  bleat.requestDevice({
	  filters:[{ name: 'VIBER' }]
  })
  .then(device => {
    app.device = device
	  log('Found device: ' + device.name)
	  showInfo('Found ' + device.name)
	  return device.gatt.connect();
  })
  .then(server => {
	  gattServer = server
	  log('nRF51DK connected:  ' + gattServer.connected)
	  showInfo('Connected to VIBER')
	  return gattServer.getPrimaryService(buttonServiceUUID)
  })
  .then(service => {
	  // Get button characteristic.
	  log('Got button service')
	  showInfo('Got button service')
	  buttonService = service
	  return buttonService.getCharacteristic(buttonCharacteristicUUID)
  })
  .then(characteristic => {
	  // Read button value and then disconnect.
	  return characteristic.readValue()
  })
  .then(data => {
    var shouldVibrate = data.getInt8(0, true) == 1
    app.disconnect()
    log('Button pressed: ' + shouldVibrate)
    if (shouldVibrate) {
	    app.startVibration()
    } else {
      app.stopVibration()
    }
    showInfo('Done poll')
    app.nextPoll()
  })
  .catch(error => {
	  log(error)
    app.disconnect()
    showInfo('Disconnected on error')
    app.nextPoll()
  });
}

app.disconnect = () => {
  if (gattServer != null) {
    if (gattServer.connected) {
      gattServer.disconnect()
      log("Disconnected")
    }
  }
}    

app.stop = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  app.disconnect()
  app.stopVibration()
	showInfo('Stopped polling')
}

})();
