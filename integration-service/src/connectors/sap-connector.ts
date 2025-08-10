/**
 * SAP CONNECTOR - ENTERPRISE ERP INTEGRATION
 * Connects to SAP systems via OData, RFC, and IDoc
 * Handles: Materials, Purchase Orders, Goods Movements, Quality Inspections
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface SapConfig {
    host: string;
    client: string;
    username: string;
    password: string;
    protocol?: 'http' | 'https';
    port?: number;
    basePath?: string;
    timeout?: number;
}

export interface SapMaterial {
    materialNumber: string;
    materialDescription: string;
    materialType: string;
    plant: string;
    storageLocation: string;
    batchNumber?: string;
    serialNumber?: string;
    unitOfMeasure: string;
    standardPrice: number;
    currency: string;
    lastUpdated: Date;
}

export interface SapPurchaseOrder {
    purchaseOrderNumber: string;
    vendorNumber: string;
    vendorName: string;
    companyCode: string;
    purchaseOrderDate: Date;
    deliveryDate: Date;
    items: SapPurchaseOrderItem[];
    totalValue: number;
    currency: string;
    status: 'OPEN' | 'RELEASED' | 'DELIVERED' | 'CLOSED';
}

export interface SapPurchaseOrderItem {
    itemNumber: string;
    materialNumber: string;
    materialDescription: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    plant: string;
    storageLocation: string;
    deliveryDate: Date;
}

export interface SapGoodsMovement {
    documentNumber: string;
    materialNumber: string;
    plant: string;
    storageLocation: string;
    movementType: string; // 101=GR, 261=Consumption, 311=Transfer, etc.
    quantity: number;
    unitOfMeasure: string;
    batchNumber?: string;
    serialNumber?: string;
    postingDate: Date;
    reference: string;
    userId: string;
}

export interface SapQualityInspection {
    inspectionLot: string;
    materialNumber: string;
    batchNumber?: string;
    inspectionType: string;
    plant: string;
    vendor?: string;
    inspectionDate: Date;
    inspectionResult: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    defectCode?: string;
    inspector: string;
    certificates: string[];
}

export class SapConnector extends EventEmitter {
    private config: SapConfig;
    private client: AxiosInstance;
    private connected: boolean = false;
    private sessionId?: string;
    private csrfToken?: string;

    constructor(config: SapConfig) {
        super();
        this.config = {
            protocol: 'https',
            port: 443,
            basePath: '/sap/opu/odata/sap',
            timeout: 30000,
            ...config
        };
        
        this.client = axios.create({
            baseURL: `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.basePath}`,
            timeout: this.config.timeout,
            auth: {
                username: this.config.username,
                password: this.config.password
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'sap-client': this.config.client
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor for authentication
        this.client.interceptors.request.use(
            (config) => {
                if (this.csrfToken) {
                    config.headers['X-CSRF-Token'] = this.csrfToken;
                }
                if (this.sessionId) {
                    config.headers['Cookie'] = `sap-usercontext=${this.sessionId}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    logger.warn('SAP authentication expired, reconnecting...');
                    await this.connect();
                    // Retry the original request
                    return this.client.request(error.config);
                }
                return Promise.reject(error);
            }
        );
    }

    public async connect(): Promise<void> {
        try {
            logger.info('🔌 Connecting to SAP system...');
            
            // Get CSRF token
            const response = await this.client.get('/', {
                headers: {
                    'X-CSRF-Token': 'Fetch'
                }
            });
            
            this.csrfToken = response.headers['x-csrf-token'];
            this.sessionId = response.headers['set-cookie']?.[0]?.split(';')[0]?.split('=')[1];
            
            // Test connection with a simple service call
            await this.client.get('/MM_MATERIAL_SRV/$metadata');
            
            this.connected = true;
            logger.info('✅ Connected to SAP system');
            this.emit('connected');
            
        } catch (error: any) {
            logger.error('❌ Failed to connect to SAP:', error.message);
            this.connected = false;
            throw new Error(`SAP connection failed: ${error.message}`);
        }
    }

    public isConnected(): boolean {
        return this.connected;
    }

    // MATERIALS MANAGEMENT
    public async getMaterials(filters?: {
        plant?: string;
        materialType?: string;
        lastUpdatedAfter?: Date;
    }): Promise<SapMaterial[]> {
        try {
            let url = '/MM_MATERIAL_SRV/Materials';
            const queryParams: string[] = [];
            
            if (filters?.plant) {
                queryParams.push(`$filter=Plant eq '${filters.plant}'`);
            }
            if (filters?.materialType) {
                queryParams.push(`MaterialType eq '${filters.materialType}'`);
            }
            if (filters?.lastUpdatedAfter) {
                const dateStr = filters.lastUpdatedAfter.toISOString();
                queryParams.push(`LastChanged gt datetime'${dateStr}'`);
            }
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            
            const response = await this.client.get(url);
            
            return response.data.d.results.map((item: any) => ({
                materialNumber: item.Material,
                materialDescription: item.MaterialDescription,
                materialType: item.MaterialType,
                plant: item.Plant,
                storageLocation: item.StorageLocation,
                batchNumber: item.Batch,
                serialNumber: item.SerialNumber,
                unitOfMeasure: item.BaseUnit,
                standardPrice: parseFloat(item.StandardPrice),
                currency: item.Currency,
                lastUpdated: new Date(item.LastChanged)
            }));
            
        } catch (error: any) {
            logger.error('Failed to fetch SAP materials:', error.message);
            throw error;
        }
    }

    public async createMaterial(material: Partial<SapMaterial>): Promise<SapMaterial> {
        try {
            const sapPayload = {
                Material: material.materialNumber,
                MaterialDescription: material.materialDescription,
                MaterialType: material.materialType,
                Plant: material.plant,
                StorageLocation: material.storageLocation,
                BaseUnit: material.unitOfMeasure,
                StandardPrice: material.standardPrice?.toString(),
                Currency: material.currency
            };
            
            const response = await this.client.post('/MM_MATERIAL_SRV/Materials', sapPayload);
            
            logger.info(`✅ Created SAP material: ${material.materialNumber}`);
            return this.mapSapMaterial(response.data.d);
            
        } catch (error: any) {
            logger.error('Failed to create SAP material:', error.message);
            throw error;
        }
    }

    // PURCHASE ORDER MANAGEMENT
    public async getPurchaseOrders(filters?: {
        vendor?: string;
        dateFrom?: Date;
        dateTo?: Date;
        status?: string;
    }): Promise<SapPurchaseOrder[]> {
        try {
            let url = '/MM_PURCHASE_ORDER_SRV/PurchaseOrders';
            const queryParams: string[] = [];
            
            if (filters?.vendor) {
                queryParams.push(`$filter=Vendor eq '${filters.vendor}'`);
            }
            if (filters?.dateFrom) {
                const dateStr = filters.dateFrom.toISOString();
                queryParams.push(`DocumentDate ge datetime'${dateStr}'`);
            }
            if (filters?.dateTo) {
                const dateStr = filters.dateTo.toISOString();
                queryParams.push(`DocumentDate le datetime'${dateStr}'`);
            }
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            
            const response = await this.client.get(url);
            
            const orders: SapPurchaseOrder[] = [];
            for (const order of response.data.d.results) {
                // Get PO items
                const itemsResponse = await this.client.get(
                    `/MM_PURCHASE_ORDER_SRV/PurchaseOrders('${order.PurchaseOrder}')/Items`
                );
                
                orders.push({
                    purchaseOrderNumber: order.PurchaseOrder,
                    vendorNumber: order.Vendor,
                    vendorName: order.VendorName,
                    companyCode: order.CompanyCode,
                    purchaseOrderDate: new Date(order.DocumentDate),
                    deliveryDate: new Date(order.DeliveryDate),
                    totalValue: parseFloat(order.TotalValue),
                    currency: order.Currency,
                    status: order.Status,
                    items: itemsResponse.data.d.results.map((item: any) => ({
                        itemNumber: item.PurchaseOrderItem,
                        materialNumber: item.Material,
                        materialDescription: item.MaterialDescription,
                        quantity: parseFloat(item.OrderQuantity),
                        unitOfMeasure: item.OrderUnit,
                        unitPrice: parseFloat(item.NetPrice),
                        plant: item.Plant,
                        storageLocation: item.StorageLocation,
                        deliveryDate: new Date(item.DeliveryDate)
                    }))
                });
            }
            
            return orders;
            
        } catch (error: any) {
            logger.error('Failed to fetch SAP purchase orders:', error.message);
            throw error;
        }
    }

    // GOODS MOVEMENT
    public async postGoodsMovement(movement: SapGoodsMovement): Promise<string> {
        try {
            const sapPayload = {
                DocumentDate: movement.postingDate.toISOString().split('T')[0],
                PostingDate: movement.postingDate.toISOString().split('T')[0],
                Items: [{
                    Material: movement.materialNumber,
                    Plant: movement.plant,
                    StorageLocation: movement.storageLocation,
                    MovementType: movement.movementType,
                    EntryQuantity: movement.quantity.toString(),
                    EntryUnit: movement.unitOfMeasure,
                    Batch: movement.batchNumber,
                    SerialNumber: movement.serialNumber,
                    DocumentReference: movement.reference
                }]
            };
            
            const response = await this.client.post('/MM_GOODS_MOVEMENT_SRV/GoodsMovements', sapPayload);
            
            const documentNumber = response.data.d.MaterialDocument;
            logger.info(`✅ Posted SAP goods movement: ${documentNumber}`);
            
            this.emit('goodsMovement', {
                documentNumber,
                material: movement.materialNumber,
                quantity: movement.quantity,
                movementType: movement.movementType
            });
            
            return documentNumber;
            
        } catch (error: any) {
            logger.error('Failed to post SAP goods movement:', error.message);
            throw error;
        }
    }

    // QUALITY MANAGEMENT
    public async getQualityInspections(filters?: {
        material?: string;
        plant?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<SapQualityInspection[]> {
        try {
            let url = '/QM_INSPECTION_SRV/InspectionLots';
            const queryParams: string[] = [];
            
            if (filters?.material) {
                queryParams.push(`$filter=Material eq '${filters.material}'`);
            }
            if (filters?.plant) {
                queryParams.push(`Plant eq '${filters.plant}'`);
            }
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            
            const response = await this.client.get(url);
            
            return response.data.d.results.map((item: any) => ({
                inspectionLot: item.InspectionLot,
                materialNumber: item.Material,
                batchNumber: item.Batch,
                inspectionType: item.InspectionType,
                plant: item.Plant,
                vendor: item.Vendor,
                inspectionDate: new Date(item.InspectionDate),
                inspectionResult: item.InspectionResult,
                defectCode: item.DefectCode,
                inspector: item.Inspector,
                certificates: item.Certificates ? item.Certificates.split(',') : []
            }));
            
        } catch (error: any) {
            logger.error('Failed to fetch SAP quality inspections:', error.message);
            throw error;
        }
    }

    // REAL-TIME DATA SYNC
    public async syncToKMP(eventType: 'MATERIAL' | 'PURCHASE_ORDER' | 'GOODS_MOVEMENT' | 'QUALITY_INSPECTION', data: any): Promise<void> {
        try {
            // Transform SAP data to KMP supply chain events
            const kmpEvent = this.transformToKMPEvent(eventType, data);
            
            // Send to KMP Message Bus
            const response = await axios.post(`${process.env.KMP_MESSAGE_BUS_URL}/api/supply-chain/event`, kmpEvent, {
                headers: {
                    'Authorization': `Bearer ${process.env.KMP_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            logger.info(`✅ Synced SAP ${eventType} to KMP blockchain: ${response.data.transactionId}`);
            
            this.emit('kmpSync', {
                eventType,
                sapData: data,
                kmpEvent,
                transactionId: response.data.transactionId
            });
            
        } catch (error: any) {
            logger.error(`Failed to sync SAP ${eventType} to KMP:`, error.message);
            throw error;
        }
    }

    private transformToKMPEvent(eventType: string, sapData: any): any {
        const baseEvent = {
            timestamp: new Date().toISOString(),
            source: 'SAP_ERP',
            metadata: {
                sapClient: this.config.client,
                sapHost: this.config.host,
                originalEventType: eventType
            }
        };

        switch (eventType) {
            case 'MATERIAL':
                return {
                    ...baseEvent,
                    productId: sapData.materialNumber,
                    location: sapData.plant,
                    eventType: 'MATERIAL_CREATED',
                    metadata: {
                        ...baseEvent.metadata,
                        materialType: sapData.materialType,
                        description: sapData.materialDescription,
                        storageLocation: sapData.storageLocation
                    }
                };
                
            case 'GOODS_MOVEMENT':
                return {
                    ...baseEvent,
                    productId: sapData.materialNumber,
                    location: sapData.plant,
                    eventType: this.mapMovementTypeToKMP(sapData.movementType),
                    metadata: {
                        ...baseEvent.metadata,
                        quantity: sapData.quantity,
                        unitOfMeasure: sapData.unitOfMeasure,
                        batchNumber: sapData.batchNumber,
                        serialNumber: sapData.serialNumber,
                        movementType: sapData.movementType,
                        documentNumber: sapData.documentNumber
                    }
                };
                
            case 'QUALITY_INSPECTION':
                return {
                    ...baseEvent,
                    productId: sapData.materialNumber,
                    location: sapData.plant,
                    eventType: 'QUALITY_CHECK',
                    metadata: {
                        ...baseEvent.metadata,
                        inspectionLot: sapData.inspectionLot,
                        inspectionResult: sapData.inspectionResult,
                        inspector: sapData.inspector,
                        batchNumber: sapData.batchNumber,
                        defectCode: sapData.defectCode,
                        certificates: sapData.certificates
                    }
                };
                
            default:
                return {
                    ...baseEvent,
                    productId: sapData.id || 'UNKNOWN',
                    location: sapData.plant || 'UNKNOWN',
                    eventType: 'SAP_EVENT',
                    metadata: {
                        ...baseEvent.metadata,
                        rawData: sapData
                    }
                };
        }
    }

    private mapMovementTypeToKMP(movementType: string): string {
        const movementMap: { [key: string]: string } = {
            '101': 'GOODS_RECEIPT',
            '102': 'GOODS_RECEIPT_REVERSAL',
            '261': 'CONSUMPTION',
            '262': 'CONSUMPTION_REVERSAL',
            '311': 'TRANSFER_POSTING',
            '312': 'TRANSFER_REVERSAL',
            '601': 'OUTBOUND_DELIVERY',
            '602': 'OUTBOUND_REVERSAL'
        };
        
        return movementMap[movementType] || 'GOODS_MOVEMENT';
    }

    private mapSapMaterial(sapData: any): SapMaterial {
        return {
            materialNumber: sapData.Material,
            materialDescription: sapData.MaterialDescription,
            materialType: sapData.MaterialType,
            plant: sapData.Plant,
            storageLocation: sapData.StorageLocation,
            batchNumber: sapData.Batch,
            serialNumber: sapData.SerialNumber,
            unitOfMeasure: sapData.BaseUnit,
            standardPrice: parseFloat(sapData.StandardPrice),
            currency: sapData.Currency,
            lastUpdated: new Date(sapData.LastChanged)
        };
    }

    public async disconnect(): Promise<void> {
        this.connected = false;
        logger.info('🔌 Disconnected from SAP system');
        this.emit('disconnected');
    }
} 