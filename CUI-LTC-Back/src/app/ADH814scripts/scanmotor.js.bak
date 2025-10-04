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
        if (command === 0xA5 && data[0] !== 0) {
            console.log(`Command error: Code ${data[0]} - ${
                data[0] === 1 ? 'Invalid parameter' :
                data[0] === 2 ? 'Command rejected' :
                data[0] === 3 ? 'Previous result not cleared' : 'Unknown'
            }`);
        }
        return { address: receivedAddress, command, data, idString, statusDetails, crc: receivedCRC };
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

// Parse motor input (e.g., "1,2,3,4,5" or "1-20")
function parseMotorInput(input) {
    const motors = [];
    if (input.includes('-')) {
        const [start, end] = input.split('-').map(num => parseInt(num.trim()));
        if (isNaN(start) || isNaN(end) || start < 0 || end > 60 || start > end) {
            throw new Error('Invalid range format. Use e.g., "1-20" with numbers between 0 and 60.');
        }
        for (let i = start; i <= end; i++) {
            motors.push(i);
        }
    } else {
        const nums = input.split(',').map(num => parseInt(num.trim()));
        for (const num of nums) {
            if (isNaN(num) || num < 0 || num > 60) {
                throw new Error('Invalid motor number. Must be between 0 and 60.');
            }
            motors.push(num);
        }
    }
    return motors;
}

async function testMotors() {
    const portName = '/dev/ttyS1';
    const address = 0x01;
    const motorDelay = 5000; // 10 seconds delay between motors
    const maxPolls = 20; // 6 seconds at 300ms per poll

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const motorInput = await new Promise(resolve => {
        rl.question('Enter motor numbers (e.g., "1,2,3,4,5" or "1-20"): ', answer => {
            resolve(answer);
        });
    });
    rl.close();

    let motorNumbers;
    try {
        motorNumbers = parseMotorInput(motorInput);
    } catch (err) {
        console.error('Error:', err.message);
        return;
    }

    console.log(`Testing motors: ${motorNumbers.join(', ')}`);
    let port = null;
    const skippedMotors = [];

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

        // Verify device ID
        console.log('Initializing: Requesting ID...');
        const idResponse = await protocol.requestID(address);
        console.log('ID Response:', idResponse);

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

        // Process each motor
        for (const motorNumber of motorNumbers) {
            console.log(`Starting motor ${motorNumber} (0x${motorNumber.toString(16).padStart(2, '0')})...`);

            // Preemptive POLL and ACK to ensure board is idle
            console.log(`Checking board status before motor ${motorNumber}...`);
            let preStatus = await protocol.pollStatus(address);
            if (preStatus.statusDetails.status !== 0) {
                console.warn(`Board not idle (status: ${preStatus.statusDetails.status}), sending ACK...`);
                await protocol.acknowledgeResult(address);
                preStatus = await protocol.pollStatus(address);
                if (preStatus.statusDetails.status !== 0) {
                    console.error(`Board still not idle for motor ${motorNumber} (status: ${preStatus.statusDetails.status})`);
                    skippedMotors.push(motorNumber);
                    if (motorNumber !== motorNumbers[motorNumbers.length - 1]) {
                        console.log(`Waiting ${motorDelay / 1000} seconds before next motor...`);
                        await new Promise(resolve => setTimeout(resolve, motorDelay));
                    }
                    continue;
                }
            }

            // Attempt to start motor with retries
            let motorStarted = false;
            let retryCount = 0;
            const maxRetries = 3;

            while (!motorStarted && retryCount <= maxRetries) {
                try {
                    const motorResponse = await protocol.startMotor(address, motorNumber);
                    if (motorResponse.data[0] === 3) {
                        console.warn(`Retry ${retryCount + 1}/${maxRetries}: Previous result not cleared for motor ${motorNumber}, sending ACK...`);
                        await protocol.acknowledgeResult(address);
                        retryCount++;
                        continue;
                    } else if (motorResponse.data[0] !== 0) {
                        console.error(`Failed to start motor ${motorNumber}: Error code ${motorResponse.data[0]}`);
                        break;
                    }
                    console.log('Start Motor Response:', motorResponse);
                    motorStarted = true;
                } catch (err) {
                    console.error(`Error starting motor ${motorNumber}:`, err.message);
                    break;
                }
            }

            if (!motorStarted) {
                console.error(`Skipping motor ${motorNumber}: Failed to start after ${maxRetries} retries.`);
                skippedMotors.push(motorNumber);
                await protocol.acknowledgeResult(address); // Clear state to proceed
                if (motorNumber !== motorNumbers[motorNumbers.length - 1]) {
                    console.log(`Waiting ${motorDelay / 1000} seconds before next motor...`);
                    await new Promise(resolve => setTimeout(resolve, motorDelay));
                }
                continue;
            }

            // Poll status every 300ms for up to 6 seconds
            console.log('Polling status...');
            let polls = 0;
            let statusResponse;
            while (polls < maxPolls) {
                statusResponse = await protocol.pollStatus(address);
                console.log('Status Response:', JSON.stringify(statusResponse, null, 2));
                if (statusResponse.statusDetails.status === 2) {
                    console.log('Dispensing complete, sending ACK...');
                    await protocol.acknowledgeResult(address);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms
                polls++;
            }

            if (statusResponse.statusDetails.status !== 2) {
                console.warn(`Motor ${motorNumber} did not reach dispensing complete state after ${maxPolls * 0.3} seconds. Sending ACK...`);
                await protocol.acknowledgeResult(address);
            }

            console.log('Final Status:', statusResponse);

            // Wait 10 seconds before starting the next motor
            if (motorNumber !== motorNumbers[motorNumbers.length - 1]) {
                console.log(`Waiting ${motorDelay / 1000} seconds before next motor...`);
                await new Promise(resolve => setTimeout(resolve, motorDelay));
            }
        }

        console.log('All motors processed.');
        if (skippedMotors.length > 0) {
            console.warn(`Skipped motors: ${skippedMotors.join(', ')}`);
        }
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

testMotors();