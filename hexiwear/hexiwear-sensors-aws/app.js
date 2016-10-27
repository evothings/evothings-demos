// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

var mDevice = null;
var mTimer = null;
var mAwsKey = "hexiwear-accel";
var mAwsValue = "";

var INFO_SERVICE = "0000180a-0000-1000-8000-00805f9b34fb";
var INFO_MANUFACTURER = "00002a29-0000-1000-8000-00805f9b34fb";
var INFO_FIRMWARE = "00002a26-0000-1000-8000-00805f9b34fb";
var INFO_SERIAL = "00002a25-0000-1000-8000-00805f9b34fb";

var BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
var BATTERY_CHARACTERISTIC = "00002a19-0000-1000-8000-00805f9b34fb";

var MOTION_SERVICE = "00002000-0000-1000-8000-00805f9b34fb";
var MOTION_ACCELEROMETER = "00002001-0000-1000-8000-00805f9b34fb";
var MOTION_GYRO = "00002002-0000-1000-8000-00805f9b34fb";
var MOTION_MAGNET = "00002003-0000-1000-8000-00805f9b34fb";

var WEATHER_SERVICE = "00002010-0000-1000-8000-00805f9b34fb";
var WEATHER_AMBIENT = "00002011-0000-1000-8000-00805f9b34fb";
var WEATHER_TEMPERATURE = "00002012-0000-1000-8000-00805f9b34fb";
var WEATHER_HUMIDITY = "00002013-0000-1000-8000-00805f9b34fb";
var WEATHER_PRESSURE = "00002014-0000-1000-8000-00805f9b34fb";

var HEALTH_SERVICE = "00002020-0000-1000-8000-00805f9b34fb";
var HEALTH_HEART = "00002021-0000-1000-8000-00805f9b34fb";
var HEALTH_STEPS = "00002022-0000-1000-8000-00805f9b34fb";
var HEALTH_ACTIVITY = "00002023-0000-1000-8000-00805f9b34fb";

var MODE_SERVICE = "00002040-0000-1000-8000-00805f9b34fb";
var MODE_CHARACTERISTIC = "00002041-0000-1000-8000-00805f9b34fb";

function initialize() {
  document.addEventListener("deviceready", onDeviceReady, false);
}

function showStatus(text) {
  console.log(text);
  document.getElementById("status").innerHTML = text;
}

function onDeviceReady() {

  // Initialize AWS.
  evothings.aws.initialize(evothings.aws.config);

  // UI button actions.
  document.getElementById("connectButton")
    .addEventListener("click", onConnectButton, false);
  document.getElementById("disconnectButton")
    .addEventListener("click", disconnect, false);
  document.getElementById("writeToAwsButton")
    .addEventListener("click", writeToAws, false);
  document.getElementById("readFromAwsButton")
    .addEventListener("click", readFromAws, false);

  showStatus("Ready");
}

function onConnectButton() {

  // We must not be connected.
  if (mDevice) return;

  disconnect();

  searchForBondedDevice({
    name: 'HEXIWEAR',
    serviceUUIDs: [INFO_SERVICE],
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
  // Stop scanning.
  evothings.ble.stopScan();

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
    onConnectError);

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
    var service = evothings.ble.getService(mDevice, WEATHER_SERVICE);
    var characteristic = evothings.ble.getCharacteristic(service, WEATHER_TEMPERATURE);
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

function convertHexData(data) {
  return "0x" + evothings.util.typedArrayToHexString(data);
}

function convert3x16bitData(data) {
  var d = new Int16Array(data);
  return d[0] + " " + d[1] + " " + d[2];
}

function convert8bitPercentageData(data) {
  return new Uint8Array(data)[0] + "%";
}

function convertHumidityData(data) {
  return (new Uint16Array(data)[0]) / 100.0 + "%";
}

function convertTemperatureData(data) {
  return (new Int16Array(data)[0]) / 100.0 + " &deg;C";
}

function convertPressureData(data) {
  return (new Uint16Array(data)[0]) / 100.0 + " Pa";
}

function convertHeartData(data) {
  return new Uint8Array(data)[0] + " bpm";
}

function convert16bitUnsignedData(data) {
  return new Uint16Array(data)[0];
}

var mModes = ["Idle", "Watch", "Sensor Tag", "Weather", "Motion Accel", "Motion Gyro", "Pedometer"];

function convertModeData(data) {
  var v = new Uint8Array(data)[0];
  if(v < mModes.length) {
    return v + " (" + mModes[v] + ")";
  } else {
    return "Unknown mode "+v;
  }
}

function handleData(elementId, data, converter) {

  // Show value for sensor.
  var string = converter(data);
  document.getElementById(elementId).innerHTML = string;

  // Save value that will be written to AWS.
  if (elementId == "accel") {
    mAwsValue = string;
  }
}

function readCharacteristic(serviceUUID, characteristicUUID, elementId, converter) {
  var service = evothings.ble.getService(mDevice, serviceUUID);
  var characteristic = evothings.ble.getCharacteristic(service, characteristicUUID);
  evothings.ble.readCharacteristic(
    mDevice,
    characteristic,
    function(data) {
      handleData(elementId, data, converter);
    },
    function(errorCode) {
      // On Android we get read errors now and then. Log this to the console.
      console.log("readCharacteristic error: " + errorCode + " element: " + elementId);
    });
}

function enableNotification(serviceUUID, characteristicUUID, elementId, converter) {
  var service = evothings.ble.getService(mDevice, serviceUUID);
  var characteristic = evothings.ble.getCharacteristic(service, characteristicUUID);
  evothings.ble.enableNotification(
    mDevice,
    characteristic,
    function(data) {
      handleData(elementId, data, converter);
    },
    function(errorCode) {
      // On iOS we get error on notification fot mode characteristic, it first succeeds,
      // then produces error: "The attribute could not be found."
      console.log("enableNotification error: " + errorCode + " element: " + elementId);
    });
}

function startNotifications() {
  // But first, read static data.
  showStatus("Reading data");
  readCharacteristic(INFO_SERVICE, INFO_MANUFACTURER, "manufacturer", evothings.ble.fromUtf8);
  readCharacteristic(INFO_SERVICE, INFO_FIRMWARE, "firmware", evothings.ble.fromUtf8);
  readCharacteristic(INFO_SERVICE, INFO_SERIAL, "serial", convertHexData);
  readCharacteristic(BATTERY_SERVICE, BATTERY_CHARACTERISTIC, "battery", convert8bitPercentageData);
  readCharacteristic(MODE_SERVICE, MODE_CHARACTERISTIC, "mode", convertModeData);

  // OK, now we can do notifications.
  enableNotification(BATTERY_SERVICE, BATTERY_CHARACTERISTIC, "battery", convert8bitPercentageData);
  enableNotification(MODE_SERVICE, MODE_CHARACTERISTIC, "mode", convertModeData);

  // Or not. These services do not support BLE notification, even though you would expect it.
  // Polling is possible, but quite inefficient by comparison.
  //enableNotification(MOTION_SERVICE, MOTION_ACCELEROMETER, "accel", convert3x16bitData);
  //enableNotification(MOTION_SERVICE, MOTION_GYRO, "gyro", convert3x16bitData);
  //enableNotification(MOTION_SERVICE, MOTION_MAGNET, "magnet", convert3x16bitData);

  // Let's try polling instead.
  mTimer = setInterval(poll, 1000);
}

function poll() {
  readCharacteristic(MOTION_SERVICE, MOTION_ACCELEROMETER, "accel", convert3x16bitData);
  readCharacteristic(MOTION_SERVICE, MOTION_GYRO, "gyro", convert3x16bitData);
  readCharacteristic(MOTION_SERVICE, MOTION_MAGNET, "magnet", convert3x16bitData);

  readCharacteristic(WEATHER_SERVICE, WEATHER_AMBIENT, "ambient", convert8bitPercentageData);
  readCharacteristic(WEATHER_SERVICE, WEATHER_TEMPERATURE, "temperature", convertTemperatureData);
  readCharacteristic(WEATHER_SERVICE, WEATHER_HUMIDITY, "humidity", convertHumidityData);
  readCharacteristic(WEATHER_SERVICE, WEATHER_PRESSURE, "pressure", convertPressureData);

  readCharacteristic(HEALTH_SERVICE, HEALTH_HEART, "heart", convertHeartData);
  readCharacteristic(HEALTH_SERVICE, HEALTH_STEPS, "steps", convert16bitUnsignedData);
  readCharacteristic(HEALTH_SERVICE, HEALTH_ACTIVITY, "activity", convert16bitUnsignedData);
}

// Write data to AWS.
function writeToAws() {
  document.getElementById('aws-status').innerHTML = "Writing...";
  evothings.aws.update(
    mAwsKey,
    mAwsValue,
    function() {
      console.log(mAwsKey + " written.");
      document.getElementById("aws-status").innerHTML = "Write success.";
    },
    function(error) {
      console.log(mAwsKey + " write error: " + error);
      document.getElementById("aws-status").innerHTML = "Write error: " + error;
    });
}

function readFromAws() {
  document.getElementById("aws-status").innerHTML = "Reading...";
  evothings.aws.query(
    mAwsKey,
    function(items) {
      var string = items[0].Value;
      console.log(mAwsKey + " read: " + string);
      document.getElementById("aws-status").innerHTML = "Read success.";
      document.getElementById("aws-value").innerHTML = string;
    },
    function(error) {
      console.log(mAwsKey + " read error: " + error);
      document.getElementById("aws-status").innerHTML = "Read error: " + error;
    });
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
