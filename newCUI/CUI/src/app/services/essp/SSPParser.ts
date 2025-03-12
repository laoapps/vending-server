// parser.ts


// Define constants
var SSP_STX = 0x7f;

// SSPParser class
export var SSPParser = (function () {
    function SSPParser() {
        this.counter = 0;
        this.checkStuff = 0;
        this.packetLength = 0;
        this.packet = []; // Using array instead of Buffer
        this.onPacketComplete = null; // Callback for completed packets
    }

    // Main parsing method
    SSPParser.prototype.parse = function (data) {
        // Convert input to array of numbers if it isn't already
        var bytes = Array.isArray(data) ? data : Array.from(data);

        for (var ndx = 0; ndx < bytes.length; ndx++) {
            var byte = bytes[ndx];

            if (byte === SSP_STX && this.counter === 0) {
                // Packet start
                this.packet = [byte];
                this.counter++;
            } else if (byte === SSP_STX && this.counter === 1) {
                // Reset if started from stuffed byte
                this.reset();
            } else {
                // If last byte was start byte, and next is not then
                // restart the packet
                if (this.checkStuff === 1) {
                    if (byte !== SSP_STX) {
                        this.packet = [SSP_STX, byte];
                        this.counter = 2;
                    } else {
                        this.packet.push(byte);
                        this.counter++;
                    }
                    // Reset stuff check flag
                    this.checkStuff = 0;
                } else {
                    // Set flag for stuffed byte check
                    if (byte === SSP_STX) {
                        this.checkStuff = 1;
                    } else {
                        // Add data to packet
                        this.packet.push(byte);
                        this.counter++;

                        // Get the packet length
                        if (this.counter === 3) {
                            this.packetLength = this.packet[2] + 5;
                        }
                    }
                }

                if (this.packetLength === this.packet.length && this.packetLength > 0) {
                    // Packet complete, emit through callback
                    if (this.onPacketComplete) {
                        this.onPacketComplete(this.packet.slice()); // Return a copy of the packet
                    }
                    this.reset();
                }
            }
        }
    };

    // Reset method
    SSPParser.prototype.reset = function () {
        this.counter = 0;
        this.checkStuff = 0;
        this.packetLength = 0;
        this.packet = [];
    };

    // Method to set callback for complete packets
    SSPParser.prototype.setPacketCompleteCallback = function (callback) {
        this.onPacketComplete = callback;
    };

    return SSPParser;
})();

// Export for ES5


// Usage example in an Angular service
/*
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SspService {
  private parser: SSPParser;

  constructor() {
    this.parser = new SSPParser();
    
    // Set up callback for complete packets
    this.parser.setPacketCompleteCallback((packet: number[]) => {
      console.log('Complete packet received:', packet);
      // Handle the complete packet here
    });
  }

  processData(data: number[] | Uint8Array) {
    this.parser.parse(data);
  }
}
*/

// Example usage:
/*
const parser = new SSPParser();
parser.setPacketCompleteCallback((packet) => {
  console.log('Packet:', packet);
});

const testData = [0x7f, 0x01, 0x03, 0x01, 0x02, 0x03, 0x04];
parser.parse(testData);
*/

