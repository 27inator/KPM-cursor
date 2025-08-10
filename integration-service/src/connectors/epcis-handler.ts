/**
 * GS1 EPCIS HANDLER - GLOBAL SUPPLY CHAIN STANDARDS COMPLIANCE
 * Handles: EPCIS events, CBV vocabulary, XML/JSON serialization
 * Supports: ObjectEvent, AggregationEvent, TransactionEvent, TransformationEvent
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface EpcisEvent {
    eventID?: string;
    eventTime: Date;
    eventTimeZoneOffset: string;
    action: 'ADD' | 'OBSERVE' | 'DELETE';
    bizStep?: string;
    disposition?: string;
    readPoint?: EpcisReadPoint;
    bizLocation?: EpcisBizLocation;
    bizTransactionList?: EpcisBizTransaction[];
    sourceList?: EpcisSource[];
    destinationList?: EpcisDestination[];
    sensorElementList?: EpcisSensorElement[];
    persistentDisposition?: EpcisPersistentDisposition;
    ilmd?: any; // Instance/Lot Master Data
    errorDeclaration?: EpcisErrorDeclaration;
    recordTime?: Date;
    certificationInfo?: string;
}

export interface EpcisObjectEvent extends EpcisEvent {
    epcList: string[];
    quantityList?: EpcisQuantityElement[];
}

export interface EpcisAggregationEvent extends EpcisEvent {
    parentID?: string;
    childEPCs?: string[];
    childQuantityList?: EpcisQuantityElement[];
}

export interface EpcisTransactionEvent extends EpcisEvent {
    parentID?: string;
    epcList?: string[];
    quantityList?: EpcisQuantityElement[];
}

export interface EpcisTransformationEvent extends EpcisEvent {
    inputEPCList?: string[];
    inputQuantityList?: EpcisQuantityElement[];
    outputEPCList?: string[];
    outputQuantityList?: EpcisQuantityElement[];
    transformationID?: string;
}

export interface EpcisQuantityElement {
    epcClass: string;
    quantity: number;
    uom?: string;
}

export interface EpcisReadPoint {
    id: string;
}

export interface EpcisBizLocation {
    id: string;
}

export interface EpcisBizTransaction {
    type: string;
    bizTransaction: string;
}

export interface EpcisSource {
    type: string;
    source: string;
}

export interface EpcisDestination {
    type: string;
    destination: string;
}

export interface EpcisSensorElement {
    sensorMetadata: EpcisSensorMetadata;
    sensorReport: EpcisSensorReport[];
}

export interface EpcisSensorMetadata {
    time?: Date;
    deviceID?: string;
    deviceMetadata?: string;
    rawData?: string;
    dataProcessingMethod?: string;
    bizRules?: string;
}

export interface EpcisSensorReport {
    type: string;
    value?: number;
    uom?: string;
    minValue?: number;
    maxValue?: number;
    meanValue?: number;
    sDev?: number;
    percRank?: number;
    percValue?: number;
    stringValue?: string;
    booleanValue?: boolean;
    hexBinaryValue?: string;
    uriValue?: string;
    component?: string;
    coordinateReferenceSystem?: string;
}

export interface EpcisPersistentDisposition {
    set?: string[];
    unset?: string[];
}

export interface EpcisErrorDeclaration {
    declarationTime: Date;
    reason?: string;
    correctiveEventIDs?: string[];
}

export interface EpcisDocument {
    schemaVersion: string;
    creationDate: Date;
    epcisBody: {
        eventList: EpcisEvent[];
    };
    epcisHeader?: {
        epcisMasterData?: EpcisMasterData;
    };
}

export interface EpcisMasterData {
    vocabularyList: EpcisVocabulary[];
}

export interface EpcisVocabulary {
    type: string;
    vocabularyElementList: EpcisVocabularyElement[];
}

export interface EpcisVocabularyElement {
    id: string;
    attributes: Record<string, any>;
    children?: string[];
}

// CBV (Core Business Vocabulary) Standard Values
export const CBV_BUSINESS_STEPS = {
    ACCEPTING: 'urn:epcglobal:cbv:bizstep:accepting',
    ARRIVING: 'urn:epcglobal:cbv:bizstep:arriving',
    ASSEMBLING: 'urn:epcglobal:cbv:bizstep:assembling',
    COLLECTING: 'urn:epcglobal:cbv:bizstep:collecting',
    COMMISSIONING: 'urn:epcglobal:cbv:bizstep:commissioning',
    CONSIGNING: 'urn:epcglobal:cbv:bizstep:consigning',
    CREATING_CLASS_INSTANCE: 'urn:epcglobal:cbv:bizstep:creating_class_instance',
    CYCLE_COUNTING: 'urn:epcglobal:cbv:bizstep:cycle_counting',
    DECOMMISSIONING: 'urn:epcglobal:cbv:bizstep:decommissioning',
    DEPARTING: 'urn:epcglobal:cbv:bizstep:departing',
    DESTROYING: 'urn:epcglobal:cbv:bizstep:destroying',
    DISPENSING: 'urn:epcglobal:cbv:bizstep:dispensing',
    ENCODING: 'urn:epcglobal:cbv:bizstep:encoding',
    ENTERING_EXITING: 'urn:epcglobal:cbv:bizstep:entering_exiting',
    HOLDING: 'urn:epcglobal:cbv:bizstep:holding',
    INSPECTING: 'urn:epcglobal:cbv:bizstep:inspecting',
    INSTALLING: 'urn:epcglobal:cbv:bizstep:installing',
    KILLING: 'urn:epcglobal:cbv:bizstep:killing',
    LOADING: 'urn:epcglobal:cbv:bizstep:loading',
    OTHER: 'urn:epcglobal:cbv:bizstep:other',
    PACKING: 'urn:epcglobal:cbv:bizstep:packing',
    PICKING: 'urn:epcglobal:cbv:bizstep:picking',
    RECEIVING: 'urn:epcglobal:cbv:bizstep:receiving',
    REMOVING: 'urn:epcglobal:cbv:bizstep:removing',
    REPAIRING: 'urn:epcglobal:cbv:bizstep:repairing',
    REPLACING: 'urn:epcglobal:cbv:bizstep:replacing',
    RESERVING: 'urn:epcglobal:cbv:bizstep:reserving',
    RETAIL_SELLING: 'urn:epcglobal:cbv:bizstep:retail_selling',
    SHIPPING: 'urn:epcglobal:cbv:bizstep:shipping',
    STAGING_OUTBOUND: 'urn:epcglobal:cbv:bizstep:staging_outbound',
    STOCK_TAKING: 'urn:epcglobal:cbv:bizstep:stock_taking',
    STOCKING: 'urn:epcglobal:cbv:bizstep:stocking',
    STORING: 'urn:epcglobal:cbv:bizstep:storing',
    TRANSPORTING: 'urn:epcglobal:cbv:bizstep:transporting',
    UNLOADING: 'urn:epcglobal:cbv:bizstep:unloading',
    UNPACKING: 'urn:epcglobal:cbv:bizstep:unpacking',
    VOID_SHIPPING: 'urn:epcglobal:cbv:bizstep:void_shipping'
};

export const CBV_DISPOSITIONS = {
    ACTIVE: 'urn:epcglobal:cbv:disp:active',
    CONTAINER_CLOSED: 'urn:epcglobal:cbv:disp:container_closed',
    CONTAINER_OPEN: 'urn:epcglobal:cbv:disp:container_open',
    DAMAGED: 'urn:epcglobal:cbv:disp:damaged',
    DESTROYED: 'urn:epcglobal:cbv:disp:destroyed',
    DISPENSED: 'urn:epcglobal:cbv:disp:dispensed',
    DISPOSED: 'urn:epcglobal:cbv:disp:disposed',
    ENCODED: 'urn:epcglobal:cbv:disp:encoded',
    EXPIRED: 'urn:epcglobal:cbv:disp:expired',
    IN_PROGRESS: 'urn:epcglobal:cbv:disp:in_progress',
    IN_TRANSIT: 'urn:epcglobal:cbv:disp:in_transit',
    INACTIVE: 'urn:epcglobal:cbv:disp:inactive',
    MISMATCH_CLASS: 'urn:epcglobal:cbv:disp:mismatch_class',
    MISMATCH_INSTANCE: 'urn:epcglobal:cbv:disp:mismatch_instance',
    MISMATCH_QUANTITY: 'urn:epcglobal:cbv:disp:mismatch_quantity',
    NEEDS_REPLACEMENT: 'urn:epcglobal:cbv:disp:needs_replacement',
    NON_SELLABLE_OTHER: 'urn:epcglobal:cbv:disp:non_sellable_other',
    PARTIALLY_DISPENSED: 'urn:epcglobal:cbv:disp:partially_dispensed',
    RECALLED: 'urn:epcglobal:cbv:disp:recalled',
    RESERVED: 'urn:epcglobal:cbv:disp:reserved',
    RETAIL_SOLD: 'urn:epcglobal:cbv:disp:retail_sold',
    RETURNED: 'urn:epcglobal:cbv:disp:returned',
    SELLABLE_ACCESSIBLE: 'urn:epcglobal:cbv:disp:sellable_accessible',
    SELLABLE_NOT_ACCESSIBLE: 'urn:epcglobal:cbv:disp:sellable_not_accessible',
    STOLEN: 'urn:epcglobal:cbv:disp:stolen',
    UNKNOWN: 'urn:epcglobal:cbv:disp:unknown'
};

export class EpcisHandler extends EventEmitter {
    private xmlParser: XMLParser;
    private xmlBuilder: XMLBuilder;
    private masterData: Map<string, EpcisMasterData> = new Map();

    constructor() {
        super();
        
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
            textNodeName: '#text',
            parseTagValue: true,
            parseAttributeValue: true
        });

        this.xmlBuilder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
            textNodeName: '#text',
            format: true,
            indentBy: '  '
        });
    }

    // EPCIS DOCUMENT PROCESSING
    public async processEpcisDocument(document: string | EpcisDocument, format: 'XML' | 'JSON' = 'XML'): Promise<EpcisDocument> {
        try {
            logger.info('📄 Processing EPCIS document...');
            
            let epcisDoc: EpcisDocument;
            
            if (typeof document === 'string') {
                epcisDoc = format === 'XML' ? this.parseXmlDocument(document) : JSON.parse(document);
            } else {
                epcisDoc = document;
            }

            // Validate document structure
            this.validateEpcisDocument(epcisDoc);

            // Process master data if present
            if (epcisDoc.epcisHeader?.epcisMasterData) {
                await this.processMasterData(epcisDoc.epcisHeader.epcisMasterData);
            }

            // Process events
            for (const event of epcisDoc.epcisBody.eventList) {
                await this.processEpcisEvent(event);
            }

            logger.info(`✅ EPCIS document processed: ${epcisDoc.epcisBody.eventList.length} events`);
            this.emit('documentProcessed', epcisDoc);

            return epcisDoc;

        } catch (error: any) {
            logger.error('❌ EPCIS document processing failed:', error.message);
            throw error;
        }
    }

    private parseXmlDocument(xmlString: string): EpcisDocument {
        const parsed = this.xmlParser.parse(xmlString);
        
        // Navigate XML structure to extract EPCIS document
        const epcisDoc = parsed['epcis:EPCISDocument'] || parsed.EPCISDocument;
        if (!epcisDoc) {
            throw new Error('Invalid EPCIS XML: Missing EPCISDocument root element');
        }

        return {
            schemaVersion: epcisDoc['@schemaVersion'] || '2.0',
            creationDate: new Date(epcisDoc['@creationDate'] || new Date()),
            epcisBody: {
                eventList: this.parseEventList(epcisDoc.EPCISBody?.EventList || epcisDoc['epcis:EPCISBody']?.EventList)
            },
            epcisHeader: epcisDoc.EPCISHeader ? {
                epcisMasterData: this.parseMasterData(epcisDoc.EPCISHeader.extension?.EPCISMasterData)
            } : undefined
        };
    }

    private parseEventList(eventListXml: any): EpcisEvent[] {
        if (!eventListXml) return [];

        const events: EpcisEvent[] = [];
        
        // Handle different event types
        const eventTypes = ['ObjectEvent', 'AggregationEvent', 'TransactionEvent', 'TransformationEvent'];
        
        for (const eventType of eventTypes) {
            const eventArray = eventListXml[eventType] || eventListXml[`epcis:${eventType}`];
            if (eventArray) {
                const eventList = Array.isArray(eventArray) ? eventArray : [eventArray];
                for (const eventXml of eventList) {
                    const event = this.parseEventXml(eventXml, eventType);
                    events.push(event);
                }
            }
        }

        return events;
    }

    private parseEventXml(eventXml: any, eventType: string): EpcisEvent {
        const baseEvent: EpcisEvent = {
            eventTime: new Date(eventXml.eventTime || eventXml['epcis:eventTime']),
            eventTimeZoneOffset: eventXml.eventTimeZoneOffset || eventXml['epcis:eventTimeZoneOffset'] || '+00:00',
            action: eventXml.action || eventXml['epcis:action'] || 'OBSERVE',
            bizStep: eventXml.bizStep || eventXml['epcis:bizStep'],
            disposition: eventXml.disposition || eventXml['epcis:disposition'],
            readPoint: eventXml.readPoint ? { id: eventXml.readPoint.id } : undefined,
            bizLocation: eventXml.bizLocation ? { id: eventXml.bizLocation.id } : undefined,
            recordTime: eventXml.recordTime ? new Date(eventXml.recordTime) : undefined
        };

        // Parse event-specific fields based on type
        switch (eventType) {
            case 'ObjectEvent':
                return {
                    ...baseEvent,
                    epcList: this.parseEpcList(eventXml.epcList || eventXml['epcis:epcList']),
                    quantityList: this.parseQuantityList(eventXml.quantityList)
                } as EpcisObjectEvent;

            case 'AggregationEvent':
                return {
                    ...baseEvent,
                    parentID: eventXml.parentID || eventXml['epcis:parentID'],
                    childEPCs: this.parseEpcList(eventXml.childEPCs || eventXml['epcis:childEPCs']),
                    childQuantityList: this.parseQuantityList(eventXml.childQuantityList)
                } as EpcisAggregationEvent;

            case 'TransactionEvent':
                return {
                    ...baseEvent,
                    parentID: eventXml.parentID || eventXml['epcis:parentID'],
                    epcList: this.parseEpcList(eventXml.epcList || eventXml['epcis:epcList']),
                    quantityList: this.parseQuantityList(eventXml.quantityList)
                } as EpcisTransactionEvent;

            case 'TransformationEvent':
                return {
                    ...baseEvent,
                    inputEPCList: this.parseEpcList(eventXml.inputEPCList),
                    inputQuantityList: this.parseQuantityList(eventXml.inputQuantityList),
                    outputEPCList: this.parseEpcList(eventXml.outputEPCList),
                    outputQuantityList: this.parseQuantityList(eventXml.outputQuantityList),
                    transformationID: eventXml.transformationID
                } as EpcisTransformationEvent;

            default:
                return baseEvent;
        }
    }

    private parseEpcList(epcListXml: any): string[] {
        if (!epcListXml) return [];
        
        const epcs = epcListXml.epc || epcListXml['epcis:epc'];
        if (!epcs) return [];
        
        return Array.isArray(epcs) ? epcs : [epcs];
    }

    private parseQuantityList(quantityListXml: any): EpcisQuantityElement[] {
        if (!quantityListXml) return [];
        
        const quantities = quantityListXml.quantityElement || quantityListXml['epcis:quantityElement'];
        if (!quantities) return [];
        
        const quantityArray = Array.isArray(quantities) ? quantities : [quantities];
        
        return quantityArray.map((q: any) => ({
            epcClass: q.epcClass || q['epcis:epcClass'],
            quantity: parseFloat(q.quantity || q['epcis:quantity']),
            uom: q.uom || q['epcis:uom']
        }));
    }

    private parseMasterData(masterDataXml: any): EpcisMasterData {
        if (!masterDataXml) {
            return { vocabularyList: [] };
        }

        const vocabularyList = masterDataXml.Vocabulary || masterDataXml['epcis:Vocabulary'] || [];
        const vocabArray = Array.isArray(vocabularyList) ? vocabularyList : [vocabularyList];

        return {
            vocabularyList: vocabArray.map((vocab: any) => ({
                type: vocab['@type'],
                vocabularyElementList: this.parseVocabularyElements(vocab.VocabularyElement)
            }))
        };
    }

    private parseVocabularyElements(elementsXml: any): EpcisVocabularyElement[] {
        if (!elementsXml) return [];
        
        const elements = Array.isArray(elementsXml) ? elementsXml : [elementsXml];
        
        return elements.map((elem: any) => ({
            id: elem['@id'],
            attributes: this.extractAttributes(elem),
            children: elem.children ? (Array.isArray(elem.children) ? elem.children : [elem.children]) : undefined
        }));
    }

    private extractAttributes(xmlElement: any): Record<string, any> {
        const attributes: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(xmlElement)) {
            if (key.startsWith('@') && key !== '@id') {
                attributes[key.substring(1)] = value;
            } else if (!key.startsWith('@') && key !== 'children') {
                attributes[key] = value;
            }
        }
        
        return attributes;
    }

    // EPCIS EVENT PROCESSING
    private async processEpcisEvent(event: EpcisEvent): Promise<void> {
        try {
            // Enrich event with master data
            await this.enrichEventWithMasterData(event);

            // Validate event
            this.validateEpcisEvent(event);

            // Transform to KMP supply chain event
            const kmpEvent = this.transformEpcisToKMP(event);

            // Send to KMP Message Bus
            await this.sendToKMP(kmpEvent);

            logger.debug(`✅ EPCIS event processed and sent to KMP: ${event.eventID || 'NO_ID'}`);
            this.emit('eventProcessed', { epcisEvent: event, kmpEvent });

        } catch (error: any) {
            logger.error('Failed to process EPCIS event:', error.message);
            this.emit('eventError', { event, error: error.message });
        }
    }

    private async enrichEventWithMasterData(event: EpcisEvent): Promise<void> {
        // Add master data context to events
        if (event.readPoint?.id) {
            const readPointData = this.findMasterDataElement('ReadPoint', event.readPoint.id);
            if (readPointData) {
                Object.assign(event.readPoint, readPointData.attributes);
            }
        }

        if (event.bizLocation?.id) {
            const bizLocationData = this.findMasterDataElement('BizLocation', event.bizLocation.id);
            if (bizLocationData) {
                Object.assign(event.bizLocation, bizLocationData.attributes);
            }
        }
    }

    private findMasterDataElement(type: string, id: string): EpcisVocabularyElement | undefined {
        for (const masterData of this.masterData.values()) {
            const vocabulary = masterData.vocabularyList.find(v => v.type === type);
            if (vocabulary) {
                return vocabulary.vocabularyElementList.find(e => e.id === id);
            }
        }
        return undefined;
    }

    private transformEpcisToKMP(event: EpcisEvent): any {
        const baseKmpEvent = {
            timestamp: event.eventTime.toISOString(),
            source: 'EPCIS',
            metadata: {
                epcisEventID: event.eventID,
                eventTimeZoneOffset: event.eventTimeZoneOffset,
                action: event.action,
                bizStep: event.bizStep,
                disposition: event.disposition,
                readPoint: event.readPoint,
                bizLocation: event.bizLocation,
                bizTransactionList: event.bizTransactionList,
                sourceList: event.sourceList,
                destinationList: event.destinationList,
                sensorElementList: event.sensorElementList,
                recordTime: event.recordTime,
                epcisStandard: true
            }
        };

        // Determine KMP event type and product ID based on EPCIS event type
        if ('epcList' in event) {
            const objectEvent = event as EpcisObjectEvent;
            return {
                ...baseKmpEvent,
                productId: this.extractProductIdFromEpc(objectEvent.epcList[0]),
                location: event.bizLocation?.id || event.readPoint?.id || 'UNKNOWN',
                eventType: this.mapBizStepToKMPEventType(event.bizStep, event.action),
                metadata: {
                    ...baseKmpEvent.metadata,
                    epcList: objectEvent.epcList,
                    quantityList: objectEvent.quantityList,
                    eventClass: 'ObjectEvent'
                }
            };
        } else if ('parentID' in event && 'childEPCs' in event) {
            const aggregationEvent = event as EpcisAggregationEvent;
            return {
                ...baseKmpEvent,
                productId: this.extractProductIdFromEpc(aggregationEvent.parentID || aggregationEvent.childEPCs?.[0] || 'UNKNOWN'),
                location: event.bizLocation?.id || event.readPoint?.id || 'UNKNOWN',
                eventType: event.action === 'ADD' ? 'AGGREGATION' : 'DISAGGREGATION',
                metadata: {
                    ...baseKmpEvent.metadata,
                    parentID: aggregationEvent.parentID,
                    childEPCs: aggregationEvent.childEPCs,
                    childQuantityList: aggregationEvent.childQuantityList,
                    eventClass: 'AggregationEvent'
                }
            };
        } else if ('inputEPCList' in event && 'outputEPCList' in event) {
            const transformationEvent = event as EpcisTransformationEvent;
            return {
                ...baseKmpEvent,
                productId: this.extractProductIdFromEpc(transformationEvent.outputEPCList?.[0] || transformationEvent.inputEPCList?.[0] || 'UNKNOWN'),
                location: event.bizLocation?.id || event.readPoint?.id || 'UNKNOWN',
                eventType: 'TRANSFORMATION',
                metadata: {
                    ...baseKmpEvent.metadata,
                    inputEPCList: transformationEvent.inputEPCList,
                    inputQuantityList: transformationEvent.inputQuantityList,
                    outputEPCList: transformationEvent.outputEPCList,
                    outputQuantityList: transformationEvent.outputQuantityList,
                    transformationID: transformationEvent.transformationID,
                    eventClass: 'TransformationEvent'
                }
            };
        } else {
            // Transaction event or unknown
            return {
                ...baseKmpEvent,
                productId: 'TRANSACTION',
                location: event.bizLocation?.id || event.readPoint?.id || 'UNKNOWN',
                eventType: 'TRANSACTION_EVENT',
                metadata: {
                    ...baseKmpEvent.metadata,
                    eventClass: 'TransactionEvent'
                }
            };
        }
    }

    private extractProductIdFromEpc(epc: string): string {
        if (!epc) return 'UNKNOWN';
        
        // Handle different EPC formats
        if (epc.startsWith('urn:epc:id:sgtin:')) {
            // SGTIN format: urn:epc:id:sgtin:companyPrefix.itemRef.serial
            const parts = epc.split(':');
            if (parts.length >= 5) {
                const gtin = parts[4].split('.');
                return `${gtin[0]}.${gtin[1]}`; // Company prefix + item reference
            }
        } else if (epc.startsWith('urn:epc:id:sscc:')) {
            // SSCC format: urn:epc:id:sscc:companyPrefix.serialRef
            const parts = epc.split(':');
            if (parts.length >= 5) {
                return parts[4]; // Full SSCC
            }
        } else if (epc.startsWith('urn:epc:id:grai:')) {
            // GRAI format: urn:epc:id:grai:companyPrefix.assetRef.serial
            const parts = epc.split(':');
            if (parts.length >= 5) {
                const grai = parts[4].split('.');
                return `${grai[0]}.${grai[1]}`; // Company prefix + asset reference
            }
        }
        
        // Return the EPC as-is if format is unknown
        return epc;
    }

    private mapBizStepToKMPEventType(bizStep?: string, action?: string): string {
        if (!bizStep) return 'OBSERVATION';

        const bizStepMap: { [key: string]: string } = {
            [CBV_BUSINESS_STEPS.RECEIVING]: 'GOODS_RECEIPT',
            [CBV_BUSINESS_STEPS.SHIPPING]: 'SHIPMENT_CREATED',
            [CBV_BUSINESS_STEPS.ACCEPTING]: 'QUALITY_APPROVED',
            [CBV_BUSINESS_STEPS.INSPECTING]: 'QUALITY_CHECK',
            [CBV_BUSINESS_STEPS.PACKING]: 'PACKAGING',
            [CBV_BUSINESS_STEPS.UNPACKING]: 'UNPACKAGING',
            [CBV_BUSINESS_STEPS.LOADING]: 'LOADING',
            [CBV_BUSINESS_STEPS.UNLOADING]: 'UNLOADING',
            [CBV_BUSINESS_STEPS.DEPARTING]: 'DEPARTURE',
            [CBV_BUSINESS_STEPS.ARRIVING]: 'ARRIVAL',
            [CBV_BUSINESS_STEPS.STORING]: 'STORAGE',
            [CBV_BUSINESS_STEPS.PICKING]: 'PICKING',
            [CBV_BUSINESS_STEPS.CYCLE_COUNTING]: 'INVENTORY_COUNT',
            [CBV_BUSINESS_STEPS.COMMISSIONING]: 'COMMISSIONING',
            [CBV_BUSINESS_STEPS.DECOMMISSIONING]: 'DECOMMISSIONING',
            [CBV_BUSINESS_STEPS.INSTALLING]: 'INSTALLATION',
            [CBV_BUSINESS_STEPS.REMOVING]: 'REMOVAL',
            [CBV_BUSINESS_STEPS.RETAIL_SELLING]: 'SALE',
            [CBV_BUSINESS_STEPS.DESTROYING]: 'DESTRUCTION',
            [CBV_BUSINESS_STEPS.DISPENSING]: 'DISPENSING'
        };

        return bizStepMap[bizStep] || 'EPCIS_EVENT';
    }

    // EPCIS DOCUMENT GENERATION
    public generateEpcisDocument(events: EpcisEvent[], format: 'XML' | 'JSON' = 'XML'): string {
        const epcisDoc: EpcisDocument = {
            schemaVersion: '2.0',
            creationDate: new Date(),
            epcisBody: {
                eventList: events
            }
        };

        if (format === 'JSON') {
            return JSON.stringify(epcisDoc, null, 2);
        } else {
            return this.generateXmlDocument(epcisDoc);
        }
    }

    private generateXmlDocument(epcisDoc: EpcisDocument): string {
        const xmlDoc = {
            '?xml': {
                '@version': '1.0',
                '@encoding': 'UTF-8'
            },
            'epcis:EPCISDocument': {
                '@xmlns:epcis': 'urn:epcglobal:epcis:xsd:2',
                '@xmlns:cbv': 'urn:epcglobal:cbv:mixin:2',
                '@schemaVersion': epcisDoc.schemaVersion,
                '@creationDate': epcisDoc.creationDate.toISOString(),
                'EPCISBody': {
                    'EventList': this.generateEventListXml(epcisDoc.epcisBody.eventList)
                }
            }
        };

        return this.xmlBuilder.build(xmlDoc);
    }

    private generateEventListXml(events: EpcisEvent[]): any {
        const eventList: any = {};

        for (const event of events) {
            const eventXml = this.generateEventXml(event);
            const eventType = this.determineEventType(event);
            
            if (!eventList[eventType]) {
                eventList[eventType] = [];
            }
            eventList[eventType].push(eventXml);
        }

        return eventList;
    }

    private generateEventXml(event: EpcisEvent): any {
        const baseEventXml: any = {
            eventTime: event.eventTime.toISOString(),
            eventTimeZoneOffset: event.eventTimeZoneOffset,
            action: event.action
        };

        if (event.eventID) baseEventXml.eventID = event.eventID;
        if (event.bizStep) baseEventXml.bizStep = event.bizStep;
        if (event.disposition) baseEventXml.disposition = event.disposition;
        if (event.readPoint) baseEventXml.readPoint = { id: event.readPoint.id };
        if (event.bizLocation) baseEventXml.bizLocation = { id: event.bizLocation.id };
        if (event.recordTime) baseEventXml.recordTime = event.recordTime.toISOString();

        // Add event-specific fields
        if ('epcList' in event) {
            const objectEvent = event as EpcisObjectEvent;
            baseEventXml.epcList = { epc: objectEvent.epcList };
            if (objectEvent.quantityList) {
                baseEventXml.quantityList = {
                    quantityElement: objectEvent.quantityList.map(q => ({
                        epcClass: q.epcClass,
                        quantity: q.quantity,
                        uom: q.uom
                    }))
                };
            }
        } else if ('parentID' in event && 'childEPCs' in event) {
            const aggregationEvent = event as EpcisAggregationEvent;
            if (aggregationEvent.parentID) baseEventXml.parentID = aggregationEvent.parentID;
            if (aggregationEvent.childEPCs) baseEventXml.childEPCs = { epc: aggregationEvent.childEPCs };
        } else if ('inputEPCList' in event) {
            const transformationEvent = event as EpcisTransformationEvent;
            if (transformationEvent.inputEPCList) baseEventXml.inputEPCList = { epc: transformationEvent.inputEPCList };
            if (transformationEvent.outputEPCList) baseEventXml.outputEPCList = { epc: transformationEvent.outputEPCList };
            if (transformationEvent.transformationID) baseEventXml.transformationID = transformationEvent.transformationID;
        }

        return baseEventXml;
    }

    private determineEventType(event: EpcisEvent): string {
        if ('epcList' in event) return 'ObjectEvent';
        if ('parentID' in event && 'childEPCs' in event) return 'AggregationEvent';
        if ('inputEPCList' in event && 'outputEPCList' in event) return 'TransformationEvent';
        return 'TransactionEvent';
    }

    // VALIDATION
    private validateEpcisDocument(document: EpcisDocument): void {
        if (!document.epcisBody || !document.epcisBody.eventList) {
            throw new Error('Invalid EPCIS document: Missing event list');
        }

        if (!Array.isArray(document.epcisBody.eventList)) {
            throw new Error('Invalid EPCIS document: Event list must be an array');
        }

        for (const event of document.epcisBody.eventList) {
            this.validateEpcisEvent(event);
        }
    }

    private validateEpcisEvent(event: EpcisEvent): void {
        if (!event.eventTime) {
            throw new Error('Invalid EPCIS event: Missing eventTime');
        }

        if (!event.eventTimeZoneOffset) {
            throw new Error('Invalid EPCIS event: Missing eventTimeZoneOffset');
        }

        if (!['ADD', 'OBSERVE', 'DELETE'].includes(event.action)) {
            throw new Error(`Invalid EPCIS event: Invalid action '${event.action}'`);
        }

        // Validate event-specific fields
        if ('epcList' in event) {
            const objectEvent = event as EpcisObjectEvent;
            if (!objectEvent.epcList || objectEvent.epcList.length === 0) {
                throw new Error('Invalid ObjectEvent: Missing or empty epcList');
            }
        }
    }

    // MASTER DATA PROCESSING
    private async processMasterData(masterData: EpcisMasterData): Promise<void> {
        const key = `masterdata-${Date.now()}`;
        this.masterData.set(key, masterData);
        
        logger.info(`📚 Processed master data: ${masterData.vocabularyList.length} vocabularies`);
        this.emit('masterDataProcessed', masterData);
    }

    // KMP INTEGRATION
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
            logger.debug(`✅ EPCIS event sent to KMP blockchain: ${result.transactionId}`);
            
        } catch (error: any) {
            logger.error('Failed to send EPCIS event to KMP:', error.message);
            throw error;
        }
    }

    // QUERY CAPABILITIES
    public queryEvents(criteria: {
        eventType?: string;
        epc?: string;
        bizStep?: string;
        bizLocation?: string;
        timeFrom?: Date;
        timeTo?: Date;
    }): EpcisEvent[] {
        // This would typically query a database
        // For now, return empty array as placeholder
        return [];
    }

    // SUBSCRIPTION MANAGEMENT
    public subscribe(subscription: {
        dest: string;
        schedule?: string;
        trigger?: string;
        queryParams?: any;
    }): string {
        const subscriptionId = `sub-${Date.now()}`;
        logger.info(`📧 Created EPCIS subscription: ${subscriptionId}`);
        return subscriptionId;
    }

    public unsubscribe(subscriptionId: string): void {
        logger.info(`🚫 Unsubscribed from EPCIS: ${subscriptionId}`);
    }

    // UTILITY METHODS
    public createObjectEvent(options: {
        epcList: string[];
        action: 'ADD' | 'OBSERVE' | 'DELETE';
        bizStep?: string;
        disposition?: string;
        readPoint?: string;
        bizLocation?: string;
        eventTime?: Date;
        eventTimeZoneOffset?: string;
    }): EpcisObjectEvent {
        return {
            epcList: options.epcList,
            eventTime: options.eventTime || new Date(),
            eventTimeZoneOffset: options.eventTimeZoneOffset || '+00:00',
            action: options.action,
            bizStep: options.bizStep,
            disposition: options.disposition,
            readPoint: options.readPoint ? { id: options.readPoint } : undefined,
            bizLocation: options.bizLocation ? { id: options.bizLocation } : undefined
        };
    }

    public createAggregationEvent(options: {
        parentID?: string;
        childEPCs?: string[];
        action: 'ADD' | 'OBSERVE' | 'DELETE';
        bizStep?: string;
        disposition?: string;
        readPoint?: string;
        bizLocation?: string;
        eventTime?: Date;
        eventTimeZoneOffset?: string;
    }): EpcisAggregationEvent {
        return {
            parentID: options.parentID,
            childEPCs: options.childEPCs,
            eventTime: options.eventTime || new Date(),
            eventTimeZoneOffset: options.eventTimeZoneOffset || '+00:00',
            action: options.action,
            bizStep: options.bizStep,
            disposition: options.disposition,
            readPoint: options.readPoint ? { id: options.readPoint } : undefined,
            bizLocation: options.bizLocation ? { id: options.bizLocation } : undefined
        };
    }

    public generateEPC(format: 'SGTIN' | 'SSCC' | 'GRAI', options: {
        companyPrefix: string;
        itemRef?: string;
        serialNumber?: string;
        assetRef?: string;
    }): string {
        switch (format) {
            case 'SGTIN':
                return `urn:epc:id:sgtin:${options.companyPrefix}.${options.itemRef}.${options.serialNumber}`;
            case 'SSCC':
                return `urn:epc:id:sscc:${options.companyPrefix}.${options.serialNumber}`;
            case 'GRAI':
                return `urn:epc:id:grai:${options.companyPrefix}.${options.assetRef}.${options.serialNumber}`;
            default:
                throw new Error(`Unsupported EPC format: ${format}`);
        }
    }

    public getMasterData(): Map<string, EpcisMasterData> {
        return this.masterData;
    }

    public clearMasterData(): void {
        this.masterData.clear();
    }
} 