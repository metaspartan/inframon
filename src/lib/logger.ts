import fs from 'fs';
import path from 'path';
import { format } from 'util';

class Logger {
  private logFile: fs.WriteStream;
  private errorFile: fs.WriteStream;

  constructor() {
    const logDir = process.cwd();
    this.logFile = fs.createWriteStream(path.join(logDir, 'inframon.out.log'), { flags: 'a' });
    this.errorFile = fs.createWriteStream(path.join(logDir, 'inframon.err.log'), { flags: 'a' });

    // Capture console.log
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = format(...args);
      this.logFile.write(`${new Date().toISOString()} - ${message}\n`);
      originalConsoleLog.apply(console, args);
    };

    // Capture console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = format(...args);
      this.errorFile.write(`${new Date().toISOString()} - ${message}\n`);
      originalConsoleError.apply(console, args);
    };

    // Handle process exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private cleanup() {
    this.logFile.end();
    this.errorFile.end();
  }
}

export const logger = new Logger();