/**
 * 🔄 WEBSOCKET SERVICE
 * Real-time updates for transaction confirmations, events, and dashboard data
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

// 📡 WebSocket Event Types
export interface TransactionConfirmationEvent {
  type: 'transaction_confirmed' | 'transaction_failed' | 'transaction_pending';
  transactionHash: string;
  companyId: number;
  eventId?: number;
  blockHeight?: number;
  confirmationCount: number;
  timestamp: string;
}

export interface SupplyChainEventNotification {
  type: 'supply_chain_event_created';
  eventId: number;
  productId: string;
  eventType: string;
  companyId: number;
  timestamp: string;
}

export interface DashboardUpdateEvent {
  type: 'dashboard_update';
  companyId: number;
  stats: any;
  timestamp: string;
}

// 🔐 WebSocket Authentication
interface AuthenticatedSocket {
  userId: number;
  email: string;
  companyIds: number[];
  role: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private authenticatedSockets = new Map<string, AuthenticatedSocket>();

  /**
   * 🚀 Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // In production, restrict this to your frontend domains
        methods: ["GET", "POST"]
      }
    });

    // 🔐 Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT (using same secret as auth service)
        const JWT_SECRET = process.env.JWT_SECRET || 'kmp-supply-chain-dev-secret-change-in-production';
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Store authentication info
        this.authenticatedSockets.set(socket.id, {
          userId: decoded.userId,
          email: decoded.email,
          companyIds: decoded.companies?.map((c: any) => c.id) || [],
          role: decoded.role
        });

        console.log(`🔗 [WebSocket] User ${decoded.email} connected (${socket.id})`);
        next();
      } catch (error) {
        console.error('❌ [WebSocket] Authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // 📡 Connection handling
    this.io.on('connection', (socket) => {
      const auth = this.authenticatedSockets.get(socket.id);
      
      if (auth) {
        // Join company-specific rooms for targeted notifications
        auth.companyIds.forEach(companyId => {
          socket.join(`company_${companyId}`);
          console.log(`🏢 [WebSocket] ${auth.email} joined company room: ${companyId}`);
        });

        // Send welcome message
        socket.emit('connected', {
          message: 'WebSocket connected successfully',
          userId: auth.userId,
          companies: auth.companyIds,
          timestamp: new Date().toISOString()
        });
      }

      // 🔌 Disconnection handling
      socket.on('disconnect', () => {
        const auth = this.authenticatedSockets.get(socket.id);
        if (auth) {
          console.log(`🔌 [WebSocket] User ${auth.email} disconnected (${socket.id})`);
          this.authenticatedSockets.delete(socket.id);
        }
      });

      // 📊 Real-time dashboard subscription
      socket.on('subscribe_dashboard', (data) => {
        const auth = this.authenticatedSockets.get(socket.id);
        if (auth && data.companyId && auth.companyIds.includes(data.companyId)) {
          socket.join(`dashboard_${data.companyId}`);
          console.log(`📊 [WebSocket] ${auth.email} subscribed to dashboard: ${data.companyId}`);
        }
      });

      // 🔍 Transaction status subscription
      socket.on('subscribe_transaction', (data) => {
        const auth = this.authenticatedSockets.get(socket.id);
        if (auth && data.transactionHash) {
          socket.join(`transaction_${data.transactionHash}`);
          console.log(`🔍 [WebSocket] ${auth.email} subscribed to transaction: ${data.transactionHash}`);
        }
      });
    });

    console.log('✅ [WebSocket] Service initialized with authentication');
  }

  /**
   * 🎉 Emit transaction confirmation event
   */
  emitTransactionConfirmation(event: TransactionConfirmationEvent): void {
    if (!this.io) return;

    // Emit to company-specific room
    this.io.to(`company_${event.companyId}`).emit('transaction_update', event);
    
    // Emit to transaction-specific subscribers
    this.io.to(`transaction_${event.transactionHash}`).emit('transaction_confirmation', event);

    console.log(`📡 [WebSocket] Emitted ${event.type} for transaction ${event.transactionHash} to company ${event.companyId}`);
  }

  /**
   * 📦 Emit supply chain event notification
   */
  emitSupplyChainEvent(event: SupplyChainEventNotification): void {
    if (!this.io) return;

    // Emit to company-specific room
    this.io.to(`company_${event.companyId}`).emit('supply_chain_event', event);

    console.log(`📦 [WebSocket] Emitted supply chain event ${event.eventId} to company ${event.companyId}`);
  }

  /**
   * 📊 Emit dashboard update
   */
  emitDashboardUpdate(event: DashboardUpdateEvent): void {
    if (!this.io) return;

    // Emit to dashboard subscribers
    this.io.to(`dashboard_${event.companyId}`).emit('dashboard_update', event);

    console.log(`📊 [WebSocket] Emitted dashboard update for company ${event.companyId}`);
  }

  /**
   * 📢 Broadcast global notification (admin only)
   */
  broadcastGlobalNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.io) return;

    this.io.emit('global_notification', {
      type,
      message,
      timestamp: new Date().toISOString()
    });

    console.log(`📢 [WebSocket] Broadcasted global ${type}: ${message}`);
  }

  /**
   * 📈 Get connection statistics
   */
  getConnectionStats(): any {
    if (!this.io) return { connected: 0, authenticated: 0 };

    const connected = this.io.engine.clientsCount;
    const authenticated = this.authenticatedSockets.size;

    return {
      connected,
      authenticated,
      connectionsByCompany: this.getConnectionsByCompany()
    };
  }

  /**
   * 🏢 Get connections grouped by company
   */
  private getConnectionsByCompany(): Record<number, number> {
    const companyConnections: Record<number, number> = {};
    
    this.authenticatedSockets.forEach(auth => {
      auth.companyIds.forEach(companyId => {
        companyConnections[companyId] = (companyConnections[companyId] || 0) + 1;
      });
    });

    return companyConnections;
  }

  /**
   * 🛑 Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.io) {
      console.log('🛑 [WebSocket] Shutting down...');
      this.io.close();
      this.authenticatedSockets.clear();
      console.log('✅ [WebSocket] Shutdown complete');
    }
  }
}

// 🌟 Export singleton instance
export const webSocketService = new WebSocketService(); 