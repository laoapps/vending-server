import axios from 'axios';
import express, { Router } from 'express';
import { EMessage, EMODBUS_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import ModbusRTU from 'modbus-serial';
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { initWs, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
import crc16,{checkSum} from 'node-crc16';
import { SocketModBusClient } from './socketClient.modbus';
export class VendingModBus {

    port = new ModbusRTU();
    sock: SocketModBusClient;
    constructor(sock: SocketModBusClient) {

        this.sock = sock;

        this.port.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 });


    }
    command(command: string,param:any) {
        // this.port.setID(1);
        return new Promise<IResModel>((resolve,reject)=>{
        let buff = Array<any>();
        switch (command) {
            case EMODBUS_COMMAND.hwversion:
                buff = ['03', '00', '01', '00', '02', '95', 'CB'];
                //01 03 04 20 02 0A 0A D6 94
                //Description: The 1st~2nd byte is the hardware version of the driver board, which is the BCD code, indicating the year and month
                // For example: 20 02 means 20 years and 2 months
                //The 3rd byte is the number of cargo lane layers 0A to decimal -10 layers The 4th byte is the number of cargo lane columns 0A to decimal-10 columns
                break;
            case EMODBUS_COMMAND.swversion:
                buff = ['03', '00', '02', '00', '02', '65', 'CB'];
                //                     01 03 04 20 20 02 20 F0 81 Description: 4 bytes are BCD code, which means: year, month and day respectively.
                // For example: 20 20 02 20 means February 20, 2020
                break;
            case EMODBUS_COMMAND.status:
                buff = ['03', '00', '03', '00', '01', '74', '0A'];
                // 01 03 02 '00' '00' B8 44
                // Packet byte 1 running state '00'-idle state
                // Packet 2 Byte Fault Code '00' - No Error
                // Details: (Table 3.1) Status return packet definition
                // Note: When the driver board into the "shipping success" or "shipping failure", Android read this state after the driver board will default into the idle state waiting for the next shipment. The fault code will not be cleared
                break;
            case EMODBUS_COMMAND.hutemp:
                buff = ['03', '00', '04', '00', '02', '85', 'CA'];
                // 01 03 04 '00' D2 02 26 DA B0
                // Packet 1~2 byte temperature
                // Data packet 3rd~4th byte humidity
                // Note: The temperature and humidity data is done x10 to retain 1 bit after the decimal point, and the high byte of the data is in front.
                // For example, read the temperature value: '00' D2 converted to decimal 210, then the actual temperature is 210/10 = 21.0 °C, the same humidity data to do this processing
                break;
            case EMODBUS_COMMAND.statusgrid:
                buff = ['03', '00', '05', '00', '01', '94', '0B'];
            //                     01 03 02 2-byte data CRCL CRCH
            // Return Example: 01 03 02 01 '00' B9 D4
            // Packet byte 1 cabinet code 01-1 cabinet
            // Packet byte 2 cabinet status '00'-open status 01-closed status
            // Note: This instruction is based on the current protocol extension instruction and is non-standard.
            case EMODBUS_COMMAND.shippingcontrol:
                const lane = param.lane;
                const isspring ='01';
                const enabledropdetect='01';
                buff = ['10', lane, isspring, enabledropdetect, '04', '00', '01', '01', '00'];
                // 01 10 20 01 00 02 04 00 01 01 00 FB F2
                // ● 01: Slave address (driver board address, settable)
                // ● 10: Function code
                // ● 20 01: Shipping control register
                // ● 00 02: Word length
                // ● 04: Byte length
                // ● 00 01 01 00: Shipping control
            // Packet byte 1 lane number, '00' - lane number for the first layer of the first column of motors
            // Data packet byte 2 cargo channel type, 01 - cargo channel type is spring motor
            // Packet byte 3 turn on drop detection, 01 - turn on drop detection
            // Byte 4 of the packet turns on the lift system, '00' - does not enable the lift
            // ● FB F2: CRC check digit
            // Driver board return: 01 10 20 01 '00' 02 1B C8
            // For detailed shipping control rules see: (Table 3.3) Shipping control packet definitions
            // - frieght lane  number
            // byte 1 The shipping lane number 0 ~ 99 (decimal number), ten for the line number, the individual column number (0 for the first line / column)
            // byte 2 Cargo Lane Type
            // '00':Auto-ID (not recommended)
            // 01:Spring motor
            // 02:Electromagnetic lock
            // 03:Crawler Cargo Lane
            // 04:Motor timing control
            // byte 3 Enable drop detection
            //Whether to enable drop detection for this shipment: 0 - not
            // enabled 1 - enabled
            // byte 4 Enable lift table
            // Whether to enable the lift: 0 - not enabled 1 - enabled
           const  check = checkSum(Buffer.from(buff), { retType: 'hex' });
                    console.log('checksum',this.getCheckSum(check) );
                    buff.push(...this.getCheckSum(check));
            case EMODBUS_COMMAND.positionliftmotor:
                buff = ['03', '00', '06', '00', '01', '64', '0B'];
            //                 01 03 02 2-byte data CRCL CRCH
            // Return Example: 01 03 02 07 D0 BB E8
            // Packet:7D0 corresponds to 2'00'0 in decimal, indicating the current position of the lift motor at 2'00'0 (with symbols to note the positive and negative) Note: This command is valid only for lift systems. 8.31
            case EMODBUS_COMMAND.dropdetectstatus:
                buff = ['03', '00', '08', '00', '01', '05', 'C8'];
            // 01 03 02 2-byte data CRCL CRCH
            // Return Example: 01 03 02 '00' '00' B8 44
            // Packet word 1/2, '00''00'-drop detection not connected or blocked '00'01-drop detection normal alignment no blocking
            // case EMODBUS_COMMAND.positionhoraxis:
            //     buff = ['03', '00', '07', '00', '01', '35', 'CB'];
            // //                 01 03 02 03 E8 B8 FA
            // // Packet:3E8 corresponds to 1'00'0 in decimal, indicating that the current horizontal motor is at the position of 1'00'0 (there are symbols to note the positive and negative)
            // // Note: This command is valid only for two-axis systems. 8.31

           
            // case EMODBUS_COMMAND.arrayoutputstatus:
            //     buff = ['03', '00', '09', '00', '02', '14', '09'];
            // //                 : 01 03 04 '00' '00' 04 01 39 33
            // // The return data is 32 bits long, where 1-10 bit indicates the negative 1-10 channel output status, 11-20 bit indicates the positive channel output status, and 21-32 bit is reserved. 1 means the output is valid and 0 means the output is invalid.
            // // If the return example: '00''00'0401 corresponds to binary '00''00' '00''00' '00''00' '00''00' '00''00' 01'00' '00''00' '00'01
            // // Indicates that 1 channel of the positive pole is active and 1 channel of the negative pole is active

            // case EMODBUS_COMMAND.arrayinputstatus:
            //     buff = ['03', '00', '0A', '00', '01', 'A4', '08'];
            // // 01 03 02 04 '00' BA 84
            // // The data packet is a 16-bit length data, each bit indicates an IO input status, 0 - invalid, 1 - valid. For example: Return data 04'00' means the drop detection port is valid
            // // Bit0-Bit9: indicates the status of the spring motor feedback input 1~10 channels
            // // Bit10: Drop detection port status
            // // Bit11: Reserved input port status
            // // Bit12: Button Status
            // // Bit13~Bit15: Reserved
            // case EMODBUS_COMMAND.yaxiselevatorstatus:
            //     buff = ['03', '00', '0B', '00', '02', 'F5', 'C8'];
            // // 01 03 02 '00' 10 B9 88
            // // The data packet is a 16-bit length data, each bit indicates an IO input status, 0 - invalid, 1 - valid. For example: Return data '00'10 means the 5th channel sensor of the lift-off board is valid
            // // Bit0-upper limit bit Bit1: lower limit bit
            // // Bit8-Bit15: Invalid
            // case EMODBUS_COMMAND.xaxiselevatorstatus:
            //     buff = ['03', '00', '0C', '00', '02', '44', '09'];
            // // 01 03 02 '00' 10 B9 88
            // // The data packet is a 16-bit length data, each bit indicates an IO input status, 0 - invalid, 1 - valid. For example, the return data '00'10 means that the 5th channel sensor of X-axis moving motor control board is valid. Bit0-Left Limit Bit1: Right Limit
            // // Bit8-Bit15: Invalid
            // case EMODBUS_COMMAND.yaxisliftmotor:
            //     buff = ['03', '00', '0D', '00', '02', '15', 'C9'];
            // //                 01 03 02 '00' '00' B8 44
            // // Packet 1 byte Y-axis operation status '00'-idle 01-motor is addressing 02-motor finished addressing 03-fault
            // // Packet byte 2 Y-axis fault code '00' - no error (see Table 3.1 for detailed fault codes)
            // case EMODBUS_COMMAND.xaxisliftmotor:
            //     buff = ['03', '00', '0E', '00', '02', 'E5', 'C9'];

            // // 01 03 02 2-byte data CRCL CRCH
            // // Return Example: 01 03 02 '00' '00' B8 44
            // // Packet 1 byte X-axis operation status '00'-idle 01-motor is addressing 02-motor finished addressing 03-fault
            // // Packet byte 2 X-axis fault code '00' - no error (see Table 3.1 for detailed fault codes)
            // case EMODBUS_COMMAND.relaycommand:
            //     buff = ['06', '10', '01', '01', '01', '01', '1C', '9A'];
            // //                 Sending packet description.
            // // Data packet byte 1 relay number: 01-1 relay
            // // Data packet byte 2 relay status: '00' - release relay, 01 - relay output Driver board return (example): 01 06 10 01 01 01 01 1C 9A
            // case EMODBUS_COMMAND.lifterreset:
            //     buff = ['06', '10', '02', '00', '01', 'ED', '0A'];
            // //             Sending packet description.
            // // Packet: '00' 01 (fixed)
            // // Driver board return (example): 01 06 10 02 '00' 01 ED 0A Note: This command is valid for lift systems only.
            // case EMODBUS_COMMAND.manualspeedmode:
            //     buff = ['06', '10', '03', '00', '01', 'BC', 'CA'];
            // //             Sending packet description.
            // // Packet byte 1: '00'-Lift motor, 01-Horizontal motor
            // // Packet byte 2: '00'-Stop running, 01-Motor forward, 02-Motor reverse Driver board return (example): 01 06 10 03 '00' 01 BC CA
            // //Note: This command is valid only for lift systems. 8.31
            // case EMODBUS_COMMAND.motortimeout:
            //     buff = ['06', '10', '04', '0B', 'B8', 'CB', '89'];
            // //             
            // // Sending packet description.
            // // Packet 1~2 bytes: motor timeout time, 0BB8-transformed to decimal 3'00'0.means motor timeout time is 3'00'0mS
            // // Driver board return (example): 01 06 10 04 0B B8 CB 89
            // // Note: Time unit mS
            // case EMODBUS_COMMAND.setyaxisposition:
            //     buff = ['06', '10', '05', '03', 'E8', '9D', 'B5'];
            // //Sending packet description.
            // // Data packet: 03E8 means the Y-axis position of the pickup port is at 1'00'0 Driver board return (example): 01 06 10 05 03 E8 9D B5
            // // Note: This command is valid for lift systems only.
            // case EMODBUS_COMMAND.setxaxisposition:
            //     buff = ['06', '10', '06', '03', 'E8', '6D', 'B5'];
            // //                 Sending packet description.
            // // Data packet: 03E8 means the X-axis position of the pickup port is at 1'00'0 Driver board return (example): 01 06 10 06 03 E8 6D B5
            // // Note: This command is valid for two-axis systems only.
            // case EMODBUS_COMMAND.setyaxismotor:
            //     buff = ['06', '10', '07', '13', '88', '31', '9D'];
            // //                 Sending packet description.
            // // Data packet: 13888 means set Y-axis addressing position to 1'00'0 Driver board return (example): 01 06 10 07 13 88 31 9D
            // // Note: This command is valid for lift systems only.

            // case EMODBUS_COMMAND.setxaxismotor:
            //     buff = ['06', '10', '08', '13', '88', '01', '9E'];
            // //                 Sending packet description.
            // // Data packet: 1388 means set X-axis addressing position to 5'00'0
            // // Driver board return (example): 01 06 10 08 13 88 01 9E Note: This command is valid for two-axis systems only.
            
            // case EMODBUS_COMMAND.yaxisliftmotorissue:
            //     buff = ['10', '20', '02', '00', '0A', '14', '1F', '40', '1B', '58', '17', '70', '13', '88', '0F', 'A0', '0B', 'B8', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', 'D4', '18'];
            // // 01: Slave address (driver board address, settable)
            // // ● 10: Function code
            // // ● 20 02: Lift motor search register
            // // ● '00' 0A: Word length,10
            // // ● 14: Byte length,20
            // // ● 1F401B58177013880FA'00'BB8'00''00''00''00''00''00''00''00''00':Y-axisparameters
            // //    1F 40 decimal 8'00'0, means Y0=8'00'0
            // //    1B 58 decimal 7'00'0, means Y1=7'00'0
            // //    17 70 decimal 6'00'0, means Y2=6'00'0
            // //    13 88 decimal 5'00'0, means Y3=5'00'0
            // //    0F A0 decimal 4'00'0, means Y4=4'00'0
            // //    0B B8 decimal 3'00'0, means Y5=3'00'0
            // //    Y6=0,Y7=0,Y8=0,Y9=0
            // // Y0 generally indicates the height position information of the first layer
            // // ● D4 18: CRC check digit
            // // Driver board return: 01 10 20 02 '00' 0A EA 0E
            // // Note: This command is valid for lift systems only.
            // case EMODBUS_COMMAND.xaxisliftmotorissue:
            //     buff = ['10', '20', '03', '00', '0A', '14', '07', 'D0', '07', '08', '06', '40', '05', '78', '04', 'B0', '03', 'E8', '03', '20', '02', '58', '01', '90', '00', 'C8', '9A', 'EF'];
            // //07D'00'708064'00'57804B'00'3E8032'00'258019'00'0C8:X-axisparameters
            // //                 07 D0 decimal 2'00'0, means X0=2'00'0 07 08 decimal 18'00', means X1=18'00' 06 40 decimal 16'00', means X2=16'00' 05 78 decimal 14'00', means X3 = 14'00' 04 B0 decimal 12'00', means X4=12'00' 03 E8 decimal 1'00'0, means X5=1'00'0 03 20 decimal 8'00', means X6=8'00'
            // // 02 58 decimal 6'00', means X7=6'00'
            // // 01 90 decimal 4'00', means X8=4'00'
            // // '00' C8 decimal 2'00', means X9=2'00'
            // // X0 generally indicates the position information of the first column
            // // ● 9A EF: CRC check digit
            // // Driver board return: 01 10 20 03 '00' 0A BB CE
            // // Note: This command is valid for two-axis systems only.
            // case EMODBUS_COMMAND.arrayoutput:
            //     buff = ['10', '20', '04', '00', '03', '06', '00', '64', '00', '00', '04', '01', 'BE', '5D'];
            // // Packet 1 ~ 2 bytes that the array output effective time (unit mS): such as the example '00' 64 decimal means 1'00', it means that the array output 1'00'mS after the automatic shutdown, if the parameter is 0 that has been output.
            // // The 3rd~6th byte of the data packet indicates the array output control status: the data is 32 bits long, where 1-10 bit indicates the negative 1-10 channel output status, 11-20 bit indicates the positive channel output status, and 21-32 bit is reserved. 1 indicates that the output is valid, and 0 indicates that the output is invalid.
            // // For example: '00' '00' 04 01 corresponds to binary '00''00' '00''00' '00''00' '00''00' '00''00' '00''00' 01'00' '00''00' '00'01
            // // Indicates that 1 channel of the positive pole is active and 1 channel of the negative pole is active
            // // ● BE 5D: CRC check digit
            // // Driver board return: 01 10 20 04 '00' 03 CA 09
            // case EMODBUS_COMMAND.liftoutput:
            //     buff = ['10', '20', '05', '00', '03', '06', '00', '00', '03', '01', '03', 'E8', '0C', '6A'];
            // //Data packet byte 1 lift board number: '00'-Y-axis control board 01-X-axis control board
            // // Data packet 2nd byte output mode: '00' - Sensor operation mode 01 - Timing control mode
            // // The 3rd byte of the data packet lifts the output channel: 1~5 corresponding to the 5 output channels of the control board
            // // Data packet 4th byte lift board output status: '00'-stop, 01-positive rotation, 02-reverse rotation
            // // Data packet 5~6 byte lift board drive output time (unit mS): timed output, timed output automatically
            // // Stop. If this parameter is 0 it means output all the time. 03 E8-Decimal 1'00'0, indicates when output is valid
            // // In the sensor mode, the time parameter is valid to prioritize the conditions to be met as a stopping reference.
            // // ● 0C 6A: CRC check digit
            // // Driver board return: 01 10 20 05 '00' 03 9B C9
            // // Note: This command is only valid for supporting lift systems.
            default:
                break;
        }
        this.port.writeRegisters(1, buff).then(r => {
            console.log('write', r);
            this.sock.send(r,command as any);
            resolve(PrintSucceeded(command, param, EMessage.commandsucceeded));
        }).then(() => {
            this.port.readHoldingRegisters(1, buff.length).then(r => {
                console.log('read', r);

            })
        }).catch(e=>{
            reject(PrintError(command, param, e.message));
        })

    })
}

    close() {
        this.port.close((e) => {
            console.log('closing', e);
        })
    }
    getCheckSum(s:string){
        return [s.substring(0,1),s.substring(2,3)]
    }



}
