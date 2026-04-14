import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-numpad-modal',
  templateUrl: './numpad-modal.component.html',
  styleUrls: ['./numpad-modal.component.scss'],
})
export class NumpadModalComponent implements OnInit {
  @Input() title = 'Enter wallet ID';
  @Input() subtitle = 'Enter your 8-digit LaabX wallet number';
  @Input() length = 8;
  @Input() hideByDefault = true;   // New: control if it starts hidden

  value = '';
  keys = ['1','2','3','4','5','6','7','8','9','cancel','0','backspace'];

  showPassword = false;           // Controls whether digits are visible
  private holdTimeout: any;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.showPassword = !this.hideByDefault;
  }

  get digits(): string[] {
    return Array.from({ length: this.length }, (_, i) => this.value[i] ?? '');
  }

  get isComplete(): boolean {
    return this.value.length === this.length;
  }

  // New: Check if we should show actual digit or dot
  getDisplayChar(digit: string, index: number): string {
    if (!digit) return '';
    return this.showPassword ? digit : '●';
  }

  onKey(key: string) {
    if (key === 'cancel') {
      this.modalCtrl.dismiss(null, 'cancel');
    } else if (key === 'backspace') {
      this.value = this.value.slice(0, -1);
    } else if (this.value.length < this.length) {
      this.value += key;
    }
  }

  confirm() {
    if (this.isComplete) {
      this.modalCtrl.dismiss(this.value, 'confirm');
    }
  }

  // === Hold to show password ===
  onEyeMouseDown() {
    this.holdTimeout = setTimeout(() => {
      this.showPassword = true;
    }, 150); // 150ms hold to activate (feels responsive)
  }

  onEyeMouseUp() {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
    }
    // Auto-hide again after a short delay when user releases
    if (this.showPassword) {
      setTimeout(() => {
        this.showPassword = false;
      }, 800); // Show for ~800ms after release
    }
  }

  // For touch devices (better support)
  onEyeTouchStart() {
    this.onEyeMouseDown();
  }

  onEyeTouchEnd() {
    this.onEyeMouseUp();
  }
}