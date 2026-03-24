// src/app/services/blockchain-db.service.ts
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';  // Add this for local storage
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
  capSQLiteChanges,
} from '@capacitor-community/sqlite';
import { BehaviorSubject } from 'rxjs';
import CryptoJS from 'crypto-js';  // For hashing/TOTP if needed (from your package)

@Injectable({
  providedIn: 'root',
})
export class BlockchainDbService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbReady$ = new BehaviorSubject<boolean>(false);


  private  DB_NAME = 'vending_blockchain';
  private readonly DB_VERSION = 1;

  // Assume your server API endpoint (replace with actual)

  constructor(private platform: Platform) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }



  async initialize(machineId: string): Promise<void> {
    this.DB_NAME+= `_${machineId}`;  // Make DB name unique per machine
    if (this.dbReady$.value) return;

    try {
      await this.platform.ready();

      // Correct check: does the DB file exist?
      const existsResult = await this.sqlite.isDatabase(this.DB_NAME);
      const dbExists = existsResult.result ?? false;

      // Recommended object-style createConnection (safer in v7+)
      this.db = await this.sqlite.createConnection(
         this.DB_NAME,
         false,
        'no-encryption',
        this.DB_VERSION,
         false,
      );

      await this.db.open();

      if (!dbExists) {
        await this.createTables();
      }
      // else → future: check version and run migrations if DB_VERSION increased

      console.log(`SQLite DB "${this.DB_NAME}" ready`);
      this.dbReady$.next(true);
    } catch (err) {
      console.error('SQLite init failed:', err);
      throw err;
    }
  }

  get isReady(): boolean {
    return this.dbReady$.value;
  }

  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    await new Promise<void>((resolve) => {
      const sub = this.dbReady$.subscribe((ready) => {
        if (ready) {
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');

    const createTable = `
      CREATE TABLE IF NOT EXISTS blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        block_index INTEGER NOT NULL,
        prev_hash TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        signature TEXT,
        is_reset INTEGER DEFAULT 0,
        server_synced INTEGER DEFAULT 0,
        needs_sync INTEGER DEFAULT 1,  -- New: flag for whether to submit to server (1=yes, 0=local-only)
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_hash ON blocks (hash);
      CREATE INDEX IF NOT EXISTS idx_machine_timestamp ON blocks (machine_id, timestamp);
    `;

    await this.db.execute(createTable);
  }
  /**
 * Calculate current "balance" from logged insertions/resets (local only)
 * Assumes data.amount is in LAK or your unit; adjust logic as needed
 */
/**
 * Calculate current "balance" from logged insertions/resets (local only)
 * Assumes data is a JSON string with { type: 'insert'|'reset'|'withdrawal', amount: number }
 */
async getLocalBalance(machineId: string): Promise<number> {
  await this.waitForReady();
  if (!this.db) return 0;

  const query = `
    SELECT COALESCE(SUM(
      CASE 
        WHEN json_extract(data, '$.type') = 'insert' THEN json_extract(data, '$.amount')
        WHEN json_extract(data, '$.type') IN ('reset', 'withdrawal') THEN -json_extract(data, '$.amount')
        ELSE 0
      END
    ), 0) as balance
    FROM blocks
    WHERE machine_id = ?
  `;

  const res = await this.db.query(query, [machineId]);

  // Safeguard: SQLite returns string or number depending on platform
  const balance = Number(res.values?.[0]?.balance ?? 0);

  console.log(`Local balance for ${machineId}: ${balance}`);

  return balance;
}

  /**
   * Add a new block (insertion or reset)
   * - Includes machineId (required)
   * - Generates TOTP on-the-fly if needed (assuming TOTP secret is stored in local storage)
   * - Optional needsSync: false for local-only blocks (no server submit)
   */
  async addBlock(blockData: {
    machineId: string;
    prevHash: string;
    hash: string;
    data: any;
    isReset?: boolean;
    signature?: string;
    needsSync?: boolean;  // New: default true (submit to server)
  }): Promise<capSQLiteChanges> {
    await this.waitForReady();
    if (!this.db) throw new Error('DB not open');

    // Load machineId and TOTP from local storage (assume they exist as per req)
    const storedMachineId = localStorage.getItem('machineId')||'11111111';
    const totp = localStorage.getItem('otp')||'111111';  // Assume TOTP is generated from stored secret

    if (!storedMachineId || !totp) {
      throw new Error('machineId or TOTP secret not found in local storage');
    }

    // Include machineId (override if provided) and TOTP in data
    const enhancedData = {
      ...blockData.data,
      machineId: blockData.machineId || storedMachineId,
      totp,  // Add TOTP to data for verification
    };

    const dataJson = JSON.stringify(enhancedData);
    const nextIndex = await this.getNextBlockIndex(blockData.machineId);

    const statement = `
      INSERT INTO blocks (
        machine_id, block_index, prev_hash, hash, data, signature, is_reset, server_synced, needs_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `;

    const values = [
      blockData.machineId,
      nextIndex,
      blockData.prevHash,
      blockData.hash,
      dataJson,
      blockData.signature ?? null,
      blockData.isReset ? 1 : 0,
      blockData.needsSync !== false ? 1 : 0,  // Default to submit
    ];

    const result = await this.db.run(statement, values);

    if (result.changes?.changes !== 1) {
      throw new Error(
        `Insert failed: affected rows = ${result.changes?.values?.toString() ?? 'unknown'}` +
        (result.changes?.lastId ? ` - ${result.changes.values?.toString()}` : '')
      );
    }

    return result;
  }

  // Example TOTP generation (simplified; use a proper lib like speakeasy if added later)
  private generateTOTP(secret: string): string {
    const time = Math.floor(Date.now() / 30000);  // 30s window
    return CryptoJS.HmacSHA1(time.toString(), secret).toString(CryptoJS.enc.Hex).slice(0, 6);
  }

  private async getNextBlockIndex(machineId: string): Promise<number> {
    await this.waitForReady();
    const res = await this.db!.query(
      'SELECT COALESCE(MAX(block_index), 0) + 1 as next FROM blocks WHERE machine_id = ?',
      [machineId]
    );
    return (res.values?.[0]?.next as number) ?? 1;
  }

  async getLatestBlock(machineId: string): Promise<any | null> {
    await this.waitForReady();
    if (!this.db) return null;

    const res = await this.db.query(
      `SELECT * FROM blocks
       WHERE machine_id = ?
       ORDER BY block_index DESC LIMIT 1`,
      [machineId]
    );

    if (!res.values?.length) return null;

    const row = res.values[0];
    row.data = JSON.parse(row.data as string);
    return row;
  }

  async getUnsyncedBlocks(machineId: string, limit = 100): Promise<any[]> {
    await this.waitForReady();
    if (!this.db) return [];

    const res = await this.db.query(
      `SELECT * FROM blocks
       WHERE machine_id = ? AND server_synced = 0 AND needs_sync = 1
       ORDER BY block_index ASC LIMIT ?`,
      [machineId, limit]
    );

    return (res.values || []).map((row: any) => {
      row.data = JSON.parse(row.data as string);
      return row;
    });
  }

  async markAsSynced(blockIds: number[]): Promise<void> {
    if (!blockIds.length) return;
    await this.waitForReady();
    if (!this.db) return;

    const placeholders = blockIds.map(() => '?').join(',');
    const statement = `UPDATE blocks SET server_synced = 1 WHERE id IN (${placeholders})`;

    const result = await this.db.run(statement, blockIds);

    console.log(`Marked ${result.changes ?? 0} blocks as synced`);
  }

  /**
   * Sync unsynced blocks to server (submits chain for verification/top-up/e-wallet transfer)
   * - Only for blocks with needs_sync=1
   * - On success, marks as synced
   */
  async getUnsync(machineId: string): Promise<any[]> {
    const unsynced = await this.getUnsyncedBlocks(machineId);
    if (!unsynced.length) return [];
    return unsynced;

  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.DB_NAME,false);
      this.db = null;
      this.dbReady$.next(false);
    }
  }

  // Future methods: verifyChainIntegrity(), resetChain(), etc.
}