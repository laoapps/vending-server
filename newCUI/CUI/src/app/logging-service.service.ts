import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private indexFileName = 'log_index.json'; // File to store the list of log files

  constructor() {
    // this.initializeLogging();
  }

  // Initialize the index file if it doesn’t exist
   async initializeLogging() {
    try {
      await Filesystem.stat({
        path: this.indexFileName,
        directory: Directory.Documents,
      });
    } catch (e) {
      // Index doesn’t exist, create it
      await Filesystem.writeFile({
        path: this.indexFileName,
        data: JSON.stringify([]), // Empty array to start
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
  }

  // Get the current index of log files
  private async getIndex(): Promise<string[]> {
    try {
      const result = await Filesystem.readFile({
        path: this.indexFileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return new Promise((resolve, reject) => {
        resolve(JSON.parse(result.data+'' || '[]'));
      });
    } catch (e) {
      console.error('Error reading index:', e);
      return new Promise((resolve, reject) => {
        reject('Error reading index');
      }
      );
    }
  }

  // Update the index with a new filename
  private async updateIndex(newFileName: string) {
    const index = await this.getIndex();
    if (!index.includes(newFileName)) {
      index.push(newFileName);
      await Filesystem.writeFile({
        path: this.indexFileName,
        data: JSON.stringify(index),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
  }

  // Remove a filename from the index
  private async removeFromIndex(fileName: string) {
    const index = await this.getIndex();
    const updatedIndex = index.filter((name) => name !== fileName);
    await Filesystem.writeFile({
      path: this.indexFileName,
      data: JSON.stringify(updatedIndex),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  }

  // Write a log to a specified file
  async writeLog(fileName: string, message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
  
    try {
      // Check if file exists, if not create it
      try {
        await Filesystem.stat({
          path: fileName,
          directory: Directory.Documents,
        });
      } catch (e) {
        await Filesystem.writeFile({
          path: fileName,
          data: '',
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        await this.updateIndex(fileName); // Add to index
      }
  
      // Append the log entry
      await Filesystem.appendFile({
        path: fileName,
        data: logEntry,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      console.log(`Wrote to ${fileName}:`, logEntry.trim());
    } catch (e) {
      console.error('Error writing log:', e);
    }
  }

  // Read the contents of a specified log file
  async readLog(fileName: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      // return result.data+'' || 'No content in this log file';
      return new Promise((resolve, reject) => {
        resolve(result.data+'' || 'No content in this log file');
      });

    } catch (e) {
      console.error(`Error reading ${fileName}:`, e);
      // return `Error reading ${fileName}`;
      return new Promise((resolve, reject) => {
        reject(`Error reading ${fileName}`);
      });
    }
  }

  // Delete a specified log file
  async deleteLog(fileName: string) {
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Documents,
      });
      await this.removeFromIndex(fileName); // Remove from index
      console.log(`Deleted ${fileName}`);
    } catch (e) {
      console.error(`Error deleting ${fileName}:`, e);
    }
  }

  // Get all log filenames from the index
  async getLogFiles(): Promise<string[]> {
    return this.getIndex();
  }
}