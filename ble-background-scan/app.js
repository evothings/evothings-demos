// JavaScript code for the app.
;(function()
{

// -------------------- Code you need to modify --------------------
// Device to scan for.
// Change this to the name of your device.
var deviceNameToScanFor = 'CC2650 SensorTag';
// Specifying a service UUID is required to scan for devices in the
// background on iOS.
// Change this to an advertised service UUID of your device.
var serviceUUIDToScanFor = '0000aa10-0000-1000-8000-00805f9b34fb';
// -----------------------------------------------------------------

// Global object with exported functions.
window.app = {};

// Background detection.
var notificationID = 0;
var inBackground = false;
document.addEventListener('pause', function() { inBackground = true });
document.addEventListener('resume', function() { inBackground = false });

// Found device object.
var foundDevice = null;

// Time stamp for found device.
var foundDeviceTimeStamp = 0;

// Time stamp for background notifications.
var notificationTimeStamp = 0;

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
var updateTimer = null;

function initialize()
{
    document.addEventListener(
        'deviceready',
        function() { onDeviceReady() },
        false);
};

function onDeviceReady()
{
    // Here you can update the UI to say that
    // the device (the phone/tablet) is ready
    // to use BLE and other Cordova functions.
    displayStatus(
        'Tap Start Scan to search for device named: ' +
        deviceNameToScanFor);
};

// Starts the scan. Calls the callback function when a device is found.
// Format: callbackFun(device, errorCode)
function startScan(callbackFun)
{
    stopScan();

    bleat.startScan(
        // Service UUID to scan for.
        [serviceUUIDToScanFor],
        // Device found callback.
        function(device) { callbackFun(device, null) },
        // Scan complete callback (intensionally empty).
        function() {},
        // Error callback.
        function(errorCode) { callbackFun(null, errorCode) },
        // Scan options.
        { allowDuplicates: true }
    );
};

// Stop scanning for devices.
function stopScan()
{
    bleat.stopScan();
};

// Called when Start Scan button is selected.
app.onStartScanButton = function()
{
    startScan(deviceFound);
    displayStatus('Scanning...');
    // This timer displays updated device info.
    updateTimer = setInterval(displayDevice, 1000);
};

// Called when Stop Scan button is selected.
app.onStopScanButton = function()
{
    stopScan();
    foundDevice = null;
    displayStatus('Scan stopped');
    displayDevice();
    clearInterval(updateTimer);
};

// Called when a device is found.
function deviceFound(device, errorCode)
{
    // Sometimes an RSSI of +127 is reported.
    // We filter out these values here.
    if (device.adData.rssi > 0)
    {
        return;
    }

    // Is this the device we are looking for?
    if (device.name == deviceNameToScanFor)
    {
        var timeNow = Date.now();
        var timeBetweenNotifications = 15 * 60 * 1000; // 15 minutes.
        var showBackgroundNotification = timeNow > notificationTimeStamp + timeBetweenNotifications;

        if (inBackground && showBackgroundNotification)
        {
            notificationTimeStamp = timeNow;
            cordova.plugins.notification.local.schedule(
                {
                    id: ++notificationID,
                    title: 'Found device ' + deviceNameToScanFor,
                    text: 'Bleat Finder detected a device, tap here to open app.'
                });
        }

        // Save device data and set timestamp.
        foundDevice = device;
        foundDeviceTimeStamp = timeNow;

    }
    else if (errorCode)
    {
        displayStatus('Scan error: ' + errorCode);
    }
};

// Display the device list.
function displayDevice()
{
    // Clear device info.
    $('#found-device').empty();

    var timeNow = Date.now();

    // Only show device if updated during the last 10 seconds.
    if (foundDevice)
    {
        if (foundDeviceTimeStamp + 5000 > timeNow)
        {
            displayStatus('Found device');

            var name = foundDevice.name;
            var rssi = foundDevice.adData.rssi;

            // Map the RSSI value to a width in percent for the indicator.
            var rssiWidth = 100; // Used when RSSI is zero or greater.
            if (rssi < -100) { rssiWidth = 0; }
            else if (rssi < 0) { rssiWidth = 100 + rssi; }

            // Create HTML for device data.
            var html =
                $(
                    '<p><strong>' + name + '</strong><br />' +
                    'RSSI: ' + rssi + '</p>' +
                    '<div style="background:rgb(225,0,0);height:20px;width:' +
                    rssiWidth + '%;"></div>'
                );

            $('#found-device').html(html);
        }
        else
        {
            $('#found-device').html('');
            displayStatus('Lost contact with device');
        }
    }
};

// Display a status message
function displayStatus(message)
{
    $('#scan-status').html(message);
};

initialize();

})();
