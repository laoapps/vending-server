import { Plugins, Capacitor } from '@capacitor/core';
import { EventEmitter } from 'events';

const { SerialPortPlugin } = Plugins;

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
    STATUS = 0x25
}

export class VendingMachineSerial extends EventEmitter {
    private readonly path: string;
    private readonly baudRate: number;
    private isConnected: boolean = false;
    private commandQueue: CommandQueue[] = [];
    private currentTransactionId: number = 0;
    private pollingInterval: NodeJS.Timeout | null = null;

    private readonly MAX_RETRIES = 3;
    private readonly COMMAND_TIMEOUT = 5000;
    private readonly POLLING_INTERVAL = 1000;

    constructor(portPath: string = '/dev/ttyUSB0', baudRate: number = 57600) {
        super();
        this.path = portPath;
        this.baudRate = baudRate;
        this.initializeConnection();
    }

    private async initializeConnection(): Promise<void> {
        try {
            await SerialPortPlugin.open({ portPath: this.path, baudRate: this.baudRate });
            this.isConnected = true;
            console.log('Serial port connected:', this.path);
            this.emit('connected');
            this.startPolling();
            this.setupListeners();
        } catch (error) {
            console.error('Failed to connect to serial port:', error);
            this.tryReconnect();
        }
    }

    private setupListeners(): void {
        Capacitor.addListener('serialPortData', (event: { data: string }) => {
            const buffer = Buffer.from(event.data, 'hex');
            this.handleResponse(buffer);
        });

        Capacitor.addListener('serialPortError', (event: { error: string }) => {
            console.error('Serial port error:', event.error);
            this.emit('error', event.error);
        });
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

    private async sendCommand(command: string): Promise<void> {
        try {
            await SerialPortPlugin.write({ command });
            console.log('Command sent:', command);
        } catch (error) {
            console.error('Failed to send command:', error);
            throw error;
        }
    }

    private handleResponse(data: Buffer): void {
        if (!this.validateResponse(data)) {
            this.emit('error', new Error('Invalid response'));
            return;
        }

        const type = data[2];
        const id = data[3];
        const responseData = data.slice(4, -1);

        this.emit('response', {
            type,
            id,
            data: responseData,
            timestamp: Date.now()
        });

        // Remove completed command from queue
        if (this.commandQueue.length > 0 && this.commandQueue[0].id === id) {
            this.commandQueue.shift();
            this.processCommandQueue();
        }
    }

    private validateResponse(data: Buffer): boolean {
        if (data.length < 5) return false;
        const checksum = this.calculateChecksum(Array.from(data.slice(0, -1)));
        return checksum === data[data.length - 1];
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

        SerialPortPlugin.close()
            .then(() => {
                this.isConnected = false;
                console.log('Disconnected from serial port');
            })
            .catch((error) => console.error('Failed to disconnect:', error));
    }
}

// const vmc = new VendingMachineSerial('/dev/ttyUSB0', 57600);

// vmc.on('connected', () => console.log('Connected to vending machine'));
// vmc.on('response', (event) => console.log('Response received:', event));
// vmc.on('error', (error) => console.error('Error:', error));

// // Example: Vend product
// vmc.vendProduct(1)
//     .then(() => console.log('Product vended successfully'))
//     .catch(console.error);