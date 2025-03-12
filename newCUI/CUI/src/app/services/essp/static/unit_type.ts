// Device Type class definition
export class UnitType {
    constructor(
        public code: number,
        public name: string
    ) {}
}

// Device type list with numeric keys
export const unitType: { [key: number]: UnitType } = {
    0: new UnitType(0, "Banknote validator"),
    3: new UnitType(3, "Smart Hopper"),
    6: new UnitType(6, "SMART payout fitted"),
    7: new UnitType(7, "Note Float fitted"),
    8: new UnitType(8, "Addon Printer"),
    11: new UnitType(11, "Stand Alone Printer"),
    13: new UnitType(13, "TEBS"),
    14: new UnitType(14, "TEBS with SMART Payout"),
    15: new UnitType(15, "TEBS with SMART Ticket")
};

// Define device type key type
export type DeviceTypeKey = keyof typeof unitType;

// Helper functions
export function getDeviceType(code: DeviceTypeKey): UnitType {
    return unitType[code];
}

export function getDeviceName(code: DeviceTypeKey): string {
    return unitType[code].name;
}

// Safety wrapper
export function getDeviceNameSafe(data: number[]): string {
    const code = data[0];
    return unitType[code]?.name ?? "Unknown device type";
}

// Usage examples
function demonstrateUsage() {
    // Your requested syntax
    const data = [0]; // Banknote validator
    console.log(unitType[data[0]].name);    // "Banknote validator"
    console.log(unitType[data[0]].code);    // 0

    // Direct access
    console.log(unitType[6].name);         // "SMART payout fitted"
    console.log(unitType[6].code);         // 6

    // Using helper functions
    const device = getDeviceType(7);
    console.log(device.name);                 // "Note Float fitted"
    console.log(device.code);                 // 7

    // Using safe wrapper
    console.log(getDeviceNameSafe([3]));      // "Smart Hopper"
    console.log(getDeviceNameSafe([999]));    // "Unknown device type"
}

// Example with your exact syntax
const data2 = [13]; // TEBS
const deviceName = unitType[data2[0]].name; // "TEBS"
console.log(deviceName);