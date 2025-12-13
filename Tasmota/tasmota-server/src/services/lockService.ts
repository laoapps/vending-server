// src/services/lockService.ts
import axios from 'axios';

const LOCK_SERVER_BASE_URL = process.env.LOCK_SERVER_URL || 'http://lock-server:3000/api'; // Adjust to your lock server

export async function activateLock(lockId: string | number): Promise<void> {
  try {
    return;
    await axios.post(`${LOCK_SERVER_BASE_URL}/locks/${lockId}/activate`, {
      // Add any required payload, e.g., duration, booking info, etc.
      action: 'unlock',
      // duration_minutes: 30, // optional: if lock auto-locks after time
    });
    console.log(`Lock ${lockId} activated successfully`);
  } catch (error: any) {
    console.error(`Failed to activate lock ${lockId}:`, error.response?.data || error.message);
    // Do NOT throw — we don't want to fail the payment if lock temporarily unreachable
    // You might want to queue this for retry later
  }
}

export async function deactivateLock(lockId: string | number): Promise<void> {
  try {
    return;
    await axios.post(`${LOCK_SERVER_BASE_URL}/locks/${lockId}/deactivate`, {
      action: 'lock',
    });
    console.log(`Lock ${lockId} deactivated`);
  } catch (error: any) {
    console.error(`Failed to deactivate lock ${lockId}:`, error.response?.data || error.message);
  }
}