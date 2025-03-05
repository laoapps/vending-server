import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
/// FOR RS485 only 
@Injectable({
    providedIn: 'root'
})
export class ADH815Service implements ISerialService {
    machineId = '11111111';
    portName = '/dev/ttyS1';
    baudRate = 9600; // Typical RS485 baud rate, adjust if specified
    log: IlogSerial = { data: '', limit: 50 };
    otp = '111111';
    parity: 'none' = 'none';
    dataBits: 8 = 8;
    stopBits: 1 = 1;
    private adh815: ADH815Protocol;
    private totalValue = 0; // Optional: track value if bill validator functionality is intended
    machinestatus = {data:''};
    constructor(private serialService: SerialServiceService) { }

    private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
        addLogMessage(log, message, consoleMessage);
    }

    private initADH815(): void {
        const portAdapter: CommunicationPort = {
            send: async (data: string) => {
                await this.serialService.write(data);
                this.addLogMessage(this.log, `Sent: ${data}`);
            },
            on: (event: 'data', listener: (data: Uint8Array) => void) => {
                this.serialService.getSerialEvents().subscribe((serialEvent) => {
                    if (serialEvent.event === 'dataReceived') {
                        const buffer = new Uint8Array(hexToUint8Array(serialEvent.data));
                        listener(buffer);
                    }
                });
            },
            off: () => {
                // No-op; Angular subscriptions handle cleanup
            }
        };

        this.adh815 = new ADH815Protocol(portAdapter);

        // Log raw data for debugging
        this.getSerialEvents().subscribe((event) => {
            if (event.event === 'dataReceived') {
                const hexData = event.data;
                this.addLogMessage(this.log, `Raw data: ${hexData}`);
            } else if (event.event === 'serialOpened') {
                this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
                this.setupDevice().catch(err => {
                    this.addLogMessage(this.log, `Setup failed: ${err.message}`);
                });
            }
        });
    }

    private async setupDevice(): Promise<void> {
        try {
            const idResponse = await this.adh815.requestID(0x02); // Example slave address 2
            this.addLogMessage(this.log, `Device ID response: ${JSON.stringify(idResponse)}`);
            // Additional setup (e.g., enable bill acceptance) can be added if specified
            this.addLogMessage(this.log, 'ADH815 setup complete');
            return new Promise((resolve) => {
                resolve();
            });
        } catch (err) {
            this.addLogMessage(this.log, `Setup error: ${err.message}`);
            return new Promise((resolve, reject) => {
                reject(err);
            });
        }
    }

    initializeSerialPort(
        portName: string,
        baudRate: number,
        log: IlogSerial,
        machineId: string,
        otp: string,
        isNative: ESerialPortType
    ): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            this.machineId = machineId;
            this.otp = otp;
            this.portName = portName || this.portName;
            this.baudRate = baudRate || this.baudRate;
            this.log = log;

            if (this.adh815) this.adh815.dispose();

            const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      this.serialService.startReading();

            if (init === this.portName) {
                this.initADH815();
                resolve(init);
            } else {
                reject(init);
            }
        });
    }

    command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
        return new Promise<IResModel>((resolve, reject) => {
            if (!this.adh815) {
                reject(new Error('Serial port not initialized'));
                return;
            }

            const onResponse = (response: IADH815) => {
                const result: IResModel = {
                    command,
                    data: { response },
                    status: response.data[0] === 0 ? 1 : 0, // Assuming 0 means success
                    message: `Command 0x${response.command.toString(16)} executed`,
                    transactionID
                };
                resolve(result);
            };

            const onError = (error: Error) => {
                reject(new Error(`Command failed: ${error.message}`));
            };

            switch (command) {
                case EMACHINE_COMMAND.SET_TEMP: // Renamed for clarity
                    const { mode = 0x00, tempValue = 0x0008, address = 0x02 } = params || {};
                    this.adh815.setTemperature(address, mode, tempValue, onResponse).catch(onError);
                    break;
                case EMACHINE_COMMAND.START_MOTOR: // Renamed for clarity
                    const { motorNumber = 0x00, address: motorAddress = 0x01 } = params || {};
                    this.adh815.startMotor(motorAddress, motorNumber, onResponse).catch(onError);
                    break;
                case EMACHINE_COMMAND.CLEAR_RESULT:
                    const { motor1 = 0x00, motor2 = 0x01, clearAddress = 0x01 } = params || {};
                    this.adh815.clearResult(clearAddress, motor1, motor2, onResponse).catch(onError);
                    break;
                case EMACHINE_COMMAND.RESET:
                    this.totalValue = 0;
                    resolve(PrintSucceeded(command, {}, 'reset'));
                    break;
                case EMACHINE_COMMAND.READ_EVENTS:
                    resolve(PrintSucceeded(command, { totalValue: this.totalValue }, 'read events'));
                    break;
                default:
                    resolve(PrintSucceeded(command, params, 'unknown command'));
            }
        });
    }

    checkSum(data?: any[]): string {
        return data ? data.join('') : '';
    }

    getSerialEvents() {
        return this.serialService.getSerialEvents();
    }

    close(): Promise<void> {
        if (this.adh815) this.adh815.dispose();
        return this.serialService.close();
    }

    public async listPorts(): Promise<SerialPortListResult> {
        return  this.serialService.listPorts();
    }
}

// Interface for ADH815 protocol message
interface IADH815 {
    address: number;
    command: number;
    data: number[];
    crc: number;
}

// Utility to calculate CRC-16 (IBM polynomial: 0xA001)
function calculateCRC16(data: number[]): number {
    let crc = 0xFFFF;
    const polynomial = 0xA001;

    for (const byte of data) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            const lsb = crc & 0x0001;
            crc >>= 1;
            if (lsb) crc ^= polynomial;
        }
    }
    return ((crc >> 8) & 0xFF) | ((crc << 8) & 0xFF00); // Byte swap as per example
}

// Utility to convert Uint8Array to hex string
function toHexString(data: Uint8Array): string {
    return Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

// CommunicationPort interface
interface CommunicationPort {
    send(data: string): Promise<void>;
    on(event: 'data', listener: (data: Uint8Array) => void): void;
    off(event: 'data', listener: (data: Uint8Array) => void): void;
}

class ADH815Protocol {
    private port: CommunicationPort;
    private responseListeners: Map<number, (response: IADH815) => void>;

    constructor(port: CommunicationPort) {
        this.port = port;
        this.responseListeners = new Map();
        this.setupListener();
    }

    private setupListener() {
        this.port.on('data', (data: Uint8Array) => {
            try {
                const response = this.parseResponse(data);
                const command = response.command;
                const listener = this.responseListeners.get(command);
                if (listener) {
                    listener(response);
                    this.responseListeners.delete(command);
                } else {
                    console.warn(`No listener for command: 0x${command.toString(16)}`);
                }
            } catch (error) {
                console.log('ADH815 Error parsing response:', error);
            }
        });
    }

    private async sendRequest(request: Uint8Array, onResponse: (response: IADH815) => void): Promise<void> {
        const command = request[1];
        this.responseListeners.set(command, onResponse);
        const hexRequest = toHexString(request);
        return  this.port.send(hexRequest);
    }

    private createRequest(address: number, command: number, data: number[]): Uint8Array {
        const payload = [address, command, ...data];
        const crc = calculateCRC16(payload);
        return new Uint8Array([...payload, crc & 0xFF, (crc >> 8) & 0xFF]);
    }

    private parseResponse(buffer: Uint8Array): IADH815 {
        if (buffer.length < 4) throw new Error('Invalid response length');
        const address = buffer[0];
        const command = buffer[1];
        const data = Array.from(buffer.slice(2, buffer.length - 2));
        const receivedCRC = (buffer[buffer.length - 1] << 8) | buffer[buffer.length - 2];
        const payloadToCheck = Array.from(buffer.slice(0, buffer.length - 2));
        const calculatedCRC = calculateCRC16(payloadToCheck);

        if (receivedCRC !== calculatedCRC) {
            throw new Error(`CRC validation failed: received 0x${receivedCRC.toString(16)}, calculated 0x${calculatedCRC.toString(16)}`);
        }
        return { address, command, data, crc: receivedCRC };
    }

    async setTemperature(
        address: number,
        mode: number,
        tempValue: number,
        onResponse: (response: IADH815) => void
    ): Promise<void> {
        const data = [mode, tempValue & 0xFF, (tempValue >> 8) & 0xFF];
        const request = this.createRequest(address, 0x04, data);
        return  this.sendRequest(request, onResponse);
    }

    async startMotor(
        address: number,
        motorNumber: number,
        onResponse: (response: IADH815) => void
    ): Promise<void> {
        const data = [motorNumber];
        const request = this.createRequest(address, 0x05, data);
        return  this.sendRequest(request, onResponse);
    }

    async clearResult(
        address: number,
        motorNumber1: number,
        motorNumber2: number,
        onResponse: (response: IADH815) => void
    ): Promise<void> {
        const data = [motorNumber1, motorNumber2];
        const request = this.createRequest(address, 0x15, data);
        return  this.sendRequest(request, onResponse);
    }

    async requestID(
        address: number
    ): Promise<IADH815> {
        return new Promise((resolve, reject) => {
            const request = this.createRequest(address, 0x01, []);
            this.sendRequest(request, resolve).catch(reject);
        });
    }

    dispose() {
        this.responseListeners.clear();
    }
}