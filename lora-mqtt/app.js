// JavaScript code for the LoRa Demo example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

// Timer that updates the displayed list of devices.
//var mUpdateTimer = null

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
  var clientID = device.uuid
  mClient = new Paho.MQTT.Client(
    'vernemq.evothings.com',
    8084,
    clientID)
  mClient.onConnectionLost = onConnectionLost
  mClient.onMessageArrived = onMessageArrived
  var options =
  {
    userName: 'anon',
    password: 'ymous',
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
      selection:
      {
          mode: 'x'
      },
      HtmlText: false,
      title: title
  }
  Flotr.draw(container, [data], options)
}

var mCurrentTimeStamp = null
var mSensorData = {}

function updateSensorData(payload)
{
  mCurrentTimeStamp = new Date(payload.metadata.time).getTime()
  updateSensor('message-counter', 'Messages', payload.counter)
  updateSensor('rssi', 'RSSI', payload.metadata.gateways[0].rssi)
  updateSensor('snr', 'SNR', payload.metadata.gateways[0].snr)
  updateSensor('frequency', 'Frequency', payload.metadata.frequency)
}

function updateSensor(sensorID, label, value)
{
  // Ensure array exists for sensor.
  if (!mSensorData[sensorID]) { mSensorData[sensorID] = [] }
  
  // Add data point.
  mSensorData[sensorID].push([mCurrentTimeStamp, value])

  // Keep max 100 data points.
  if (mSensorData[sensorID].length > 100) mSensorData[sensorID].shift()
  
  // Draw sensor data.
  drawGraph(
    document.getElementById('graph-' + sensorID),
    mSensorData[sensorID],
    label)
}

// Call main function to initialise app.
main()

})();
