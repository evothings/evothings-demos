// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

var mDevice = null;
var mTimer = null;
var mAccelerationSamples = [];

var MOTION_SERVICE = "00002000-0000-1000-8000-00805f9b34fb";
var MOTION_ACCELEROMETER = "00002001-0000-1000-8000-00805f9b34fb";

function initialize() {
  document.addEventListener("deviceready", onDeviceReady, false);
}

function showStatus(text) {
  console.log(text);
  document.getElementById("status").innerHTML = text;
}

function onDeviceReady() {
  // UI button actions.
  document.getElementById("connectButton")
    .addEventListener("click", onConnectButton, false);
  document.getElementById("disconnectButton")
    .addEventListener("click", disconnect, false);
  showStatus("Ready");
}

function onConnectButton() {

  // We must not be connected.
  if (mDevice) return;

  disconnect();

  searchForBondedDevice({
    name: 'HEXIWEAR',
    serviceUUIDs: [MOTION_SERVICE],
    onFound: connectToDevice,
    onNotFound: scanForDevice,
    });
}

function disconnect() {
  if (mTimer) {
    clearInterval(mTimer);
    mTimer = null;
  }
  if (mDevice) {
    evothings.ble.close(mDevice);
    mDevice = null;
    showStatus("Disconnected");
  }
}

function scanForDevice() {
  showStatus("Scanning...");

  // Start scanning. Two callback functions are specified.
  evothings.ble.startScan(
    onDeviceFound,
    onScanError);

  // This function is called when a device is detected, here
  // we check if we found the device we are looking for.
  function onDeviceFound(device) {
    if (isHexiwear(device)) {

      // Stop scanning.
      evothings.ble.stopScan();

      showStatus('Found HexiWear Sensor Tag')

      // Bond and connect.
      evothings.ble.bond(
        device,
        function(state) {
          // Android returns 'bonded' when bonding is complete.
          // iOS will return 'unknown' and show paring dialog
          // when connecting.
          if (state == 'bonded' || state == 'unknown') {
            connectToDevice(device);
          }
          else if (state == 'bonding') {
            showStatus('Bonding in progress');
          }
          else if (state == 'unbonded') {
            showStatus('Bonding aborted');
          }
        },
        function(error) {
          showStatus('Bond error: ' + error);
        });
    }
  }

  // Function called when a scan error occurs.
  function onScanError(error) {
    showStatus('Scan error: ' + error);
  }
}

function connectToDevice(device) {
  showStatus('Connecting to device...')

  // Save device.
  mDevice = device;

  evothings.ble.connectToDevice(
    device,
    onConnected,
    onDisconnected,
    onConnectError,
    { serviceUUIDs: [MOTION_SERVICE] });

  function onConnected(device)
  {
    showStatus('Connected');
    testIfBonded();
  }

  function onDisconnected(device)
  {
    showStatus('Device disconnected');
  }

  // Function called when a connect error or disconnect occurs.
  function onConnectError(error)
  {
    showStatus('Connect error: ' + error);

    // If we get Android connect error 133, we wait and try to connect again.
    // This can resolve connect problems on Android when error 133 is seen.
    // In a production app you may want to have a function for aborting or
    // maximising the number of connect attempts. Note that attempting reconnect
    // does not block the app however, so you can still do other tasks and
    // update the UI of the app.
    // Note: It can work better on Android to do a new scan rather than connect
    // again. Android may report the device as bonded, but fail to connect to it.
    // Scanning for the device initiates a new pairing process, and connect works.
    if (133 == error)
    {
      showStatus('Reconnecting...');
      setTimeout(
        function() {
          disconnect();
          scanForDevice();
        },
        1000);
    }
  }

  function testIfBonded()
  {
    // Read encrypted characteristic to test if device is bonded.
    // This will fail if not bonded.
    var service = evothings.ble.getService(mDevice, MOTION_SERVICE);
    var characteristic = evothings.ble.getCharacteristic(service, MOTION_ACCELEROMETER);
    evothings.ble.readCharacteristic(
      mDevice,
      characteristic,
      function(data)
      {
        // We are bonded. Continue to read device data.
        startNotifications();
      },
      function(errorCode)
      {
        // Not bonded.
        disconnect();
        showStatus('Device not bonded. Please Connect again.');
      });
  }
}

function isHexiwear(device) {
  //return device.name == "HEXIWEAR";
  return device.advertisementData.kCBAdvDataLocalName == "HEXIWEAR";
}

function startNotifications() {
  mTimer = setInterval(poll, 200);
}

function poll() {
  var service = evothings.ble.getService(mDevice, MOTION_SERVICE);
  var characteristic = evothings.ble.getCharacteristic(service, MOTION_ACCELEROMETER);
  evothings.ble.readCharacteristic(
    mDevice,
    characteristic,
    function(data) {
      var v = new Int16Array(data);
      var ax = v[0] / 100.0;
      var ay = v[1] / 100.0;
      var az = v[2] / 100.0;
      drawDiagram({ x: ax, y: ay, z: az });
    },
    function(errorCode) {
      // On Android we get read errors now and then. Log this to the console.
      console.log("readCharacteristic error: " + errorCode);
    });
}

function clearDiagram() {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  // Clear diagram canvas.
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Remove samples from array.
  mAccelerationSamples.length = 0;
}

// Draw diagram to canvas.
function drawDiagram(values) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  // Add recent values.
  mAccelerationSamples.push(values);

  // Remove data points that do not fit the canvas.
  if (mAccelerationSamples.length > canvas.width) {

    mAccelerationSamples.splice(0, (mAccelerationSamples.length - canvas.width));
  }

  // Value is an accelerometer reading between -1 and 1.
  function calcDiagramY(value){

    // Return Y coordinate for this value.
    var diagramY = ((value * canvas.height) / 4) + (canvas.height / 2);
    return diagramY;
  }

  function drawLine(axis, color) {

    context.strokeStyle = color;
    context.beginPath();
    var lastDiagramY = calcDiagramY(
      mAccelerationSamples[mAccelerationSamples.length - 1][axis]);
    context.moveTo(0, lastDiagramY);
    var x = 1;
    for (var i = mAccelerationSamples.length - 2; i >= 0; i--)
    {
      var y = calcDiagramY(mAccelerationSamples[i][axis]);
      context.lineTo(x, y);
      x++;
    }
    context.stroke();
  }

  // Clear background.
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw lines.
  drawLine('x', '#f00');
  drawLine('y', '#0f0');
  drawLine('z', '#00f');
}

/**
 * Search for bonded device with a given name.
 * Useful if the address is not known.
 */
function searchForBondedDevice(params)
{
  evothings.ble.getBondedDevices(
    // Success function.
    function(devices)
    {
      for (var i in devices)
      {
        var device = devices[i];
        if (device.name == params.name)
        {
          showStatus('Found bonded device: ' + device.name);
          params.onFound(device);
          return; // bonded device found
        }
      }
      params.onNotFound();
    },
    // Error function.
    function(error)
    {
      params.onNotFound();
    },
    { serviceUUIDs: params.serviceUUIDs });
}

initialize();

})(); // End of closure.
