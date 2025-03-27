import { EventEmitter } from 'events';
export const EESSP_COMMANDS = {
    RESET: {
        code: 1,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Command to instruct the slave to perform a hard reset at any point within its operational status.'
    },
    SET_CHANNEL_INHIBITS: {
        code: 2,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Variable length command, used to control which channels are enabled. The command byte is followed by 2 data bytes, these bytes are combined to create the INHIBIT_REGISTER, each bit represents the state of a channel (LSB= channel 1, 1=enabled, 0=disabled). At power up all channels are inhibited and the validator is disabled.'
    },
    DISPLAY_ON: {
        code: 3,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'NV200', 'NV11'],
        description: 'Use this command to re-enabled a disabled bezel illumination function (using the Display Off command). The Bezel will only be illuminated when the device is enabled even if this command is sent.'
    },
    DISPLAY_OFF: {
        code: 4,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'NV200', 'NV11'],
        description: 'This command will force the device bezel to not be illuminated even if the device is enabled.'
    },
    SETUP_REQUEST: {
        code: 5,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'The device responds with an array of data the format of which depends upon the device, the dataset installed and the protocol version set.'
    },
    HOST_PROTOCOL_VERSION: {
        code: 6,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Dual byte command, the first byte is the command; the second byte is the version of the protocol that is implemented on the host. So for example, to enable events on BNV to protocol version 6, send 06, 06. The device will respond with OK if the device supports version 6, or FAIL (0xF8) if it does not.',
        example: 'SSP.command(\'HOST_PROTOCOL_VERSION\', {version: 6})'
    },
    POLL: {
        code: 7,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'The poll command returns the list of events that have occurred within the device since the last poll. The format of the events depends on the protocol version set within the device. Note that more than one event can occur within a poll response so ensure that the full return array is scanned.'
    },
    REJECT_BANKNOTE: {
        code: 8,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'A command to reject a note held in escrow in the banknote validator. For devices apart form NV11; if there is no note in escrow to be rejected, the device replies with COMMAND CANNOT BE PROCESSED (0xF5).'
    },
    DISABLE: {
        code: 9,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'The peripheral will switch to its disabled state, it will not execute any more commands or perform any actions until enabled, any poll commands will report disabled.'
    },
    ENABLE: {
        code: 10,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'Send this command to enable a disabled device.'
    },
    GET_SERIAL_NUMBER: {
        code: 12,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'This command returns a 4-byte big endian array representing the unique factory programmed serial number of the device.'
    },
    UNIT_DATA: {
        code: 13,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Returns, Unit type (1 Byte integer), Firmware Version (4 bytes ASCII string), Country Code (3 Bytes ASCII string), Value Multiplier (3 bytes integer), Protocol Version (1 Byte, integer)'
    },
    CHANNEL_VALUE_REQUEST: {
        code: 14,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Returns channel value data for a banknote validator. Formatted as: byte 0 - the highest channel used the a value byte representing each of the denomination values. The real value is obtained by multiplying by the value multiplier. If the validator is greater than or equal to protocol version 6 then the channel values response will be given as: Highest Channel, Value Per Channel (0 for expanded values),3 Byte ASCI country code for each channel, 4- byte Full channel Value for each channel.'
    },
    CHANNEL_SECURITY_DATA: {
        code: 15,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Command which returns a number of channels byte (the highest channel used) and then 1 to n bytes which give the security of each channel up to the highest one, a zero indicates that the channel is not implemented. (1 = low, 2 = std, 3 = high, 4 = inhibited).'
    },
    CHANNEL_RE_TEACH_DATA: {
        code: 16,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'This is a vestigial command and may be deprecated in future versions. Do not use. If it is supported in a device it will return all zeros.'
    },
    SYNC: {
        code: 17,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'A command to establish communications with a slave device. A Sync command resets the seq bit of the packet so that the slave device expects the next seq bit to be 0. The host then sets its next seq bit to 0 and the seq sequence is synchronised.'
    },
    LAST_REJECT_CODE: {
        code: 23,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Returns a single byte that indicates the reason for the last banknote reject. The codes are shown in the table below. Specifics of note validation are not shown to protect integrity of manufacturers security.'
    },
    HOLD: {
        code: 24,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'This command may be sent to BNV when Note Read has changed from 0 to >0 (valid note seen) if the user does not wish to accept the note with the next command. This command will also reset the 10-second time-out period after which a note held would be rejected automatically, so it should be sent before this time-out if an escrow function is required. If there is no note in escrow to hold, the device will reply with COMMAND CANNOT BE PROCESSED (0xF5)'
    },
    GET_FIRMWARE_VERSION: {
        code: 32,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'Returns the full firmware version ascii data array for this device.'
    },
    GET_DATASET_VERSION: {
        code: 33,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'NV11'],
        description: 'Returns a string of ascii codes giving the full dataset version of the device.'
    },
    GET_ALL_LEVELS: {
        code: 34,
        encrypted: false,
        args: false,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'Use this command to return all the stored levels of denominations in the device (including those at zero level). This gives a faster response than sending each individual denomination level request.'
    },
    GET_BAR_CODE_READER_CONFIGURATION: {
        code: 35,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV200'],
        description: 'Returns the set-up data for the device bar code readers.'
    },
    SET_BAR_CODE_CONFIGURATION: {
        code: 36,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV200'],
        description: 'This command allows the host to set-up the bar code reader(s) configuration on the device. 3 bytes of data define the configuration. In this example we enable both readers with format interleaved 1 of 5 for 18 characters.',
        example: 'SSP.command(\'SET_BAR_CODE_CONFIGURATION\', {enable: \'top\', numChar: 6}) //enable: none|top|bottom|both   numChar(min:6 max:24)'
    },
    GET_BAR_CODE_INHIBIT_STATUS: {
        code: 37,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV200'],
        description: 'Command to return the current bar code/currency inhibit status.'
    },
    SET_BAR_CODE_INHIBIT_STATUS: {
        code: 38,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV200'],
        description: 'Sets up the bar code inhibit status register. A single data byte representing a bit register is sent. Bit 0 is Currency read enable (0 = enable, 1= disable) Bit 1 is the Bar code enable (0 = enable, 1 = disable). All other bits are not used and set to 1. This example shows a request to a device to have currency enabled, bar code enabled.',
        example: 'SSP.command(\'SET_BAR_CODE_INHIBIT_STATUS\', {currencyRead: true, barCode: true})'
    },
    GET_BAR_CODE_DATA: {
        code: 39,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'NV200'],
        description: 'Command to obtain last valid bar code ticket data, send in response to a Bar Code Ticket Validated event. This command will return a variable length data steam, a generic response (OK) followed by a status byte, a bar code data length byte, then a stream of bytes of the ticket data in ASCII.'
    },
    SET_REFILL_MODE: {
        code: 48,
        encrypted: false,
        args: true,
        device: ['SMART Payout'],
        description: 'A command sequence to set or reset the facility for the payout to reject notes that are routed to the payout store but the firmware determines that they are un-suitable for storage. In default mode, they would be rerouted to the stacker. In refill mode they will be rejected from the front of the NV200.'
    },
    PAYOUT_AMOUNT: {
        code: 51,
        encrypted: true,
        args: true,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to set the monetary value to be paid by the payout unit. Using protocol version 6, the host also sends a pre-test option byte (TEST_PAYOUT_AMOUT 0x19, PAYOUT_AMOUNT 0x58), which will determine if the command amount is tested or paid out. This is useful for multi-payout systems so that the ability to pay a split down amount can be tested before committing to actual payout.',
        example: 'SSP.command(\'PAYOUT_AMOUNT\', {amount: 100, country_code: \'RUB\', test: false})'
    },
    SET_DENOMINATION_LEVEL: {
        code: 52,
        encrypted: false,
        args: true,
        device: ['SMART Hopper'],
        description: 'A command to increment the level of coins of a denomination stored in the hopper. The command is formatted with the command byte first, amount of coins to add as a 2-byte little endian, the value of coin as 2-byte little endian and (if using protocol version 6) the country code of the coin as 3 byte ASCII. The level of coins for a denomination can be set to zero by sending a zero level for that value. Note that protocol 6 version commands have been expanded to use a 4-byte coin value. The command data is formatted as byte 0 and byte 1 give the number of coins to add. In protocol version 5, the denomination is then sent as a two byte value. In protocol version greater than 5, the denomination is sent as 4 byte value plus 3 bytes ascii country code. In this example we want to increase the level of .50c coin by 20 using protocol version 5.'
    },
    GET_DENOMINATION_LEVEL: {
        code: 53,
        encrypted: false,
        args: true,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'This command returns the level of a denomination stored in a payout device as a 2 byte value. In protocol versions greater or equal to 6, the host adds a 3 byte ascii country code to give mulit-currency functionality. Send the requested denomination to find its level. In this case a request to find the amount of 0.10c coins in protocol version 5.',
        example: 'SSP.command(\'GET_DENOMINATION_LEVEL\', {amount: 100, country_code: \'RUB\'})'
    },
    COMMUNICATION_PASS_THROUGH: {
        code: 55,
        encrypted: false,
        args: false,
        device: ['SMART Hopper'],
        description: 'Used with SMART Hopper only. This command sets USB pass through mode. SMART Hopper then works only as USB to serial converter to allow direct communication (firmware/dataset update) with devices connected to SMART Hopper UARTS. This command was implemented in firmware versions greater or equal to 6.16.'
    },
    HALT_PAYOUT: {
        code: 56,
        encrypted: true,
        args: false,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to stop the execution of an existing payout. The device will stop payout at the earliest convenient place and generate a Halted event giving the value paid up to that point.'
    },
    SET_DENOMINATION_ROUTE: {
        code: 59,
        encrypted: false,
        args: true,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'This command will configure the denomination to be either routed to the cashbox on detection or stored to be made available for later possible payout.',
        example: 'SSP.command(\'SET_DENOMINATION_ROUTE\', {route: \'payout\', value: 10000, country_code: \'RUB\'}) //route: payout|cashbox'
    },
    GET_DENOMINATION_ROUTE: {
        code: 60,
        encrypted: true,
        args: true,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'This command allows the host to determine the route of a denomination. Note protocol versions: For protocol versions less than 6 a value only data array is sent. For protocol version greater or equal to 6, a 3 byte country code is also sent to allow multi-currency functionality to the payout. Please note that there exists a difference in the data format between SMART Payout and SMART Hopper for protocol versions less than 6. In these protocol versions the value was determined by a 2 byte array rather than 4 byte array For NV11 devices the host must send the required note value in the same form that the device is set to report by (see Set Value Reporting Type command).'
    },
    FLOAT_AMOUNT: {
        code: 61,
        encrypted: true,
        args: true,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to float the hopper unit to leave a requested value of money, with a requested minimum possible payout level. All monies not required to meet float value are routed to cashbox. Using protocol version 6, the host also sends a pre-test option byte (TEST_FLOAT_AMOUT 0x19, FLOAT_AMOUNT 0x58), which will determine if the command amount is tested or floated. This is useful for multi-payout systems so that the ability to pay a split down amount can be tested before committing to actual float.',
        example: 'SSP.command(\'FLOAT_AMOUNT\', {min_possible_payout: 10, amount: 100, country_code: \'RUB\', test: false})'
    },
    GET_MINIMUM_PAYOUT: {
        code: 62,
        encrypted: false,
        args: false,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to request the minimum possible payout amount that this device can provide'
    },
    EMPTY_ALL: {
        code: 63,
        encrypted: true,
        args: false,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'This command will direct all stored monies to the cash box without reporting any value and reset all the stored counters to zero. See Smart Empty command to record the value emptied.'
    },
    SET_COIN_MECH_INHIBITS: {
        code: 64,
        encrypted: false,
        args: true,
        device: ['SMART Hopper'],
        description: 'This command is used to enable or disable acceptance of individual coin values from a coin acceptor connected to the hopper.',
        example: 'SSP.command(\'SET_COIN_MECH_INHIBITS\', {amount: 100, inhibited: true})'
    },
    GET_NOTE_POSITIONS: {
        code: 65,
        encrypted: false,
        args: false,
        device: ['NV11'],
        description: 'This command will return the number of notes in the Note Float and the value in each position. The way the value is reported is specified by the Set Reporting Type command. The value can be reported by its value or by the channel number of the bill validator. The first note in the table is the first note that was paid into the Note Float. The Note Float is a LIFO system, so the note that is last in the table is the only one that is available to be paid out or moved into the stacker.'
    },
    PAYOUT_NOTE: {
        code: 66,
        encrypted: false,
        args: false,
        device: ['NV11'],
        description: 'The Note Float will payout the last note that was stored. This is the note that is in the highest position in the table returned by the Get Note Positions Command. If the payout is possible the Note Float will reply with generic response OK. If the payout is not possible the reply will be generic response COMMAND CANNOT BE PROCESSED, followed by an error code shown in the table below'
    },
    STACK_NOTE: {
        code: 67,
        encrypted: false,
        args: false,
        device: ['NV11'],
        description: 'The Note Float will stack the last note that was stored. This is the note that is in the highest position in the table returned by the Get Note Positions Command. If the stack operation is possible the Note Float will reply with generic response OK. If the stack is not possible the reply will be generic response command cannot be processed, followed by an error code as shown in the table.'
    },
    FLOAT_BY_DENOMINATION: {
        code: 68,
        encrypted: true,
        args: true,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to float (leave in device) the requested quantity of individual denominations. The quantities of denominations to leave are sent as a 2 byte little endian array; the money values as 4-byte little endian array and the country code as a 3-byte ASCII array. The host also adds an option byte to the end of the command array (TEST_PAYOUT_AMOUT 0x19 or PAYOUT_AMOUNT 0x58). This will allow a pre-test of the ability to float to the requested levels before actual float executes.',
        example: 'SSP.command(\'FLOAT_BY_DENOMINATION\', {value: [{number: 1, denomination: 100, country_code: \'RUB\'}, {number: 1, denomination: 500, country_code: \'RUB\'}], test: false})'
    },
    SET_VALUE_REPORTING_TYPE: {
        code: 69,
        encrypted: false,
        args: true,
        device: ['NV11'],
        description: 'This will set the method of reporting values of notes. There are two options, by a four-byte value of the note or by the channel number of the value from the banknote validator. If the channel number is used then the actual value must be determined using the data from the Validator command Unit Data. The default operation is by 4-byte value. Send 0x00 to set Report by value, 0x01 to set Report By Channel.',
        example: 'SSP.command(\'SET_VALUE_REPORTING_TYPE\', {reportBy: \'channel\'}) // reportBy: value|channel'
    },
    PAYOUT_BY_DENOMINATION: {
        code: 70,
        encrypted: true,
        args: true,
        device: ['SMART Hopper', 'SMART Payout'],
        description: 'A command to payout the requested quantity of individual denominations. The quantities of denominations to pay are sent as a 2 byte little endian array; the money values as 4-byte little endian array and the country code as a 3-byte ASCII array. The host also adds an option byte to the end of the command array (TEST_PAYOUT_AMOUT 0x19 or PAYOUT_AMOUNT 0x58). This will allow a pre-test of the ability to payout the requested levels before actual payout executes.',
        example: 'SSP.command(\'PAYOUT_BY_DENOMINATION\', {value: [{number: 1, denomination: 100, country_code: \'RUB\'}, {number: 1, denomination: 500, country_code: \'RUB\'}], test: false})'
    },
    SET_COIN_MECH_GLOBAL_INHIBIT: {
        code: 73,
        encrypted: false,
        args: false,
        device: ['SMART Hopper'],
        description: 'This command allows the host to enable/disable the attached coin mech in one command rather than by each individual value with previous firmware versions. Send this command and one Mode data byte: Data byte = 0x00 - mech disabled. Date byte = 0x01 - mech enabled.'
    },
    SET_GENERATOR: {
        code: 74,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Eight data bytes are a 64 bit number representing the Generator this must be a 64bit prime number. The slave will reply with OK or PARAMETER_OUT_OF_RANGE if the number is not prime.'
    },
    SET_MODULUS: {
        code: 75,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Eight data bytes are a 64 bit number representing the modulus this must be a 64 bit prime number. The slave will reply with OK or PARAMETER_OUT_OF_RANGE if the number is not prime.'
    },
    REQUEST_KEY_EXCHANGE: {
        code: 76,
        encrypted: false,
        args: true,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'The eight data bytes are a 64 bit number representing the Host intermediate key. If the Generator and Modulus have been set the slave will calculate the reply with the generic response and eight data bytes representing the slave intermediate key. The host and slave will then calculate the key. If Generator and Modulus are not set then the slave will reply FAIL.'
    },
    SET_BAUD_RATE: {
        code: 77,
        encrypted: false,
        args: true,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'This command has two data bytes to allow communication speed to be set on a device. The first byte is the speed to change to (see table below).',
        example: 'SSP.command(\'SET_BAUD_RATE\', {baudrate: 9600, reset_to_default_on_reset: true})'
    },
    GET_BUILD_REVISION: {
        code: 79,
        encrypted: false,
        args: false,
        device: ['NV200', 'SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'A command to return the build revision information of a device. The command returns 3 bytes of information representing the build of the product. Byte 0 is the product type, next two bytes make up the revision number(0-65536). For NV200 and NV9USB, the type byte is 0, for Note Float, byte is 3 and for SMART Payout the byte is 6.'
    },
    SET_HOPPER_OPTIONS: {
        code: 80,
        encrypted: false,
        args: false,
        device: ['SMART Hopper'],
        description: 'The host can set the following options for the SMART Hopper. These options do not persist in memory and after a reset they will go to their default values. This command is valid only when using protocol version 6 or greater.'
    },
    GET_HOPPER_OPTIONS: {
        code: 81,
        encrypted: false,
        args: false,
        device: ['SMART Hopper'],
        description: 'This command returns 2 option register bytes described in Set Hopper Options command.'
    },
    SMART_EMPTY: {
        code: 82,
        encrypted: true,
        args: false,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Empties payout device of contents, maintaining a count of value emptied. The current total value emptied is given is response to a poll command. All coin counters will be set to 0 after running this command. Use Cashbox Payout Operation Data command to retrieve a breakdown of the denomination routed to the cashbox through this operation.'
    },
    CASHBOX_PAYOUT_OPERATION_DATA: {
        code: 83,
        encrypted: false,
        args: false,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Can be sent at the end of a SMART Empty, float or dispense operation. Returns the amount emptied to cashbox from the payout in the last dispense, float or empty command. The quantity of denominations in the response is sent as a 2 byte little endian array; the note values as 4-byte little endian array and the country code as a 3-byte ASCII array. Each denomination in the dataset will be reported, even if 0 coins of that denomination are emptied. As money is emptied from the device, the value is checked. An additional 4 bytes will be added to the response giving a count of object that could not be validated whilst performing the operation. The response is formatted as follows: byteParameter byte 0The number denominations (n) in this response (max 20) byte 1 to byte 1 + (9*n)The individual denomination level (see description below) byte 1 to byte 1 + (9*n) + 1 to byte 1 to byte 1 + (9*n) + 4 The number of un-validated objects moved. Individual level requests: byte 0 and byte 1 number of coins of this denomination moved to cashbox in operation byte 2 to byte 5 The denomination value byte 6 to byte 8 The ascii denomination country code'
    },
    CONFIGURE_BEZEL: {
        code: 84,
        encrypted: false,
        args: true,
        device: ['NV200'],
        description: 'This command allows the host to configure a supported BNV bezel. If the bezel is not supported the command will return generic response COMMAND NOT KNOWN 0xF2.',
        example: 'SSP.command(\'CONFIGURE_BEZEL\', {RGB: \'0000ff\', volatile: true})'
    },
    POLL_WITH_ACK: {
        code: 86,
        encrypted: true,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'A command that behaves in the same way as the Poll command but with this command, the specified events (see table below) will need to be acknowledged by the host using the EVENT ACK command (0x56). The events will repeat until the EVENT ACK command is sent and the BNV will not allow any further note actions until the event has been cleared by the EVENT ACK command. If this command is not supported by the slave device, then generic response 0xF2 will be returned and standard poll command (0x07) will have to be used.'
    },
    EVENT_ACK: {
        code: 87,
        encrypted: true,
        args: false,
        device: ['NV9USB', 'NV10USB', 'BV20', 'BV50', 'BV100', 'NV200', 'SMART Hopper', 'NV11'],
        description: 'This command will clear a repeating Poll ACK response and allow further note operations.'
    },
    GET_COUNTERS: {
        code: 88,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'SMART Payout', 'NV11'],
        description: 'A command to return a global note activity counter set for the slave device. The response is formatted as in the table below and the counter values are persistent in memory after a power down- power up cycle. These counters are note set independent and will wrap to zero and begin again if their maximum value is reached. Each counter is made up of 4 bytes of data giving a max value of 4294967295.'
    },
    RESET_COUNTERS: {
        code: 89,
        encrypted: false,
        args: false,
        device: ['NV9USB', 'SMART Payout', 'NV11'],
        description: 'Resets the note activity counters described in Get Counters command to all zero values.'
    },
    COIN_MECH_OPTIONS: {
        code: 90,
        encrypted: false,
        args: true,
        device: ['SMART Hopper'],
        description: 'The host can set the following options for the SMART Hopper. These options do not persist in memory and after a reset they will go to their default values.'
    },
    DISABLE_PAYOUT_DEVICE: {
        code: 91,
        encrypted: false,
        args: false,
        device: ['SMART Payout', 'NV11'],
        description: 'All accepted notes will be routed to the stacker and payout commands will not be accepted.'
    },
    ENABLE_PAYOUT_DEVICE: {
        code: 92,
        encrypted: false,
        args: true,
        device: ['SMART Payout', 'NV11'],
        description: 'A command to enable the attached payout device for storing/paying out notes. A successful enable will return OK, If there is a problem the reply will be generic response COMMAND_CANNOT_BE_PROCESSED, followed by an error code.',
        example: 'SSP.command(\'ENABLE_PAYOUT_DEVICE\', {REQUIRE_FULL_STARTUP: true, OPTIMISE_FOR_PAYIN_SPEED: true}) //nv11 args: GIVE_VALUE_ON_STORED|NO_HOLD_NOTE_ON_PAYOUT    Payout args: REQUIRE_FULL_STARTUP|OPTIMISE_FOR_PAYIN_SPEED'
    },
    SET_FIXED_ENCRYPTION_KEY: {
        code: 96,
        encrypted: true,
        args: false,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'A command to allow the host to change the fixed part of the eSSP key. The eight data bytes are a 64 bit number representing the fixed part of the key. This command must be encrypted.',
        example: 'SSP.command(\'SET_FIXED_ENCRYPTION_KEY\', { fixedKey: \'0000000000000000\' })'
    },
    RESET_FIXED_ENCRYPTION_KEY: {
        code: 97,
        encrypted: false,
        args: false,
        device: ['SMART Hopper', 'SMART Payout', 'NV11'],
        description: 'Resets the fixed encryption key to the device default. The device may have extra security requirements before it will accept this command (e.g. The Hopper must be empty) if these requirements are not met, the device will reply with Command Cannot be Processed. If successful, the device will reply OK, then reset. When it starts up the fixed key will be the default.'
    }
}
export interface IFranchiseStock extends IBase, IBC {
    data: any
}
export interface IVendingWallet {
    ownerUuid: string;
    walletUuid: string;
    walletType: string;// limitter, Merchant, machine
    machineClientId: string; // 
    passkeys: string;
    username: string;
    platform: string;
}
export enum EPaymentProvider {
    mmoney = 'mmoney',
    umoney = 'umoney',
    bcelone = 'bcelone',
    laab = 'laab'
}
export interface IResModel {
    transactionID: string;
    command: any;
    data: any;
    message: string;
    status: number;
}
export interface IReqModel {
    transactionID: number;
    command: any;
    data: any;
    time: string;
    ip: string;
    token: string;
    limit: number;
    skip: number;
}
export enum EM102_COMMAND {
    release = 'release',
    DO = 'DO',
    temperature = 'temperature',
    getid = "getid",
    readtemperature = "readtemperature",
    getresult = "getresult",
    modify = "modify",
    DI = "DI",
    scan = "scan"
}
export enum EMODBUS_SYS_STAT {
    STAT_IDLE = 0, //idle
    STAT_BUSY, //busy, shipping now
    STAT_SALE_OK, //Sale success
    STAT_SALE_EER, //failure, shipping failure
}
export enum EMODBUS_ERROR_CODE {
    '01' = 'Illegal function code. The slave receives a function code that cannot be executed. After issuing a query command, this code indicates that no program function is available.',
    '02' = 'Illegal data address. The received data address, which is not allowed by the slave.',
    '03' = 'Illegal data. The value of the query data area is a value that is not allowed from the machine.',
    '04' = 'Calibration error. The checksum is incorrect and the host resends the data request as requested by the slave.',
    '06' = 'Slave equipment busy. The slave is busy processing a long-time program command and requests the host to send the message when the slave is idle.',
    '07' = 'Slave equipment failure. A non-recoverable error occurred when the slave executed the action requested by the host.',
    '08' = 'Confirmation. The slave has received the requested data, but it takes a long time to process it and sends this acknowledgement to avoid a timeout error on the host. The host then sends a "query completion" to determine if the slave has completed processing.'
}
export enum EMODBUS_ERROR {
    ERR_NO_ERR = 0x00,//:No error
    ERR_SLOT_NUM_INVALID = 0x01,//:invalid lane number
    ERR_MOTOR_DRIVER_BREAK = 0x02,//:Motor not rotating, no current through (plug not plugged in or disconnected) 
    ERR_MOTOR_DRIVER_SHORT = 0x03,//:Motor short-circuited. (Excessive current or shorted wire head) 
    ERR_MOTOR_RUN_TIMEOUT = 0x04,//:motor can rotate, no feedback signal (motor feedback is not connected) 
    ERR_DLV_STATE_BREAK = 0x05,//:Drop detection board status abnormal (device enabled drop detection, but drop detection board is not connected or faulty)
    ERR_DLV_NO_DIRECT = 0x06, //motor normal, no drop detection detected
    ERR_SLOT_TYPE_SET_ERROR = 0x07,//: wrong setting of cargo lane type (mismatch between setting and actual)
    ERR_SLAVE_COMM_ERROR = 0x08,//Slave device communication failure (not connected to the line or address setting error)
    ERR_LIFT_COMUNICATION = 0x10,//:Lift system communication failure (check line) 
    ERR_LIFT_PLATFORMS = 0x11,//:Lifting table failure
    ERR_LIFT_HAVE_GOODS = 0x12,//:There are items on the lift table and cannot be shipped 
    ERR_VER_LIMIT_DOWN = 0x13,//:Lift system lower limit switch failure 
    ERR_HOR_LIMIT_RIGHT = 0x14,//:Lift system right limit switch failure 
    ERR_SECURITY_BAFFLE = 0x15,//:Anti-theft baffle failure
    ERR_PICK_GOODS_DOOR = 0x16,//:Fetch port failure
    ERR_VER_MOTOR_BREAK = 0x17,//:lift motor not energized (no current, detect line)
    ERR_VER_MOTOR_SHORT = 0x18,//:lift motor short circuit (overload, line short circuit or motor burned out)
    ERR_VER_ENCODE_BREAK = 0x19,//:lift motor encoder failure (check motor feedback line)
    ERR_HOR_MOTOR_BREAK = 0x1A,//:Horizontal motor not energized (no current, detect line)
    ERR_HOR_MOTOR_SHORT = 0x1B,//:Horizontal motor short circuit (overload, line short circuit or motor burnout) 
    ERR_HOR_ENCODE_BREAK = 0x1C,//:Horizontal motor encoder failure (check motor feedback line)

}
































































































































































































































































export enum EZDM8_COMMAND {
    hwversion = 'hwversion',
    swversion = 'swversion',
    status = 'status',
    hutemp = 'hutemp',
    statusgrid = 'statusgrid',
    positionhoraxis = 'positionhoraxis',
    dropdetectstatus = 'dropdetectstatus',
    arrayoutputstatus = 'arrayoutputstatus',
    arrayinputstatus = 'arrayinputstatus',
    yaxiselevatorstatus = 'yaxiselevatorstatus',
    xaxiselevatorstatus = 'xaxiselevatorstatus',
    yaxisliftmotor = 'yaxisliftmotor',
    xaxisliftmotor = 'xaxisliftmotor',
    relaycommand = 'relaycommand',
    lifterreset = 'lifterreset',
    manualspeedmode = 'manualspeedmode',
    motortimeout = 'motortimeout',
    setyaxisposition = 'setyaxisposition',
    setxaxisposition = 'setxaxisposition',
    setyaxismotor = 'setyaxismotor',
    setxaxismotor = 'setxaxismotor',
    shippingcontrol = 'shippingcontrol',
    yaxisliftmotorissue = 'yaxisliftmotorissue',
    xaxisliftmotorissue = 'xaxisliftmotorissue',
    arrayoutput = 'arrayoutput',
    liftoutput = 'liftoutput',
    positionliftmotor = "positionliftmotor",
    balance = "balance",
    limiter = "limiter",
    reports = "reports",
    deleteReport = "deleteReport",
    deleteReports = "deleteReports",
    logs = "logs"
}
export enum EPaymentStatus {
    paid = 'paid',
    pending = 'pending',
    delivered = 'delivered',
    succeeded = 'succeeded',
    failed = 'failed',
    error = 'error',
    timeout = 'timeout'
}
export enum EMessage {
    resetCashingSuccess = 'reset cashing success',
    notfoundmachine = 'notfoundmachine',
    invalidMachine = 'invalid machine',
    invalidDataAccess = 'invalid data access',
    parametersEmpty = 'parameters empty',
    cloneStockFail = 'clone stock fail',
    notFoundSaleForClone = 'not found sale for clone',
    notfoundCloneMachine = 'not found clone machine',
    invalidBankNote = 'invalid bank note',
    loginfailed = 'login failed',
    succeeded = 'succeeded',
    error = 'error',
    insertSucceeded = 'inserting succeeded',
    insertError = 'inserting error',
    updateSucceeded = 'updating succeeded',
    updateError = 'updating error',
    deletingSucceeded = 'deleting succeeded',
    deletingerror = 'deleting error',
    notfound = 'not found',
    exist = 'exist',
    bodyIsEmpty = "body is empty",
    idIsEmpty = "id is empty",
    unknownError = "unknown Error",
    selectOneSucceeded = "select One Succeeded",
    selectOneError = "select One Error",
    selectManySucceeded = "select Many Succeeded",
    selectManyError = "select Many Error",
    generateSucceeded = "find Succeeded",
    findError = "find Error",
    resetdatasucceeded = "resetdatasucceeded",
    joinsucceeded = "joinsucceeded",
    joinfailed = "joinfailed",
    submisionsucceeded = "submisionsucceeded",
    submisionfailed = "submisionfailed",
    coinconfirmsumissionsucceeded = "coinconfirmsumissionsucceeded",
    coinconfirmsubmissionfailed = "coinconfirmsubmissionfailed",
    transactionnotfound = "transactionnotfound",
    gamestartedsucceeded = "gamestartedsucceeded",
    gamestartedfailed = "gamestartedfailed",
    submissionclosedsucceeded = "submissionclosedsucceeded",
    submissionclosedfailed = "submissionclosedfailed",
    gamehasnotbeenstarted = "gamehasnotbeenstarted",
    all = "all",
    getallgamersucceeded = "getallgamersucceeded",
    getallgamerfailed = "getallgamerfailed",
    gammernotfound = "gammernotfound",
    valueisoverthebudget = "valueisoverthebudget",
    listrewardsucceeded = "listrewardsucceeded",
    listrewardfailed = "listrewardfailed",
    rewardnotfound = "rewardnotfound",
    commandnotfound = "commandnotfound",
    methodnotfound = "methodnotfound",
    gamestatusfailed = "gamestatusfailed",
    gamestatusok = "gamestatusok",
    closethegamesucceeded = "closethegamesucceeded",
    closethegamefailed = "closethegamefailed",
    connectionestablished = "connectionestablished",
    gamerhasbeenjoined = "gamerhasbeenjoined",
    createrewardsucceeded = "createrewardsucceeded",
    createrewardfailed = "createrewardfailed",
    deleterewardsucceeded = "deleterewardsucceeded",
    deleterewardfailed = "deleterewardfailed",
    winnernotfound = "winnernotfound",
    randomcoinsucceeded = "randomcoinsucceeded",
    randomcoinfailed = "randomcoinfailed",
    couldnotfindphonenumber = "couldnotfindphonenumber",
    loadexchangesucceeded = "loadexchangesucceeded",
    loadexchangefailed = "loadexchangefailed",
    loadtotalcoinsucceeded = "loadtotalcoinsucceeded",
    loadtotalcoinfailed = "loadtotalcoinfailed",
    loadcoinsucceeded = "loadcoinsucceeded",
    loadcoinfailed = "loadcoinfailed",
    showphonenumberfailed = "showphonenumberfailed",
    showphonenumbersucceeded = "showphonenumbersucceeded",
    showallresultssucceeded = "showallresultssucceeded",
    showallresultsfailed = "showallresultsfailed",
    createanewgamesucceeded = "createanewgamesucceeded",
    createanewgamefailed = "createanewgamefailed",
    rewardselected = "rewardselected",
    cointypesdidntmatched = "cointypesdidntmatched",
    updategamefailed = "updategamefailed",
    updategamesucceeded = "updategamesucceeded",
    endgamefailed = "endgamefailed",
    endgamesucceeded = "endgamesucceeded",
    cleargamesucceeded = "cleargamesucceeded",
    cleargamefailed = "cleargamefailed",
    showcurrentgamessucceeded = "showcurrentgamessucceeded",
    showcurrentgamefailed = "showcurrentgamefailed",
    selectedgamenotfound = "selectedgamenotfound",
    gamenotfound = "gamenotfound",
    pong = "pong",
    findoldadssucceeded = "findoldadssucceeded",
    findoldadsfailed = "findoldadsfailed",
    findadssucceeded = "findadssucceeded",
    findaddedfailed = "findaddedfailed",
    findadsfailed = "findadsfailed",
    createdadssucceeded = "createdadssucceeded",
    createdadsfailed = "createdadsfailed",
    imageistoolarge = "imageistoolarge",
    findoldsponsorlist = "findoldsponsorlist",
    findoldsponsorlistfailed = "findoldsponsorlistfailed",
    findoldsponsorlistsucceeded = "findoldsponsorlistsucceeded",
    findsponsorlistfailed = "findsponsorlistfailed",
    findsponsorlistsucceeded = "findsponsorlistsucceeded",
    createsponsorsucceeded = "createsponsorsucceeded",
    createsponsorfailed = "createsponsorfailed",
    updatesponsorfailed = "updatesponsorfailed",
    updatesponsorsucceeded = "updatesponsorsucceeded",
    somecointypenotfound = "somecointypenotfound",
    reporttotalmembervaluesucceeded = "reporttotalmembervaluesucceeded",
    reporttotalmembervaluefailed = "reporttotalmembervaluefailed",
    reporttotalmemberjoinedgamesucceeded = "reporttotalmemberjoinedgamesucceeded",
    reporttotalmemberjoinedgamefailed = "reporttotalmemberjoinedgamefailed",
    updateadsfailed = "updateadsfailed",
    updateadssucceeded = "updateadssucceeded",
    assignedtothegamesucceeded = "assignedtothegamesucceeded",
    assignedtothegamefailed = "assignedtothegamefailed",
    closethecoinsubmission = "closethecoinsubmission",
    gameclosed = "gameclosed",
    listrewardselectedgame = "listrewardselectedgame",
    checkcoinsubmission = "checkcoinsubmission",
    checkcoinsubmissionfailed = "checkcoinsubmissionfailed",
    turnonsumissionselectedgame = "turnonsumissionselectedgame",
    notallowed = "notallowed",
    phoneNumberNotExist = "phoneNumberNotExist",
    gettotalclientconnectionfailed = "gettotalclientconnectionfailed",
    gettotalclientconnectionsucceeded = "gettotalclientconnectionsucceeded",
    addownertothegamefailed = "addownertothegamefailed",
    addownertothegamesucceeded = "addownertothegamesucceeded",
    removeonwerfromthegamefailed = "removeonwerfromthegamefailed",
    removeonwerfromthegamesucceeded = "removeonwerfromthegamesucceeded",
    notexist = "notexist",
    showgameshardssucceeded = "showgameshardssucceeded",
    showgameshardsfailed = "showgameshardsfailed",
    checkphonenumbersucceeded = "checkphonenumbersucceeded",
    checkphonenumberfailed = "checkphonenumberfailed",
    IncorrectFormat = "IncorrectFormat",
    cannotreomvethefinalowner = "cannotreomvethefinalowner",
    couldnotremovesuperadmin = "couldnotremovesuperadmin",
    turnonsumissionselectedgamefailed = "turnonsumissionselectedgamefailed",
    checkjoinstatusok = "checkjoinstatusok",
    quitgamefailed = "quitgamefailed",
    quitgameok = "quitgameok",
    loadjoinstatusfailed = "loadjoinstatusfailed",
    ThereIsNoAnyCoins = "ThereIsNoAnyCoins",
    foundPhonenumber = "foundPhonenumber",
    tokenNotFound = "tokenNotFound",
    showallonlineconnection = "showallonlineconnection",
    SubmittedCoinIsZeroValue = "SubmittedCoinIsZeroValue",
    commandsucceeded = "commandsucceeded",
    MachineIdNotFound = "MachineIdNotFound",
    processingorder = "processingorder",
    loginok = "loginok",
    notloggedinyet = "notloggedinyet",
    notsupport = "notsupport",
    billnotfound = "billnotfound",
    confirmsucceeded = "confirmsucceeded",
    MachineIsNotOnline = "MachineIsNotOnline",
    OrderIsReady = "OrderIsReady",
    generateQRFailed = "generateQRFailed",
    GenerateQRMMoneyFailed = "GenerateQRMMoneyFailed",
    jammed = "jammed",
    disabled = "disabled",
    rejected = "rejected",
    reading = "reading",
    setcounter = "setcounter",
    TransactionTimeOut = "TransactionTimeOut",
    TooFast = "TooFast",
    getFreeProductFailed = "getFreeProductFailed",
    freeProductNotFoundInThisMachine = "freeProductNotFoundInThisMachine",
    productNotFound = "productNotFound",
    duplicatedPosition = "duplicatedPosition",
    qttyistoolow = "qttyistoolow",
    waitingt = "waitingt",
    updatebalance = "updatebalance",
    updatelimiter = "updatelimiter",
    requestReports = "requestReports",
    deleteReport = "deleteReport",
    machineCredit = "machineCredit",
    status = "status",
    adminloginok = "adminloginok",
    InvalidMachineIdOrOTP = "InvalidMachineIdOrOTP",
    refreshsucceeded = "refreshsucceeded",
    doorExist = "doorExist",
    BillCreatedTemp = "--_",
    LaoQRNotPaid = "LaoQRNotPaid",
    machineisdisabled = "machineisdisabled"
}
export interface IBase {
    id?: number;
    uuid?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // deletedAt?:Date;
}
export interface IBC {
    hashP?: string;
    hashM?: string;
}
export interface IDoor extends IBase {
    ownerUuid: string;
    machineId: string;
    door: IDoorItem
    doorNumber: number;
    cabinetNumber: number;
    data: any;
    isDone: boolean;
    depositBy: string;
    depositAt: Date;
    sendBy: string;
    sentAt: Date;
    minValue: number;
    maxValue: number;

}
export interface IDoorItem {
    name: string;
    description: string;
    productUuid: string;
    orderUuid: string;
    createdAt: Date;
    price: number;
    expireAt: Date;
    image: any;
    data: any;
}
export interface IDoorPayment extends IBase {
    ownerUuid: string;
    machineId: string;
    door: IDoorItem
    doorNumber: number;
    cabinetNumber: number;
    productUuid: string;
    orderUuid: string;
    price: number;
    isPaid: boolean;
    LAABRef: any;
    paymentRef: any;

}



export interface ILogActivity extends IBase {
    ownerUuid: string;
    superadmin: string;
    subadmin: string;
    url: string;
    body: any;
    error: boolean
}
export interface IStock extends IBase, IBC {
    name: string;
    image: string;
    price: number;
    qtty: number;
}
export interface IMMoneyQRRes {
    uuid: string;
    qr: string;
    ids: Array<string>;
    value: number;
}
export enum EClientCommand {
    list = 'list',
    buyMMoney = 'buyMMoney',
    buyLAOQR = "buyLAOQR",
    confirmMMoney = 'confirmMMoney',
    confirmLAAB = 'confirmLAAB',
    confirmLAOQR = 'confirmLAOQR',
    findLaoQRPaid = 'findLaoQRPaid',
    CREDIT_NOTE = "CREDIT_NOTE",
    MACHINE_STATUS = "MACHINE_STATUS",
    DISPENSE = "DISPENSE",
    DISPENSED = "DISPENSED",
    DISPENSEFAILED = "DISPENSEFAILED",
    UNKNOWN = "UNKNOWN",
    VMC_MACHINE_STATUS = "VMC_MACHINE_STATUS",
    VMC_DISPENSEFAILED = "VMC_DISPENSEFAILED",
    VMC_DISPENSED = "VMC_DISPENSED",
    VMC_DISPENSE = "VMC_DISPENSE",
    VMC_CREDIT_NOTE = "VMC_CREDIT_NOTE",
    VMC_UNKNOWN = "VMC_UNKNOWN",

}
export interface IVendingMachineSale extends IBase, IBC {
    machineId: string;
    stock: IStock;
    position: number;
    max: number;
}
export interface IVendingCloneMachineSale {
    cloneMachineId: string,
    machineId: string
}
export interface IVendingMachineBill extends IBase, IBC {
    vendingsales: Array<IVendingMachineSale>;
    totalvalue: number;
    paymentmethod: string;
    paymentstatus: string;
    paymentref: string;
    paymenttime: Date;
    requestpaymenttime: Date;
    machineId: string;
    clientId: string;
    transactionID: string;
    qr: string;
}
export interface IEPINShort extends IBase {
    phonenumber: string;
    EPIN: any;
    SMC: any;
}
export interface IMachineID extends IBase, IBC {
    machineId: string;
    machineIp: string;
    machineCommands: string;
    logintoken: string;
    bill: any;
}




export enum ERedisCommand {
    waiting_transactionID = 'waiting_transactionID',
    processing = "processing",
    machineprocessing = "machineprocessing"
}




export class SocketEmitter {
    ev = new EventEmitter();
    onResponse(cb: (data: IReqModel) => void) {
        this.ev.on('response', (data) => {
            cb(data);
        })
    };
    response(data: IReqModel) {
        this.ev.emit('response', data)
    }
    onMachineExist(cb: (data: boolean) => void) {
        this.ev.on('machineexist', (data) => {
            cb(data);
        })
    };
    isMachineExist(b: boolean) {
        this.ev.emit('machineexist', b);
    }
    onDuplicatedMachine(cb: (data: any) => void) {
        this.ev.on('dupcatedmachine', (data) => {
            cb(data);
        })
    };
    isDuplicatedMachine(b: boolean) {
        this.ev.emit('dupcatedmachine', b);
    }

    onAcceptMachineLogin(cb: (data: string) => void) {
        this.ev.on('acceptMachineLogin', (data) => {
            cb(data);
        })
    };
    isAcceptMachineLogin(machineId: string) {
        this.ev.emit('acceptMachineLogin', machineId);
    }

    onMachinePing(cb: (data: string) => void) {
        this.ev.on('machineping', (data) => {
            cb(data);
        })
    };
    isMachinePing(machineId: string) {
        this.ev.emit('machineping', machineId);
    }

    onConnectionExist(cb: (data: string) => void) {
        this.ev.on('connectionexist', (data) => {
            cb(data);
        })
    };
    isConnectionExist(machineId: string) {
        this.ev.emit('connectionexist', machineId);
    }
}
export interface IBaseClass {

    close: () => void;
}








export enum EMACHINE_COMMAND {
    CREDIT_LAAB_NOTE = 'CREDIT_LAAB_NOTE',
    login = 'login',
    ping = 'ping',
    status = 'status',
    confirm = "confirm",
    note_credit = "note_credit",
    CREDIT_NOTE = "CREDIT_NOTE",
    READ_NOTE = "READ_NOTE",
    REJECT_BANKNOTE = "REJECT_BANKNOTE",
    JAMMED = "JAMMED",
    start = "start",
    ENABLE = "ENABLE",
    DISABLE = "DISABLE",
    stop = "stop",
    setcounter = "setcounter",
    NOTE_REJECTED = "NOTE_REJECTED",
    waitingt = "waitingt",
    refresh = "refresh",
    restart = "restart",
    logs = "logs",
    confirmOrder = "confirmOrder",
    resetCashing = "resetCashing",

}

export interface IMachineClientID extends IBase {
    otp: string;
    machineId: string;
    ownerUuid: string;
    photo: string;
    data: any;
}

export interface IMMoneyLogInRes {

    token: string,
    message: string,
    expiresIn: string,// 2h
    status: true

}
export interface IMMoneyLoginCashin {
    accessToken: string,
    tokenType: string,
    expiresIn: number,
    userName: string,
    issued: string,
    expiry: string
};
export interface IMMoneyGenerateQR {
    transactionID: string,
    phonenumber: string,
    amount: string;
}
export interface IMMoneyGenerateQRPro {
    transID: string,
    merchantNumber: string,
    amount: string;
}
export interface IMMoneyGenerateQRRes {

    name: string,
    resultCode: number,
    resultDesc: string,
    qrCode: string

}

export interface ILaoQRGenerateQRRes {
    timestamp: Date,
    success: boolean,
    message: string,
    transactionId: string,
    data: any
}

export interface IMMoneyConfirm {
    // amount: string,
    // wallet_ids: string,
    // password: string,
    // channel: string,//POS
    // resultCode: string,//200
    // resultDescription: string,//'Operation'
    // trandID: string, // 
    // tranid_client: string,
    // PhoneNumber: string



    // new
    wallet_ids: string,

    channel: string,//POS
    resultCode: string,//200
    resultDescription: string,//'Operation'

    PhoneNumber: string,

    tranid_client: string,
    trandID: string, // 
    amount: string,
    msisdn_merchan: string,
    msisdn_consumer: string,
    qrcode: string


}
export interface IBillProcess {
    ownerUuid: string;
    transactionID: number;
    position: number;
    bill: IVendingMachineBill;
}

export interface IBankNote extends IBase {
    value: number;
    amount: number;
    currency: string;
    channel: number;
    image: string;
}
export interface IHashBankNote extends IBankNote {
    hash: string;
}
export interface IBillCashIn extends IBase {
    bankNotes: Array<IBankNote>;
    badBankNotes: Array<IBankNote>;
    transactionID: number;
    userUuid: string;
    requestor: IMMoneyRequestRes;
    requestTime: Date;
    confirm: any;
    confirmTime: Date;
    clientId: string;
    machineId: string
}
export interface IMMoneyTransData {
    transCashInID: number,
    transStatus: string,
    accountNo: string,
    accountNameEN: string,
    accountRef: string,
    accountType: string,
    transExpiry: Date
}
export interface IMMoneyRequestRes {
    // "22162": "73494",
    transData: Array<IMMoneyTransData>,
    responseCode: string,
    responseMessage: string,
    responseStatus: string,
    transID: number,
    processTime: number,
    serverDatetime: Date,
    serverDatetimeMs: number
}

export const data = [{
    id: 0,
    name: 'Pepsi can 330ml',
    image: 'pepsican.jpeg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true

}, {
    id: 1,
    name: 'Pepsi Zero',
    image: 'pepsizero.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true

}, {
    id: 2,
    name: 'Oishi black tea 450ml',
    image: 'oishiteabottle.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 3,
    name: 'Water tiger head 380ml',
    image: 'tigerheadbottle.png',
    price: 4000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 4,
    name: 'Water tiger head 235ml',
    image: 'tigerheadbottlesmall.png',
    price: 2000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 5,
    name: 'LTC water (MMoney)',
    image: 'ltc_water_m.png',
    price: 0,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 6,
    name: 'Beerlao 330ml',
    image: 'beerlao.png',
    price: 11000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 7,
    name: 'Carlsberg red 330ml',
    image: 'carlsbergred.png',
    price: 13000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 8,
    name: 'Mirinda green 330ml',
    image: 'mirindagreen.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 9,
    name: 'Mirinda orange 330ml',
    image: 'mirindaorange.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 10,
    name: 'Mirinda strawberry 330ml',
    image: 'mirindastrawberry.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 11,
    name: 'Johnson',
    image: 'johnson.jpg',
    price: 22000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 12,
    name: 'Scott',
    image: 'scott.jpg',
    price: 4000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 13,
    name: 'Sponsor ',
    image: 'sponsor.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 14,
    name: 'Nescafe ',
    image: 'nescafe.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 15,
    name: 'Birdy ',
    image: 'birdy.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 16,
    name: 'Kokozo coconut ',
    image: 'kokozococonut.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 17,
    name: 'Carlsberg green ',
    image: 'carlsberggreen.jpg',
    price: 13000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 18,
    name: 'Green tigerhead water',
    image: 'greentigerheadwater.jpg',
    price: 4000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 19,
    name: 'Green tigerhead water',
    image: 'greentigerheadwater.jpg',
    price: 4000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 20,
    name: 'Greenmate orange',
    image: 'greenmateorange.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    ,
{
    id: 21,
    name: 'Kokozo Lychee',
    image: 'kokozolychee.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},//
{
    id: 22,
    name: 'Zappe Green drink Detox',
    image: 'zappegreendrink.jpg',
    price: 12000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},//
{
    id: 23,
    name: 'Greenmate Orange bottle',
    image: 'greenmateorangebottle.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 24,
    name: 'Sappe blue drink',
    image: 'sappebautidrinkblue.jpg',
    price: 12000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 25,
    name: 'Haki drink lemon',
    image: 'hakidrinklemon.jpeg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 26,
    name: 'Yen Yen Kekhuai',
    image: 'yenyenkekhuai.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 27,
    name: 'Minimate Orange',
    image: 'minimateorange.jpg',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 28,
    name: 'Oishi Green tea Genmai',
    image: 'oishi-green-tea-genmai.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 29,
    name: 'Oishi Green tea lemon',
    image: 'oishi-green-tea-lemon.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 30,
    name: 'Dutchmill strawberry',
    image: 'dutchmillstrawberry.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 31,
    name: 'Dutchmill Berry mixed',
    image: 'duchmilkberrymix.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 32,
    name: 'Dutchmill Blueberry',
    image: 'dutchmillblueberry.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 33,
    name: 'Dna corn',
    image: 'dnacorn.jpeg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 34,
    name: 'Dna Green',
    image: 'dnagreen.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 35,
    name: 'Dna sesame',
    image: 'dnasesame.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 36,
    name: 'Dna strawberry',
    image: 'dnastrawberry.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 37,
    name: 'Ovaltine Red',
    image: 'ovaltinered.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 38,
    name: 'Dmalt',
    image: 'dmaltuht.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    ,
{
    id: 39,
    name: 'Lactasoy',
    image: 'lactasoy.jpg',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 39,
    name: 'Heineken',
    image: 'heineken.jpg',
    price: 0,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 40,
    name: 'Heineken',
    image: 'heineken.jpg',
    price: 0,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 62,
    name: '7Up',
    image: '7up.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 63,
    name: 'Birdy latte',
    image: 'birdy-latte.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 64,
    name: 'Freeze coconut',
    image: 'freeze-coconut.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 65,
    name: 'Dutchmilk Green',
    image: 'dutchmilk-green.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 66,
    name: 'Magicfarm coconut',
    image: 'magicfarm-coconut.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 67,
    name: 'Kato lychee',
    image: 'kato-lychee.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 68,
    name: 'Nescafe green',
    image: 'nescafe-green.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 69,
    name: 'Kato orange',
    image: 'kato-orange.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 70,
    name: 'Kato red',
    image: 'kato-red.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 71,
    name: 'bachus purple',
    image: 'bachus-purple.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 72,
    name: 'bachus blue',
    image: 'bachus-blue.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 73,
    name: 'Birdy latte',
    image: 'birdy-latte.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    ,
{
    id: 74,
    name: 'Schweppes Manao Soda',
    image: 'schweppes-manaosoda.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 75,
    name: 'Kokozo purple',
    image: 'kokozo-purple.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 76,
    name: 'Kokozo green',
    image: 'kokozo-green.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
},
{
    id: 77,
    name: 'Kokozo red',
    image: 'kokozo-red.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 78,
    name: 'Kokozo lychee',
    image: 'kokozo-lychee.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 79,
    name: 'haki purple',
    image: 'haki-purple.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 80,
    name: 'Birdy green',
    image: 'birdy-green.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 81,
    name: 'Beerlao Gold',
    image: 'beerlao-gold.png',
    price: 12000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 82,
    name: 'Somersby Apple sparkling',
    image: 'somersby-apple-sparkling.png',
    price: 13000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 83,
    name: 'Kokozo orange',
    image: 'kokozo-orange.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 84,
    name: 'Malee grape',
    image: 'malee-grape.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 85,
    name: 'Malee Apple',
    image: 'malee-apple.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 86,
    name: 'Malee Green Orange',
    image: 'malee-green-orange.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 87,
    name: 'Malee Guava',
    image: 'malee-guava.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 88,
    name: 'Malee Orange',
    image: 'malee-orange.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 89,
    name: 'Malee Pineapple',
    image: 'malee-pineapple.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 90,
    name: 'Morning green',
    image: 'morning-birdnet-green.png',
    price: 39000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 91,
    name: 'Morning pink',
    image: 'morning-birdnet-pink.png',
    price: 39000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 92,
    name: 'Morning Red D',
    image: 'morning-birdnet-red-d.png',
    price: 39000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 93,
    name: 'Morning Red',
    image: 'morning-birdnet-red.png',
    price: 39000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 94,
    name: '7Up',
    image: '7up-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 95,
    name: 'Betagen Blue',
    image: 'btagen-blue.png',
    price: 16000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 96,
    name: 'Betagen Orange',
    image: 'btagen-orange.png',
    price: 16000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}, {
    id: 97,
    name: 'Revive blue',
    image: 'revive-blue.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 98,
    name: 'Sting Yellow',
    image: 'sting-yellow.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 99,
    name: 'Sting Red',
    image: 'sting-red.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 100,
    name: 'Pepsi Bottle',
    image: 'pepsi-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 101,
    name: 'Mirinda orange Bottle',
    image: 'mirinda-orange-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 102,
    name: 'Mirinda green Bottle',
    image: 'mirinda-green-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 103,
    name: 'Mirinda strawberry Bottle',
    image: 'mirinda-strawberry-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 104,
    name: 'Greenmate grassjelly',
    image: 'mirinda-strawberry-bottle.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 105,
    name: 'Greenmate grassjelly',
    image: 'greenmate-grassjelly.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 106,
    name: 'Greenmate lychee',
    image: 'greenmate-lychee.png',
    price: 9000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 107,
    name: 'Sappe Bauty Drink Pink',
    image: 'sappebautydrink-pink.png',
    price: 12000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 108,
    name: 'Warrior Energy Drink',
    image: 'warrior-energydrink.png',
    price: 10000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 109,
    name: 'Soda Lao',
    image: 'soda-lao.png',
    price: 7000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 110,
    name: 'Greenmate Tamarind',
    image: 'greenmate-tamarind.png',
    price: 8000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}
    , {
    id: 111,
    name: 'Kato Grape',
    image: 'kato-grape.png',
    price: 6000,
    qtty: 1,
    hashP: '',
    hashM: '',
    isActive: true
}

]








export enum EEntity {
    banknote = 'banknote',
    billcash = "billcash",
    vendingmachinesale = "vendingmachinesale",
    product = "stock",
    vendingmachinebill = "vendingmachinebill",
    machineID = "machineID",
    machineIDHistory = "machineIDHistory",
    badbillcash = "badbillcash",
    insuffbillcash = "insuffbillcash",
    machineclientid = "machineclientid",
    vendingmachinebillpaid = "vendingmachinebillpaid",
    vendingwallet = 'vendingwallet',
    epinshortcode = 'epinshortcode',
    subadmin = 'subadmin',
    franchisestock = "franchisestock",
    vendingcashoutmmoney = 'vendingcashoutmmoney',
    vendingmachinesalereport = 'vendingmachinesalereport',
    ads = "ads",
    logactivity = 'logactivity',
    Door = "Door",
    DoorPayment = "DoorPayment",
    vendingVersion = 'vendingversion'
}

export interface ISaveMachineSaleReport {
    machineId: string,
    data: Array<any>
}

export interface IAdsMedia {
    name: string;
    description: string;
    url: string;
    type: string//webm,png
}
export interface IAds extends IBase {
    name: string;
    description: string;
    machines: Array<string>;
    adsMedia: Array<IAdsMedia>
}
export interface ISubadmin {
    id?: number,
    uuid?: string,
    isActive?: boolean,
    ownerUuid: string,
    data: {
        uuid: string,
        phonenumber: string
    },
    provides: Array<any>
}

export interface ILoadVendingMachineSaleBillReport {
    ownerUuid: string,
    fromDate: string,
    toDate: string,
    machineId: string
}

export interface ILoadVendingMachineStockReport extends ILoadVendingMachineSaleBillReport { }