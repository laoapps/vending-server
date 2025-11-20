

import PQueue from 'p-queue';
import { App } from '@capacitor/app';

const queue = new PQueue({
  concurrency: 1,         // gentle on battery + mobile networks
  interval: 100,
  intervalCap: 8,
  autoStart: true,
});

// Very important on mobile: pause queue when app goes to background
App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    queue.start();
  } else {
    queue.pause();
  }
});

export const apiQueue = queue;


