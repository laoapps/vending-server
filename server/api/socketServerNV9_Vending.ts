import net from 'net';
import { EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID as IMachineClientID, IReqModel, IResModel, IBankNote } from '../entities/system.model';
import cryptojs from 'crypto-js';
import { CashNV9 } from './cashNV9';
import { SocketServerESSPKiosk } from './socketServerNV9_Kiosk';
// console.log(cryptojs.SHA256('11111111111111').toString(cryptojs.enc.Hex));
export class SocketServerESSPVending extends SocketServerESSPKiosk{
    constructor(port=31236){
        super(port)
    }

}