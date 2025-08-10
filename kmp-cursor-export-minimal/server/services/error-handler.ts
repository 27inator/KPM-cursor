import { storage } from "../storage";
import { notificationService } from "../websocket";

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export enum ErrorType {
  BLOCKCHAIN_TRANSACTION = "blockchain_transaction",
  DATABASE_OPERATION = "database_operation",
  EXTERNAL_API = "external_api",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  RATE_LIMIT = "rate_limit",
  TIMEOUT = "timeout",
  NETWORK = "network"
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface ErrorContext {
  type: ErrorType;
  severity: ErrorSeverity;
  companyId?: string;
  userId?: string;
  eventId?: string;
  tagId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export interface FailedOperation {
  id: string;
  operation: string;
  payload: any;
  context: ErrorContext;
  attempts: number;
  lastError: string;
  nextRetryAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Circuit Breaker implementation
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures: number = 0;
  private lastFailureTime: Date = new Date();
  private successCount: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>, context: ErrorContext): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime.getTime() > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  private static instance: RetryManager;
  private failedOperations: Map<string, FailedOperation> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startRetryProcessor();
  }

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  private getCircuitBreaker(operation: string): CircuitBreaker {
    if (!this.circuitBreakers.has(operation)) {
      this.circuitBreakers.set(operation, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringWindow: 300000 // 5 minutes
      }));
    }
    return this.circuitBreakers.get(operation)!;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: ErrorContext,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'RATE_LIMIT'],
      ...options
    };

    const circuitBreaker = this.getCircuitBreaker(operationName);
    
    return await circuitBreaker.execute(async () => {
      return await this.attemptOperation(operation, operationName, context, retryOptions);
    }, context);
  }

  private async attemptOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: ErrorContext,
    options: RetryOptions,
    attempt: number = 1
  ): Promise<T> {
    try {
      const result = await operation();
      
      // Operation succeeded, remove from failed operations if it was there
      const operationId = this.generateOperationId(operationName, context);
      this.failedOperations.delete(operationId);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if error is retryable
      const isRetryable = this.isRetryableError(errorMessage, options.retryableErrors);
      
      if (attempt <= options.maxRetries && isRetryable) {
        const delay = Math.min(
          options.baseDelay * Math.pow(options.backoffFactor, attempt - 1),
          options.maxDelay
        );
        
        await this.delay(delay);
        return await this.attemptOperation(operation, operationName, context, options, attempt + 1);
      }
      
      // Operation failed after all retries, add to dead letter queue
      await this.addToDeadLetterQueue(operationName, context, error, attempt);
      throw error;
    }
  }

  private async addToDeadLetterQueue(
    operationName: string,
    context: ErrorContext,
    error: any,
    attempts: number
  ): Promise<void> {
    const operationId = this.generateOperationId(operationName, context);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const failedOperation: FailedOperation = {
      id: operationId,
      operation: operationName,
      payload: context.metadata || {},
      context,
      attempts,
      lastError: errorMessage,
      nextRetryAt: new Date(Date.now() + 300000), // Retry in 5 minutes
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.failedOperations.set(operationId, failedOperation);
    
    // Log error to database
    await this.logError(operationName, context, errorMessage, attempts);
    
    // Send notification for critical errors
    if (context.severity === ErrorSeverity.CRITICAL) {
      await this.notifyCriticalError(operationName, context, errorMessage);
    }
  }

  private async logError(
    operationName: string,
    context: ErrorContext,
    errorMessage: string,
    attempts: number
  ): Promise<void> {
    try {
      await storage.createSystemAlert({
        alertType: 'error',
        message: `Operation failed after ${attempts} attempts: ${errorMessage}`,
        severity: context.severity,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  }

  private async notifyCriticalError(
    operationName: string,
    context: ErrorContext,
    errorMessage: string
  ): Promise<void> {
    try {
      await notificationService.sendSystemAlert({
        type: 'error',
        title: `CRITICAL: ${operationName} Failed`,
        message: errorMessage,
        severity: 'critical'
      });
    } catch (notifyError) {
      console.error('Failed to send critical error notification:', notifyError);
    }
  }

  private startRetryProcessor(): void {
    this.retryTimer = setInterval(async () => {
      await this.processFailedOperations();
    }, 60000); // Check every minute
  }

  private async processFailedOperations(): Promise<void> {
    const now = new Date();
    
    for (const [operationId, failedOp] of this.failedOperations) {
      if (now >= failedOp.nextRetryAt) {
        try {
          // Attempt to retry the operation
          await this.retryFailedOperation(failedOp);
        } catch (error) {
          // Update retry time for next attempt
          failedOp.nextRetryAt = new Date(now.getTime() + 600000); // Retry in 10 minutes
          failedOp.updatedAt = now;
          failedOp.attempts++;
          
          // Remove from DLQ after too many attempts
          if (failedOp.attempts > 10) {
            this.failedOperations.delete(operationId);
            await this.logError(
              failedOp.operation,
              failedOp.context,
              `Operation permanently failed after ${failedOp.attempts} attempts`,
              failedOp.attempts
            );
          }
        }
      }
    }
  }

  private async retryFailedOperation(failedOp: FailedOperation): Promise<void> {
    // This is a placeholder - specific operations would need to be implemented
    // based on the operation type and context
    console.log(`Retrying operation: ${failedOp.operation}`, failedOp.context);
    
    // For now, just remove from failed operations
    this.failedOperations.delete(failedOp.id);
  }

  private generateOperationId(operationName: string, context: ErrorContext): string {
    const contextStr = JSON.stringify({
      type: context.type,
      companyId: context.companyId,
      userId: context.userId,
      eventId: context.eventId,
      tagId: context.tagId
    });
    return `${operationName}_${Buffer.from(contextStr).toString('base64')}`;
  }

  private isRetryableError(errorMessage: string, retryableErrors: string[]): boolean {
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get statistics about failed operations
  getFailedOperationsStats(): {
    totalFailed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    circuitBreakerStates: Record<string, string>;
  } {
    const stats = {
      totalFailed: this.failedOperations.size,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      circuitBreakerStates: {} as Record<string, string>
    };

    for (const failedOp of this.failedOperations.values()) {
      stats.byType[failedOp.context.type] = (stats.byType[failedOp.context.type] || 0) + 1;
      stats.bySeverity[failedOp.context.severity] = (stats.bySeverity[failedOp.context.severity] || 0) + 1;
    }

    for (const [operation, circuitBreaker] of this.circuitBreakers) {
      stats.circuitBreakerStates[operation] = circuitBreaker.getState();
    }

    return stats;
  }

  // Get failed operations for admin dashboard
  getFailedOperations(): FailedOperation[] {
    return Array.from(this.failedOperations.values());
  }
}

// Enhanced error handling wrapper
export class ErrorHandler {
  private static retryManager = RetryManager.getInstance();

  static async handleBlockchainTransaction<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'type' | 'severity'>
  ): Promise<T> {
    return await this.retryManager.executeWithRetry(
      operation,
      'blockchain_transaction',
      {
        ...context,
        type: ErrorType.BLOCKCHAIN_TRANSACTION,
        severity: ErrorSeverity.HIGH
      },
      {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'INSUFFICIENT_FUNDS']
      }
    );
  }

  static async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'type' | 'severity'>
  ): Promise<T> {
    return await this.retryManager.executeWithRetry(
      operation,
      'database_operation',
      {
        ...context,
        type: ErrorType.DATABASE_OPERATION,
        severity: ErrorSeverity.MEDIUM
      },
      {
        maxRetries: 3,
        baseDelay: 500,
        maxDelay: 5000,
        retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'LOCK_WAIT_TIMEOUT']
      }
    );
  }

  static async handleExternalAPI<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'type' | 'severity'>
  ): Promise<T> {
    return await this.retryManager.executeWithRetry(
      operation,
      'external_api',
      {
        ...context,
        type: ErrorType.EXTERNAL_API,
        severity: ErrorSeverity.MEDIUM
      },
      {
        maxRetries: 4,
        baseDelay: 1000,
        maxDelay: 30000,
        retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'RATE_LIMIT', '502', '503', '504']
      }
    );
  }

  static getStats() {
    return this.retryManager.getFailedOperationsStats();
  }

  static getFailedOperations() {
    return this.retryManager.getFailedOperations();
  }
}