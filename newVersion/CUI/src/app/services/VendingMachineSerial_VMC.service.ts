import { Injectable } from '@angular/core';
import { EventEmitter } from 'events';
declare const cordova: any;

interface CommandQueue {
    command: string; // Command sent as a hex string
    id: number;
    type: CommandType;
    retries: number;
    timestamp: number;
}

enum CommandType {
    POLL = 0xFB,
    DETECT_DROP = 0xFC,
    BILL_ACCEPT = 0x21,
    BILL_SWALLOW = 0x23,
    VEND = 0x24,
    STATUS = 0x25,
}

@Injectable({
    providedIn: 'root'
})
export class VendingMachineSerial_VMC extends EventEmitter {
    private baudRate: number = 57600;
    private isConnected: boolean = false;
    private commandQueue: CommandQueue[] = [];
    private currentTransactionId: number = 0;
    private pollingInterval: any = null;

    private readonly MAX_RETRIES = 3;
    private readonly COMMAND_TIMEOUT = 5000;
    private readonly POLLING_INTERVAL = 1000;

    constructor() {
        super();

    }

    private async initializeConnection(baudRate: number = 57600): Promise<void> {
        try {
            this.baudRate = baudRate;
            this.initializeConnection();
            await cordova.plugins.USBSerial.open({
                baudRate: this.baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 0
            });

            this.isConnected = true;
            this.setupListeners();
            this.startPolling();
            this.emit('connected');
        } catch (error) {
            console.error('USB Serial connection failed:', error);
            this.tryReconnect();
        }
    }

    private setupListeners(): void {
        cordova.plugins.USBSerial.registerReadCallback((data: ArrayBuffer) => {
            const buffer = new Uint8Array(data);
            this.handleResponse(buffer);
        });
    }

    private async sendCommand(command: string): Promise<void> {
        if (!this.isConnected) {
            throw new Error('USB Serial not connected');
        }

        try {
            const buffer = Buffer.from(command, 'hex');
            await cordova.plugins.USBSerial.write(buffer.buffer);
            console.log('Command sent:', command);
        } catch (error) {
            console.error('Failed to send command:', error);
            throw error;
        }
    }

    private handleResponse(buffer: Uint8Array): void {
        if (!this.validateResponse(buffer)) {
            this.emit('error', new Error('Invalid response'));
            return;
        }

        const type = buffer[2];
        const id = buffer[3];
        const responseData = buffer.slice(4, -1);

        this.emit('data', {
            type,
            id,
            data: Array.from(responseData),
            timestamp: Date.now()
        });

        if (this.commandQueue.length > 0 && this.commandQueue[0].id === id) {
            this.commandQueue.shift();
            this.processCommandQueue();
        }
    }

    private validateResponse(data: Uint8Array): boolean {
        if (data.length < 5) return false;
        const checksum = this.calculateChecksum(Array.from(data.slice(0, -1)));
        return checksum === data[data.length - 1];
    }

    private calculateChecksum(data: number[]): number {
        return data.reduce((xor, byte) => xor ^ byte, 0);
    }

    private async enqueueCommand(command: string, type: CommandType): Promise<void> {
        const queueItem: CommandQueue = {
            command,
            id: this.currentTransactionId,
            type,
            retries: 0,
            timestamp: Date.now()
        };

        this.commandQueue.push(queueItem);
        this.processCommandQueue();
    }

    private async processCommandQueue(): Promise<void> {
        if (this.commandQueue.length === 0 || !this.isConnected) return;

        const command = this.commandQueue[0];

        try {
            await this.sendCommand(command.command);
            setTimeout(() => {
                const index = this.commandQueue.findIndex((cmd) => cmd.id === command.id);
                if (index !== -1) {
                    this.commandQueue.splice(index, 1);
                    this.emit('commandFailed', command);
                }
            }, this.COMMAND_TIMEOUT);
        } catch (error) {
            if (command.retries < this.MAX_RETRIES) {
                command.retries++;
                setTimeout(() => this.processCommandQueue(), 1000);
            } else {
                this.commandQueue.shift();
                this.emit('commandFailed', command);
            }
        }
    }

    private tryReconnect(): void {
        if (this.isConnected) return;

        setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.initializeConnection();
        }, 5000);
    }

    private startPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendPoll().catch(console.error);
            }
        }, this.POLLING_INTERVAL);
    }

    private buildCommand(type: CommandType, data: number[] = []): string {
        const id = ++this.currentTransactionId;
        const length = data.length + 3; // command + id + data
        const message = [0xFA, length, type, id, ...data];
        const checksum = this.calculateChecksum(message);
        const command = [...message, checksum];
        return command.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    // Public API Methods
    public async sendPoll(): Promise<void> {
        const command = this.buildCommand(CommandType.POLL);
        await this.enqueueCommand(command, CommandType.POLL);
    }

    public async vendProduct(slot: number): Promise<void> {
        const command = this.buildCommand(CommandType.VEND, [slot]);
        await this.enqueueCommand(command, CommandType.VEND);
    }

    public async setDropDetection(enable: boolean): Promise<void> {
        const command = this.buildCommand(CommandType.DETECT_DROP, [enable ? 1 : 0]);
        await this.enqueueCommand(command, CommandType.DETECT_DROP);
    }

    public disconnect(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        if (this.isConnected) {
            cordova.plugins.USBSerial.close()
                .then(() => {
                    this.isConnected = false;
                    this.emit('disconnected');
                })
                .catch(error => this.emit('error', error));
        }
    }
}