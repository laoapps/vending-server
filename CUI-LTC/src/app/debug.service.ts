import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, ISerialService, IResModel } from './services/syste.model';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  private messages = new BehaviorSubject<string[]>([]);
  private isVisible = new BehaviorSubject<boolean>(false);
  log: IlogSerial = { data: '', limit: 50 };
  messages$ = this.messages.asObservable();
  isVisible$ = this.isVisible.asObservable();

  showDebugPopup() {
    this.isVisible.next(true);
  }

  hideDebugPopup() {
    this.isVisible.next(false);
  }

  addDebugMessage(message: string) {
    const currentMessages = this.messages.getValue();
    this.messages.next([...currentMessages, message]);
    addLogMessage(this.log, message, 'DebugService'); // Assuming addLogMessage is a utility function to log messages
  }

  clearDebugMessages() {
    this.messages.next([]);
  }
}