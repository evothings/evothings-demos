// JavaScript code for the LoRa Demo example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

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
}

function onConnect()
{
  // Start update timer.
  mUpdateTimer = setInterval(updateSensorData, 100)

  disconnect()
  connect()

  // Update UI.
  showMessage('Connecting')
}

var mConnected = false
var mClient = null
var mPublishTopic = 'evothings.com/lorademo/sensordata'
var mSubscribeTopic = 'evothings.com/lorademo/sensordata'

function connect()
{
  var clientID = generateUUID()
  mClient = new Paho.MQTT.Client(
    'vernemq.evothings.com',
    8084,
    clientID)
  mClient.onConnectionLost = onConnectionLost
  mClient.onMessageArrived = onMessageArrived
  var options =
  {
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
}

function onConnectSuccess(context)
{
	mConnected = true
	subscribe()
	showMessage('Connected')
	publish({ message: 'Hello' })
}

function onConnectFailure(error)
{
  console.log('Failed to connect: ' + error)
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
	mClient.subscribe(mSubscribeTopic);
	console.log('Subscribed: ' + mSubscribeTopic);
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

var mCurrentTime = new Date('2017-01-21T23:01:26.573Z').getTime()
var mSensorData1 = []
var mCurrentDataPoint1 = 0
var mSensorData2 = []
var mCurrentDataPoint2 = 0

function updateSensorData()
{
  updateSensorData1()
  updateSensorData2()
}

function updateSensorData1()
{
  mCurrentDataPoint1 += (Math.random() * 2) - 1
  mSensorData1.push([mCurrentTime, mCurrentDataPoint1])
  if (mSensorData1.length > 100) mSensorData1.shift()
  mCurrentTime += 100
  drawGraph(
    document.getElementById('graph1'),
    mSensorData1,
    'Sensor 1')
}

function updateSensorData2()
{
  mCurrentDataPoint2 += (Math.random() * 4) - 2
  mSensorData2.push([mCurrentTime, mCurrentDataPoint2])
  if (mSensorData2.length > 100) mSensorData2.shift()
  mCurrentTime += 100
  drawGraph(
    document.getElementById('graph2'),
    mSensorData2,
    'Sensor 2')
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
