// ssp.service.ts
import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service'; // Adjust path as needed
import { IResModel, IlogSerial, addLogMessage, ESerialPortType } from './services/syste.model'; // Adjust path as needed
import {
  argsToByte,
  CRC16,
  extractPacketData,
  generateKeys,
  getPacket,
  parseData,
  createSSPHostEncryptionKey,
  toUint8ArrayArrayBuffer
} from './services/essp/Utils'; // Adjust path to your utils.ts
import * as commandList from './services/essp/static/commands'; // Adjust path to your commands.ts

// Port options (mirroring PORT_OPTIONS from .js)
var PORT_OPTIONS = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 2,
  parity: 'none',
  highWaterMark: 64 * 1024
};

@Injectable({
  providedIn: 'root'
})
export class esspService {
  // Configuration properties
  config = {
    encryptAllCommand: true,
    id: 0,
    timeout: 1000,
    commandRetries: 20,
    pollingInterval: 300,
    fixedKey: '0123456701234567' // Default fixed key
  };

  // Keys for encryption
  keys = {
    encryptKey: null,
    fixedKey: this.config.fixedKey,
    generator: null,
    hostInter: null,
    hostRandom: null,
    key: null,
    modulus: null,
    slaveInterKey: null
  };

  // State tracking
  state = {
    enabled: false,
    polling: false,
    processing: false
  };

  eCount = 0;
  commandSendAttempts = 0;
  sequence = 0x80;
  protocol_version = null;
  unit_type = null;
  pollTimeout = null;
  log: IlogSerial;
  portName: string;
  lastResult='';
  constructor(private serialService: SerialServiceService) {}

  // Initialize serial port (similar to Locker1Service.initializeSerialPort)
  initializeSerialPort(portName, options, log, isNative) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.portName = portName || '/dev/ttyS1'; // Default port
      self.log = log;
      var serialOptions = { ...PORT_OPTIONS, ...options };
      self.serialService.initializeSerialPort(self.portName, serialOptions.baudRate, self.log, isNative || ESerialPortType.Serial)
        .then(function(initResult) {
          if (initResult === self.portName) {
            this.initEncryption(function(err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(initResult);
              }
            });
            self.addLogMessage('Serial port opened: ' + initResult);
            self.serialService.getSerialEvents().subscribe(function(event) {
              if (event.type === 'data') {
                self.handleData(event.data);
              } else if (event.type === 'error') {
                self.addLogMessage('Serial error: ' + event.data);
              } else if (event.type === 'close') {
                self.addLogMessage('Serial port closed');
              }
            });
            resolve(initResult);
          } else {
            reject('Failed to initialize serial port: ' + initResult);
          }
        })
        .catch(function(error) {
          reject(error);
        });
    });
  }
  handleData(data:any){
    console.log('ESSP2 Data received: '+data);
  }
  // Close serial port
  close() {
    return this.serialService.close();
  }

  // List available ports
  listPorts() {
    return this.serialService.listPorts();
  }

  // Get serial events observable
  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  // Convert Uint8Array to hex string
  toHexString(byteArray) {
    var hex = '';
    for (var i = 0; i < byteArray.length; i++) {
      hex += byteArray[i].toString(16).padStart(2, '0').toUpperCase();
    }
    return hex;
  }

  // Get sequence byte
  getSequence() {
    return this.config.id | this.sequence;
  }

  // Initialize encryption
  initEncryption(callback) {
    var self = this;
    var newKeys = generateKeys();
    Object.assign(self.keys, newKeys, { encryptKey: null });
    self.eCount = 0;

    var commands = [
      { command: 'SYNC', args: {  } },
      { command: 'HOST_PROTOCOL_VERSION', args: {version:6 } },
      { command: 'SET_GENERATOR', args: { key: this.keys.generator } },
      { command: 'SET_MODULUS', args: { key: this.keys.modulus } },
      { command: 'REQUEST_KEY_EXCHANGE', args: { key: this.keys.hostInter } },
      { command: 'GET_SERIAL_NUMBER', args: { } },
      { command: 'RESET_COUNTERS', args: { } },
      { command: 'ENABLE', args: { } },
      { command: 'SETUP_REQUEST', args: {  } },
      { command: 'SET_CHANNEL_INHIBITS', args: { channels: process.env.channels || [1, 1, 1, 1, 1, 1, 1]  } },

    ];

    function executeCommand(index) {
      if (index >= commands.length) {
        callback(null, self.lastResult);
        return;
      }
      var cmd = commands[index];
      self.command(cmd.command, cmd.args, function(err, result) {
        if (err || !result.success) {
          callback(err || result);
        } else {
          self.lastResult = result;
          executeCommand(index + 1);
        }
      });
    }
    executeCommand(0);
  }

  // Parse packet data
  parsePacketData(buffer, command) {
    var self = this;
    var parsedData = parseData(buffer, command, self.protocol_version, self.unit_type);
    self.addLogMessage('Parsed data: ' + JSON.stringify(parsedData));

    if (parsedData.success) {
      if (command === 'REQUEST_KEY_EXCHANGE') {
        try {
          var keys = createSSPHostEncryptionKey(buffer, self.keys);
          self.keys = { ...self.keys, ...keys };
          self.addLogMessage('AES encrypt key: 0x' + self.toHexString(self.keys.encryptKey));
        } catch (error) {
          throw new Error('Key exchange error');
        }
      } else if (command === 'SETUP_REQUEST') {
        self.protocol_version = parsedData.info.protocol_version;
        self.unit_type = parsedData.info.unit_type;
      } else if (command === 'UNIT_DATA') {
        self.unit_type = parsedData.info.unit_type;
      }
    } else if (command === 'HOST_PROTOCOL_VERSION') {
      self.protocol_version = undefined;
    }

    return parsedData;
  }

  // Enable the device
  enable(callback) {
    var self = this;
    self.command('ENABLE', null, function(err, result) {
      if (err) {
        callback(err);
        return;
      }
      if (result.status === 'OK') {
        self.state.enabled = true;
        if (!self.state.polling) {
          self.poll(true, function(pollErr) {
            callback(pollErr, result);
          });
        } else {
          callback(null, result);
        }
      } else {
        callback(null, result);
      }
    });
  }

  // Disable the device
  disable(callback) {
    var self = this;
    if (self.state.polling) {
      self.poll(false, function(pollErr) {
        if (pollErr) {
          callback(pollErr);
          return;
        }
        self.command('DISABLE', null, function(err, result) {
          if (err) {
            callback(err);
          } else if (result.status === 'OK') {
            self.state.enabled = false;
            callback(null, result);
          } else {
            callback(null, result);
          }
        });
      });
    } else {
      self.command('DISABLE', null, function(err, result) {
        if (err) {
          callback(err);
        } else if (result.status === 'OK') {
          self.state.enabled = false;
          callback(null, result);
        } else {
          callback(null, result);
        }
      });
    }
  }

  // Send a command
  command(command, args, callback) {
    var self = this;
    command = command.toUpperCase();
    if (!commandList[command]) {
      callback(new Error('Unknown command'));
      return;
    }

    if (commandList[command].encrypted && !self.keys.encryptKey) {
      callback(new Error('Command requires encryption'));
      return;
    }

    if (self.state.processing) {
      callback(new Error('Already processing another command'));
      return;
    }

    if (command === 'SYNC') {
      self.sequence = 0x80;
    }

    self.commandSendAttempts = 0;

    var isEncrypted = self.keys.encryptKey !== null && (commandList[command].encrypted || self.config.encryptAllCommand);
    var argBytes = argsToByte(command, args, self.protocol_version);
    var sequence = self.getSequence();
    var encryptionKey = isEncrypted ? self.keys.encryptKey : null;

    getPacket(command, argBytes, sequence, encryptionKey, self.eCount, function(err, buffer) {
      if (err) {
        callback(err);
        return;
      }
      var bufferPlain = isEncrypted ? getPacket(command, argBytes, sequence, null, self.eCount, function(err, plain) { return plain; }) : buffer;
      self.sendToDevice(command, buffer, bufferPlain, function(err, result) {
        if (err) {
          callback(err);
        } else {
          self.sequence = self.sequence === 0x00 ? 0x80 : 0x00;
          if (!result.success) {
            callback(result);
          } else {
            callback(null, result);
          }
        }
      });
    });
  }

  // Send packet to device
  sendToDevice(command, txBuffer, txBufferPlain, callback) {
    var self = this;
    var attempt = 0;

    function trySend() {
      if (attempt >= self.config.commandRetries) {
        callback({
          success: false,
          error: 'Command failed after ' + self.config.commandRetries + ' retries'
        });
        return;
      }

      self.state.processing = true;
      var hexTxBuffer = self.toHexString(txBuffer);
      self.addLogMessage('COM <- ' + hexTxBuffer + ' ' + command + ' ' + self.eCount);

      var timeout = setTimeout(function() {
        self.addLogMessage('Command timeout');
        self.state.processing = false;
        attempt++;
        trySend();
      }, self.config.timeout);

      self.serialService.write(hexTxBuffer).then(function() {
        self.commandSendAttempts++;
        self.serialService.getSerialEvents().subscribe(function(event) {
          if (event.type === 'data') {
            clearTimeout(timeout);
            var rxBuffer = self.hexToUint8Array(event.data);
            self.addLogMessage('COM -> ' + event.data + ' ' + command + ' ' + self.eCount);

            extractPacketData(rxBuffer, self.keys.encryptKey, self.eCount, function(err, data) {
              if (err) {
                self.state.processing = false;
                attempt++;
                trySend();
                return;
              }

              if (txBuffer[1] !== rxBuffer[1]) {
                self.state.processing = false;
                attempt++;
                trySend();
                return;
              }

              if (self.keys.encryptKey && rxBuffer[3] === 0x7e) {
                self.eCount++;
              }

              var result = self.parsePacketData(data, command);
              self.state.processing = false;
              callback(null, result);
            });
          }
        });
      }).catch(function(error) {
        clearTimeout(timeout);
        self.state.processing = false;
        attempt++;
        trySend();
      });
    }

    trySend();
  }

  // Poll the device
  poll(status, callback) {
    var self = this;
    if (self.state.processing) {
      var checkInterval = setInterval(function() {
        if (!self.state.processing) {
          clearInterval(checkInterval);
          executePoll();
        }
      }, 1);
    } else {
      executePoll();
    }

    function executePoll() {
      if (status === true && self.state.polling) {
        callback(null);
        return;
      }

      if (status === true) {
        self.state.polling = true;
      } else if (status === false) {
        self.state.polling = false;
        clearTimeout(self.pollTimeout);
        callback(null);
        return;
      }

      if (self.state.polling) {
        var startTime = Date.now();
        self.command('POLL', null, function(err, result) {
          if (err) {
            self.state.polling = false;
            callback(err);
            return;
          }

          if (result.info) {
            var infos = Array.isArray(result.info) ? result.info : [result.info];
            for (var i = 0; i < infos.length; i++) {
              self.addLogMessage('Event: ' + infos[i].name + ' - ' + JSON.stringify(infos[i]));
            }
          }

          var endTime = Date.now();
          var executionTime = endTime - startTime;
          self.pollTimeout = setTimeout(function() {
            self.poll(null, function(pollErr) {
              if (pollErr) {
                self.addLogMessage('Poll error: ' + pollErr.message);
              }
            });
          }, Math.max(0, self.config.pollingInterval - executionTime));

          callback(null, result);
        });
      } else {
        callback(null);
      }
    }
  }

  // Helper: Convert hex string to Uint8Array
  hexToUint8Array(hexString) {
    var bytes = new Uint8Array(Math.ceil(hexString.length / 2));
    for (var i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // Helper: Add log message
  addLogMessage(message) {
    if (this.log) {
      addLogMessage(this.log, message);
    }
  }
}