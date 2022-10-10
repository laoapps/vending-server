
import { EM102_COMMAND, EMessage, IResModel } from '../entities/syste.model';
import { SerialPort } from 'serialport';
import {int2hex, PrintError, PrintSucceeded } from '../services/service';
import { SocketClientM102 } from './socketClient.m102';
import crc from 'crc';

export class VendingM102 {

    port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    })
    sock :SocketClientM102|null=null;
    constructor(sock: SocketClientM102) {
        this.sock = sock;
        // Read data that is available but keep the stream in "paused mode"
        // this.port.on('readable', function () {
        //     console.log('Data:', this.port.read())
        // })

        // Switches the port into "flowing mode"
        // this.port.on('data', function (data) {
        //     console.log('Data:', data)
        // })
        let buffer = '';
        const that = this;
        this.port.on("open", function () {
            console.log('open serial communication');
            // Listens to incoming data
            that.port.on('data', function (data: any) {
                console.log('data', data);
                buffer += new String(data);
                console.log('buffer', buffer);
                if (buffer.length == 4) {
                    sock.send(buffer,-1)
                    buffer = '';
                    
                }

            });
        });

    }
     checkSum(buff: any) {
        try {
            let x = crc.crc16modbus(Buffer.from(buff.join(''), 'hex')).toString(16);
            x.length<4?x='0'+x:'';
            console.log(x);
            console.log(x.substring(2) + x.substring(0, 2));
            
            return x.substring(2) + x.substring(0, 2);
        }
        catch (e) {
            console.log('error', e);
            return '';
        }
    }

    command(command: EM102_COMMAND, param: any) {
        return new Promise<IResModel>((resolve, reject) => {
            let buff = Array<any>();
            let check = '';
            switch (command) {
                case EM102_COMMAND.getid:
                    buff = ['01', '01', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '71', '88'];

                    break;
                case EM102_COMMAND.getresult:
                    buff = ['01', '03', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', 'D0', 'E8'];

                    break;
                case EM102_COMMAND.scan:
                    buff = ['01', '04', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];
                  
                    break;
                case EM102_COMMAND.release:
                    buff = ['01', '05', int2hex(param), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];
                    check =this.checkSum(buff)
                    break;

                case EM102_COMMAND.readtemperature:
                    buff = ['01', '07', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '92', '29']
                   
                    break;
                case EM102_COMMAND.DO:
                    buff = ['01', '08', param, '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00']
               
                    break;
                case EM102_COMMAND.DI:
                    buff = ['01', '09', param, '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00']
                   
                    break;
                case EM102_COMMAND.modify:
                    buff = ['FF', '01', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '20', '50']
                    // buffer=[FF,02,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',D0,A0]
                    // buffer=[FF,03,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',81,30]
                    // buffer=[FF,04,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',33,01]
                    // buffer=[FF,05,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',62,91]
                    // buffer=[FF,06,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',92,61]
                    // buffer=[FF,07,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',C3,F1]
                    // buffer=[FF,08,'00','00','00','00','00','00','00','00','00','00','00','00','00','00','00','00',F6,02]
                    break;

                default:

                    break;
            }
            const x = buff.join('') + check;
            this.port.write(Buffer.from(x, 'hex'), (e) => {
                if (e) {
                    reject(PrintError(command, param, e.message));
                    return console.log('Error: ', e.message)
                } else {
                    resolve(PrintSucceeded(command, param, EMessage.commandsucceeded));
                }
            })
        })

    }
    close() {
        this.port.close((e) => {
            console.log('closing', e);
        })
    }
}




/// demo 

// const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 }, function (err) {
//     if (err) {
//         return console.log('Error: ', err.message)
//     }
//     console.log('port /dev/ttyUSB0 accessed');
    
// })
// var b = '';
// port.on('data', function (data: any) {
//     console.log('data', data);
//     b += new String(data);
//     console.log('buffer', buffer);
//     if (buffer.length == 4) {
//         b = '';
//     }

// });
// function int2hex(i: number) {
//     const str = Number(i).toString(16);
//     return str.length === 1 ? '0' + str : str;
// }
// const param = { slot: 48 }
// const buffer = ['01', '05', int2hex(param.slot), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];
// const check = this.checkSum(buffer.join(''));
// const x = buffer.join('') + check;
// port.write(Buffer.from(x, 'hex'), (e) => {
//     if (e) {
//         return console.log('Error: ', e.message)
//     } else {
//         console.log('run succeeded');

//     }
// })