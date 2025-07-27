const { SerialPort } = require('serialport');
const readline = require('readline');

// CRC-16 Modbus function (little-endian output)
function checkSumCRC(d) {
    const data = d.join('');
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i += 2) {
        const byte = parseInt(data.substring(i, i + 2), 16);
        crc ^= byte;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    const crcHex = crc.toString(16).padStart(4, '0');
    return crcHex.substring(2, 4) + crcHex.substring(0, 2); // LLHH
}

// ADH814Protocol class
class ADH814Protocol {
    constructor(port) {
        this.port = port;
        this.buffer = Buffer.alloc(0); // Buffer to accumulate incoming data
    }

    async requestID(address) {
        const request = this.createRequest(address, 0xA1, []);
        console.log('Sending requestID:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, 0xA1, request, 18); // Expected response length: 18 bytes
    }

    async pollStatus(address) {
        const request = this.createRequest(address, 0xA3, []);
        console.log('Sending pollStatus:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, 0xA3, request, 11); // Expected response length: 11 bytes
    }

    async startMotor(address, motorNumber) {
        if (motorNumber < 0x00 || motorNumber > 0x3C) throw new Error('Motor number must be 0x00-0x3C');
        const request = this.createRequest(address, 0xA5, [motorNumber]);
        console.log('Sending startMotor:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, 0xA5, request, 5); // Expected response length: 5 bytes
    }

    async acknowledgeResult(address) {
        const request = this.createRequest(address, 0xA6, []);
        console.log('Sending acknowledgeResult:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, 0xA6, request, 4); // Expected response length: 4 bytes
    }

    async switchToTwoWireMode(address) {
        const command = 0x21;
        const data = [0x10, 0x00];
        const request = this.createRequest(address, command, data);
        console.log('Sending switchToTwoWireMode:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, command, request, 5); // Expected response length: 5 bytes
    }

    async setSwap(address, retries = 3) {
        const request = this.createRequest(address, 0x35, [0x01]);
        console.log('Sending setSwap:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.sendRequest(address, 0x35, request, 5); // Expected response length: 5 bytes
            } catch (err) {
                console.warn(`SetSwap attempt ${attempt} failed: ${err.message}`);
                if (attempt === retries) throw err;
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
            }
        }
    }

    async setTemperature(address, mode = 0x01, tempValue = 7) {
        if (mode < 0x00 || mode > 0x02) throw new Error('Mode must be 0x00-0x02');
        if (tempValue < -127 || tempValue > 127) throw new Error('Temperature value must be -127 to 127');
        const data = [mode, (tempValue >> 8) & 0xFF, tempValue & 0xFF];
        const request = this.createRequest(address, 0xA4, data);
        console.log('Sending setTemperature:', Array.from(request).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return this.sendRequest(address, 0xA4, request, 5); // Expected response length: 5 bytes
    }

    createRequest(address, command, data) {
        if (address < 0x01 || address > 0x04) throw new Error('Address must be 0x01-0x04');
        const payload = [address, command, ...data];
        const hexPayload = payload.map(byte => byte.toString(16).padStart(2, '0')?.toUpperCase());
        const crc = checkSumCRC(hexPayload);
        const crcBytes = [parseInt(crc.substring(0, 2), 16), parseInt(crc.substring(2, 4), 16)];
        return new Uint8Array([...payload, ...crcBytes]);
    }

    parseResponse(address, command, buffer) {
        if (buffer.length < 4) throw new Error(`Invalid response length: ${buffer.length}`);
        const receivedAddress = buffer[0];
        const receivedCommand = buffer[1];
        const data = Array.from(buffer.slice(2, buffer.length - 2));
        const receivedCRC = (buffer[buffer.length - 2] << 8) | buffer[buffer.length - 1];
        const hexData = Array.from(buffer.slice(0, buffer.length - 2))
            .map(byte => byte.toString(16).padStart(2, '0')?.toUpperCase());
        const calculatedCRC = parseInt(checkSumCRC(hexData), 16);
        if (receivedCRC !== calculatedCRC) {
            throw new Error(`CRC mismatch: received 0x${receivedCRC.toString(16).padStart(4, '0')}, calculated 0x${calculatedCRC.toString(16).padStart(4, '0')}`);
        }
        if (receivedAddress !== address && receivedAddress !== 0) {
            throw new Error(`Invalid address: expected 0x${address.toString(16)} or 0x00, got 0x${receivedAddress.toString(16)}`);
        }
        if (receivedCommand !== command) {
            throw new Error(`Invalid command: expected 0x${command.toString(16)}, got 0x${receivedCommand.toString(16)}`);
        }
        const idString = command === 0xA1 ? data.map(byte => String.fromCharCode(byte)).join('').trim() : null;
        const statusDetails = command === 0xA3 ? {
            status: data[0] || 0, // 0=Idle, 1=Delivering, 2=Delivery End
            motorNumber: data[1] || 0,
            dropSuccess: !(data[2] & 0x04), // Bit2: 0=success, 1=failure
            faultCode: data[2] & 0x03, // Bit0-1: 0=no fault, 1=overcurrent, 2=open circuit, 3=timeout
            maxCurrent: data[3] ? (data[3] << 8) | data[4] : 0, // mA
            avgCurrent: data[5] ? (data[5] << 8) | data[6] : 0, // mA
            runTime: data[7] || 0, // 0-255, unit 0.1s
            temperature: data[8] || 0 // -127 to 127, °C
        } : null;
        const swapStatus = command === 0x35 ? (data[0] === 0x01 ? 'Swap set successfully' : 'Swap set failed') : null;
        if (statusDetails) {
            if (statusDetails.temperature === -40 || statusDetails.temperature === 120) {
                console.log('Temperature sensor issue:', statusDetails.temperature === -40 ? 'Disconnected' : 'Shorted');
            } else if (statusDetails.temperature < -127 || statusDetails.temperature > 127) {
                console.log('Temperature sensor issue: Invalid value', statusDetails.temperature);
            }
            if (statusDetails.faultCode !== 0) {
                console.log('Fault code detected:', statusDetails.faultCode === 1 ? 'Overcurrent' : statusDetails.faultCode === 2 ? 'Open circuit' : 'Timeout');
            }
        }
        if ((command === 0xA5 || command === 0x21 || command === 0x35 || command === 0xA4) && data[0] !== 0) {
            console.log(`Command error: Code ${data[0]} - ${
                data[0] === 1 ? 'Invalid parameter' :
                data[0] === 2 ? 'Command rejected' :
                data[0] === 3 ? 'Previous result not cleared' : 'Unknown'
            }`);
        }
        return { address: receivedAddress, command, data, idString, statusDetails, swapStatus, crc: receivedCRC };
    }

    async sendRequest(address, command, request, expectedLength) {
        return new Promise((resolve, reject) => {
            this.buffer = Buffer.alloc(0); // Clear buffer
            const onData = (data) => {
                this.buffer = Buffer.concat([this.buffer, data]);
                console.log('Raw response:', Array.from(this.buffer).map(b => b.toString(16).padStart(2, '0')).join(' '));
                if (this.buffer.length >= expectedLength) {
                    try {
                        const response = this.parseResponse(address, command, this.buffer);
                        this.port.removeListener('data', onData);
                        resolve(response);
                    } catch (err) {
                        this.port.removeListener('data', onData);
                        reject(err);
                    }
                }
            };

            this.port.on('data', onData);
            this.port.write(Buffer.from(request), (err) => {
                if (err) {
                    this.port.removeListener('data', onData);
                    reject(err);
                }
            });

            setTimeout(() => {
                this.port.removeListener('data', onData);
                reject(new Error(`No complete response from device (received ${this.buffer.length} bytes, expected ${expectedLength})`));
            }, 2000);
        });
    }
}

async function testMotorWithConfig() {
    const portName = '/dev/ttyS3';
    const address = 0x01;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let motorNumber = await new Promise(resolve => {
        rl.question('Enter motor number (0-60): ', answer => {
            resolve(parseInt(answer));
        });
    });
    rl.close();

    if (isNaN(motorNumber) || motorNumber < 0 || motorNumber > 60) {
        console.error(`Invalid motor number: ${motorNumber}. Must be between 0 and 60.`);
        return;
    }

    console.log(`Testing motor ${motorNumber} (0x${motorNumber.toString(16).padStart(2, '0')})...`);
    let port = null;

    try {
        port = new SerialPort({ 
            path: portName, 
            baudRate: 38400,
            parity: 'none',
            dataBits: 8,
            stopBits: 1
        });

        port.on('error', (err) => {
            console.error('Port error:', err);
        });

        const protocol = new ADH814Protocol(port);

        // Initialize: Verify device ID
        console.log('Initializing: Requesting ID...');
        const idResponse = await protocol.requestID(address);
        console.log('ID Response:', idResponse);

        // Initialize: Set temperature
        console.log('Setting temperature to 7°C...');
        const tempResponse = await protocol.setTemperature(address);
        console.log('Set Temperature Response:', tempResponse);

        // Initialize: Switch to two-wire mode
        console.log('Switching to two-wire motor mode...');
        const modeResponse = await protocol.switchToTwoWireMode(address);
        console.log('Mode Switch Response:', modeResponse);

        // Initialize: Set swap
        console.log('Performing swap...');
        const setResponse = await protocol.setSwap(address);
        console.log('Set Swap Response:', setResponse);
        await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for swap action

        // Clear status with multiple ACKs
        console.log('Clearing status...');
        for (let i = 0; i < 3; i++) {
            const ackResponse = await protocol.acknowledgeResult(address);
            console.log('Acknowledge Result Response:', ackResponse);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check initial status to ensure board is idle
        console.log('Checking initial status...');
        let initialStatus = await protocol.pollStatus(address);
        console.log('Initial Status:', initialStatus);
        if (initialStatus.statusDetails.status !== 0) {
            console.warn('Board not idle, attempting to clear...');
            await protocol.acknowledgeResult(address);
            initialStatus = await protocol.pollStatus(address);
            if (initialStatus.statusDetails.status !== 0) {
                throw new Error('Board not in idle state (status: ' + initialStatus.statusDetails.status + ')');
            }
        }

        // Start motor with RUN2 for two-wire motor
        console.log(`Starting motor ${motorNumber} (0x${motorNumber.toString(16).padStart(2, '0')})...`);
        const motorResponse = await protocol.startMotor(address, motorNumber);
        console.log('Start Motor Response:', motorResponse);

        // Poll status every 300ms for up to 1.5 seconds
        console.log('Polling status...');
        let polls = 0;
        let statusResponse;
        while (polls < 5) { // 5 polls = 1.5 seconds
            statusResponse = await protocol.pollStatus(address);
            console.log('Status Response:', JSON.stringify(statusResponse, null, 2));
            if (statusResponse.statusDetails.status === 2) { // Dispensing complete
                console.log('Dispensing complete, sending ACK...');
                await protocol.acknowledgeResult(address);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms
            polls++;
        }

        if (statusResponse.statusDetails.status !== 2) {
            console.log('Warning: Motor did not reach dispensing complete state.');
        }

        console.log('Final Status:', statusResponse);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (port && port.isOpen) {
            port.close((err) => {
                if (err) console.error('Error closing port:', err);
            });
        }
    }
}

testMotorWithConfig();