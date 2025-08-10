/**
 * ORACLE ERP CONNECTOR - ENTERPRISE INTEGRATION
 * Connects to Oracle Cloud SCM, WMS, and on-premise ERP systems
 * Handles: Items, Inventory, Purchase Orders, Shipments, Quality
 */

import axios from 'axios';
import { ORACLE_CONFIG, ORACLE_HEADERS } from '../config/oracle-config';
import { KMPEventSubmitter } from '../services/kmp-event-submitter';
import { Logger } from '../utils/logger';

export class OracleConnector {
  private kmpSubmitter: KMPEventSubmitter;
  private logger: Logger;

  constructor() {
    this.kmpSubmitter = new KMPEventSubmitter();
    this.logger = new Logger('OracleConnector');
  }

  /**
   * 📦 Monitor Oracle Item Master for new products
   */
  async syncItems(): Promise<void> {
    try {
      this.logger.info('🔄 Syncing Oracle Items...');
      
      const response = await axios.get(
        `${ORACLE_CONFIG.baseUrl}${ORACLE_CONFIG.apis.items.endpoint}`,
        { 
          headers: ORACLE_HEADERS,
          timeout: ORACLE_CONFIG.timeout,
          params: {
            'limit': 10, // Limit for demo
            'q': 'ItemClass=FINISHED_GOOD'
          }
        }
      );

      const items = response.data?.items || [];
      this.logger.info(`📦 Found ${items.length} items`);

      for (const item of items) {
        await this.processItemEvent(item);
      }

    } catch (error) {
      this.logger.error('❌ Oracle Item sync failed:', error);
    }
  }

  /**
   * 🛒 Monitor Oracle Purchase Orders
   */
  async syncPurchaseOrders(): Promise<void> {
    try {
      this.logger.info('🔄 Syncing Oracle Purchase Orders...');
      
      const response = await axios.get(
        `${ORACLE_CONFIG.baseUrl}${ORACLE_CONFIG.apis.purchaseOrders.endpoint}`,
        { 
          headers: ORACLE_HEADERS,
          timeout: ORACLE_CONFIG.timeout,
          params: {
            'limit': 10,
            'expand': 'lines'
          }
        }
      );

      const orders = response.data?.items || [];
      this.logger.info(`🛒 Found ${orders.length} purchase orders`);

      for (const order of orders) {
        await this.processPurchaseOrderEvent(order);
      }

    } catch (error) {
      this.logger.error('❌ Oracle Purchase Order sync failed:', error);
    }
  }

  /**
   * 🏭 Monitor Oracle Work Orders (Manufacturing)
   */
  async syncWorkOrders(): Promise<void> {
    try {
      this.logger.info('🔄 Syncing Oracle Work Orders...');
      
      const response = await axios.get(
        `${ORACLE_CONFIG.baseUrl}${ORACLE_CONFIG.apis.workOrders.endpoint}`,
        { 
          headers: ORACLE_HEADERS,
          timeout: ORACLE_CONFIG.timeout,
          params: {
            'limit': 10,
            'q': 'Status=COMPLETED'
          }
        }
      );

      const workOrders = response.data?.items || [];
      this.logger.info(`🏭 Found ${workOrders.length} work orders`);

      for (const workOrder of workOrders) {
        await this.processWorkOrderEvent(workOrder);
      }

    } catch (error) {
      this.logger.error('❌ Oracle Work Order sync failed:', error);
    }
  }

  /**
   * 🚚 Monitor Oracle Shipments
   */
  async syncShipments(): Promise<void> {
    try {
      this.logger.info('🔄 Syncing Oracle Shipments...');
      
      const response = await axios.get(
        `${ORACLE_CONFIG.baseUrl}${ORACLE_CONFIG.apis.shipments.endpoint}`,
        { 
          headers: ORACLE_HEADERS,
          timeout: ORACLE_CONFIG.timeout,
          params: {
            'limit': 10,
            'expand': 'lines'
          }
        }
      );

      const shipments = response.data?.items || [];
      this.logger.info(`🚚 Found ${shipments.length} shipments`);

      for (const shipment of shipments) {
        await this.processShipmentEvent(shipment);
      }

    } catch (error) {
      this.logger.error('❌ Oracle Shipment sync failed:', error);
    }
  }

  /**
   * 📦 Process Item Event
   */
  private async processItemEvent(item: any): Promise<void> {
    const kmpEvent = {
      productId: item.ItemNumber || `ORACLE-${item.ItemId}`,
      eventType: 'PRODUCTION_START',
      location: item.PrimaryUOMCode || 'Oracle Manufacturing',
      timestamp: new Date().toISOString(),
      data: {
        oracleItem: item.ItemNumber,
        description: item.Description,
        itemClass: item.ItemClass,
        uom: item.PrimaryUOMCode,
        listPrice: item.ListPrice,
        itemStatus: item.ItemStatus,
        source: 'ORACLE_ITEM_MASTER'
      },
      metadata: {
        oracleDocument: item.ItemId,
        connector: 'ORACLE_CONNECTOR',
        originalSystem: 'ORACLE_SCM'
      }
    };

    await this.kmpSubmitter.submitEvent(kmpEvent);
    this.logger.info(`✅ Processed Oracle Item: ${item.ItemNumber}`);
  }

  /**
   * 🛒 Process Purchase Order Event
   */
  private async processPurchaseOrderEvent(order: any): Promise<void> {
    const kmpEvent = {
      productId: `PO-${order.DocumentNumber}`,
      eventType: 'RAW_MATERIAL_RECEIVED',
      location: order.ProcurementBU || 'Oracle Procurement',
      timestamp: order.SubmittedDate || new Date().toISOString(),
      data: {
        oraclePO: order.DocumentNumber,
        supplier: order.Supplier,
        buyerName: order.BuyerName,
        totalAmount: order.TotalAmount,
        currency: order.Currency,
        lines: order.lines || [],
        source: 'ORACLE_PURCHASE_ORDER'
      },
      metadata: {
        oracleDocument: order.HeaderId,
        connector: 'ORACLE_CONNECTOR',
        originalSystem: 'ORACLE_SCM'
      }
    };

    await this.kmpSubmitter.submitEvent(kmpEvent);
    this.logger.info(`✅ Processed Oracle Purchase Order: ${order.DocumentNumber}`);
  }

  /**
   * 🏭 Process Work Order Event
   */
  private async processWorkOrderEvent(workOrder: any): Promise<void> {
    const kmpEvent = {
      productId: `WO-${workOrder.WorkOrderNumber}`,
      eventType: 'QUALITY_CHECK',
      location: workOrder.OrganizationCode || 'Oracle Manufacturing',
      timestamp: workOrder.CompletionDate || new Date().toISOString(),
      data: {
        oracleWorkOrder: workOrder.WorkOrderNumber,
        assemblyItem: workOrder.AssemblyItemNumber,
        quantity: workOrder.OrderQuantity,
        status: workOrder.Status,
        operations: workOrder.operations || [],
        source: 'ORACLE_WORK_ORDER'
      },
      metadata: {
        oracleDocument: workOrder.WorkOrderId,
        connector: 'ORACLE_CONNECTOR',
        originalSystem: 'ORACLE_WMS'
      }
    };

    await this.kmpSubmitter.submitEvent(kmpEvent);
    this.logger.info(`✅ Processed Oracle Work Order: ${workOrder.WorkOrderNumber}`);
  }

  /**
   * 🚚 Process Shipment Event
   */
  private async processShipmentEvent(shipment: any): Promise<void> {
    const kmpEvent = {
      productId: `SHIP-${shipment.ShipmentNumber}`,
      eventType: 'SHIPMENT_DISPATCHED',
      location: shipment.OrganizationCode || 'Oracle Shipping',
      timestamp: shipment.ShipDate || new Date().toISOString(),
      data: {
        oracleShipment: shipment.ShipmentNumber,
        carrier: shipment.Carrier,
        shipToLocation: shipment.ShipToLocation,
        totalWeight: shipment.GrossWeight,
        lines: shipment.lines || [],
        source: 'ORACLE_SHIPMENT'
      },
      metadata: {
        oracleDocument: shipment.ShipmentId,
        connector: 'ORACLE_CONNECTOR',
        originalSystem: 'ORACLE_SCM'
      }
    };

    await this.kmpSubmitter.submitEvent(kmpEvent);
    this.logger.info(`✅ Processed Oracle Shipment: ${shipment.ShipmentNumber}`);
  }

  /**
   * 🔄 Run full Oracle sync cycle
   */
  async runFullSync(): Promise<void> {
    this.logger.info('🚀 Starting full Oracle sync cycle...');
    
    await this.syncItems();
    await this.syncPurchaseOrders();
    await this.syncWorkOrders();
    await this.syncShipments();
    
    this.logger.info('✅ Oracle sync cycle completed');
  }
} 