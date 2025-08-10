/**
 * EDI X12 PROCESSOR - ENTERPRISE SUPPLY CHAIN COMMUNICATION
 * Handles: EDI transactions, document parsing, trading partner integration
 * Supports: 850 (PO), 855 (PO Ack), 856 (Ship Notice), 810 (Invoice), 997 (Functional Ack)
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface EdiTransaction {
    transactionId: string;
    transactionType: string; // 850, 855, 856, 810, 997, etc.
    sender: TradingPartner;
    receiver: TradingPartner;
    timestamp: Date;
    controlNumber: string;
    rawData: string;
    parsedData: any;
    status: 'RECEIVED' | 'PARSED' | 'PROCESSED' | 'ERROR' | 'ACKNOWLEDGED';
    errorMessages: string[];
    acknowledgmentRequired: boolean;
    acknowledgmentSent?: Date;
}

export interface TradingPartner {
    id: string;
    name: string;
    qualifierId: string; // 01=DUNS, 14=DUNS+4, 12=Phone, etc.
    ediAddress: string;
    connectionType: 'VAN' | 'AS2' | 'SFTP' | 'HTTP' | 'DIRECT';
    capabilities: string[]; // Supported transaction types
    testIndicator: boolean;
}

export interface Edi850PurchaseOrder {
    poNumber: string;
    poDate: Date;
    buyer: {
        name: string;
        address: Address;
        contact?: Contact;
    };
    vendor: {
        name: string;
        address: Address;
        contact?: Contact;
    };
    shipTo: {
        name: string;
        address: Address;
        contact?: Contact;
    };
    billTo?: {
        name: string;
        address: Address;
        contact?: Contact;
    };
    currency: string;
    paymentTerms?: string;
    shipDate?: Date;
    deliveryDate?: Date;
    lineItems: Edi850LineItem[];
    totalAmount?: number;
    specialInstructions?: string[];
}

export interface Edi850LineItem {
    lineNumber: string;
    itemNumber: string;
    itemDescription: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    totalPrice: number;
    requestedDeliveryDate?: Date;
    buyerPartNumber?: string;
    vendorPartNumber?: string;
    upcCode?: string;
    specifications?: Record<string, string>;
}

export interface Edi856ShipNotice {
    shipmentNumber: string;
    shipDate: Date;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    carrier: {
        scac: string; // Standard Carrier Alpha Code
        name: string;
        method: string;
    };
    trackingNumber?: string;
    shipFrom: {
        name: string;
        address: Address;
    };
    shipTo: {
        name: string;
        address: Address;
    };
    billOfLading?: string;
    proNumber?: string;
    packages: Edi856Package[];
    totalWeight?: number;
    weightUnit?: string;
    relatedOrders: string[]; // PO numbers
}

export interface Edi856Package {
    packageId: string;
    packagingType: string; // CTN=Carton, PLT=Pallet, etc.
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
    };
    items: Edi856Item[];
}

export interface Edi856Item {
    lineNumber: string;
    itemNumber: string;
    itemDescription: string;
    quantityShipped: number;
    unitOfMeasure: string;
    lotNumber?: string;
    serialNumbers?: string[];
    expirationDate?: Date;
    poNumber?: string;
    poLineNumber?: string;
}

export interface Edi810Invoice {
    invoiceNumber: string;
    invoiceDate: Date;
    poNumber?: string;
    billTo: {
        name: string;
        address: Address;
    };
    remitTo: {
        name: string;
        address: Address;
    };
    paymentTerms: string;
    dueDate?: Date;
    currency: string;
    lineItems: Edi810LineItem[];
    subtotal: number;
    taxAmount?: number;
    freightAmount?: number;
    totalAmount: number;
    paymentMethod?: string;
}

export interface Edi810LineItem {
    lineNumber: string;
    itemNumber: string;
    itemDescription: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    totalPrice: number;
    taxAmount?: number;
    discountAmount?: number;
}

export interface Address {
    name?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface Contact {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
}

export interface EdiAcknowledgment {
    originalTransactionId: string;
    functionalAck: {
        accepted: boolean;
        errorCodes?: string[];
        errorMessages?: string[];
    };
    businessAck?: {
        accepted: boolean;
        alternateData?: any;
        reasonCodes?: string[];
    };
}

export class EdiProcessor extends EventEmitter {
    private tradingPartners: Map<string, TradingPartner> = new Map();
    private transactions: Map<string, EdiTransaction> = new Map();
    private processingRules: Map<string, any> = new Map();

    constructor() {
        super();
        this.initializeProcessingRules();
    }

    private initializeProcessingRules(): void {
        // Define processing rules for each transaction type
        this.processingRules.set('850', {
            name: 'Purchase Order',
            parser: this.parse850PurchaseOrder.bind(this),
            processor: this.process850PurchaseOrder.bind(this),
            acknowledgmentRequired: true
        });

        this.processingRules.set('855', {
            name: 'Purchase Order Acknowledgment',
            parser: this.parse855Acknowledgment.bind(this),
            processor: this.process855Acknowledgment.bind(this),
            acknowledgmentRequired: false
        });

        this.processingRules.set('856', {
            name: 'Ship Notice/Manifest',
            parser: this.parse856ShipNotice.bind(this),
            processor: this.process856ShipNotice.bind(this),
            acknowledgmentRequired: true
        });

        this.processingRules.set('810', {
            name: 'Invoice',
            parser: this.parse810Invoice.bind(this),
            processor: this.process810Invoice.bind(this),
            acknowledgmentRequired: true
        });

        this.processingRules.set('997', {
            name: 'Functional Acknowledgment',
            parser: this.parse997FunctionalAck.bind(this),
            processor: this.process997FunctionalAck.bind(this),
            acknowledgmentRequired: false
        });
    }

    // MAIN PROCESSING METHODS
    public async processEdiDocument(rawData: string, tradingPartnerId: string): Promise<EdiTransaction> {
        try {
            logger.info('📄 Processing EDI document...');
            
            // Parse EDI envelope
            const envelope = this.parseEdiEnvelope(rawData);
            
            // Validate trading partner
            const tradingPartner = this.tradingPartners.get(tradingPartnerId);
            if (!tradingPartner) {
                throw new Error(`Unknown trading partner: ${tradingPartnerId}`);
            }

            // Create transaction record
            const transaction: EdiTransaction = {
                transactionId: this.generateTransactionId(),
                transactionType: envelope.transactionType,
                sender: envelope.sender,
                receiver: envelope.receiver,
                timestamp: new Date(),
                controlNumber: envelope.controlNumber,
                rawData,
                parsedData: null,
                status: 'RECEIVED',
                errorMessages: [],
                acknowledgmentRequired: false
            };

            this.transactions.set(transaction.transactionId, transaction);

            // Get processing rules
            const rules = this.processingRules.get(envelope.transactionType);
            if (!rules) {
                throw new Error(`Unsupported transaction type: ${envelope.transactionType}`);
            }

            // Parse the document
            transaction.parsedData = await rules.parser(rawData, envelope);
            transaction.status = 'PARSED';
            transaction.acknowledgmentRequired = rules.acknowledgmentRequired;

            // Process the document
            await rules.processor(transaction);
            transaction.status = 'PROCESSED';

            // Send functional acknowledgment if required
            if (transaction.acknowledgmentRequired) {
                await this.sendFunctionalAcknowledgment(transaction);
            }

            logger.info(`✅ EDI ${envelope.transactionType} processed: ${transaction.transactionId}`);
            this.emit('transactionProcessed', transaction);

            return transaction;

        } catch (error: any) {
            logger.error('❌ EDI processing failed:', error.message);
            throw error;
        }
    }

    private parseEdiEnvelope(rawData: string): any {
        const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Find ISA header
        const isaLine = lines.find(line => line.startsWith('ISA'));
        if (!isaLine) {
            throw new Error('Invalid EDI: Missing ISA segment');
        }

        // Parse ISA segment
        const isaElements = isaLine.split('*');
        const elementSeparator = '*';
        const componentSeparator = isaElements[16] || ':';
        const segmentTerminator = isaLine.slice(-1);

        // Find GS header
        const gsLine = lines.find(line => line.startsWith('GS'));
        if (!gsLine) {
            throw new Error('Invalid EDI: Missing GS segment');
        }

        const gsElements = gsLine.split('*');
        const transactionType = gsElements[1];
        const controlNumber = gsElements[6];

        // Extract sender/receiver info
        const sender: TradingPartner = {
            id: isaElements[6],
            name: isaElements[6],
            qualifierId: isaElements[5],
            ediAddress: isaElements[6],
            connectionType: 'DIRECT',
            capabilities: [],
            testIndicator: isaElements[15] === 'T'
        };

        const receiver: TradingPartner = {
            id: isaElements[8],
            name: isaElements[8],
            qualifierId: isaElements[7],
            ediAddress: isaElements[8],
            connectionType: 'DIRECT',
            capabilities: [],
            testIndicator: isaElements[15] === 'T'
        };

        return {
            transactionType,
            controlNumber,
            sender,
            receiver,
            elementSeparator,
            componentSeparator,
            segmentTerminator
        };
    }

    // PURCHASE ORDER (850) PROCESSING
    private async parse850PurchaseOrder(rawData: string, envelope: any): Promise<Edi850PurchaseOrder> {
        const segments = this.parseSegments(rawData);
        
        // Find BEG segment (Beginning Segment for Purchase Order)
        const begSegment = segments.find(s => s.tag === 'BEG');
        if (!begSegment) {
            throw new Error('Invalid 850: Missing BEG segment');
        }

        const po: Edi850PurchaseOrder = {
            poNumber: begSegment.elements[3],
            poDate: this.parseEdiDate(begSegment.elements[4]),
            buyer: this.extractPartyInfo(segments, 'BY'), // Buying Party
            vendor: this.extractPartyInfo(segments, 'SE'), // Selling Party
            shipTo: this.extractPartyInfo(segments, 'ST'), // Ship To
            currency: 'USD',
            lineItems: []
        };

        // Extract line items (PO1 segments)
        const po1Segments = segments.filter(s => s.tag === 'PO1');
        for (const po1 of po1Segments) {
            const lineItem: Edi850LineItem = {
                lineNumber: po1.elements[1],
                quantity: parseFloat(po1.elements[2]),
                unitOfMeasure: po1.elements[3],
                unitPrice: parseFloat(po1.elements[4]),
                totalPrice: parseFloat(po1.elements[2]) * parseFloat(po1.elements[4]),
                buyerPartNumber: po1.elements[7],
                vendorPartNumber: po1.elements[9],
                itemNumber: po1.elements[7] || po1.elements[9],
                itemDescription: 'Item Description' // Usually in PID segment following PO1
            };

            // Look for PID segment (Product/Item Description)
            const pidIndex = segments.findIndex(s => s === po1) + 1;
            if (pidIndex < segments.length && segments[pidIndex].tag === 'PID') {
                lineItem.itemDescription = segments[pidIndex].elements[5] || lineItem.itemDescription;
            }

            po.lineItems.push(lineItem);
        }

        // Calculate total if not present
        po.totalAmount = po.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

        return po;
    }

    private async process850PurchaseOrder(transaction: EdiTransaction): Promise<void> {
        const po = transaction.parsedData as Edi850PurchaseOrder;
        
        logger.info(`📋 Processing Purchase Order: ${po.poNumber}`);

        // Create KMP supply chain events for each line item
        for (const lineItem of po.lineItems) {
            const kmpEvent = {
                productId: lineItem.itemNumber,
                location: po.shipTo.name,
                eventType: 'PURCHASE_ORDER_CREATED',
                metadata: {
                    source: 'EDI_850',
                    poNumber: po.poNumber,
                    poDate: po.poDate,
                    lineNumber: lineItem.lineNumber,
                    quantity: lineItem.quantity,
                    unitOfMeasure: lineItem.unitOfMeasure,
                    unitPrice: lineItem.unitPrice,
                    totalPrice: lineItem.totalPrice,
                    buyerPartNumber: lineItem.buyerPartNumber,
                    vendorPartNumber: lineItem.vendorPartNumber,
                    buyer: po.buyer.name,
                    vendor: po.vendor.name,
                    requestedDeliveryDate: lineItem.requestedDeliveryDate,
                    tradingPartnerId: transaction.sender.id,
                    ediTransactionId: transaction.transactionId
                }
            };

            await this.sendToKMP(kmpEvent);
        }

        this.emit('purchaseOrderProcessed', { transaction, po });
    }

    // SHIP NOTICE (856) PROCESSING  
    private async parse856ShipNotice(rawData: string, envelope: any): Promise<Edi856ShipNotice> {
        const segments = this.parseSegments(rawData);
        
        // Find BSN segment (Beginning Segment for Ship Notice)
        const bsnSegment = segments.find(s => s.tag === 'BSN');
        if (!bsnSegment) {
            throw new Error('Invalid 856: Missing BSN segment');
        }

        const shipNotice: Edi856ShipNotice = {
            shipmentNumber: bsnSegment.elements[2],
            shipDate: this.parseEdiDate(bsnSegment.elements[3]),
            shipFrom: this.extractPartyInfo(segments, 'SF'), // Ship From
            shipTo: this.extractPartyInfo(segments, 'ST'), // Ship To
            carrier: {
                scac: '',
                name: '',
                method: ''
            },
            packages: [],
            relatedOrders: []
        };

        // Extract carrier info (TD5 segment)
        const td5Segment = segments.find(s => s.tag === 'TD5');
        if (td5Segment) {
            shipNotice.carrier = {
                scac: td5Segment.elements[2] || '',
                name: td5Segment.elements[3] || '',
                method: td5Segment.elements[4] || ''
            };
        }

        // Extract tracking number (TD3 segment)
        const td3Segment = segments.find(s => s.tag === 'TD3');
        if (td3Segment) {
            shipNotice.trackingNumber = td3Segment.elements[2];
        }

        // Extract packages and items (HL hierarchy)
        const hlSegments = segments.filter(s => s.tag === 'HL');
        const packageHls = hlSegments.filter(hl => hl.elements[3] === 'P'); // Package level
        
        for (const packageHl of packageHls) {
            const packageId = packageHl.elements[1];
            const pkg: Edi856Package = {
                packageId,
                packagingType: 'CTN', // Default to carton
                items: []
            };

            // Find items in this package
            const itemHls = hlSegments.filter(hl => 
                hl.elements[2] === packageId && hl.elements[3] === 'I'
            );

            for (const itemHl of itemHls) {
                // Find corresponding LIN segment (Item Identification)
                const linSegment = segments.find(s => 
                    s.tag === 'LIN' && 
                    segments.indexOf(s) > segments.indexOf(itemHl) &&
                    segments.indexOf(s) < segments.indexOf(itemHl) + 5
                );

                if (linSegment) {
                    const item: Edi856Item = {
                        lineNumber: itemHl.elements[1],
                        itemNumber: linSegment.elements[3],
                        itemDescription: 'Item Description', // Usually in PID segment
                        quantityShipped: 0, // Usually in SN1 segment
                        unitOfMeasure: 'EA'
                    };

                    // Find SN1 segment (Item Detail - Shipment)
                    const sn1Segment = segments.find(s => 
                        s.tag === 'SN1' && 
                        segments.indexOf(s) > segments.indexOf(linSegment) &&
                        segments.indexOf(s) < segments.indexOf(linSegment) + 3
                    );

                    if (sn1Segment) {
                        item.quantityShipped = parseFloat(sn1Segment.elements[2]);
                        item.unitOfMeasure = sn1Segment.elements[3] || 'EA';
                    }

                    pkg.items.push(item);
                }
            }

            shipNotice.packages.push(pkg);
        }

        // Extract related PO numbers (PRF segments)
        const prfSegments = segments.filter(s => s.tag === 'PRF');
        shipNotice.relatedOrders = prfSegments.map(prf => prf.elements[1]);

        return shipNotice;
    }

    private async process856ShipNotice(transaction: EdiTransaction): Promise<void> {
        const shipNotice = transaction.parsedData as Edi856ShipNotice;
        
        logger.info(`📦 Processing Ship Notice: ${shipNotice.shipmentNumber}`);

        // Create KMP supply chain events for shipped items
        for (const pkg of shipNotice.packages) {
            for (const item of pkg.items) {
                const kmpEvent = {
                    productId: item.itemNumber,
                    location: shipNotice.shipFrom.name,
                    eventType: 'SHIPMENT_CREATED',
                    metadata: {
                        source: 'EDI_856',
                        shipmentNumber: shipNotice.shipmentNumber,
                        shipDate: shipNotice.shipDate,
                        estimatedDeliveryDate: shipNotice.estimatedDeliveryDate,
                        carrier: shipNotice.carrier,
                        trackingNumber: shipNotice.trackingNumber,
                        packageId: pkg.packageId,
                        quantityShipped: item.quantityShipped,
                        unitOfMeasure: item.unitOfMeasure,
                        lotNumber: item.lotNumber,
                        serialNumbers: item.serialNumbers,
                        shipFrom: shipNotice.shipFrom.name,
                        shipTo: shipNotice.shipTo.name,
                        relatedOrders: shipNotice.relatedOrders,
                        tradingPartnerId: transaction.sender.id,
                        ediTransactionId: transaction.transactionId
                    }
                };

                await this.sendToKMP(kmpEvent);
            }
        }

        this.emit('shipNoticeProcessed', { transaction, shipNotice });
    }

    // INVOICE (810) PROCESSING
    private async parse810Invoice(rawData: string, envelope: any): Promise<Edi810Invoice> {
        const segments = this.parseSegments(rawData);
        
        // Find BIG segment (Beginning Segment for Invoice)
        const bigSegment = segments.find(s => s.tag === 'BIG');
        if (!bigSegment) {
            throw new Error('Invalid 810: Missing BIG segment');
        }

        const invoice: Edi810Invoice = {
            invoiceNumber: bigSegment.elements[2],
            invoiceDate: this.parseEdiDate(bigSegment.elements[1]),
            poNumber: bigSegment.elements[4],
            billTo: this.extractPartyInfo(segments, 'BT'), // Bill To
            remitTo: this.extractPartyInfo(segments, 'RE'), // Remit To
            paymentTerms: '',
            currency: 'USD',
            lineItems: [],
            subtotal: 0,
            totalAmount: 0
        };

        // Extract payment terms (ITD segment)
        const itdSegment = segments.find(s => s.tag === 'ITD');
        if (itdSegment) {
            invoice.paymentTerms = `${itdSegment.elements[3]}/${itdSegment.elements[4]}`;
            if (itdSegment.elements[7]) {
                invoice.dueDate = this.parseEdiDate(itdSegment.elements[7]);
            }
        }

        // Extract line items (IT1 segments)
        const it1Segments = segments.filter(s => s.tag === 'IT1');
        for (const it1 of it1Segments) {
            const lineItem: Edi810LineItem = {
                lineNumber: it1.elements[1],
                quantity: parseFloat(it1.elements[2]),
                unitOfMeasure: it1.elements[3],
                unitPrice: parseFloat(it1.elements[4]),
                totalPrice: parseFloat(it1.elements[2]) * parseFloat(it1.elements[4]),
                itemNumber: it1.elements[7] || it1.elements[9],
                itemDescription: 'Item Description'
            };

            invoice.lineItems.push(lineItem);
        }

        // Calculate totals (TDS segment)
        const tdsSegment = segments.find(s => s.tag === 'TDS');
        if (tdsSegment) {
            invoice.totalAmount = parseFloat(tdsSegment.elements[1]);
        } else {
            invoice.totalAmount = invoice.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
        }

        invoice.subtotal = invoice.totalAmount;

        return invoice;
    }

    private async process810Invoice(transaction: EdiTransaction): Promise<void> {
        const invoice = transaction.parsedData as Edi810Invoice;
        
        logger.info(`💰 Processing Invoice: ${invoice.invoiceNumber}`);

        // Create KMP supply chain event for invoice
        const kmpEvent = {
            productId: invoice.lineItems[0]?.itemNumber || 'MULTI_ITEM',
            location: invoice.billTo.name,
            eventType: 'INVOICE_RECEIVED',
            metadata: {
                source: 'EDI_810',
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.invoiceDate,
                poNumber: invoice.poNumber,
                totalAmount: invoice.totalAmount,
                currency: invoice.currency,
                paymentTerms: invoice.paymentTerms,
                dueDate: invoice.dueDate,
                billTo: invoice.billTo.name,
                remitTo: invoice.remitTo.name,
                lineItemCount: invoice.lineItems.length,
                tradingPartnerId: transaction.sender.id,
                ediTransactionId: transaction.transactionId
            }
        };

        await this.sendToKMP(kmpEvent);

        this.emit('invoiceProcessed', { transaction, invoice });
    }

    // FUNCTIONAL ACKNOWLEDGMENT (997) PROCESSING
    private async parse997FunctionalAck(rawData: string, envelope: any): Promise<EdiAcknowledgment> {
        const segments = this.parseSegments(rawData);
        
        // Find AK1 segment (Functional Group Response Header)
        const ak1Segment = segments.find(s => s.tag === 'AK1');
        if (!ak1Segment) {
            throw new Error('Invalid 997: Missing AK1 segment');
        }

        // Find AK9 segment (Functional Group Response Trailer)
        const ak9Segment = segments.find(s => s.tag === 'AK9');
        if (!ak9Segment) {
            throw new Error('Invalid 997: Missing AK9 segment');
        }

        const acknowledgment: EdiAcknowledgment = {
            originalTransactionId: envelope.controlNumber,
            functionalAck: {
                accepted: ak9Segment.elements[1] === 'A', // A=Accepted, R=Rejected, P=Partially Accepted
                errorCodes: [],
                errorMessages: []
            }
        };

        // Extract error details from AK3 and AK4 segments if present
        const ak3Segments = segments.filter(s => s.tag === 'AK3');
        const ak4Segments = segments.filter(s => s.tag === 'AK4');

        if (ak3Segments.length > 0 || ak4Segments.length > 0) {
            acknowledgment.functionalAck.errorCodes = [
                ...ak3Segments.map(ak3 => ak3.elements[4]).filter(Boolean),
                ...ak4Segments.map(ak4 => ak4.elements[4]).filter(Boolean)
            ];
        }

        return acknowledgment;
    }

    private async process997FunctionalAck(transaction: EdiTransaction): Promise<void> {
        const ack = transaction.parsedData as EdiAcknowledgment;
        
        logger.info(`📄 Processing Functional Acknowledgment for: ${ack.originalTransactionId}`);

        // Find the original transaction and update its status
        const originalTransaction = Array.from(this.transactions.values())
            .find(t => t.controlNumber === ack.originalTransactionId);

        if (originalTransaction) {
            if (ack.functionalAck.accepted) {
                logger.info(`✅ Transaction ${originalTransaction.transactionId} acknowledged successfully`);
            } else {
                logger.warn(`⚠️ Transaction ${originalTransaction.transactionId} rejected:`, ack.functionalAck.errorMessages);
            }
            
            originalTransaction.acknowledgmentSent = new Date();
        }

        this.emit('functionalAckProcessed', { transaction, ack, originalTransaction });
    }

    // UTILITY METHODS
    private parseSegments(rawData: string): any[] {
        const segmentTerminator = '~';
        const elementSeparator = '*';
        
        return rawData.split(segmentTerminator)
            .map(segment => segment.trim())
            .filter(segment => segment.length > 0)
            .map(segment => {
                const elements = segment.split(elementSeparator);
                return {
                    tag: elements[0],
                    elements: elements,
                    raw: segment
                };
            });
    }

    private extractPartyInfo(segments: any[], qualifierCode: string): any {
        // Find N1 segment with the specified qualifier
        const n1Segment = segments.find(s => 
            s.tag === 'N1' && s.elements[1] === qualifierCode
        );

        if (!n1Segment) {
            return {
                name: 'Unknown',
                address: {
                    line1: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'US'
                }
            };
        }

        const n1Index = segments.indexOf(n1Segment);
        
        // Look for N3 (Address) and N4 (Geographic Location) segments following N1
        const n3Segment = segments[n1Index + 1]?.tag === 'N3' ? segments[n1Index + 1] : null;
        const n4Segment = segments[n1Index + 2]?.tag === 'N4' ? segments[n1Index + 2] : null;

        return {
            name: n1Segment.elements[2] || 'Unknown',
            address: {
                line1: n3Segment?.elements[1] || '',
                line2: n3Segment?.elements[2] || '',
                city: n4Segment?.elements[1] || '',
                state: n4Segment?.elements[2] || '',
                postalCode: n4Segment?.elements[3] || '',
                country: n4Segment?.elements[4] || 'US'
            }
        };
    }

    private parseEdiDate(ediDate: string): Date {
        if (!ediDate || ediDate.length < 6) {
            return new Date();
        }

        // EDI dates are typically CCYYMMDD or YYMMDD
        let year: number, month: number, day: number;

        if (ediDate.length === 8) {
            // CCYYMMDD format
            year = parseInt(ediDate.substring(0, 4));
            month = parseInt(ediDate.substring(4, 6)) - 1; // JavaScript months are 0-based
            day = parseInt(ediDate.substring(6, 8));
        } else if (ediDate.length === 6) {
            // YYMMDD format
            const yy = parseInt(ediDate.substring(0, 2));
            year = yy < 50 ? 2000 + yy : 1900 + yy; // Y2K windowing
            month = parseInt(ediDate.substring(2, 4)) - 1;
            day = parseInt(ediDate.substring(4, 6));
        } else {
            return new Date();
        }

        return new Date(year, month, day);
    }

    private generateTransactionId(): string {
        return `EDI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    private async sendFunctionalAcknowledgment(transaction: EdiTransaction): Promise<void> {
        try {
            const ack997 = this.generate997Acknowledgment(transaction, true);
            
            // Send acknowledgment back to trading partner
            // This would typically go through EDI network (VAN, AS2, etc.)
            logger.info(`📤 Sending 997 acknowledgment for transaction ${transaction.transactionId}`);
            
            transaction.acknowledgmentSent = new Date();
            this.emit('acknowledgmentSent', { transaction, acknowledgment: ack997 });
            
        } catch (error: any) {
            logger.error('Failed to send functional acknowledgment:', error.message);
        }
    }

    private generate997Acknowledgment(transaction: EdiTransaction, accepted: boolean): string {
        const timestamp = new Date();
        const controlNumber = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
        
        // This is a simplified 997 generation - production would be more comprehensive
        const ack = [
            'ISA*00*          *00*          *ZZ*RECEIVER       *ZZ*SENDER         *' + 
            this.formatEdiDate(timestamp) + '*' + this.formatEdiTime(timestamp) + '*U*00401*' + controlNumber + '*0*T*:~',
            
            'GS*FA*RECEIVER*SENDER*' + this.formatEdiDate(timestamp) + '*' + this.formatEdiTime(timestamp) + '*' + controlNumber + '*X*004010~',
            
            'ST*997*0001~',
            'AK1*' + transaction.transactionType + '*' + transaction.controlNumber + '~',
            'AK9*' + (accepted ? 'A' : 'R') + '*1*1*' + (accepted ? '1' : '0') + '~',
            'SE*4*0001~',
            
            'GE*1*' + controlNumber + '~',
            'IEA*1*' + controlNumber + '~'
        ];
        
        return ack.join('');
    }

    private formatEdiDate(date: Date): string {
        const year = date.getFullYear().toString().substring(2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return year + month + day;
    }

    private formatEdiTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return hours + minutes;
    }

    private async sendToKMP(kmpEvent: any): Promise<void> {
        try {
            const response = await fetch(`${process.env.KMP_MESSAGE_BUS_URL}/api/supply-chain/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.KMP_API_TOKEN}`
                },
                body: JSON.stringify(kmpEvent)
            });

            if (!response.ok) {
                throw new Error(`KMP API request failed: ${response.statusText}`);
            }

            const result = await response.json();
            logger.info(`✅ EDI event sent to KMP blockchain: ${result.transactionId}`);
            
        } catch (error: any) {
            logger.error('Failed to send EDI event to KMP:', error.message);
            throw error;
        }
    }

    // PUBLIC API METHODS
    public addTradingPartner(partner: TradingPartner): void {
        this.tradingPartners.set(partner.id, partner);
        logger.info(`🤝 Added trading partner: ${partner.name} (${partner.id})`);
    }

    public getTradingPartner(id: string): TradingPartner | undefined {
        return this.tradingPartners.get(id);
    }

    public getTransaction(transactionId: string): EdiTransaction | undefined {
        return this.transactions.get(transactionId);
    }

    public getTransactionsByType(transactionType: string): EdiTransaction[] {
        return Array.from(this.transactions.values())
            .filter(t => t.transactionType === transactionType);
    }

    public getTransactionsByStatus(status: string): EdiTransaction[] {
        return Array.from(this.transactions.values())
            .filter(t => t.status === status);
    }

    public async processFile(filePath: string, tradingPartnerId: string): Promise<EdiTransaction> {
        const rawData = await fs.readFile(filePath, 'utf-8');
        return this.processEdiDocument(rawData, tradingPartnerId);
    }

    private async parse855Acknowledgment(rawData: string, envelope: any): Promise<any> {
        // Placeholder for 855 PO Acknowledgment parsing
        return { acknowledged: true };
    }

    private async process855Acknowledgment(transaction: EdiTransaction): Promise<void> {
        // Placeholder for 855 processing
        logger.info(`📋 Processing PO Acknowledgment: ${transaction.transactionId}`);
    }
} 