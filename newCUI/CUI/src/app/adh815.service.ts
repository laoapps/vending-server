import { Injectable } from '@angular/core';
import { EventEmitter } from 'events';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import * as moment from 'moment'; // Add moment import

@Injectable({
    providedIn: 'root'
})
export class ADH815Service implements ISerialService {
    lastPulseTime = Date.now();
    pulsesPerBill = 15;
    totalValue = 0;
    pulseTimeout = 1000;
    machineId = '11111111';
    portName = '/dev/ttyS1';
    baudRate = 9600;
    log: IlogSerial = { data: '', limit: 50 };
    otp = '111111';
    parity: 'none' = 'none';
    dataBits: 8 = 8;
    stopBits: 1 = 1;
    private adh815: ADH815Protocol;
    private T: NodeJS.Timeout;

    constructor(private serialService: SerialServiceService) { }

    private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
       addLogMessage(log, message, consoleMessage);
    }

    private initADH815(): void {
        const portAdapter: CommunicationPort = {
            send: async (data: string) => {
                await this.serialService.write(data);
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
                console.log('adh815 service  Received from device:', hexData);
            }
        });
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

            if (this.T) clearInterval(this.T);
            if (this.adh815) this.adh815.dispose();

            const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
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
                    data: params,
                    status: response.data[0] === 0 ? 1 : 0,
                    message: `Command 0x${response.command.toString(16)} executed`,
                    transactionID
                };
                resolve(result);
            };

            const onError = (error: Error) => {
                reject(new Error(`Command failed: ${error.message}`));
            };

            switch (command) {
                case EMACHINE_COMMAND.temp:
                    this.adh815.setTemperature(0x02, 0x01, 0x0008, onResponse).catch(onError);
                    break;
                case EMACHINE_COMMAND.shippingcontrol:
                    this.adh815.startMotor(0x01, 0x00, onResponse).catch(onError);
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
        if (this.T) clearInterval(this.T);
        if (this.adh815) this.adh815.dispose();
        return this.serialService.close();
    }

    public async listPorts(): Promise<SerialPortListResult> {
        return await this.serialService.listPorts();
    }
}

// Interface for a generic protocol message
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
    return ((crc >> 8) & 0xFF) | ((crc << 8) & 0xFF00);
}

// Utility to convert Uint8Array to hex string
function toHexString(data: Uint8Array): string {
    return Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

// CommunicationPort interface adapted for hex string output
interface CommunicationPort {
    send(data: string): Promise<void>;
    on(event: 'data', listener: (data: Uint8Array) => void): void;
    off(event: 'data', listener: (data: Uint8Array) => void): void;
}

// Protocol class with listener support
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
                console.log('adh815 service  adh815 service  Error parsing response:', error);
            }
        });
    }

    async sendRequest(request: Uint8Array, onResponse: (response: IADH815) => void): Promise<void> {
        const command = request[1];
        this.responseListeners.set(command, onResponse);
        const hexRequest = toHexString(request);
        await this.port.send(hexRequest);
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
            throw new Error('CRC validation failed');
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
        await this.sendRequest(request, onResponse);
    }

    async startMotor(
        address: number,
        motorNumber: number,
        onResponse: (response: IADH815) => void
    ): Promise<void> {
        const data = [motorNumber];
        const request = this.createRequest(address, 0x05, data);
        await this.sendRequest(request, onResponse);
    }

    dispose() {
        this.responseListeners.clear();
    }
}