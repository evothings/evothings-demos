/* mbed Microcontroller Library
 * Copyright (c) 2006-2013 ARM Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "mbed-drivers/mbed.h"
#include "ble/BLE.h"
#include "LEDService.h"
#include "ButtonService.h"

DigitalOut alivenessLED(LED1, 0);
DigitalOut actuatedLED(LED2, 0);
InterruptIn button(BUTTON1);

const static char     DEVICE_NAME[] = "VIBER";
static const uint16_t uuid16_list[] = {LEDService::LED_SERVICE_UUID, ButtonService::BUTTON_SERVICE_UUID};

LEDService *ledServicePtr;
ButtonService *buttonServicePtr;

void buttonPressedCallback(void)
{
    minar::Scheduler::postCallback(mbed::util::FunctionPointer1<void, bool>(buttonServicePtr, &ButtonService::updateButtonState).bind(true));
}

void buttonReleasedCallback(void)
{
    minar::Scheduler::postCallback(mbed::util::FunctionPointer1<void, bool>(buttonServicePtr, &ButtonService::updateButtonState).bind(false));
}

void disconnectionCallback(const Gap::DisconnectionCallbackParams_t *params)
{
    BLE::Instance().gap().startAdvertising();
}

void blinkCallback(void)
{
    alivenessLED = !alivenessLED; /* Do blinky on LED1 to indicate system aliveness. */
}

/**
 * This callback allows the LEDService to receive updates to the ledState Characteristic.
 *
 * @param[in] params
 *     Information about the characterisitc being updated.
 */
void onDataWrittenCallback(const GattWriteCallbackParams *params) {
    if ((params->handle == ledServicePtr->getValueHandle()) && (params->len == 1)) {
        actuatedLED = *(params->data);
    }
}

/**
 * This function is called when the ble initialization process has failled
 */
void onBleInitError(BLE &ble, ble_error_t error)
{
    /* Initialization error handling should go here */
}

/**
 * Callback triggered when the ble initialization process has finished
 */
void bleInitComplete(BLE::InitializationCompleteCallbackContext *params)
{
    BLE&        ble   = params->ble;
    ble_error_t error = params->error;

    if (error != BLE_ERROR_NONE) {
        /* In case of error, forward the error handling to onBleInitError */
        onBleInitError(ble, error);
        return;
    }

    /* Ensure that it is the default instance of BLE */
    if (ble.getInstanceID() != BLE::DEFAULT_INSTANCE) {
        return;
    }

    ble.gap().onDisconnection(disconnectionCallback);
    
    /* Register our hooks for button and LEDs */
    ble.gattServer().onDataWritten(onDataWrittenCallback);
    button.fall(buttonPressedCallback);
    button.rise(buttonReleasedCallback);
    
    bool initialValueForLEDCharacteristic = false;
    ledServicePtr = new LEDService(ble, initialValueForLEDCharacteristic);
    buttonServicePtr = new ButtonService(ble, false /* initial value for button pressed */);

    /* setup advertising */
    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::BREDR_NOT_SUPPORTED | GapAdvertisingData::LE_GENERAL_DISCOVERABLE);
    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LIST_16BIT_SERVICE_IDS, (uint8_t *)uuid16_list, sizeof(uuid16_list));
    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LOCAL_NAME, (uint8_t *)DEVICE_NAME, sizeof(DEVICE_NAME));
    ble.gap().setAdvertisingType(GapAdvertisingParams::ADV_CONNECTABLE_UNDIRECTED);
    ble.gap().setAdvertisingInterval(100); /* 1000ms. */
    ble.gap().startAdvertising();
}

void app_start(int, char **)
{
    minar::Scheduler::postCallback(blinkCallback).period(minar::milliseconds(500));

    BLE &ble = BLE::Instance();
    ble.init(bleInitComplete);
}
