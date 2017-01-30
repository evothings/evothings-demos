// JavaScript code for the LoRa Demo example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

// Timestamp for sensor data that arrives over MQTT.
var mCurrentTimeStamp = null

// Object that holds sensor data.
var mSensorData = {}

// Map object.
var mMap = null

// Map marker.
var mMapMarker = null

// Initial values for device marker (Sodaq)
var mLat = 59.452742
var mLng = 18.289192

// Timer that updates the displayed list of devices.
var mUpdateTimer = null

function main()
{
  $(function()
  {
    // When document has loaded we attach FastClick to
    // eliminate the 300 ms delay on click events.
    FastClick.attach(document.body)

    // Event listener for Back button.
    $('.app-back').on('click', function() { history.back() })

    // Call device ready directly (this app can work without Cordova).
    onDeviceReady()
  })
/*
  // Event handler called when Cordova plugins have loaded.
  document.addEventListener(
    'deviceready',
    onDeviceReady,
    false)
*/
}

function onDeviceReady()
{
  // Un-gray buttons.
  $('button.app-connect')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')
  $('button.app-disconnect')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--deep-orange-900')

  // Attach event listeners.
  $('.app-connect').on('click', onConnect)
  $('.app-disconnect').on('click', onDisconnect)

  $('.app-show-sensors').on('click', onShowSensors)
  $('.app-show-map').on('click', onShowMap)

  // Show initial page.
  //setTimeout(onShowMap, 100)
}

function onConnect()
{
  // Start update timer.
  //mUpdateTimer = setInterval(updateSensorData, 2000)

  disconnect()
  connect()

  // Update UI.
  showMessage('Connecting')
}

var mConnected = false
var mClient = null
var mPublishTopic = 'evothingstest1/sensordata' // For debugging
var mSubscribeTopic = 'evothingstest1/#'

function connect()
{
  var clientID = generateUUID()
  /*
  mClient = new Paho.MQTT.Client(
    'vernemq.evothings.com',
    8084,
    clientID)
  */
  mClient = new Paho.MQTT.Client(
    'm20.cloudmqtt.com',
    34667,
    clientID)
  mClient.onConnectionLost = onConnectionLost
  mClient.onMessageArrived = onMessageArrived
  var options =
  {
    userName: 'erdwahoc',
    password: 'DjdQXUQ7kaV_',
    useSSL: true,
    onSuccess: onConnectSuccess,
    onFailure: onConnectFailure
  }
  mClient.connect(options)
}

function onMessageArrived(message)
{
	var payload = JSON.parse(message.payloadString)
	console.log('got obj: ' + message.payloadString)
  //console.log('got obj 2: ' + JSON.stringify(payload))
  //console.log('got message: ' + JSON.stringify(message.payloadString))
  updateSensorData(payload)
}

function onConnectSuccess(context)
{
	mConnected = true
	subscribe()
	showMessage('Connected')
	// For debugging: publish({ message: 'Hello' })
}

function onConnectFailure(error)
{
  console.log('Failed to connect: ' + JSON.stringify(error))
	showMessage('Connect failed')
}

function onConnectionLost(responseObject)
{
	console.log("Connection lost: " + responseObject.errorMessage)
	showMessage('Connection was lost')
	mConnected = false;
}

function publish(jsonObj)
{
	var message = new Paho.MQTT.Message(JSON.stringify(jsonObj))
	message.destinationName = mPublishTopic
	mClient.send(message)
}

function subscribe()
{
	mClient.subscribe(mSubscribeTopic)
	console.log('Subscribed: ' + mSubscribeTopic)
}

function unsubscribe()
{
	mClient.unsubscribe(mSubscribeTopic)
	console.log('Unsubscribed: ' + mSubscribeTopic)
}

function disconnect()
{
	if (mClient) mClient.disconnect()
	mConnected = false
	mClient = null
}

function onDisconnect()
{
  disconnect()

  // Stop update timer.
  if (mUpdateTimer)
  {
    clearInterval(mUpdateTimer)
    mUpdateTimer = null
  }

  // Update UI.
  hideDrawerIfVisible()
}

function onShowSensors()
{
  $('.app-page-map').hide()
  $('.app-page-sensors').show()
  hideDrawerIfVisible()
}

function onShowMap()
{
  $('.app-page-sensors').hide()
  $('.app-page-map').show()
  hideDrawerIfVisible()
  loadMap()
}

function loadMap()
{
  if (mMap) return

  mMap = L.map('my-map', { maxZoom: 25 })

  /*
  setTimeout(function()
  {
    mMap.setView([51.505, -0.09], 13)
  //.setView(thingsLatLng, 20)
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mMap)
  }, 1000)
*/
  
  mMap.setView([mLat, mLng], 15)

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(mMap)

  updateMapMarker()
}

function updateMapMarker()
{
  if (!mMap) return

  if (!mMapMarker)
  {
    mMapMarker = L.marker([mLat, mLng]).addTo(mMap)
  }
  else
  {
    mMapMarker.setLatLng([mLat, mLng])
  }
}

function hideDrawerIfVisible()
{
  if ($('.mdl-layout__drawer').hasClass('mdl-layout__drawer is-visible'))
  {
    document.querySelector('.mdl-layout').MaterialLayout.toggleDrawer()
  }
}

function showMessage(message)
{
  document.querySelector('.mdl-snackbar').MaterialSnackbar.showSnackbar(
  {
    message: message
  })
}

function drawGraph(container, data, title)
{
  var options =
  {
      xaxis:
      {
          mode: 'time'
      },
      /*selection:
      {
          mode: 'x'
      },*/
      HtmlText: false,
      title: title
  }
  Flotr.draw(container, [data], options)
}

function updateSensorData(payload)
{
  // Set current timestamp.
  mCurrentTimeStamp = new Date(payload.metadata.time).getTime()

  // Check device id.
  if (payload.dev_id == 'uno-rfclick-1')
  {
    try {
      var x = JSON.parse(atob(payload.payload_raw)).x
      updateSensor('sensor-x', 'Sensor X', x)
    }
    catch (error) {
      console.log('Error parsing JSON payload (Uno): ' + error)
    }
    updateSensor('rssi', 'RSSI', payload.metadata.gateways[0].rssi)
    updateSensor('snr', 'SNR', payload.metadata.gateways[0].snr)
    updateSensor('frequency', 'Frequency', payload.metadata.frequency)
  }

  if (payload.dev_id == 'sodaq-onev2-1')
  {
    try {
      var elements = atob(payload.payload_raw).split(' ')
      mLat = Number(elements[0]) / 1000000
      mLng = Number(elements[1]) / 1000000
      updateMapMarker()
    }
    catch (error) {
      console.log('Error parsing JSON payload (Sodaq): ' + error)
    }
  }
}

function updateSensor(sensorID, label, value)
{
  // Ensure array exists for sensor.
  if (!mSensorData[sensorID]) { mSensorData[sensorID] = [] }
  
  // Add data point.
  mSensorData[sensorID].push([mCurrentTimeStamp, value])

  // Keep max 50 data points.
  if (mSensorData[sensorID].length > 50) mSensorData[sensorID].shift()
  
  // Draw sensor data.
  drawGraph(
    document.getElementById('graph-' + sensorID),
    mSensorData[sensorID],
    label)
}

// Thanks to http://stackoverflow.com/a/8809472/4940311
function generateUUID()
{
	var d = new Date().getTime()
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function(c)
		{
			var r = (d + Math.random()*16) % 16 | 0
			d = Math.floor(d/16)
			return (c == 'x' ? r : (r&0x3|0x8)).toString(16)
		})
}

// Call main function to initialise app.
main()

})();
