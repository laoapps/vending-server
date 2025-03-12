// Define data interfaces for different protocol versions
export  interface SimpleValueData {
    value: number;
}

export interface ChannelData {
    channel: number;
}

export interface ValueArrayData {
    value: { value: number; country_code: string }[];
}

export interface ActualRequestedData {
    actual: number;
    requested: number;
}

export interface ActualRequestedArrayData {
    value: { actual: number; requested: number; country_code: string }[];
}

export interface ErrorData {
    error: string;
}

export interface ErrorValueArrayData {
    value: { value: number; country_code: string }[];
    error: string;
}

// Union type for all possible data structures
export type EventData = {
    [key: string]: 
        | SimpleValueData
        | ChannelData
        | ValueArrayData
        | ActualRequestedData
        | ActualRequestedArrayData
        | ErrorData
        | ErrorValueArrayData
        | undefined;
};

// Event class definition
export class EventStatus {
    constructor(
        public code: number,
        public name: string,
        public description: string,
        public devices?: string[],
        public data?: EventData
    ) {}
}

// Status description list with numeric keys
export const statusDesc: { [key: number]: EventStatus } = {
    176: new EventStatus(176, "JAM_RECOVERY", "The SMART Payout unit is in the process of recovering from a detected jam...", ["SMART Payout"]),

    177: new EventStatus(177, "ERROR_DURING_PAYOUT", "Returned if an error is detected whilst moving a note inside the SMART Payout unit...", ["SMART Payout"], {
        "Protocol version < 7": { error: "" },
        "Protocol version >= 7": { value: [], error: "" }
    }),

    179: new EventStatus(179, "SMART_EMPTYING", "The device is in the process of carrying out its Smart Empty command...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    180: new EventStatus(180, "SMART_EMPTIED", "The device has completed its Smart Empty command...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    181: new EventStatus(181, "CHANNEL_DISABLE", "The device has had all its note channels inhibited...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    182: new EventStatus(182, "INITIALISING", "This event is given only when using the Poll with ACK command...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11", "SMART Hopper"]),

    183: new EventStatus(183, "COIN_MECH_ERROR", "The attached coin mechanism has generated an error...", ["SMART Hopper"]),

    194: new EventStatus(194, "EMPTYING", "The device is in the process of emptying its content...", ["SMART Payout", "SMART Hopper", "NV11"]),

    195: new EventStatus(195, "EMPTIED", "The device has completed its Empty process...", ["SMART Payout", "SMART Hopper", "NV11"]),

    196: new EventStatus(196, "COIN_MECH_JAMMED", "The attached coin mechanism has been detected as having a jam.", ["SMART Hopper"]),

    197: new EventStatus(197, "COIN_MECH_RETURN_PRESSED", "The attached coin mechanism has been detected as having is reject or return button pressed.", ["SMART Hopper"]),

    198: new EventStatus(198, "PAYOUT_OUT_OF_SERVICE", "This event is given if the payout goes out of service during operation...", ["SMART Payout", "NV11"]),

    199: new EventStatus(199, "NOTE_FLOAT_REMOVED", "Reported when a note float unit has been detected as removed...", ["NV11"]),

    200: new EventStatus(200, "NOTE_FLOAT_ATTACHED", "Reported when a note float unit has been detected as removed...", ["NV11"]),

    201: new EventStatus(201, "NOTE_TRANSFERED_TO_STACKER", "Reported when a note has been successfully moved from the payout store...", ["SMART Payout", "NV11"], {
        "Protocol version >= 6": { value: [] }
    }),

    202: new EventStatus(202, "NOTE_PAID_INTO_STACKER_AT_POWER-UP", "Reported when a note has been detected as paid into the cashbox stacker...", ["SMART Payout", "NV11"], {
        "Protocol version >= 8": { value: [] }
    }),

    203: new EventStatus(203, "NOTE_PAID_INTO_STORE_AT_POWER-UP", "Reported when a note has been detected as paid into the payout store...", ["SMART Payout", "NV11"], {
        "Protocol version >= 8": { value: [] }
    }),

    204: new EventStatus(204, "NOTE_STACKING", "The note is being moved from the escrow position to the host exit section...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    205: new EventStatus(205, "NOTE_DISPENSED_AT_POWER-UP", "Reported when a note has been dispensed as part of the power-up procedure.", ["NV11"], {
        "Protocol version >= 6": { value: [] }
    }),

    206: new EventStatus(206, "NOTE_HELD_IN_BEZEL", "Reported when a dispensing note is held in the bezel of the payout device.", ["SMART Payout", "NV11"], {
        "Protocol version >= 8": { value: [] }
    }),

    207: new EventStatus(207, "DEVICE_FULL", "This event is reported when the Note Float has reached its limit of stored notes...", ["NV11"]),

    209: new EventStatus(209, "BAR_CODE_TICKET_ACKNOWLEDGE", "The bar code ticket has been passed to a safe point in the device stacker.", ["NV200", "NV201"]),

    210: new EventStatus(210, "DISPENSED", "The device has completed its pay-out request...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    213: new EventStatus(213, "JAMMED", "The device has detected that coins are jammed in its mechanism...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    214: new EventStatus(214, "HALTED", "This event is given when the host has requested a halt to the device...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    215: new EventStatus(215, "FLOATING", "The device is in the process of executing a float command...", ["SMART Payout", "SMART Hopper"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    216: new EventStatus(216, "FLOATED", "The device has completed its float command...", ["SMART Payout", "SMART Hopper"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    217: new EventStatus(217, "TIME_OUT", "The device has been unable to complete a request...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    218: new EventStatus(218, "DISPENSING", "The device is in the process of paying out a requested value...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    219: new EventStatus(219, "NOTE_STORED_IN_PAYOUT", "The note has been passed into the note store of the payout unit.", ["SMART Payout", "NV11"]),

    220: new EventStatus(220, "INCOMPLETE_PAYOUT", "The device has detected a discrepancy on power-up that the last payout request was interrupted...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { actual: 0, requested: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    221: new EventStatus(221, "INCOMPLETE_FLOAT", "The device has detected a discrepancy on power-up that the last float request was interrupted...", ["SMART Payout", "SMART Hopper", "NV11"], {
        "Protocol version < 6": { actual: 0, requested: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    222: new EventStatus(222, "CASHBOX_PAID", "This is given at the end of a payout cycle...", ["SMART Hopper"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    223: new EventStatus(223, "COIN_CREDIT", "A coin has been detected as added to the system via the attached coin mechanism...", ["SMART Hopper"], {
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    224: new EventStatus(224, "NOTE_PATH_OPEN", "The device has detected that its note transport path has been opened.", ["NV200"]),

    225: new EventStatus(225, "NOTE_CLEARED_FROM_FRONT", "At power-up, a note was detected as being rejected out of the front of the device...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"], {
        "All": { channel: 0 }
    }),

    226: new EventStatus(226, "NOTE_CLEARED_TO_CASHBOX", "At power up, a note was detected as being moved into the stacker unit...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"], {
        "All": { channel: 0 }
    }),

    227: new EventStatus(227, "CASHBOX_REMOVED", "A device with a detectable cashbox has detected that it has been removed.", ["BV50", "BV100", "NV200", "SMART Payout", "NV11"]),

    228: new EventStatus(228, "CASHBOX_REPLACED", "A device with a detectable cashbox has detected that it has been replaced.", ["BV50", "BV100", "NV200", "SMART Payout", "NV11"]),

    229: new EventStatus(229, "BAR_CODE_TICKET_VALIDATED", "A validated barcode ticket has been scanned and is available at the escrow point...", ["NV200", "NV201"]),

    230: new EventStatus(230, "FRAUD_ATTEMPT", "The device has detected an attempt to tamper with the normal validation/stacking/payout process.", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11", "SMART Hopper"], {
        "Banknote validators": { channel: 0 },
        "Protocol version < 6": { value: 0 },
        "Protocol version >= 6": { value: [] }
    }),

    231: new EventStatus(231, "STACKER_FULL", "The banknote stacker unit attached to this device has been detected as at its full limit", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    232: new EventStatus(232, "DISABLED", "The device is not active and unavailable for normal validation functions.", ["All"]),

    233: new EventStatus(233, "UNSAFE_NOTE_JAM", "The note is stuck in a position where the user could possibly remove it from the front...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    234: new EventStatus(234, "SAFE_NOTE_JAM", "The note is stuck in a position not retrievable from the front of the device...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    235: new EventStatus(235, "NOTE_STACKED", "The note has exited the device on the host side or has been placed within its note stacker.", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    236: new EventStatus(236, "NOTE_REJECTED", "The note has been rejected from the validator and is available for the user to retrieve.", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    237: new EventStatus(237, "NOTE_REJECTING", "The note is in the process of being rejected from the validator", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"]),

    238: new EventStatus(238, "CREDIT_NOTE", "A note has passed through the device, past the point of possible recovery...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"], {
        "All": { channel: 0 }
    }),

    239: new EventStatus(239, "READ_NOTE", "A note is in the process of being scanned by the device...", ["BV20", "BV50", "BV100", "NV9USB", "NV10USB", "NV200", "SMART Payout", "NV11"], {
        "All": { channel: 0 }
    }),

    240: new EventStatus(240, "OK", "Returned when a command from the host is understood and has been, or is in the process of, being executed."),

    241: new EventStatus(241, "SLAVE_RESET", "The device has undergone a power reset.", ["All"]),

    242: new EventStatus(242, "COMMAND_NOT_KNOWN", "Returned when an invalid command is received by a peripheral."),

    243: new EventStatus(243, "WRONG_NO_PARAMETERS", "A command was received by a peripheral, but an incorrect number of parameters were received."),

    244: new EventStatus(244, "PARAMETER_OUT_OF_RANGE", "One of the parameters sent with a command is out of range."),

    245: new EventStatus(245, "COMMAND_CANNOT_BE_PROCESSED", "A command sent could not be processed at that time..."),

    246: new EventStatus(246, "SOFTWARE_ERROR", "Reported for errors in the execution of software..."),

    248: new EventStatus(248, "FAIL", "Command failure"),

    250: new EventStatus(250, "KEY_NOT_SET", "The slave is in encrypted communication mode but the encryption keys have not been negotiated.")
};

// Define event code type using numeric keys
export type EventCodeKey = keyof typeof statusDesc;

// Helper functions
export function getEventStatus(code: EventCodeKey): EventStatus {
    return statusDesc[code];
}

export function getEventName(code: EventCodeKey): string {
    return statusDesc[code].name;
}

export function getEventDescription(code: EventCodeKey): string {
    return statusDesc[code].description;
}

// Usage examples
function demonstrateUsage() {
    // Your requested syntax
    const data = [176]; // JAM_RECOVERY
    console.log(statusDesc[data[0]].name);        // "JAM_RECOVERY"
    console.log(statusDesc[data[0]].description); // "The SMART Payout unit is in the process..."
    console.log(statusDesc[data[0]].devices);     // ["SMART Payout"]

    // Direct access
    console.log(statusDesc[210].name);        // "DISPENSED"
    console.log(statusDesc[210].description); // "The device has completed its pay-out request..."

    // Using helper functions
    const event = getEventStatus(179);
    console.log(event.name);        // "SMART_EMPTYING"
    console.log(event.description); // "The device is in the process of carrying out..."

    // With data
    const dataEvent = statusDesc[177];
    console.log(dataEvent.data?.["Protocol version < 7"]);  // { error: "" }
    console.log(dataEvent.data?.["Protocol version >= 7"]); // { value: [], error: "" }
}

// Example with your exact syntax
const data = [238]; // CREDIT_NOTE
const eventName = statusDesc[data[0]].name;        // "CREDIT_NOTE"
const eventDesc = statusDesc[data[0]].description; // "A note has passed through the device..."
console.log(eventName);
console.log(eventDesc);

// Safety wrapper
function getEventNameSafe(data: number[]): string {
    const code = data[0];
    return statusDesc[code]?.name ?? "Unknown event code";
}

console.log(getEventNameSafe([225])); // "NOTE_CLEARED_FROM_FRONT"
console.log(getEventNameSafe([999])); // "Unknown event code"