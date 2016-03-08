This is a sample combining:

- The new ARM mbed OS
- The nRF51-DK BLE board
- An Evothings hybrid mobile app using ES6 and the new Web Bluetooth API.

There is an article written around this sample which explains how it works and how to run it:

http://evothings.com/...

But... if you are impatient,

Build the mbed OS server code by running `yt build`. Flash it by connecting the board (needs to
have been mbed *prepared* first which is described in the article) so that it mounts as MBED and
then running `./flash.sh`. Press the reset button on the board to start the application which will
blink one of the LEDs as an alive indicator.

Load the Evothings application by dragging the evothings.json file onto the Evothings Workbench
`MyApps` tab. Then press RUN to run it on a connected phone/tablet.

See article above for more details.
