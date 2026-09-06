import { Injectable, OnDestroy } from '@angular/core';
import { EMACHINE_COMMAND, IAlive, IBillProcess, IClientId, IReqModel, IResModel } from './syste.model';
import * as cryptojs from 'crypto-js';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { EventEmitter } from 'events';
import { AppcachingserviceService } from './appcachingservice.service';
import { IENMessage } from '../models/base.model';
import { IndexerrorService } from '../indexerror.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WsapiService implements OnDestroy {
  private wsurl = 'ws://localhost:9009';
  public webSocket: WebSocket | null = null;
  private machineId = '';
  private otp = '';
  retries = 1;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 60000;
  private pingInterval: any = null;
  private connectionTimeout: any = null;
  private failureStartTime: number | null = null;
  private maxFailureDuration = 300000;
  private replacing = false;
  private reconnectTimer: any = null;
  int: any = null;

  private eventEmitter = new EventEmitter();
  public connectionStatus = new BehaviorSubject<string>('disconnected');
  public balanceUpdateSubscription = new BehaviorSubject<number>(0);
  public loginSubscription = new BehaviorSubject<IClientId>(null);
  public aliveSubscription = new BehaviorSubject<IAlive>(null);
  public billProcessSubscription = new BehaviorSubject<IBillProcess>(null);
  public waitingDelivery = new BehaviorSubject<IBillProcess>(null);
  public refreshSubscription = new BehaviorSubject<boolean>(false);
  public wsalertSubscription = new BehaviorSubject<any>(null);

  constructor(
    private cashingService: AppcachingserviceService,
    private IndexedLogDB: IndexerrorService,
  ) {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  reconnect() {
    if (this.webSocket?.readyState === WebSocket.OPEN) return;
    this.connect(this.wsurl, this.machineId, this.otp);
  }

  connect(url: string, machineId: string, otp: string): void {
    this.wsurl = url;
    this.machineId = machineId;
    this.otp = otp;

    if (this.webSocket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.replacing = true;
    this.disconnect();
    this.replacing = false;

    this.connectionStatus.next('connecting');
    this.webSocket = new WebSocket(this.wsurl);
    this.startPing();

    this.connectionTimeout = setTimeout(() => {
      if (this.webSocket?.readyState !== WebSocket.OPEN) {
        console.log('Connection timed out');
        this.webSocket?.close();
        this.IndexedLogDB.addBillProcess({ errorData: 'Connection timed out' });
      }
    }, 30000);

    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.failureStartTime = null;
      this.connectionStatus.next('connected');
      clearTimeout(this.connectionTimeout);
      this.send({
        command: EMACHINE_COMMAND.login,
        data: '',
        ip: '',
        message: '',
        status: -1,
        time: new Date().toString(),
        token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex),
      });
    };

    this.webSocket.onclose = (ev) => {
      console.log('WebSocket closed', ev);
      if (this.replacing) return;
      this.IndexedLogDB.addBillProcess({ errorData: 'WebSocket closed' });
      this.connectionStatus.next('disconnected');
      this.scheduleReconnect();
    };

    this.webSocket.onerror = (ev) => {
      console.error('WebSocket error', ev);
      this.IndexedLogDB.addBillProcess({ errorData: `WebSocket error` });
    };

    this.webSocket.onmessage = async (ev) => {
      try {
        const res = JSON.parse(ev.data) as IResModel;
        if (!res) return;
        console.log('Received message', res);
        switch (res.command) {
          case 'ping':
            this.aliveSubscription.next({
              test: res.data?.test,
              data: res.data,
              balance: Number(res.data?.balance ?? '0'),
              message: res.message ?? undefined,
            } as IAlive);
            break;
          case 'wsalert':
            this.wsalertSubscription.next(res?.data);
            this.eventEmitter.emit('wsalert', res?.data);
            break;
          case 'confirm':
            res.data.transactionID = res.transactionID;
            this.eventEmitter.emit('billProcess', res.data);
            this.billProcessSubscription.next(res.data);
            break;
          case 'waitingt':
            this.waitingDelivery.next(res.data);
            break;
          case 'login':
            this.loginSubscription.next(res.data?.data ?? res.data);
            break;
          case 'CREDIT_NOTE':
            this.balanceUpdateSubscription.next(res.data);
            break;
          case 'refresh':
            this.refreshSubscription.next(res.data);
            break;
          case 'resetCashing':
            await this.resetCashing();
            break;
          case 'setMenus':
            for (const element of res.data?.menu ?? []) {
              this.setMenu(element?.menu, element.status);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('WebSocket message error', error);
      }
    };
  }

  private startPing(): void {
    this.stopPing();
    this.int = setInterval(async () => {
      if (this.webSocket?.readyState !== WebSocket.OPEN) return;
      const allLogs = await this.IndexedLogDB.getAllErrorData();
      this.send({
        command: EMACHINE_COMMAND.ping,
        data: {
          settingVersion: `${new Date().getTime()}`,
          errorLog: allLogs,
          clientVersion: environment.versionId || '0.0.0',
        },
        ip: '',
        message: '',
        status: -1,
        time: new Date().toString(),
        token: cryptojs.SHA256(this.machineId + this.otp).toString(cryptojs.enc.Hex),
      });
    }, 10000);
  }

  private stopPing(): void {
    if (this.int) {
      clearInterval(this.int);
      this.int = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.replacing) return;
    if (this.webSocket?.readyState === WebSocket.OPEN) return;
    clearTimeout(this.reconnectTimer);

    if (!this.failureStartTime) this.failureStartTime = Date.now();
    if (Date.now() - this.failureStartTime >= this.maxFailureDuration) {
      this.failureStartTime = null;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 5000;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.reconnectAttempts = 0;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.wsurl, this.machineId, this.otp);
    }, delay);
  }

  disconnect(): void {
    this.stopPing();
    clearTimeout(this.connectionTimeout);
    this.connectionTimeout = null;
    if (!this.replacing) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.webSocket) {
      this.webSocket.onclose = null;
      this.webSocket.onerror = null;
      try {
        this.webSocket.close();
      } catch {}
      this.webSocket = null;
    }
    this.connectionStatus.next('disconnected');
  }

  send(data: IReqModel | IResModel): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(data));
    }
  }

  setMenu(m: string, status: boolean): void {
    localStorage.setItem('menu-' + m, status ? 'true' : 'false');
  }

  resetCashing(): Promise<string> {
    return new Promise<string>(async (resolve) => {
      try {
        const ownerUuid = localStorage.getItem('machineId');
        if (ownerUuid) await this.cashingService.remove(ownerUuid);
        resolve(IENMessage.success);
      } catch (error: any) {
        resolve(error?.message);
      }
    });
  }

  onBillProcess(cb: (data: any) => void): void {
    if (cb) this.eventEmitter.on('billProcess', cb);
  }

  onWsAlert(cb: (data: any) => void): { unsubscribe: () => void } {
    if (!cb) return { unsubscribe: () => {} };
    this.eventEmitter.on('wsalert', cb);
    return { unsubscribe: () => this.eventEmitter.removeListener('wsalert', cb) };
  }
}