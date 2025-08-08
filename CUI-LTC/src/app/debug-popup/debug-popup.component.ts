import { Component, OnInit } from '@angular/core';
import { DebugService } from '../debug.service';

@Component({
  selector: 'app-debug-popup',
  templateUrl: './debug-popup.component.html',
  styleUrls: ['./debug-popup.component.scss'],
})
export class DebugPopupComponent implements OnInit {
  isVisible = false;
  position = { x: 20, y: 20 };
  debugMessages: string[] = [];
  private isDragging = false;
  private currentPos = { x: 0, y: 0 };

  constructor(private debugService: DebugService) {}

  ngOnInit() {
    // Subscribe to debug service for messages and visibility
    this.debugService.messages$.subscribe(messages => {
      this.debugMessages = messages;
    });
    this.debugService.isVisible$.subscribe(visible => {
      this.isVisible = visible;
    });
  }

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.currentPos = { x: clientX - this.position.x, y: clientY - this.position.y };

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      if (this.isDragging) {
        const x = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const y = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        this.position = {
          x: x - this.currentPos.x,
          y: y - this.currentPos.y,
        };
      }
    };

    const stopHandler = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', stopHandler);
      document.removeEventListener('touchend', stopHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', stopHandler);
    document.addEventListener('touchend', stopHandler);
  }

  closePopup() {
    this.debugService.hideDebugPopup();
  }
}