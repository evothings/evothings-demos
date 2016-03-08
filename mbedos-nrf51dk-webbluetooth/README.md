This is a sample combining:

- The new ARM mbed OS
- The nRF51-DK BLE board
- An Evothings hybrid mobile app using ES6 and the new Web Bluetooth API.

There is an article written around this sample which explains how it works and how to run it:

http://evothings.com/...

But... if you are impatient, already have the yotta tools installed and already have an nRF51-DK
prepped for mbed OS and mounted as `MBED`, all of which is <strong>explained in the article</strong>,
then you can:

1. Build the mbed OS server code by running `yt build`.

2. Flash it by connecting the mbed prepped board so that it mounts as MBED and then running
`./flash.sh`. After the board stops flickering in a few seconds, press the reset button on the
board to start the application which will blink one of the LEDs as an alive indicator.

3. Load the Evothings application by dragging the `evothings/evothings.json` file onto the Evothings
Workbench `MyApps` tab. Then press RUN to run it on your connected iOS/Android phone/tablet.

See article above for more details.
