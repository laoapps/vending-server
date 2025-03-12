// Reject Code class definition
export class RejectCode {
    constructor(
        public code: number,
        public name: string,
        public description: string
    ) {}
}

// Reject code list with numeric keys
export const rejectNote: { [key: number]: RejectCode } = {
    0: new RejectCode(0, "NOTE_ACCEPTED", "The banknote has been accepted. No reject has occured."),
    1: new RejectCode(1, "LENGTH_FAIL", "A validation fail: The banknote has been read but it's length registers over the max length parameter."),
    2: new RejectCode(2, "AVERAGE_FAIL", "Internal validation failure - banknote not recognised."),
    3: new RejectCode(3, "COASTLINE_FAIL", "Internal validation failure - banknote not recognised."),
    4: new RejectCode(4, "GRAPH_FAIL", "Internal validation failure - banknote not recognised."),
    5: new RejectCode(5, "BURIED_FAIL", "Internal validation failure - banknote not recognised."),
    6: new RejectCode(6, "CHANNEL_INHIBIT", "This banknote has been inhibited for acceptance in the dataset configuration."),
    7: new RejectCode(7, "SECOND_NOTE_DETECTED", "A second banknote was inserted into the validator while the first one was still being transported through the banknote path."),
    8: new RejectCode(8, "REJECT_BY_HOST", "The host system issues a Reject command when this banknote was held in escrow."),
    9: new RejectCode(9, "CROSS_CHANNEL_DETECTED", "This bank note was identified as exisiting in two or more seperate channel definitions in the dataset."),
    10: new RejectCode(10, "REAR_SENSOR_ERROR", "An inconsistency in a position sensor detection was seen"),
    11: new RejectCode(11, "NOTE_TOO_LONG", "The banknote failed dataset length checks."),
    12: new RejectCode(12, "DISABLED_BY_HOST", "The bank note was validated on a channel that has been inhibited for acceptance by the host system."),
    13: new RejectCode(13, "SLOW_MECH", "The internal mechanism was detected as moving too slowly for correct validation."),
    14: new RejectCode(14, "STRIM_ATTEMPT", "The internal mechanism was detected as moving too slowly for correct validation."),
    15: new RejectCode(15, "FRAUD_CHANNEL", "Obselete response."),
    16: new RejectCode(16, "NO_NOTES_DETECTED", "A banknote detection was initiated but no banknotes were seen at the validation section."),
    17: new RejectCode(17, "PEAK_DETECT_FAIL", "Internal validation fail. Banknote not recognised."),
    18: new RejectCode(18, "TWISTED_NOTE_REJECT", "Internal validation fail. Banknote not recognised."),
    19: new RejectCode(19, "ESCROW_TIME-OUT", "A banknote held in escrow was rejected due to the host not communicating within the timeout period."),
    20: new RejectCode(20, "BAR_CODE_SCAN_FAIL", "Internal validation fail. Banknote not recognised."),
    21: new RejectCode(21, "NO_CAM_ACTIVATE", "A banknote did not reach the internal note path for validation during transport."),
    22: new RejectCode(22, "SLOT_FAIL_1", "Internal validation fail. Banknote not recognised."),
    23: new RejectCode(23, "SLOT_FAIL_2", "Internal validation fail. Banknote not recognised."),
    24: new RejectCode(24, "LENS_OVERSAMPLE", "The banknote was transported faster than the system could sample the note."),
    25: new RejectCode(25, "WIDTH_DETECTION_FAIL", "The banknote failed a measurement test."),
    26: new RejectCode(26, "SHORT_NOTE_DETECT", "The banknote measured length fell outside of the validation parameter for minimum length."),
    27: new RejectCode(27, "PAYOUT_NOTE", "The reject code cammand was issued after a note was payed out using a note payout device."),
    28: new RejectCode(28, "DOUBLE_NOTE_DETECTED", "Mote than one banknote was detected as overlayed during note entry."),
    29: new RejectCode(29, "UNABLE_TO_STACK", "The bank was unable to reach it's correct stacking position during transport")
};

// Define reject code type using numeric keys
export type RejectCodeKey = keyof typeof rejectNote;

// Helper function to get reject code by number
export function getRejectCode(code: RejectCodeKey): RejectCode {
    return rejectNote[code];
}

// Alternative lookup by name
// const rejectNoteByName: { [key: string]: RejectCode } = Object.fromEntries(
//     Object.entries(rejectNote).map(([_, value]) => [value.name, value])
// );

// // Usage examples
// function demonstrateUsage() {
//     // Assuming data is an array with a numeric value
//     const data = [8]; // Example data array with reject code 8
//     console.log(rejectNote[data[0]].name);        // "REJECT_BY_HOST"
//     console.log(rejectNote[data[0]].description); // "The host system issues a Reject command..."

//     // Direct access with number
//     console.log(rejectNote[7].name);        // "SECOND_NOTE_DETECTED"
//     console.log(rejectNote[7].description); // "A second banknote was inserted..."

//     // Using helper function
//     const rejectInfo = getRejectCode(19);
//     console.log(rejectInfo.name);        // "ESCROW_TIME-OUT"
//     console.log(rejectInfo.description); // "A banknote held in escrow was rejected..."

//     // Using name lookup
//     const byName = rejectNoteByName["NOTE_ACCEPTED"];
//     console.log(byName.code);        // 0
//     console.log(byName.description); // "The banknote has been accepted..."
// }

// // Type-safe access to specific properties
// function getRejectName(code: RejectCodeKey): string {
//     return rejectNote[code].name;
// }

// function getRejectDescription(code: RejectCodeKey): string {
//     return rejectNote[code].description;
// }

// // Example usage with your requested syntax
// const data = [6]; // Example data array
// const rejectName = rejectNote[data[0]].name; // "CHANNEL_INHIBIT"
// const rejectDesc = rejectNote[data[0]].description; // "This banknote has been inhibited..."
// console.log(rejectName);
// console.log(rejectDesc);

// // Type-safe example
// const name = getRejectName(25); // "WIDTH_DETECTION_FAIL"
// const desc = getRejectDescription(25); // "The banknote failed a measurement test."
// console.log(name);
// console.log(desc);