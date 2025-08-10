export class Logger {
  private component: string;

  constructor(component: string = 'ERP-Integration') {
    this.component = component;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${this.component}] ${level.toUpperCase()}: ${message}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message), meta || '');
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('error', message), error || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message), meta || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.DEBUG) {
      console.debug(this.formatMessage('debug', message), meta || '');
    }
  }
} 