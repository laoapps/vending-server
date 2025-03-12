// Define all possible argument export interfaces
export interface NoArgs {}

export interface ChannelsArgs {
    channels: number[];
}

export interface VersionArgs {
    version: number;
}

export interface BarcodeConfigArgs {
    enable: 'none' | 'top' | 'bottom' | 'both';
    numChar: number; // min:6 max:24
}

export interface BarcodeInhibitArgs {
    currencyRead: boolean;
    barCode: boolean;
}

export interface RefillModeArgs {
    mode: 'on' | 'off' | 'get';
}

export interface PayoutAmountArgs {
    test: boolean;
    amount: number;
    country_code: string;
}

export interface DenominationLevelArgs {
    value: number;
    denomination: number;
    country_code: string;
}

export interface DenominationAmountArgs {
    amount: number;
    country_code: string;
}

export interface DenominationRouteArgs {
    route: 'payout' | 'cashbox';
    value: number;
    country_code: string;
    isHopper: boolean;
}

export interface GetDenominationRouteArgs {
    value: number;
    country_code: string;
    isHopper: boolean;
}

export interface FloatAmountArgs {
    test: boolean;
    min_possible_payout: number;
    amount: number;
    country_code: string;
}

export interface CoinMechInhibitsArgs {
    inhibited: boolean;
    amount: number;
    country_code: string;
}

export interface FloatDenominationArgs {
    test: boolean;
    value: { number: number; denomination: number; country_code: string }[];
}

export interface ValueReportingArgs {
    reportBy: 'value' | 'channel';
}

export interface PayoutDenominationArgs {
    test: boolean;
    value: { number: number; denomination: number; country_code: string }[];
}

export interface CoinMechGlobalInhibitArgs {
    enable: boolean;
}

export interface KeyArgs {
    key: number;
}

export interface BaudRateArgs {
    baudrate: 9600 | 38400 | 115200;
    reset_to_default_on_reset: boolean;
}

export interface HopperOptionsArgs {
    payMode: 0 | 1;
    levelCheck: boolean;
    motorSpeed: 0 | 1;
    cashBoxPayActive: boolean;
}

export interface BezelArgs {
    RGB: string; // hex color
    volatile: boolean;
}

export interface CoinMechOptionsArgs {
    ccTalk: boolean;
}

export interface EnablePayoutArgs {
    GIVE_VALUE_ON_STORED: boolean;
    NO_HOLD_NOTE_ON_PAYOUT: boolean;
    REQUIRE_FULL_STARTUP?: boolean;
    OPTIMISE_FOR_PAYIN_SPEED?: boolean;
}

export interface FixedKeyArgs {
    fixedKey: string;
}

// Union type for all possible arguments
export type SSPArgs = 
    | null
    | ChannelsArgs
    | VersionArgs
    | BarcodeConfigArgs
    | BarcodeInhibitArgs
    | RefillModeArgs
    | PayoutAmountArgs
    | DenominationLevelArgs
    | DenominationAmountArgs
    | DenominationRouteArgs
    | GetDenominationRouteArgs
    | FloatAmountArgs
    | CoinMechInhibitsArgs
    | FloatDenominationArgs
    | ValueReportingArgs
    | PayoutDenominationArgs
    | CoinMechGlobalInhibitArgs
    | KeyArgs
    | BaudRateArgs
    | HopperOptionsArgs
    | BezelArgs
    | CoinMechOptionsArgs
    | EnablePayoutArgs
    | FixedKeyArgs;

// Message class definition
export class SSPMessage {
    constructor(
        public code: number,
        public encrypted: boolean,
        public args: SSPArgs,
        public device: string[],
        public description: string,
        public example?: string
    ) {}
}

// Command list with all commands implemented
export const commandList: { [key: string]: SSPMessage } = {
    RESET: new SSPMessage(1, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "Command to instruct the slave to perform a hard reset at any point within its operational status."),

    SET_CHANNEL_INHIBITS: new SSPMessage(2, false, { channels: [] }, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Variable length command, used to control which channels are enabled...", "SSP.command('SET_CHANNEL_INHIBITS', {channels:[1,1,1,1,1,0,0,0]})"),

    DISPLAY_ON: new SSPMessage(3, false, null, ["NV9USB", "NV10USB", "NV200", "NV11"], "Use this command to re-enabled a disabled bezel illumination function..."),

    DISPLAY_OFF: new SSPMessage(4, false, null, ["NV9USB", "NV10USB", "NV200", "NV11"], "This command will force the device bezel to not be illuminated even if the device is enabled."),

    SETUP_REQUEST: new SSPMessage(5, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "The device responds with an array of data the format of which depends upon the device..."),

    HOST_PROTOCOL_VERSION: new SSPMessage(6, false, { version: 0 }, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "Dual byte command, the first byte is the command...", "SSP.command('HOST_PROTOCOL_VERSION', { version: 6 })"),

    POLL: new SSPMessage(7, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "The poll command returns the list of events that have occurred within the device since the last poll..."),

    REJECT_BANKNOTE: new SSPMessage(8, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "A command to reject a note held in escrow in the banknote validator..."),

    DISABLE: new SSPMessage(9, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "The peripheral will switch to its disabled state..."),

    ENABLE: new SSPMessage(10, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "Send this command to enable a disabled device."),

    GET_SERIAL_NUMBER: new SSPMessage(12, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "This command returns a 4-byte big endian array representing the unique factory programmed serial number..."),

    UNIT_DATA: new SSPMessage(13, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Returns, Unit type (1 Byte integer), Firmware Version (4 bytes ASCII string)..."),

    CHANNEL_VALUE_REQUEST: new SSPMessage(14, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Returns channel value data for a banknote validator..."),

    CHANNEL_SECURITY_DATA: new SSPMessage(15, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Command which returns a number of channels byte..."),

    CHANNEL_RE_TEACH_DATA: new SSPMessage(16, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "This is a vestigial command and may be deprecated in future versions..."),

    SYNC: new SSPMessage(17, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "A command to establish communications with a slave device..."),

    LAST_REJECT_CODE: new SSPMessage(23, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Returns a single byte that indicates the reason for the last banknote reject..."),

    HOLD: new SSPMessage(24, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "This command may be sent to BNV when Note Read has changed from 0 to >0..."),

    GET_FIRMWARE_VERSION: new SSPMessage(32, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "Returns the full firmware version ascii data array for this device."),

    GET_DATASET_VERSION: new SSPMessage(33, false, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "NV11"], "Returns a string of ascii codes giving the full dataset version of the device."),

    GET_ALL_LEVELS: new SSPMessage(34, false, null, ["SMART Hopper", "SMART Payout"], "Use this command to return all the stored levels of denominations in the device..."),

    GET_BAR_CODE_READER_CONFIGURATION: new SSPMessage(35, false, null, ["NV9USB", "NV200"], "Returns the set-up data for the device bar code readers."),

    SET_BAR_CODE_CONFIGURATION: new SSPMessage(36, false, { enable: 'none', numChar: 6 }, ["NV9USB", "NV200"], "This command allows the host to set-up the bar code reader(s) configuration...", "SSP.command('SET_BAR_CODE_CONFIGURATION', {enable: 'top', numChar: 6})"),

    GET_BAR_CODE_INHIBIT_STATUS: new SSPMessage(37, false, null, ["NV9USB", "NV200"], "Command to return the current bar code/currency inhibit status."),

    SET_BAR_CODE_INHIBIT_STATUS: new SSPMessage(38, false, { currencyRead: false, barCode: false }, ["NV9USB", "NV200"], "Sets up the bar code inhibit status register...", "SSP.command('SET_BAR_CODE_INHIBIT_STATUS',{ currencyRead: true, barCode: true })"),

    GET_BAR_CODE_DATA: new SSPMessage(39, false, null, ["NV9USB", "NV200"], "Command to obtain last valid bar code ticket data..."),

    SET_REFILL_MODE: new SSPMessage(48, false, { mode: 'get' }, ["SMART Payout"], "A command sequence to set or reset the facility for the payout to reject notes...", "SSP.command('SET_REFILL_MODE', { mode: 'on' })"),

    PAYOUT_AMOUNT: new SSPMessage(51, true, { test: false, amount: 0, country_code: '' }, ["SMART Hopper", "SMART Payout"], "A command to set the monetary value to be paid by the payout unit...", "SSP.command('PAYOUT_AMOUNT', { test: true, amount: 500, country_code: 'EUR' })"),

    SET_DENOMINATION_LEVEL: new SSPMessage(52, false, { value: 0, denomination: 0, country_code: '' }, ["SMART Hopper"], "A command to increment the level of coins of a denomination stored in the hopper...", "SSP.command('SET_DENOMINATION_LEVEL', { value: 12, denomination: 100, country_code: 'EUR' })"),

    GET_DENOMINATION_LEVEL: new SSPMessage(53, false, { amount: 0, country_code: '' }, ["SMART Hopper", "SMART Payout"], "This command returns the level of a denomination stored in a payout device...", "SSP.command('GET_DENOMINATION_LEVEL', { amount: 500, country_code: 'EUR' })"),

    COMMUNICATION_PASS_THROUGH: new SSPMessage(55, false, null, ["SMART Hopper"], "Used with SMART Hopper only. This command sets USB pass through mode..."),

    HALT_PAYOUT: new SSPMessage(56, true, null, ["SMART Hopper", "SMART Payout"], "A command to stop the execution of an existing payout..."),

    SET_DENOMINATION_ROUTE: new SSPMessage(59, true, { route: 'payout', value: 0, country_code: '', isHopper: false }, ["SMART Hopper", "SMART Payout", "NV11"], "This command will configure the denomination to be either routed to the cashbox...", "SSP.command('SET_DENOMINATION_ROUTE', { route: 'payout', value: 10, country_code: 'EUR', isHopper: false })"),

    GET_DENOMINATION_ROUTE: new SSPMessage(60, true, { value: 0, country_code: '', isHopper: false }, ["SMART Hopper", "SMART Payout", "NV11"], "This command allows the host to determine the route of a denomination...", "SSP.command('GET_DENOMINATION_ROUTE', { value: 500, country_code: 'EUR', isHopper: false })"),

    FLOAT_AMOUNT: new SSPMessage(61, true, { test: false, min_possible_payout: 0, amount: 0, country_code: '' }, ["SMART Hopper", "SMART Payout"], "A command to float the hopper unit to leave a requested value of money...", "SSP.command('FLOAT_AMOUNT', { test: true, min_possible_payout: 50, amount: 10000, country_code: 'EUR' })"),

    GET_MINIMUM_PAYOUT: new SSPMessage(62, false, null, ["SMART Hopper", "SMART Payout"], "A command to request the minimum possible payout amount that this device can provide"),

    EMPTY_ALL: new SSPMessage(63, true, null, ["SMART Hopper", "SMART Payout", "NV11"], "This command will direct all stored monies to the cash box without reporting any value..."),

    SET_COIN_MECH_INHIBITS: new SSPMessage(64, false, { inhibited: false, amount: 0, country_code: '' }, ["SMART Hopper"], "This command is used to enable or disable acceptance of individual coin values...", "SSP.command('SET_COIN_MECH_INHIBITS', { inhibited: false, amount: 50, country_code: 'EUR' })"),

    GET_NOTE_POSITIONS: new SSPMessage(65, false, null, ["NV11"], "This command will return the number of notes in the Note Float and the value in each position..."),

    PAYOUT_NOTE: new SSPMessage(66, false, null, ["NV11"], "The Note Float will payout the last note that was stored..."),

    STACK_NOTE: new SSPMessage(67, false, null, ["NV11"], "The Note Float will stack the last note that was stored..."),

    FLOAT_BY_DENOMINATION: new SSPMessage(68, true, { test: false, value: [] }, ["SMART Hopper", "SMART Payout"], "A command to float (leave in device) the requested quantity of individual denominations...", "SSP.command('FLOAT_BY_DENOMINATION', { value: [{ number: 4, denomination: 100, country_code: 'EUR' }, { number: 5, denomination: 10, country_code: 'EUR' }], test: false })"),

    SET_VALUE_REPORTING_TYPE: new SSPMessage(69, false, { reportBy: 'value' }, ["NV11"], "This will set the method of reporting values of notes...", "SSP.command('SET_VALUE_REPORTING_TYPE', { reportBy: 'channel' })"),

    PAYOUT_BY_DENOMINATION: new SSPMessage(70, true, { test: false, value: [] }, ["SMART Hopper", "SMART Payout"], "A command to payout the requested quantity of individual denominations...", "SSP.command('PAYOUT_BY_DENOMINATION', { value: [{ number: 4, denomination: 100, country_code: 'EUR' }, { number: 5, denomination: 10, country_code: 'EUR' }], test: false })"),

    SET_COIN_MECH_GLOBAL_INHIBIT: new SSPMessage(73, false, { enable: false }, ["SMART Hopper"], "This command allows the host to enable/disable the attached coin mech in one command...", "SSP.command('SET_COIN_MECH_GLOBAL_INHIBIT', {enable:true})"),

    SET_GENERATOR: new SSPMessage(74, false, { key: 0 }, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "Eight data bytes are a 64 bit number representing the Generator...", "SSP.command('SET_GENERATOR', { key: 982451653 })"),

    SET_MODULUS: new SSPMessage(75, false, { key: 0 }, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "Eight data bytes are a 64 bit number representing the modulus...", "SSP.command('SET_GENERATOR', { key: 982451653 })"),

    REQUEST_KEY_EXCHANGE: new SSPMessage(76, false, { key: 0 }, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "SMART Payout", "NV11"], "The eight data bytes are a 64 bit number representing the Host intermediate key...", "SSP.command('SET_GENERATOR', { key: 982451653 })"),

    SET_BAUD_RATE: new SSPMessage(77, false, { baudrate: 9600, reset_to_default_on_reset: false }, ["SMART Hopper", "SMART Payout", "NV11"], "This command has two data bytes to allow communication speed to be set on a device...", "SSP.command('SET_BAUD_RATE', { baudrate: 9600, reset_to_default_on_reset: true })"),

    GET_BUILD_REVISION: new SSPMessage(79, false, null, ["NV200", "SMART Hopper", "SMART Payout", "NV11"], "A command to return the build revision information of a device..."),

    SET_HOPPER_OPTIONS: new SSPMessage(80, false, { payMode: 0, levelCheck: false, motorSpeed: 0, cashBoxPayActive: false }, ["SMART Hopper"], "The host can set the following options for the SMART Hopper...", "SSP.command('SET_HOPPER_OPTIONS', { payMode: 0, levelCheck: false, motorSpeed: 1, cashBoxPayActive: false })"),

    GET_HOPPER_OPTIONS: new SSPMessage(81, false, null, ["SMART Hopper"], "This command returns 2 option register bytes described in Set Hopper Options command."),

    SMART_EMPTY: new SSPMessage(82, true, null, ["SMART Hopper", "SMART Payout", "NV11"], "Empties payout device of contents, maintaining a count of value emptied..."),

    CASHBOX_PAYOUT_OPERATION_DATA: new SSPMessage(83, false, null, ["SMART Hopper", "SMART Payout", "NV11"], "Can be sent at the end of a SMART Empty, float or dispense operation..."),

    CONFIGURE_BEZEL: new SSPMessage(84, false, { RGB: '', volatile: false }, ["NV200"], "This command allows the host to configure a supported BNV bezel...", "SSP.command('CONFIGURE_BEZEL', { RGB: 'FF0000', volatile: false })"),

    POLL_WITH_ACK: new SSPMessage(86, true, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "A command that behaves in the same way as the Poll command but with this command..."),

    EVENT_ACK: new SSPMessage(87, true, null, ["NV9USB", "NV10USB", "BV20", "BV50", "BV100", "NV200", "SMART Hopper", "NV11"], "This command will clear a repeating Poll ACK response and allow further note operations."),

    GET_COUNTERS: new SSPMessage(88, false, null, ["NV9USB", "SMART Payout", "NV11"], "A command to return a global note activity counter set for the slave device..."),

    RESET_COUNTERS: new SSPMessage(89, false, null, ["NV9USB", "SMART Payout", "NV11"], "Resets the note activity counters described in Get Counters command to all zero values."),

    COIN_MECH_OPTIONS: new SSPMessage(90, false, { ccTalk: false }, ["SMART Hopper"], "The host can set the following options for the SMART Hopper..."),

    DISABLE_PAYOUT_DEVICE: new SSPMessage(91, false, null, ["SMART Payout", "NV11"], "All accepted notes will be routed to the stacker and payout commands will not be accepted."),

    ENABLE_PAYOUT_DEVICE: new SSPMessage(92, false, { GIVE_VALUE_ON_STORED: false, NO_HOLD_NOTE_ON_PAYOUT: false }, ["SMART Payout", "NV11"], "A command to enable the attached payout device for storing/paying out notes...", "SSP.command('ENABLE_PAYOUT_DEVICE', { GIVE_VALUE_ON_STORED: true, NO_HOLD_NOTE_ON_PAYOUT: true })"),

    SET_FIXED_ENCRYPTION_KEY: new SSPMessage(96, true, { fixedKey: '' }, ["SMART Hopper", "SMART Payout", "NV11"], "A command to allow the host to change the fixed part of the eSSP key...", "SSP.command('SET_FIXED_ENCRYPTION_KEY', { fixedKey: '0123456701234567' })"),

    RESET_FIXED_ENCRYPTION_KEY: new SSPMessage(97, false, null, ["SMART Hopper", "SMART Payout", "NV11"], "Resets the fixed encryption key to the device default...")
};

// Define command name type
export type CommandName = keyof typeof commandList;

// // Usage example
// function getCommandArgs(command: CommandName): SSPArgs {
//     return commandList[command].args;
// }

// Test usage
// const resetArgs = getCommandArgs("RESET_FIXED_ENCRYPTION_KEY"); // null
// const channelArgs = getCommandArgs("SET_CHANNEL_INHIBITS"); // { channels: number[] }