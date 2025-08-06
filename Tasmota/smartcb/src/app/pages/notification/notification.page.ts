import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription;

  constructor(
    private notificationService: NotificationService,

  ) {
    this.subscription = new Subscription();
  }

  async ngOnInit() {
    // const { userUuid, token } = await this.authService.getUserCredentials();
    // if (userUuid && token) {
    //   await this.notificationService.connect(userUuid, token);
    //   this.subscription.add(
    //     this.notificationService.getNotifications().subscribe((notifications) => {
    //       this.notifications = notifications;
    //     })
    //   );
    // } else {
    //   console.error('User credentials not found');
    // }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.notificationService.disconnect();
  }

  clearNotifications() {
    this.notificationService.clearNotifications();
  }
}