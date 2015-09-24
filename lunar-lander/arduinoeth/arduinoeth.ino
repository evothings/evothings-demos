/*
Arduino WiFi Script Server

Created October 20, 2013
Mikael Kindborg, Evothings AB

TCP socket server that accept connections and sends reports
from the Arduino board.

This example is written for a network using WPA encryption.
For WEP or unencrypted WiFi, change the Wifi.begin() call according to
the documentation of the Wifi class, found in the Arduino SDK.

The reports are delimited by \n (LF, code 0x0A).
A report may be any of the following:

Analog input pin value:
A<decimal number>
Example:
A346

Digital input pin value:
D<0|1>
Examples:
D0
D1

*/

// Include files.
#include <SPI.h>
#include <Ethernet.h>

// Local configuration.
#define HAVE_CLIENT 1
#define NETCAT_DEBUG 0


// Enter a MAC address for your controller below, usually found on a sticker
// on the back of your Ethernet shield.
byte mac[] = { 0x90, 0xA2, 0xDA, 0x0E, 0xD0, 0x93 };

// The IP address will be dependent on your local network.
// If you have IP network info, uncomment the lines starting
// with IPAddress and enter relevant data for your network.
// If you don't know, you probably have dynamically allocated IP adresses, then
// you don't need to do anything, move along.
// IPAddress ip(192,168,1, 177);
// IPAddress gateway(192,168,1, 1);
// IPAddress subnet(255, 255, 255, 0);

// Create a server listening on the given port.
EthernetServer server(3300);

// Your network key Index number (needed only for WEP).
int keyIndex = 0;

// Input pin definitions.
static const int AnalogInputPin = 0;

// Try pins 2-6. Pins 0, 1, 7+ are known to be used by WiFi and other systems...
static const int DigitalInputPin = 3;

void setup()
{
	// Start serial communication with the given baud rate.
	// NOTE: Remember to set the baud rate in the Serial
	// monitor to the same value.
	Serial.begin(9600);

	// Wait for serial port to connect. Needed for Leonardo only
	while (!Serial) { ; }

	Serial.println("Hello World!");

#if HAVE_CLIENT
	// Initialize the Ethernet shield.
	// If you entered fixed ipaddress info, gateway, subnet mask,
	// then uncommment the next line.
	// Ethernet.begin(mac, ip, gateway, subnet);

	// If it works to get a dynamic IP from a DHCP server, use this
	// code to test if you're getting a dynamic adress. If this
	// does not work, use the above method of specifying an IP-address.
	// dhcp test starts here
	if (Ethernet.begin(mac) == 0)
	{
		Serial.println("Failed to configure Ethernet using DHCP");
		// No point in carrying on, stop here forever.
		while(true) ;
	}
	// dhcp test end

	// Start the server.
	server.begin();
#endif

	pinMode(DigitalInputPin, INPUT_PULLUP);

	// Print IP address.
	printServerStatus();
}

void loop()
{
#if HAVE_CLIENT
	// Listen for incoming client requests.
	EthernetClient client = server.available();

	if(client)
	{
		Serial.println("Client connected");
		while(client.connected())
		{
			// Flush the input buffer.
			// This will allow connected() to return false appropriately when the client disconnects.
			while(client.read() != -1);

			checkInputValues(&client);
		}
		Serial.println("Client disonnected");
		client.stop();
	}
#else
	checkInputValues(NULL);
#endif
}

void checkInputValues(EthernetClient* client)
{
	static int oldAnalogValue = -1000;
	static int oldDigitalValue = -1000;

	int newDigitalValue = digitalRead(DigitalInputPin);
	if(newDigitalValue != oldDigitalValue)
	{
#if NETCAT_DEBUG
#define DIGITAL_PREFIX "DIGITAL "
#else
#define DIGITAL_PREFIX "D"
#endif
		sendReport(client, String(DIGITAL_PREFIX)+String(newDigitalValue));
		oldDigitalValue = newDigitalValue;
	}

	// Analog values usually vary 1 or 2 units even if you don't move the potentiometer.
	// Let's avoid sending too many reports.
	int newAnalogValue = analogRead(AnalogInputPin);
	if(abs(newAnalogValue - oldAnalogValue) > 10)
	{
#if NETCAT_DEBUG
#define ANALOG_PREFIX "ANALOG "
#else
#define ANALOG_PREFIX "A"
#endif
		sendReport(client, String(ANALOG_PREFIX)+String(newAnalogValue));
		oldAnalogValue = newAnalogValue;
	}
}

void sendReport(EthernetClient* client, String report)
{
	static int count = 0;
	count++;
#if HAVE_CLIENT
	// Send response to client.
#if NETCAT_DEBUG
	client->print(count);
	client->print(": ");
#endif
	client->print(report+String("\n"));
#endif

	// Debug print.
	Serial.print("report ");
	Serial.print(count);
	Serial.print(": ");
	Serial.println(report);
}

void printServerStatus()
{
	Serial.print("Server address: ");
	Serial.println(Ethernet.localIP());
}
