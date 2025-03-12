// utils.ts
// Assuming these interfaces align with your syste.model.ts; adjust as needed
// import { IResModel } from '../syste.model';
// Enums for unit types (placeholder; expand from unit_type.json)
// Import static data (assuming these are already converted to TS modules)

import * as crypto from 'crypto';
// import satisfies from 'semver';
// import chalk from 'chalk';

import { statusDesc } from './static/status_desc';
import { unitType } from './static/unit_type';
import { rejectNote } from './static/reject_note';
import { commandList } from './static/commands';


// Type definitions
interface CommandArgs {
  key?: number; // Changed from bigint to number for ES5
  route?: string;
  value?: any;
  country_code?: string;
  isHopper?: boolean;
  channels?: number[];
  enable?: boolean;
  payMode?: boolean;
  levelCheck?: boolean;
  motorSpeed?: boolean;
  cashBoxPayActive?: boolean;
  denomination?: number;
  mode?: string;
  version?: number;
  numChar?: number;
  currencyRead?: boolean;
  barCode?: boolean;
  amount?: number;
  test?: boolean;
  min_possible_payout?: number;
  inhibited?: boolean;
  reportBy?: string;
  baudrate?: number;
  reset_to_default_on_reset?: boolean;
  RGB?: string;
  volatile?: boolean;
  GIVE_VALUE_ON_STORED?: boolean;
  REQUIRE_FULL_STARTUP?: boolean;
  NO_HOLD_NOTE_ON_PAYOUT?: boolean;
  OPTIMISE_FOR_PAYIN_SPEED?: boolean;
  fixedKey?: string;
  ccTalk?: boolean;
}

interface ParseResult {
  success: boolean;
  status: string;
  command: string;
  info: any;
}

interface Keys {
  fixedKey: string;
  hostRandom: number; // Changed from bigint to number for ES5
  modulus: number;    // Changed from bigint to number for ES5
}

var STX = 0x7f;
var STEX = 0x7e;

// Utility to pad data for AES-ECB (PKCS#7 padding)
function padTo16Bytes(data) {
  var paddingLength = 16 - (data.length % 16) || 16;
  var padded = new Uint8Array(data.length + paddingLength);
  padded.set(data);
  for (var i = data.length; i < padded.length; i++) {
    padded[i] = paddingLength; // PKCS#7 padding
  }
  return padded;
}

function absBigInt(n) {
  return n < 0 ? -n : n; // Simplified for ES5; assumes number input
}

function encrypt(key, data, callback) {
  if (!key || !(key instanceof Uint8Array)) {
    throw new Error('Key must be a Uint8Array');
  }
  if (!data || !(data instanceof Uint8Array)) {
    throw new Error('Data must be a Uint8Array');
  }

  window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-ECB' },
    false,
    ['encrypt']
  ).then(function(cryptoKey) {
    var paddedData = padTo16Bytes(data); // Manual padding
    return window.crypto.subtle.encrypt(
      { name: 'AES-ECB' },
      cryptoKey,
      paddedData
    );
  }).then(function(encrypted) {
    callback(null, new Uint8Array(encrypted));
  }).catch(function(err) {
    callback(err);
  });
}

function decrypt(key, data, callback) {
  if (!key || !(key instanceof Uint8Array)) {
    throw new Error('Key must be a Uint8Array');
  }
  if (!data || !(data instanceof Uint8Array)) {
    throw new Error('Data must be a Uint8Array');
  }

  window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-ECB' },
    false,
    ['decrypt']
  ).then(function(cryptoKey) {
    return window.crypto.subtle.decrypt(
      { name: 'AES-ECB' },
      cryptoKey,
      data
    );
  }).then(function(decrypted) {
    callback(null, new Uint8Array(decrypted));
  }).catch(function(err) {
    callback(err);
  });
}

function readBytesFromBuffer(array, startIndex, length) {
  if (!array || !(array instanceof Uint8Array)) {
    throw new Error('Input must be a Uint8Array');
  }
  if (startIndex < 0 || startIndex >= array.length) {
    throw new Error('Invalid start index');
  }
  if (length < 0 || startIndex + length > array.length) {
    throw new Error('Invalid length or exceeds array size');
  }
  return array.subarray(startIndex, startIndex + length);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function CRC16(source) {
  var CRC_SSP_SEED = 0xffff;
  var CRC_SSP_POLY = 0x8005;
  var crc = CRC_SSP_SEED;

  for (var i = 0; i < source.length; ++i) {
    crc ^= source[i] << 8;
    for (var j = 0; j < 8; ++j) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ CRC_SSP_POLY) : (crc << 1);
    }
  }

  crc &= 0xffff;
  var result = new Uint8Array(2);
  new DataView(result.buffer).setUint16(0, crc, true); // Little-endian
  return result;
}

function uInt64LE(number) {
  // ES5 workaround: Treat as two 32-bit numbers (high and low)
  if (typeof number !== 'number' || number < 0 || number > 18446744073709551615) {
    throw new Error('Input must be an unsigned 64-bit integer (approximated as number)');
  }
  var low = number & 0xffffffff;
  var high = Math.floor(number / 4294967296);
  var result = new Uint8Array(8);
  var dv = new DataView(result.buffer);
  dv.setUint32(0, low, true);  // Little-endian
  dv.setUint32(4, high, true); // Little-endian
  return result;
}

function uInt32LE(number) {
  if (!Number.isInteger(number) || number < 0 || number > 4294967295) {
    throw new Error('Input must be an unsigned 32-bit integer');
  }
  var result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, number, true); // Little-endian
  return result;
}

function uInt16LE(number) {
  if (!Number.isInteger(number) || number < 0 || number > 65535) {
    throw new Error('Input must be an unsigned 16-bit integer');
  }
  var result = new Uint8Array(2);
  new DataView(result.buffer).setUint16(0, number, true); // Little-endian
  return result;
}

function argsToByte(command, args, protocolVersion) {
  if (!args) {
    return new Uint8Array(0);
  }

  var encoder = new TextEncoder();

  switch (command) {
    case 'SET_GENERATOR':
    case 'SET_MODULUS':
    case 'REQUEST_KEY_EXCHANGE':
      return uInt64LE(args.key);
    case 'SET_DENOMINATION_ROUTE':
      var routeBuffer = new Uint8Array([args.route === 'payout' ? 0 : 1]);
      var valueBuffer32 = uInt32LE(args.value);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        return new Uint8Array([].concat.apply([], [routeBuffer, valueBuffer32, countryCodeBuffer]));
      }
      var valueHopperBuffer = args.isHopper ? uInt16LE(args.value) : valueBuffer32;
      return new Uint8Array([].concat.apply([], [routeBuffer, valueHopperBuffer]));
    case 'SET_CHANNEL_INHIBITS':
      var channels = args.channels;
      var bitmask = 0;
      for (var i = 0; i < channels.length; i++) {
        bitmask |= (channels[i] << i);
      }
      return uInt16LE(bitmask);
    case 'SET_COIN_MECH_GLOBAL_INHIBIT':
      return new Uint8Array([args.enable ? 1 : 0]);
    case 'SET_HOPPER_OPTIONS':
      var res = 0;
      if (args.payMode) res += 1;
      if (args.levelCheck) res += 2;
      if (args.motorSpeed) res += 4;
      if (args.cashBoxPayActive) res += 8;
      return uInt16LE(res);
    case 'GET_DENOMINATION_ROUTE':
      var valueBuffer32 = uInt32LE(args.value);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        return new Uint8Array([].concat.apply([], [valueBuffer32, countryCodeBuffer]));
      }
      return args.isHopper ? uInt16LE(args.value) : valueBuffer32;
    case 'SET_DENOMINATION_LEVEL':
      var valueBuffer = uInt16LE(args.value);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        var denominationBuffer32 = uInt32LE(args.denomination);
        return new Uint8Array([].concat.apply([], [valueBuffer, denominationBuffer32, countryCodeBuffer]));
      }
      var denominationBuffer = uInt16LE(args.denomination);
      return new Uint8Array([].concat.apply([], [valueBuffer, denominationBuffer]));
    case 'SET_REFILL_MODE':
      if (args.mode === 'on') {
        return new Uint8Array([0x05, 0x81, 0x10, 0x11, 0x01]);
      } else if (args.mode === 'off') {
        return new Uint8Array([0x05, 0x81, 0x10, 0x11, 0x00]);
      } else if (args.mode === 'get') {
        return new Uint8Array([0x05, 0x81, 0x10, 0x01]);
      }
      return new Uint8Array(0);
    case 'HOST_PROTOCOL_VERSION':
      return new Uint8Array([args.version]);
    case 'SET_BAR_CODE_CONFIGURATION':
      var enable = { none: 0, top: 1, bottom: 2, both: 3 };
      var number = Math.min(Math.max(args.numChar || 6, 6), 24);
      return new Uint8Array([enable[args.enable || 'none'], 0x01, number]);
    case 'SET_BAR_CODE_INHIBIT_STATUS':
      var byte = 0xff;
      if (!args.currencyRead) byte &= 0xfe;
      if (!args.barCode) byte &= 0xfd;
      return new Uint8Array([byte]);
    case 'PAYOUT_AMOUNT':
      var amountBuffer = uInt32LE(args.amount);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        var testBuffer = new Uint8Array([args.test ? 0x19 : 0x58]);
        return new Uint8Array([].concat.apply([], [amountBuffer, countryCodeBuffer, testBuffer]));
      }
      return amountBuffer;
    case 'GET_DENOMINATION_LEVEL':
      var amountBuffer = uInt32LE(args.amount);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        return new Uint8Array([].concat.apply([], [amountBuffer, countryCodeBuffer]));
      }
      return amountBuffer;
    case 'FLOAT_AMOUNT':
      var minBuffer = uInt16LE(args.min_possible_payout);
      var amountBuffer = uInt32LE(args.amount);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        var testBuffer = new Uint8Array([args.test ? 0x19 : 0x58]);
        return new Uint8Array([].concat.apply([], [minBuffer, amountBuffer, countryCodeBuffer, testBuffer]));
      }
      return new Uint8Array([].concat.apply([], [minBuffer, amountBuffer]));
    case 'SET_COIN_MECH_INHIBITS':
      var inhibitBuffer = new Uint8Array([args.inhibited ? 0x00 : 0x01]);
      var amountBuffer = uInt16LE(args.amount);
      if (protocolVersion >= 6) {
        var countryCodeBuffer = encoder.encode(args.country_code);
        return new Uint8Array([].concat.apply([], [inhibitBuffer, amountBuffer, countryCodeBuffer]));
      }
      return new Uint8Array([].concat.apply([], [inhibitBuffer, amountBuffer]));
    case 'FLOAT_BY_DENOMINATION':
    case 'PAYOUT_BY_DENOMINATION':
      var tmpArray = [args.value.length];
      var testBuffer = new Uint8Array([args.test ? 0x19 : 0x58]);
      var result = [new Uint8Array(tmpArray)];
      for (var i = 0; i < args.value.length; i++) {
        var countBuffer = uInt16LE(args.value[i].number);
        var denominationBuffer = uInt32LE(args.value[i].denomination);
        var countryCodeBuffer1 = toUint8ArrayArrayBuffer(encoder.encode(args.value[i].country_code));
        result.push(countBuffer, denominationBuffer, countryCodeBuffer1);
      }
      result.push(testBuffer);
      var totalLength = result.reduce(function(acc, curr) { return acc + curr.length; }, 0);
      var finalArray = new Uint8Array(totalLength);
      var offset = 0;
      for (var j = 0; j < result.length; j++) {
        finalArray.set(result[j], offset);
        offset += result[j].length;
      }
      return finalArray;
    case 'SET_VALUE_REPORTING_TYPE':
      return new Uint8Array([args.reportBy === 'channel' ? 0x01 : 0x00]);
    case 'SET_BAUD_RATE':
      var byte = 9600;
      switch (args.baudrate) {
        case 9600: byte = 0; break;
        case 38400: byte = 1; break;
        case 115200: byte = 2; break;
      }
      return new Uint8Array([byte, args.reset_to_default_on_reset ? 0 : 1]);
    case 'CONFIGURE_BEZEL':
      var rgbBytes = hexToBytes(args.RGB);
      var volatileByte = new Uint8Array([args.volatile ? 0 : 1]);
      return new Uint8Array([].concat.apply([], [rgbBytes, volatileByte]));
    case 'ENABLE_PAYOUT_DEVICE':
      var byte = 0;
      byte += args.GIVE_VALUE_ON_STORED || args.REQUIRE_FULL_STARTUP ? 1 : 0;
      byte += args.NO_HOLD_NOTE_ON_PAYOUT || args.OPTIMISE_FOR_PAYIN_SPEED ? 2 : 0;
      return new Uint8Array([byte]);
    case 'SET_FIXED_ENCRYPTION_KEY':
      return swap64(hexToBytes(args.fixedKey));
    case 'COIN_MECH_OPTIONS':
      return new Uint8Array([args.ccTalk ? 1 : 0]);
    default:
      return new Uint8Array(0);
  }
}

function parseData(data, currentCommand, protocolVersion, deviceUnitType) {
  var result = {
    success: data[0] === 0xf0,
    status: statusDesc[data[0]] ? statusDesc[data[0]].name : 'UNDEFINED',
    command: currentCommand,
    info: {} as any
  };
  var decoder = new TextDecoder();

  if (result.success) {
    data = data.subarray(1);

    if (currentCommand === 'REQUEST_KEY_EXCHANGE') {
      result.info.key = Array.prototype.slice.call(data);
    } else if (currentCommand === 'SETUP_REQUEST') {
      var unit_type = unitType[data[0]];
      var firmware_version = (parseInt(decoder.decode(readBytesFromBuffer(data, 1, 4))) / 100).toFixed(2);
      var country_code = decoder.decode(readBytesFromBuffer(data, 5, 3));
      var isSmartHopper = data[0] === 3;

      if (isSmartHopper) {
        var protocol_version = data[8];
        var number_of_coin_values = data[9];
        var coin_values = [];
        for (var i = 0; i < number_of_coin_values; i++) {
          var offset = 10 + i * 2;
          coin_values[i] = new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, true);
        }
        result.info.unit_type = unit_type;
        result.info.firmware_version = firmware_version;
        result.info.country_code = country_code;
        result.info.protocol_version = protocol_version;
        result.info.number_of_coin_values = number_of_coin_values;
        result.info.coin_values = coin_values;

        if (protocol_version >= 6) {
          var country_codes_for_values = [];
          for (var i = 0; i < number_of_coin_values; i++) {
            country_codes_for_values[i] = decoder.decode(readBytesFromBuffer(data, 10 + number_of_coin_values * 2 + i * 3, 3));
          }
          result.info.country_codes_for_values = country_codes_for_values;
        }
      } else {
        var n = data[11];
        var value_multiplier = new DataView(data.buffer, data.byteOffset + 8, 3).getUint32(0, true) & 0xffffff;
        var channel_security = Array.prototype.slice.call(readBytesFromBuffer(data, 12 + n, n));
        var channel_value = Array.prototype.slice.call(readBytesFromBuffer(data, 12, n)).map(function(value) {
          return value * value_multiplier;
        });
        var offset = 12 + n * 2;
        result.info.channel_security = channel_security;
        result.info.channel_value = channel_value;
        result.info.country_code = country_code;
        result.info.firmware_version = firmware_version;
        result.info.number_of_channels = n;
        result.info.protocol_version = data[15 + n * 2];
        result.info.real_value_multiplier = new DataView(data.buffer, data.byteOffset + offset, 3).getUint32(0, true) & 0xffffff;
        result.info.unit_type = unit_type;
        result.info.value_multiplier = value_multiplier;

        if (result.info.protocol_version >= 6) {
          var expanded_channel_country_code = decoder.decode(readBytesFromBuffer(data, 16 + n * 2, n * 3)).match(/.{3}/g);
          var expanded_channel_value = [];
          for (var i = 0; i < n; i++) {
            var offset = 16 + n * 5 + i * 4;
            expanded_channel_value[i] = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
          }
          result.info.expanded_channel_country_code = expanded_channel_country_code;
          result.info.expanded_channel_value = expanded_channel_value;
        }
      }
    } else if (currentCommand === 'GET_SERIAL_NUMBER') {
      result.info.serial_number = new DataView(data.buffer, data.byteOffset, 4).getUint32(0, false); // Big-endian
    } else if (currentCommand === 'UNIT_DATA') {
      result.info.unit_type = unitType[data[0]];
      result.info.firmware_version = (parseInt(decoder.decode(readBytesFromBuffer(data, 1, 4))) / 100).toFixed(2);
      result.info.country_code = decoder.decode(readBytesFromBuffer(data, 5, 3));
      result.info.value_multiplier = new DataView(data.buffer, data.byteOffset + 8, 3).getUint32(0, true) & 0xffffff;
      result.info.protocol_version = data[11];
    } else if (currentCommand === 'CHANNEL_VALUE_REQUEST') {
      var count = data[0];
      if (protocolVersion >= 6) {
        result.info.channel = Array.prototype.slice.call(data.subarray(1, count + 1));
        result.info.country_code = [];
        result.info.value = [];
        for (var i = 0; i < count; i++) {
          result.info.country_code[i] = decoder.decode(readBytesFromBuffer(data, count + 1 + i * 3, 3));
          var offset:number = count + 1 + count * 3 + i * 4;
          result.info.value[i] = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
        }
      } else {
        result.info.channel = Array.prototype.slice.call(data.subarray(1, count + 1));
      }
    } else if (currentCommand === 'CHANNEL_SECURITY_DATA') {
      var level = { 0: 'not_implemented', 1: 'low', 2: 'std', 3: 'high', 4: 'inhibited' };
      result.info.channel = {};
      for (var i = 1; i <= data[0]; i++) {
        result.info.channel[i] = level[data[i]];
      }
    } else if (currentCommand === 'CHANNEL_RE_TEACH_DATA') {
      result.info.source = Array.prototype.slice.call(data);
    } else if (currentCommand === 'LAST_REJECT_CODE') {
      result.info.code = data[0];
      result.info.name = rejectNote[data[0]].name;
      result.info.description = rejectNote[data[0]].description;
    } else if (currentCommand === 'GET_FIRMWARE_VERSION' || currentCommand === 'GET_DATASET_VERSION') {
      result.info.version = decoder.decode(data);
    } else if (currentCommand === 'GET_ALL_LEVELS') {
      result.info.counter = {};
      for (var i = 0; i < data[0]; i++) {
        var offset = i * 9 + 1;
        result.info.counter[i + 1] = {
          denomination_level: new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, true),
          value: new DataView(data.buffer, data.byteOffset + offset + 2, 4).getUint32(0, true),
          country_code: decoder.decode(readBytesFromBuffer(data, offset + 6, 3))
        };
      }
    } else if (currentCommand === 'GET_BAR_CODE_READER_CONFIGURATION') {
      var status = {
        0: { 0: 'none', 1: 'Top reader fitted', 2: 'Bottom reader fitted', 3: 'both fitted' },
        1: { 0: 'none', 1: 'top', 2: 'bottom', 3: 'both' },
        2: { 1: 'Interleaved 2 of 5' }
      };
      result.info.bar_code_hardware_status = status[0][data[0]];
      result.info.readers_enabled = status[1][data[1]];
      result.info.bar_code_format = status[2][data[2]];
      result.info.number_of_characters = data[3];
    } else if (currentCommand === 'GET_BAR_CODE_INHIBIT_STATUS') {
      result.info.currency_read_enable = (data[0] & 0x01) === 0;
      result.info.bar_code_enable = (data[0] & 0x02) === 0;
    } else if (currentCommand === 'GET_BAR_CODE_DATA') {
      var status2 = { 0: 'no_valid_data', 1: 'ticket_in_escrow', 2: 'ticket_stacked', 3: 'ticket_rejected' };
      result.info.status = status2[data[0]];
      result.info.data = decoder.decode(readBytesFromBuffer(data, 2, data[1]));
    } else if (currentCommand === 'GET_DENOMINATION_LEVEL') {
      result.info.level = new DataView(data.buffer, data.byteOffset, 2).getUint16(0, true);
    } else if (currentCommand === 'GET_DENOMINATION_ROUTE') {
      var res = {
        0: { code: 0, value: 'Recycled and used for payouts' },
        1: { code: 1, value: 'Detected denomination is routed to system cashbox' }
      };
      result.info = res[data[0]];
    } else if (currentCommand === 'GET_MINIMUM_PAYOUT') {
      result.info.value = new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true);
    } else if (currentCommand === 'GET_NOTE_POSITIONS') {
      var count = data[0];
      data = data.subarray(1);
      result.info.slot = {};
      if (data.length === count) {
        for (var i = 0; i < count; i++) {
          result.info.slot[i + 1] = { channel: data[i] };
        }
      } else {
        for (var i = 0; i < count; i++) {
          result.info.slot[i + 1] = {
            value: new DataView(data.buffer, data.byteOffset + i * 4, 4).getUint32(0, true)
          };
        }
      }
    } else if (currentCommand === 'GET_BUILD_REVISION') {
      var count:any = data.length / 3;
      result.info.device = {};
      for (var i = 0; i < count; i++) {
        var offset = i * 3;
        result.info.device[i] = {
          unitType: unitType[data[offset]],
          revision: new DataView(data.buffer, data.byteOffset + offset + 1, 2).getUint16(0, true)
        };
      }
    } else if (currentCommand === 'GET_COUNTERS') {
      var dv = new DataView(data.buffer, data.byteOffset);
      result.info.stacked = dv.getUint32(1, true);
      result.info.stored = dv.getUint32(5, true);
      result.info.dispensed = dv.getUint32(9, true);
      result.info.transferred_from_store_to_stacker = dv.getUint32(13, true);
      result.info.rejected = dv.getUint32(17, true);
    } else if (currentCommand === 'GET_HOPPER_OPTIONS') {
      var value = data[0];
      result.info.payMode = (value & 0x01) !== 0;
      result.info.levelCheck = (value & 0x02) !== 0;
      result.info.motorSpeed = (value & 0x04) !== 0;
      result.info.cashBoxPayAcive = (value & 0x08) !== 0;
    } else if (currentCommand === 'POLL' || currentCommand === 'POLL_WITH_ACK') {
      result.info = [];
      var k = 0;
      while (k < data.length) {
        var code = data[k];
        if (!statusDesc[code]) {
          k += 1;
          continue;
        }

        var info = {
          error: null,
          requested: null,
          actual: null,
          value: null,
          channel: null,
          code: code,
          name: statusDesc[code] ? statusDesc[code].name : undefined,
          description: statusDesc[code] ? statusDesc[code].description : undefined
        };

        switch (info.name) {
          case 'SLAVE_RESET':
          case 'NOTE_REJECTING':
          case 'NOTE_REJECTED':
          case 'NOTE_STACKING':
          case 'NOTE_STACKED':
          case 'SAFE_NOTE_JAM':
          case 'UNSAFE_NOTE_JAM':
          case 'DISABLED':
          case 'STACKER_FULL':
          case 'CASHBOX_REMOVED':
          case 'CASHBOX_REPLACED':
          case 'BAR_CODE_TICKET_VALIDATED':
          case 'BAR_CODE_TICKET_ACKNOWLEDGE':
          case 'NOTE_PATH_OPEN':
          case 'CHANNEL_DISABLE':
          case 'INITIALISING':
          case 'COIN_MECH_JAMMED':
          case 'COIN_MECH_RETURN_PRESSED':
          case 'EMPTYING':
          case 'EMPTIED':
          case 'COIN_MECH_ERROR':
          case 'NOTE_STORED_IN_PAYOUT':
          case 'PAYOUT_OUT_OF_SERVICE':
          case 'JAM_RECOVERY':
          case 'NOTE_FLOAT_REMOVED':
          case 'NOTE_FLOAT_ATTACHED':
          case 'DEVICE_FULL':
            k += 1;
            break;
          case 'READ_NOTE':
          case 'CREDIT_NOTE':
          case 'NOTE_CLEARED_FROM_FRONT':
          case 'NOTE_CLEARED_TO_CASHBOX':
            info.channel = data[k + 1];
            k += 2;
            break;
          case 'FRAUD_ATTEMPT':
            var smartDevice = [unitType[3], unitType[6]].indexOf(deviceUnitType) !== -1;
            if (protocolVersion >= 6 && smartDevice) {
              var length = data[k + 1];
              info.value = [];
              for (var i = 0; i < length; i++) {
                info.value[i] = {
                  value: new DataView(data.buffer, data.byteOffset + k + 2 + i * 7, 4).getUint32(0, true),
                  country_code: decoder.decode(readBytesFromBuffer(data, k + 6 + i * 7, 3))
                };
              }
              k += 2 + length * 7;
            } else if (smartDevice) {
              info.value = new DataView(data.buffer, data.byteOffset + k + 1, 4).getUint32(0, true);
              k += 5;
            } else {
              info.channel = data[k + 1];
              k += 2;
            }
            break;
          case 'DISPENSING':
          case 'DISPENSED':
          case 'JAMMED':
          case 'HALTED':
          case 'FLOATING':
          case 'FLOATED':
          case 'TIME_OUT':
          case 'CASHBOX_PAID':
          case 'COIN_CREDIT':
          case 'SMART_EMPTYING':
          case 'SMART_EMPTIED':
            if (protocolVersion >= 6) {
              var length = data[k + 1];
              info.value = [];
              for (var i = 0; i < length; i++) {
                info.value[i] = {
                  value: new DataView(data.buffer, data.byteOffset + k + 2 + i * 7, 4).getUint32(0, true),
                  country_code: decoder.decode(readBytesFromBuffer(data, k + 6 + i * 7, 3))
                };
              }
              k += 2 + length * 7;
            } else {
              info.value = new DataView(data.buffer, data.byteOffset + k + 1, 4).getUint32(0, true);
              k += 5;
            }
            break;
          case 'INCOMPLETE_PAYOUT':
          case 'INCOMPLETE_FLOAT':
            if (protocolVersion >= 6) {
              var length = data[k + 1];
              info.value = [];
              for (var i = 0; i < length; i++) {
                info.value[i] = {
                  actual: new DataView(data.buffer, data.byteOffset + k + 2 + i * 11, 4).getUint32(0, true),
                  requested: new DataView(data.buffer, data.byteOffset + k + 6 + i * 11, 4).getUint32(0, true),
                  country_code: decoder.decode(readBytesFromBuffer(data, k + 10 + i * 11, 3))
                };
              }
              k += 2 + length * 11;
            } else {
              info.actual = new DataView(data.buffer, data.byteOffset + k + 1, 4).getUint32(0, true);
              info.requested = new DataView(data.buffer, data.byteOffset + k + 5, 4).getUint32(0, true);
              k += 9;
            }
            break;
          case 'ERROR_DURING_PAYOUT':
            var errors = {
              0x00: 'Note not being correctly detected as it is routed',
              0x01: 'Note jammed in transport'
            };
            if (protocolVersion >= 7) {
              var length = data[k + 1];
              info.value = [];
              for (var i = 0; i < length; i++) {
                info.value[i] = {
                  value: new DataView(data.buffer, data.byteOffset + k + 2 + i * 7, 4).getUint32(0, true),
                  country_code: decoder.decode(readBytesFromBuffer(data, k + 6 + i * 7, 3))
                };
              }
              info.error = errors[data[k + 2 + length * 7]];
              k += 3 + length * 7;
            } else {
              info.error = errors[data[k + 1]];
              k += 2;
            }
            break;
          case 'NOTE_TRANSFERED_TO_STACKER':
          case 'NOTE_DISPENSED_AT_POWER-UP':
            if (protocolVersion >= 6) {
              info.value = {
                value: new DataView(data.buffer, data.byteOffset + k + 1, 4).getUint32(0, true),
                country_code: decoder.decode(readBytesFromBuffer(data, k + 5, 3))
              };
              k += 8;
            } else {
              k += 1;
            }
            break;
          case 'NOTE_HELD_IN_BEZEL':
          case 'NOTE_PAID_INTO_STACKER_AT_POWER-UP':
          case 'NOTE_PAID_INTO_STORE_AT_POWER-UP':
            if (protocolVersion >= 8) {
              info.value = {
                value: new DataView(data.buffer, data.byteOffset + k + 1, 4).getUint32(0, true),
                country_code: decoder.decode(readBytesFromBuffer(data, k + 5, 3))
              };
              k += 8;
            } else {
              k += 1;
            }
            break;
        }
        result.info.push(info);
      }
    } else if (currentCommand === 'CASHBOX_PAYOUT_OPERATION_DATA') {
      result.info = { data: [] };
      for (var i = 0; i < data[0]; i++) {
        var offset = i * 9 + 1;
        result.info.data[i] = {
          quantity: new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, true),
          value: new DataView(data.buffer, data.byteOffset + offset + 2, 4).getUint32(0, true),
          country_code: decoder.decode(readBytesFromBuffer(data, offset + 6, 3))
        };
      }
    } else if (currentCommand === 'SET_REFILL_MODE' && data.length === 1) {
      result.info = { enabled: data[0] === 0x01 };
    }
  } else {
    if (result.status === 'COMMAND_CANNOT_BE_PROCESSED' && currentCommand === 'ENABLE_PAYOUT_DEVICE') {
      result.info.errorCode = data[1];
      switch (data[1]) {
        case 1: result.info.error = 'No device connected'; break;
        case 2: result.info.error = 'Invalid currency detected'; break;
        case 3: result.info.error = 'Device busy'; break;
        case 4: result.info.error = 'Empty only (Note float only)'; break;
        case 5: result.info.error = 'Device error'; break;
        default: result.info.error = 'Unknown error'; break;
      }
    } else if (
      result.status === 'COMMAND_CANNOT_BE_PROCESSED' &&
      (currentCommand === 'PAYOUT_BY_DENOMINATION' || currentCommand === 'FLOAT_AMOUNT' || currentCommand === 'PAYOUT_AMOUNT')
    ) {
      result.info.errorCode = data[1];
      switch (data[1]) {
        case 0: result.info.error = 'Not enough value in device'; break;
        case 1: result.info.error = 'Cannot pay exact amount'; break;
        case 3: result.info.error = 'Device busy'; break;
        case 4: result.info.error = 'Device disabled'; break;
        default: result.info.error = 'Unknown error'; break;
      }
    } else if (
      result.status === 'COMMAND_CANNOT_BE_PROCESSED' &&
      (currentCommand === 'SET_VALUE_REPORTING_TYPE' || currentCommand === 'GET_DENOMINATION_ROUTE' || currentCommand === 'SET_DENOMINATION_ROUTE')
    ) {
      result.info.errorCode = data[1];
      switch (data[1]) {
        case 1: result.info.error = 'No payout connected'; break;
        case 2: result.info.error = 'Invalid currency detected'; break;
        case 3: result.info.error = 'Payout device error'; break;
        default: result.info.error = 'Unknown error'; break;
      }
    } else if (result.status === 'COMMAND_CANNOT_BE_PROCESSED' && currentCommand === 'FLOAT_BY_DENOMINATION') {
      result.info.errorCode = data[1];
      switch (data[1]) {
        case 0: result.info.error = 'Not enough value in device'; break;
        case 1: result.info.error = 'Cannot pay exact amount'; break;
        case 3: result.info.error = 'Device busy'; break;
        case 4: result.info.error = 'Device disabled'; break;
        default: result.info.error = 'Unknown error'; break;
      }
    } else if (result.status === 'COMMAND_CANNOT_BE_PROCESSED' && (currentCommand === 'STACK_NOTE' || currentCommand === 'PAYOUT_NOTE')) {
      result.info.errorCode = data[1];
      switch (data[1]) {
        case 1: result.info.error = 'Note float unit not connected'; break;
        case 2: result.info.error = 'Note float empty'; break;
        case 3: result.info.error = 'Note float busy'; break;
        case 4: result.info.error = 'Note float disabled'; break;
        default: result.info.error = 'Unknown error'; break;
      }
    } else if (result.status === 'COMMAND_CANNOT_BE_PROCESSED' && currentCommand === 'GET_NOTE_POSITIONS') {
      result.info.errorCode = data[1];
      if (data[1] === 2) {
        result.info.error = 'Invalid currency';
      }
    }
  }

  return result;
}

function stuffBuffer(inputBuffer) {
  var output = new Uint8Array(inputBuffer.length * 2);
  var j = 0;

  for (var i = 0; i < inputBuffer.length; i++) {
    var byte = inputBuffer[i];
    output[j++] = byte;
    if (byte === 0x7f) {
      output[j++] = 0x7f;
    }
  }
  return output.subarray(0, j);
}
function toUint8ArrayArrayBuffer(input) {
  // Create a new ArrayBuffer with the same length as the input
  var newBuffer = new ArrayBuffer(input.length);
  // Create a new Uint8Array from the new ArrayBuffer
  var result = new Uint8Array(newBuffer);
  // Copy the data from the input Uint8Array to the new Uint8Array
  result.set(input);
  return result;
}
function extractPacketData(buffer, encryptKey, count, callback) {
  if (buffer[0] !== STX) {
    callback(new Error('Unknown response'));
    return;
  }

  var dataLength = buffer[1];
  var packetData = buffer.subarray(2, dataLength + 2);
  var crcData = buffer.subarray(0, dataLength + 2);
  var crc = CRC16(crcData);
  var crcCheck = buffer.subarray(buffer.length - 2);

  if (!arrayEquals(crc, crcCheck)) {
    callback(new Error('Wrong CRC16'));
    return;
  }

  var extractedData = packetData;
  if (encryptKey !== null && packetData[0] === STEX) {
    decrypt(encryptKey, packetData.subarray(1), function(err, decryptedData) {
      if (err) {
        callback(err);
        return;
      }
      var eLength = decryptedData[0];
      var eCount = bytesToUInt32LE(decryptedData.subarray(1, 5));
      extractedData = decryptedData.subarray(5, eLength + 5);

      if (eCount !== count + 1) {
        callback(new Error('Encrypted counter mismatch'));
        return;
      }
      callback(null, extractedData);
    });
  } else {
    callback(null, extractedData);
  }
}

function generateKeys() {
  // ES5 workaround: Simplified prime generation (not cryptographically secure)
  var generator = window.crypto.getRandomValues(new Uint16Array(1))[0];
  var modulus = window.crypto.getRandomValues(new Uint16Array(1))[0];
  if (generator === 0 || modulus === 0) {
    throw new Error('GENERATOR and MODULUS should be > 0');
  }
  if (generator < modulus) {
    var temp = generator;
    generator = modulus;
    modulus = temp;
  }
  var hostRandom = window.crypto.getRandomValues(new Uint16Array(1))[0] % 2147483648;
  var hostInter = Math.pow(generator, hostRandom) % modulus; // Limited precision in ES5
  return {
    generator: generator,
    modulus: modulus,
    hostRandom: hostRandom,
    hostInter: hostInter
  };
}

function getPacket(command, argBytes, sequence, encryptKey, eCount, callback) {
  if (commandList[command].args && argBytes.length === 0) {
    callback(new Error('Command requires arguments'));
    return;
  }

  var SEQ_SLAVE_ID = sequence;
  var DATA = new Uint8Array([commandList[command].code].concat(Array.prototype.slice.call(argBytes)));

  if (encryptKey !== null) {
    var eCOUNT = uInt32LE(eCount);
    var paddingLength = (16 - ((DATA.length + 7) % 16)) % 16;
    var ePACKING = window.crypto.getRandomValues(new Uint8Array(paddingLength));
    var crcPacket = new Uint8Array([DATA.length].concat(Array.prototype.slice.call(eCOUNT), Array.prototype.slice.call(DATA), Array.prototype.slice.call(ePACKING)));
    var crc = CRC16(crcPacket);
    encrypt(encryptKey, new Uint8Array([].concat.apply([], [crcPacket, crc])), function(err, encryptedData) {
      if (err) {
        callback(err);
        return;
      }
      DATA = new Uint8Array([STEX].concat(Array.prototype.slice.call(encryptedData)));
      finalizePacket();
    });
  } else {
    finalizePacket();
  }

  function finalizePacket() {
    var crcPacket = new Uint8Array([SEQ_SLAVE_ID, DATA.length].concat(Array.prototype.slice.call(DATA)));
    var PACKET = new Uint8Array([].concat.apply([], [crcPacket, CRC16(crcPacket)]));
    var STUFFED_PACKET = new Uint8Array([STX].concat(Array.prototype.slice.call(stuffBuffer(PACKET))));
    callback(null, STUFFED_PACKET);
  }
}

function createSSPHostEncryptionKey(buffer, keys) {
  var fixedKey = keys.fixedKey;
  var hostRandom = keys.hostRandom;
  var modulus = keys.modulus;
  var slaveInterKey = new DataView(buffer.buffer, buffer.byteOffset, 8).getUint32(0, true); // Limited to 32-bit in ES5
  var key = Math.pow(slaveInterKey, hostRandom) % modulus; // Limited precision in ES5
  var encryptKey = new Uint8Array([].concat.apply([], [swap64(hexToBytes(fixedKey)), uInt64LE(key)]));
  return {
    slaveInterKey: slaveInterKey,
    key: key,
    encryptKey: encryptKey
  };
}

// Helper functions
function hexToBytes(hex) {
  var bytes = new Uint8Array(hex.length / 2);
  for (var i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function swap64(bytes) {
  var result = new Uint8Array(8);
  for (var i = 0; i < 8; i++) {
    result[i] = bytes[7 - i];
  }
  return result;
}

function bytesToUInt16LE(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, 2).getUint16(0, true);
}

function bytesToUInt24BE(bytes) {
  return (bytes[0] << 16) + (bytes[1] << 8) + bytes[2];
}

function bytesToUInt32LE(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
}

function bytesToUInt32BE(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false);
}

function arrayEquals(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Exports (ES5-compatible module pattern)
export {
  absBigInt,
  argsToByte,
  CRC16,
  createSSPHostEncryptionKey,
  decrypt,
  encrypt,
  extractPacketData,
  generateKeys,
  getPacket,
  parseData,
  randomInt,
  readBytesFromBuffer,
  stuffBuffer,
  uInt16LE,
  uInt32LE,
  uInt64LE,
  hexToBytes,
  swap64,
  bytesToUInt16LE,
  bytesToUInt24BE,
  bytesToUInt32LE,
  bytesToUInt32BE,
  arrayEquals,
  toUint8ArrayArrayBuffer
};