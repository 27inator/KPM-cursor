import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

interface WebSocketClient {
  ws: WebSocket;
  userId?: number;
  companyId?: string;
  subscriptions: Set<string>;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, WebSocketClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      const client: WebSocketClient = {
        ws,
        subscriptions: new Set(),
      };
      
      this.clients.set(ws, client);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(client, {
        type: 'info',
        title: 'Connected',
        message: 'Real-time notifications enabled',
      });
    });
  }

  private handleMessage(client: WebSocketClient, message: any) {
    switch (message.type) {
      case 'authenticate':
        if (message.userId) {
          client.userId = message.userId;
        }
        if (message.companyId) {
          client.companyId = message.companyId;
        }
        break;
      
      case 'subscribe':
        if (message.channel) {
          client.subscriptions.add(message.channel);
        }
        break;
      
      case 'unsubscribe':
        if (message.channel) {
          client.subscriptions.delete(message.channel);
        }
        break;
    }
  }

  private sendToClient(client: WebSocketClient, notification: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(notification));
    }
  }

  // Broadcast to all connected clients
  public broadcast(notification: any) {
    this.clients.forEach((client) => {
      this.sendToClient(client, notification);
    });
  }

  // Send to specific user
  public sendToUser(userId: number, notification: any) {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client, notification);
      }
    });
  }

  // Send to specific company
  public sendToCompany(companyId: string, notification: any) {
    this.clients.forEach((client) => {
      if (client.companyId === companyId) {
        this.sendToClient(client, notification);
      }
    });
  }

  // Send to subscribers of a specific channel
  public sendToChannel(channel: string, notification: any) {
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(client, notification);
      }
    });
  }
}

// Global notification service
export class NotificationService {
  private wsServer: NotificationWebSocketServer | null = null;

  public initialize(server: Server) {
    this.wsServer = new NotificationWebSocketServer(server);
  }

  public async createNotification(notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    userId?: number;
    companyId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      // Save to database
      const savedNotification = await storage.createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        userId: notification.userId,
        companyId: notification.companyId,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : undefined,
        read: false,
      });

      // Send real-time notification via WebSocket
      if (this.wsServer) {
        const wsNotification = {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          id: savedNotification.id,
        };

        if (notification.userId) {
          this.wsServer.sendToUser(notification.userId, wsNotification);
        } else if (notification.companyId) {
          this.wsServer.sendToCompany(notification.companyId, wsNotification);
        } else {
          this.wsServer.broadcast(wsNotification);
        }
      }

      return savedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  public async sendSystemAlert(alert: {
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    await this.createNotification({
      type: alert.type,
      title: alert.title,
      message: alert.message,
    });

    // Also create system alert in database
    await storage.createSystemAlert({
      alertType: alert.type,
      message: alert.message,
      severity: alert.severity,
      acknowledged: false,
    });
  }

  public async sendCompanyNotification(companyId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    await this.createNotification({
      ...notification,
      companyId,
    });
  }

  public async sendEventNotification(eventType: string, companyId: string, eventData: any) {
    const notification = {
      type: 'success' as const,
      title: 'New Event Processed',
      message: `${eventType} event successfully committed to blockchain`,
      companyId,
      actionUrl: `/company-portal?tab=events`,
      metadata: {
        eventType,
        tagId: eventData.tagId,
        txid: eventData.txid,
      },
    };

    await this.createNotification(notification);
  }

  public async sendLowBalanceAlert(companyId: string, balance: number, threshold: number) {
    await this.createNotification({
      type: 'warning',
      title: 'Low Wallet Balance',
      message: `Your wallet balance (${balance.toFixed(8)} KAS) is below the threshold (${threshold.toFixed(8)} KAS)`,
      companyId,
      actionUrl: `/company-portal?tab=overview`,
    });
  }

  public async sendPolicyUpdateNotification(companyId: string, updatedBy: string, changes: string[]) {
    await this.createNotification({
      type: 'info',
      title: 'Policy Updated',
      message: `Company policy has been updated by ${updatedBy}. Changes: ${changes.join(', ')}`,
      companyId,
      actionUrl: `/company-portal?tab=policy`,
    });
  }

  public async sendTransactionFailureNotification(companyId: string, error: string, eventData?: any) {
    await this.createNotification({
      type: 'error',
      title: 'Transaction Failed',
      message: `Failed to commit event to blockchain. ${error}`,
      companyId,
      actionUrl: `/company-portal?tab=events`,
      metadata: eventData ? {
        eventType: eventData.eventType,
        tagId: eventData.tagId,
        error: error,
      } : undefined,
    });
  }
}

export const notificationService = new NotificationService();