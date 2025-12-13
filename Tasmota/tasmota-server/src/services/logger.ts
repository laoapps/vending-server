// logger.ts
import fs from 'fs/promises';
import path from 'path';

const logDir = path.join('/app', 'logs');  // Important: use /app/logs

// Ensure the logs directory exists
async function ensureLogDir() {
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (err) {
    // Ignore if already exists
  }
}

// Get the current day's log file name (e.g., log-2025-12-13.log)
function getTodayLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `log-${date}.log`);
}

// Write a log message to the current day's file
// You can replace console.log calls with this function, e.g., logToFile('My message');
// For size limits: This implementation does not enforce automatic rotation or deletion on size exceedance.
// If the file grows beyond a desired limit (e.g., 10MB), you can manually delete or archive via the deleteLog function.
// To add a simple size check, see the comment inside.
export async function logToFile(message: string): Promise<void> {
  await ensureLogDir();
  const filePath = getTodayLogFile();
  const timestamp = new Date().toISOString();

  // Optional: Check file size and handle limit (e.g., 10MB = 10 * 1024 * 1024 bytes)
  // try {
  //   const stats = await fs.stat(filePath);
  //   if (stats.size > 10 * 1024 * 1024) {
  //     // Handle limit: e.g., rename to log-YYYY-MM-DD-overflow.log or delete old entries.
  //     // For now, just append; implement as needed.
  //   }
  // } catch {}

  await fs.appendFile(filePath, `${timestamp} - ${message}\n`, 'utf8');
}

// List all log files
export async function listLogs(): Promise<string[]> {
  await ensureLogDir();
  const files = await fs.readdir(logDir);
  return files.filter((f) => f.startsWith('log-') && f.endsWith('.log')).sort().reverse(); // Newest first
}

// Read the content of a specific log file
export async function readLog(fileName: string): Promise<string> {
  const filePath = path.join(logDir, fileName);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Log file not found: ${fileName}`);
  }
}

// Delete a specific log file
export async function deleteLog(fileName: string): Promise<void> {
  const filePath = path.join(logDir, fileName);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    throw new Error(`Log file not found: ${fileName}`);
  }
}