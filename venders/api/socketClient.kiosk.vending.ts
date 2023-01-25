import * as net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'

import { SocketKiosClient } from './socketClient.kiosk';
export class SocketKiosClientVending extends SocketKiosClient {
    //---------------------client----------------------

    constructor(serverPort=31236,port='COM1') {
        super(serverPort,port);
    }



}