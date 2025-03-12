import { Buffer } from 'buffer'
// class EsspProtocol {
//   private sequenceCounter: number = 0;
//   private id: number = 0x00;

//   constructor() { }

//   private calculateCrc16(source: Uint8Array): Buffer {
//     const CRC_SSP_SEED = 0xffff
//     const CRC_SSP_POLY = 0x8005
//     let crc = CRC_SSP_SEED

//     for (let i = 0; i < source.length; ++i) {
//       crc ^= source[i] << 8
//       for (let j = 0; j < 8; ++j) {
//         crc = crc & 0x8000 ? (crc << 1) ^ CRC_SSP_POLY : crc << 1
//       }
//     }

//     // Ensure CRC is within 16-bit range
//     crc &= 0xffff

//     const crcBuffer = Buffer.alloc(2)
//     crcBuffer.writeUInt16LE(crc, 0)
//     return crcBuffer
//   }

//   private toHexString(bytes: Uint8Array): string {
//     return Array.from(bytes)
//       .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
//       .join('');
//   }

//   public buildPacket(command: number, data: number[] = []): string {
//     const length = data.length + 1;
//     const seqId = this.sequenceCounter === 0 ? 0x80 : 0x00;
//     const packetBody = new Uint8Array([seqId, length, command, ...data]);

//     const result = new Uint8Array(1 + packetBody.length + 2);
//     result[0] = 0x7F; // STX
//     result.set(packetBody, 1);

//     const crcData = result.slice(1, -2);
//     const crcBuffer = this.calculateCrc16(crcData);
//     // Use big-endian for sent packets (device expects 8265, not 6582)
//     result[result.length - 2] = crcBuffer[1]; // High byte
//     result[result.length - 1] = crcBuffer[0]; // Low byte

//     const stuffed = [0x7F];
//     for (let i = 1; i < result.length; i++) {
//       stuffed.push(result[i]);
//       if (result[i] === 0x7F) stuffed.push(0x7F);
//     }

//     this.sequenceCounter = (this.sequenceCounter + 1) % 2;
//     return this.toHexString(new Uint8Array(stuffed));
//   }

//   public parsePacket(hexString: string): { command: number; data: number[] } {
//     const bytes = hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
//     const unstuffed = [bytes[0]];
//     for (let i = 1; i < bytes.length; i++) {
//       if (bytes[i] === 0x7F && bytes[i - 1] === 0x7F) continue;
//       unstuffed.push(bytes[i]);
//     }
//     const packet = new Uint8Array(unstuffed);
//     if (packet[0] !== 0x7F) throw new Error('Invalid STX');

//     const crcData = packet.slice(1, -2);
//     const crcCalculatedBuffer = this.calculateCrc16(crcData);
//     const crcReceived = (packet[packet.length - 1] << 8) | packet[packet.length - 2]; // Little-endian from device
//     const crcCalculated = crcCalculatedBuffer.readUInt16LE(0); // Little-endian from Buffer

//     if (crcCalculated !== crcReceived) {
//       console.log('CRC mismatch - Expected:', crcCalculated.toString(16).toUpperCase(), 'Received:', crcReceived.toString(16).toUpperCase());
//       throw new Error('CRC mismatch');
//     }

//     const length = packet[2];
//     const command = packet[3];
//     const data = Array.from(packet.slice(4, 4 + length - 1));

//     return { command, data };
//   }

//   public sync(): string {
//     return this.buildPacket(0x11);
//   }
// }

// function testCrcAndPacket() {
//   const essp = new EsspProtocol();

//   // Test 1: CRC calculation
//   const testData = new Uint8Array([0x00, 0x01, 0xF0]);
//   const crcBuffer = essp['calculateCrc16'](testData);
//   const crc = crcBuffer.readUInt16LE(0);
//   console.log('CRC for [00, 01, F0]:', crc.toString(16).toUpperCase(), `(decimal: ${crc})`);
//   console.log('Expected CRC: 0A20 (2592), Device expects in packet: 20 0A');

//   // Test 2: Build SYNC packet
//   const syncPacket = essp.sync();
//   console.log('SYNC Packet:', syncPacket);
//   console.log('Expected SYNC Packet: 7F8001118265');

//   // Test 3: Parse response packet
//   const responsePacket = '7F0001F0200A';
//   try {
//     const parsed = essp.parsePacket(responsePacket);
//     console.log('Parsed Response:', {
//       command: parsed.command.toString(16).toUpperCase(),
//       data: parsed.data.map(d => d.toString(16).toUpperCase()).join(' ')
//     });
//     console.log('Expected: { command: F0, data: [] }');
//   } catch (error) {
//     console.error('Parse Error:', error.message);
//   }

//   // Test 4: Build and parse a round-trip
//   const builtPacket = essp.sync();
//   console.log('Built SYNC Packet (second call):', builtPacket);
//   try {
//     const parsedBuilt = essp.parsePacket(builtPacket);
//     console.log('Parsed Built Packet:', {
//       command: parsedBuilt.command.toString(16).toUpperCase(),
//       data: parsedBuilt.data.map(d => d.toString(16).toUpperCase()).join(' ')
//     });
//   } catch (error) {
//     console.error('Parse Error:', error.message);
//   }
// }

// testCrcAndPacket();

/// working code
// function CRC16(source) {
//     const CRC_SSP_SEED = 0xffff
//   const CRC_SSP_POLY = 0x8005
//   let crc = CRC_SSP_SEED

//   for (let i = 0; i < source.length; ++i) {
//     crc ^= source[i] << 8
//     for (let j = 0; j < 8; ++j) {
//       crc = crc & 0x8000 ? (crc << 1) ^ CRC_SSP_POLY : crc << 1
//     }
//   }

//   // Ensure CRC is within 16-bit range
//   crc &= 0xffff

//   const crcBuffer = Buffer.alloc(2)
//   crcBuffer.writeUInt16LE(crc, 0)
//   return crcBuffer
// }
// const testDataSync = Buffer.from([0x80, 0x01, 0x11]);
// const crcSync = CRC16(testDataSync);
// console.log('SYNC CRC:', crcSync.toString('hex'));

// const testDataPoll = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x07]);
// const crcPoll = CRC16(testDataPoll);
// console.log('POLL CRC (no padding):', crcPoll.toString('hex'));

// const testDataPollPadded = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x07, 0x19, 0x2B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
// const crcPollPadded = CRC16(testDataPollPadded);
// console.log('POLL CRC (with padding):', crcPollPadded.toString('hex'));
/// working code

class CRCTest {
  private calculateCrc16(data: Uint8Array): Uint8Array {
      let crc = 0xFFFF;
      const poly = 0x8005;

      for (const byte of data) {
          crc ^= byte << 8;
          for (let j = 0; j < 8; j++) {
              crc = (crc & 0x8000) ? (crc << 1) ^ poly : crc << 1;
          }
      }
      crc &= 0xFFFF;

      const crcBytes = new Uint8Array(2);
      crcBytes[0] = crc & 0xFF;
      crcBytes[1] = (crc >> 8) & 0xFF;
      return crcBytes;
  }

  public test() {
      // Test 1: SYNC command (80 01 11)
      const syncData = new Uint8Array([0x80, 0x01, 0x11]);
      const syncCrc = this.calculateCrc16(syncData);
      console.log(`SYNC CRC: ${this.toHex(syncCrc)}`);

      // Test 2: POLL without padding (01 00 00 00 07)
      const pollData = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x07]);
      const pollCrc = this.calculateCrc16(pollData);
      console.log(`POLL CRC (no padding): ${this.toHex(pollCrc)}`);

      // Test 3: POLL with padding (01 00 00 00 07 19 2B 00 00 00 00 00 00 00)
      const pollDataPadded = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x07, 0x19, 0x2B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const pollCrcPadded = this.calculateCrc16(pollDataPadded);
      console.log(`POLL CRC (with padding): ${this.toHex(pollCrcPadded)}`);
  }

  private toHex(bytes: Uint8Array): string {
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

const tester = new CRCTest();
tester.test();