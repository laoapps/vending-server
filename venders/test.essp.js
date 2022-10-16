"use strict";
// import axios from 'axios';
exports.__esModule = true;
exports.KiosServer = void 0;
var sspLib = require('encrypted-smiley-secure-protocol');
// import { SerialPort } from 'serialport';
var KiosServer = /** @class */ (function () {
    function KiosServer() {
        var _this = this;
        this.eSSP = new sspLib({
            id: 0x00,
            debug: false,
            timeout: 3000,
            fixedKey: '0123456701234567'
        });
        var buffer = '';
        var that = this;
        this.eSSP.on('OPEN', function () {
            console.log('open');
            _this.eSSP.command('SYNC')
                .then(function () { return _this.eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }); })
                .then(function () { return _this.eSSP.initEncryption(); })
                .then(function () { return _this.eSSP.command('GET_SERIAL_NUMBER'); })
                .then(function (result) {
                console.log('SERIAL NUMBER:', result.info.serial_number);
                return;
            })
                .then(function () { return _this.eSSP.enable(); })
                .then(function (result) {
                if (result.status == 'OK') {
                    console.log('Device is active');
                }
                return;
            });
        });
        this.eSSP.on('NOTE_REJECTED', function (result) {
            console.log('NOTE_REJECTED', result);
            _this.eSSP.command('LAST_REJECT_CODE')
                .then(function (result) {
                console.log(result);
                // //this.send(sock, EMessage.all,'LAST_REJECT_CODE', result);
            });
        });
        this.eSSP.on('JAM_RECOVERY', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'JAM_RECOVERY', result);
        });
        this.eSSP.on('ERROR_DURING_PAYOUT', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'ERROR_DURING_PAYOUT', result);
        });
        this.eSSP.on('SMART_EMPTYING', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'SMART_EMPTYING', result);
        });
        this.eSSP.on('SMART_EMPTIED', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'SMART_EMPTIED', result);
        });
        this.eSSP.on('CHANNEL_DISABLE', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'CHANNEL_DISABLE', result);
        });
        this.eSSP.on('INITIALISING', function (result) {
            console.log(result);
            // //this.send(sock, EMessage.all,'INITIALISING', result);
        });
        this.eSSP.on('COIN_MECH_ERROR', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'COIN_MECH_ERROR', result);
        });
        this.eSSP.on('EMPTYING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'EMPTYING', result);
        });
        this.eSSP.on('COIN_MECH_JAMMED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'COIN_MECH_JAMMED', result);
        });
        this.eSSP.on('COIN_MECH_RETURN_PRESSED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'COIN_MECH_RETURN_PRESSED', result);
        });
        this.eSSP.on('PAYOUT_OUT_OF_SERVICE', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'PAYOUT_OUT_OF_SERVICE', result);
        });
        this.eSSP.on('NOTE_FLOAT_REMOVED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_FLOAT_REMOVED', result);
        });
        this.eSSP.on('NOTE_FLOAT_ATTACHED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_FLOAT_ATTACHED', result);
        });
        this.eSSP.on('NOTE_TRANSFERED_TO_STACKER', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_TRANSFERED_TO_STACKER', result);
        });
        this.eSSP.on('NOTE_PAID_INTO_STACKER_AT_POWER-UP', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_PAID_INTO_STACKER_AT_POWER-UP', result);
        });
        this.eSSP.on('NOTE_PAID_INTO_STORE_AT_POWER-UP', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_PAID_INTO_STORE_AT_POWER-UP', result);
        });
        this.eSSP.on('NOTE_STACKING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_STACKING', result);
        });
        this.eSSP.on('NOTE_DISPENSED_AT_POWER-UP', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_DISPENSED_AT_POWER-UP', result);
        });
        this.eSSP.on('NOTE_HELD_IN_BEZEL', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_HELD_IN_BEZEL', result);
        });
        this.eSSP.on('BAR_CODE_TICKET_ACKNOWLEDGE', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'BAR_CODE_TICKET_ACKNOWLEDGE', result);
        });
        this.eSSP.on('DISPENSED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'DISPENSED', result);
        });
        this.eSSP.on('JAMMED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'JAMMED', result);
        });
        this.eSSP.on('HALTED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'HALTED', result);
        });
        this.eSSP.on('FLOATING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'FLOATING', result);
        });
        this.eSSP.on('TIME_OUT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'TIME_OUT', result);
        });
        this.eSSP.on('DISPENSING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'DISPENSING', result);
        });
        this.eSSP.on('NOTE_STORED_IN_PAYOUT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_STORED_IN_PAYOUT', result);
        });
        this.eSSP.on('INCOMPLETE_PAYOUT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'INCOMPLETE_PAYOUT', result);
        });
        this.eSSP.on('INCOMPLETE_FLOAT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'INCOMPLETE_FLOAT', result);
        });
        this.eSSP.on('CASHBOX_PAID', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'CASHBOX_PAID', result);
        });
        this.eSSP.on('COIN_CREDIT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'COIN_CREDIT', result);
        });
        this.eSSP.on('NOTE_PATH_OPEN', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_PATH_OPEN', result);
        });
        this.eSSP.on('NOTE_CLEARED_FROM_FRONT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_CLEARED_FROM_FRONT', result);
        });
        this.eSSP.on('NOTE_CLEARED_TO_CASHBOX', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_CLEARED_TO_CASHBOX', result);
        });
        this.eSSP.on('CASHBOX_REMOVED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'CASHBOX_REMOVED', result);
        });
        this.eSSP.on('CASHBOX_REPLACED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        });
        this.eSSP.on('BAR_CODE_TICKET_VALIDATED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'BAR_CODE_TICKET_VALIDATED', result);
        });
        this.eSSP.on('FRAUD_ATTEMPT', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'FRAUD_ATTEMPT', result);
        });
        this.eSSP.on('STACKER_FULL', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'STACKER_FULL', result);
        });
        this.eSSP.on('DISABLED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'DISABLED', result);
        });
        this.eSSP.on('UNSAFE_NOTE_JAM', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'UNSAFE_NOTE_JAM', result);
        });
        this.eSSP.on('SAFE_NOTE_JAM', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'SAFE_NOTE_JAM', result);
        });
        this.eSSP.on('NOTE_STACKED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_STACKED', result);
        });
        this.eSSP.on('NOTE_REJECTED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_REJECTED', result);
        });
        this.eSSP.on('NOTE_REJECTING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'NOTE_REJECTING', result);
        });
        this.eSSP.on('CLOSE', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'CLOSE', result);
        });
        this.eSSP.on('OPEN', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'OPEN', result);
        });
        this.eSSP.on('READ_NOTE', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'READ_NOTE', result);
        });
        this.eSSP.on('EMPTIED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'EMPTIED', result);
        });
        this.eSSP.on('DISPENSING', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'DISPENSING', result);
        });
        this.eSSP.on('CASHBOX_REPLACED', function (result) {
            console.log(result);
            //this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        });
        this.eSSP.command('SET_BAUD_RATE', {
            baudrate: 9600,
            reset_to_default_on_reset: true
        });
        // this.eSSP.open('/dev/ttyS0')
        this.eSSP.open('COM1');
    }
    //  checkSum(buff: any) {
    //     try {
    //         const x = crc.crc16modbus(Buffer.from(buff as any, 'hex')).toString(16);
    //         console.log(x);
    //         return x.substring(2) + x.substring(0, 2);
    //     }
    //     catch (e) {
    //         console.log('error', e);
    //         return '';
    //     }
    // }
    KiosServer.prototype.close = function () {
        this.eSSP.close();
    };
    return KiosServer;
}());
exports.KiosServer = KiosServer;
