import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private dbName = 'myDatabase';

  constructor() {
    this.initializeDatabase();
  }

  // Initialize the database and create the table
  private async initializeDatabase() {
    try {
      this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1,false);
      await this.db.open();

      // Create the items table with id as auto-incrementing primary key
      const createTable = `
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          data TEXT NOT NULL,  -- JSON content stored as text
          transactionID TEXT,
          description TEXT
        );
      `;
      await this.db.execute(createTable);
      console.log('Database initialized');
    } catch (e) {
      console.error('Error initializing database:', e);
    }
  }

  // Create a new item (no need to provide id)
  async createItem(name: string, data: object,transactionID:string, description: string): Promise<number> {
    try {
      const jsonData = JSON.stringify(data); // Convert object to JSON string
      const query = `INSERT INTO items (name, data,transactionID, description) VALUES (?, ?, ?);`;
      const result = await this.db!.run(query, [name, jsonData, description]);
      return result.changes?.lastId || -1; // Return the auto-generated ID
    } catch (e) {
      console.error('Error creating item:', e);
      return -1;
    }
  }

  // Read all items
  async getItems(): Promise<any[]> {
    try {
      const query = `SELECT * FROM items;`;
      const result = await this.db!.query(query);
      return (result.values || []).map(item => ({
        id: item.id,
        name: item.name,
        data: JSON.parse(item.data), // Parse JSON back to object
        transactionID: item.transactionID,
        description: item.description,
      }));
    } catch (e) {
      console.error('Error reading items:', e);
      return [];
    }
  }

  // Read a single item by ID
  async getItemById(id: number): Promise<any> {
    try {
      const query = `SELECT * FROM items WHERE id = ?;`;
      const result = await this.db!.query(query, [id]);
      if (result.values && result.values.length > 0) {
        const item = result.values[0];
        return {
          id: item.id,
          name: item.name,
          data: JSON.parse(item.data), // Parse JSON back to object
          transactionID: item.transactionID,
          description: item.description,
        };
      }
      return null;
    } catch (e) {
      console.error('Error reading item:', e);
      return null;
    }
  }

  // Update an item by ID
  async updateItem(id: number, name: string, data: object,transactionID, description: string): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(data); // Convert object to JSON string
      const query = `UPDATE items SET name = ?, data = ?,transactionID = ?, description = ? WHERE id = ?;`;
      const result = await this.db!.run(query, [name, jsonData,transactionID, description, id]);
      return result.changes?.changes! > 0;
    } catch (e) {
      console.error('Error updating item:', e);
      return false;
    }
  }

  // Delete an item by ID
  async deleteItem(id: number): Promise<boolean> {
    try {
      const query = `DELETE FROM items WHERE id = ?;`;
      const result = await this.db!.run(query, [id]);
      return result.changes?.changes! > 0;
    } catch (e) {
      console.error('Error deleting item:', e);
      return false;
    }
  }

  // Close the database (optional)
  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.dbName,false);
      this.db = null;
      console.log('Database closed');
    }
  }
}