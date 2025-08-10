/**
 * EDGE DEVICE MANAGER - CRITICAL FOR REAL-WORLD DEPLOYMENT
 * Handles: Device registration, OTA updates, heartbeat monitoring, offline sync
 * Supports: Scanners, tablets, Raspberry Pi, embedded devices, IoT sensors
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import cron from 'node-cron';
import crypto from 'crypto';

export interface DeviceInfo {
    deviceId: string;
    deviceType: 'SCANNER' | 'TABLET' | 'RASPBERRY_PI' | 'EMBEDDED' | 'GATEWAY' | 'SENSOR';
    deviceName: string;
    location: string;
    companyId: string;
    macAddress: string;
    ipAddress: string;
    firmwareVersion: string;
    hardwareVersion: string;
    operatingSystem: string;
    batteryLevel?: number;
    signalStrength?: number;
    lastSeen: Date;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
    capabilities: DeviceCapability[];
    configuration: DeviceConfiguration;
}

export interface DeviceCapability {
    type: 'BARCODE_SCAN' | 'RFID_READ' | 'NFC' | 'CAMERA' | 'GPS' | 'WIFI' | 'CELLULAR' | 'BLUETOOTH' | 'SENSORS';
    enabled: boolean;
    version?: string;
    configuration?: any;
}

export interface DeviceConfiguration {
    scanningMode: 'CONTINUOUS' | 'TRIGGERED' | 'BATCH';
    syncInterval: number; // minutes
    offlineStorageLimit: number; // MB
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    autoUpdateEnabled: boolean;
    debugMode: boolean;
    customSettings: Record<string, any>;
}

export interface DeviceHeartbeat {
    deviceId: string;
    timestamp: Date;
    batteryLevel?: number;
    signalStrength?: number;
    memoryUsage: number;
    storageUsage: number;
    cpuUsage: number;
    networkStatus: 'CONNECTED' | 'DISCONNECTED' | 'LIMITED';
    lastSyncTime?: Date;
    errorCount: number;
    warningCount: number;
    pendingUpdates: boolean;
}

export interface OTAUpdate {
    updateId: string;
    deviceId?: string; // null for all devices
    deviceType?: string;
    version: string;
    releaseNotes: string;
    packageUrl: string;
    packageSize: number;
    packageHash: string;
    mandatory: boolean;
    rolloutPercentage: number;
    createdAt: Date;
    scheduledAt?: Date;
    status: 'PENDING' | 'DEPLOYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    targetDevices: string[];
    completedDevices: string[];
    failedDevices: string[];
}

export interface OfflineQueue {
    deviceId: string;
    queuedEvents: OfflineEvent[];
    totalSize: number; // bytes
    lastSync: Date;
    syncInProgress: boolean;
}

export interface OfflineEvent {
    eventId: string;
    timestamp: Date;
    eventType: string;
    data: any;
    retryCount: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    size: number; // bytes
}

export class EdgeDeviceManager extends EventEmitter {
    private io: SocketIOServer;
    private activeDevices: Map<string, DeviceInfo> = new Map();
    private deviceSockets: Map<string, Socket> = new Map();
    private deviceHeartbeats: Map<string, DeviceHeartbeat> = new Map();
    private otaUpdates: Map<string, OTAUpdate> = new Map();
    private offlineQueues: Map<string, OfflineQueue> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(io: SocketIOServer) {
        super();
        this.io = io;
        this.startHeartbeatMonitoring();
        this.scheduleMaintenanceTasks();
    }

    // DEVICE REGISTRATION & MANAGEMENT
    public async registerDevice(socketId: string, deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
        try {
            const deviceId = deviceInfo.deviceId || this.generateDeviceId(deviceInfo);
            
            const fullDeviceInfo: DeviceInfo = {
                deviceId,
                deviceType: deviceInfo.deviceType || 'SCANNER',
                deviceName: deviceInfo.deviceName || `Device-${deviceId.slice(-4)}`,
                location: deviceInfo.location || 'UNKNOWN',
                companyId: deviceInfo.companyId || 'DEFAULT',
                macAddress: deviceInfo.macAddress || '',
                ipAddress: deviceInfo.ipAddress || '',
                firmwareVersion: deviceInfo.firmwareVersion || '1.0.0',
                hardwareVersion: deviceInfo.hardwareVersion || '1.0.0',
                operatingSystem: deviceInfo.operatingSystem || 'UNKNOWN',
                batteryLevel: deviceInfo.batteryLevel,
                signalStrength: deviceInfo.signalStrength,
                lastSeen: new Date(),
                status: 'ONLINE',
                capabilities: deviceInfo.capabilities || this.getDefaultCapabilities(deviceInfo.deviceType || 'SCANNER'),
                configuration: deviceInfo.configuration || this.getDefaultConfiguration()
            };

            // Store the device
            this.activeDevices.set(deviceId, fullDeviceInfo);
            
            // Map socket to device
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                this.deviceSockets.set(deviceId, socket);
                socket.data.deviceId = deviceId;
                
                // Set up device-specific event handlers
                this.setupDeviceEventHandlers(socket, fullDeviceInfo);
            }

            // Initialize offline queue if not exists
            if (!this.offlineQueues.has(deviceId)) {
                this.offlineQueues.set(deviceId, {
                    deviceId,
                    queuedEvents: [],
                    totalSize: 0,
                    lastSync: new Date(),
                    syncInProgress: false
                });
            }

            // Check for pending OTA updates
            await this.checkPendingUpdates(deviceId);

            logger.info(`✅ Device registered: ${deviceId} (${fullDeviceInfo.deviceType}) at ${fullDeviceInfo.location}`);
            
            this.emit('deviceRegistered', fullDeviceInfo);
            
            return fullDeviceInfo;
            
        } catch (error: any) {
            logger.error('Failed to register device:', error.message);
            throw error;
        }
    }

    public async unregisterDevice(socketId: string): Promise<void> {
        try {
            const socket = this.io.sockets.sockets.get(socketId);
            const deviceId = socket?.data?.deviceId;
            
            if (deviceId) {
                const device = this.activeDevices.get(deviceId);
                if (device) {
                    device.status = 'OFFLINE';
                    device.lastSeen = new Date();
                    
                    // Keep device info but remove socket mapping
                    this.deviceSockets.delete(deviceId);
                    
                    logger.info(`📱 Device disconnected: ${deviceId}`);
                    this.emit('deviceDisconnected', device);
                }
            }
            
        } catch (error: any) {
            logger.error('Failed to unregister device:', error.message);
        }
    }

    private setupDeviceEventHandlers(socket: Socket, device: DeviceInfo): void {
        // Heartbeat handling
        socket.on('heartbeat', (heartbeat: Partial<DeviceHeartbeat>) => {
            this.processHeartbeat(device.deviceId, heartbeat);
        });

        // Scan data handling
        socket.on('scan:data', (scanData: any) => {
            this.processScanData(device.deviceId, scanData);
        });

        // Offline sync request
        socket.on('sync:request', (syncRequest: any) => {
            this.processOfflineSync(device.deviceId, syncRequest);
        });

        // OTA update response
        socket.on('update:response', (updateResponse: any) => {
            this.processUpdateResponse(device.deviceId, updateResponse);
        });

        // Configuration update acknowledgment
        socket.on('config:ack', (configAck: any) => {
            this.processConfigurationAck(device.deviceId, configAck);
        });

        // Error reporting
        socket.on('error:report', (errorReport: any) => {
            this.processErrorReport(device.deviceId, errorReport);
        });
    }

    // HEARTBEAT MONITORING
    private startHeartbeatMonitoring(): void {
        this.heartbeatInterval = setInterval(() => {
            this.checkDeviceHeartbeats();
        }, 30000); // Check every 30 seconds
    }

    private processHeartbeat(deviceId: string, heartbeat: Partial<DeviceHeartbeat>): void {
        const device = this.activeDevices.get(deviceId);
        if (!device) return;

        const fullHeartbeat: DeviceHeartbeat = {
            deviceId,
            timestamp: new Date(),
            batteryLevel: heartbeat.batteryLevel,
            signalStrength: heartbeat.signalStrength,
            memoryUsage: heartbeat.memoryUsage || 0,
            storageUsage: heartbeat.storageUsage || 0,
            cpuUsage: heartbeat.cpuUsage || 0,
            networkStatus: heartbeat.networkStatus || 'CONNECTED',
            lastSyncTime: heartbeat.lastSyncTime,
            errorCount: heartbeat.errorCount || 0,
            warningCount: heartbeat.warningCount || 0,
            pendingUpdates: heartbeat.pendingUpdates || false
        };

        // Update device info
        device.lastSeen = fullHeartbeat.timestamp;
        device.batteryLevel = fullHeartbeat.batteryLevel;
        device.signalStrength = fullHeartbeat.signalStrength;
        device.status = 'ONLINE';

        // Store heartbeat
        this.deviceHeartbeats.set(deviceId, fullHeartbeat);

        // Check for alerts
        this.checkDeviceAlerts(device, fullHeartbeat);

        this.emit('heartbeat', { device, heartbeat: fullHeartbeat });
    }

    private checkDeviceHeartbeats(): void {
        const now = new Date();
        const timeout = 5 * 60 * 1000; // 5 minutes

        for (const [deviceId, device] of this.activeDevices) {
            const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
            
            if (timeSinceLastSeen > timeout && device.status === 'ONLINE') {
                device.status = 'OFFLINE';
                logger.warn(`📱 Device timeout: ${deviceId} (${timeSinceLastSeen}ms since last seen)`);
                this.emit('deviceTimeout', device);
            }
        }
    }

    private checkDeviceAlerts(device: DeviceInfo, heartbeat: DeviceHeartbeat): void {
        const alerts: string[] = [];

        // Battery alerts
        if (heartbeat.batteryLevel && heartbeat.batteryLevel < 20) {
            alerts.push(`Low battery: ${heartbeat.batteryLevel}%`);
        }

        // Signal strength alerts
        if (heartbeat.signalStrength && heartbeat.signalStrength < -80) {
            alerts.push(`Weak signal: ${heartbeat.signalStrength} dBm`);
        }

        // Memory alerts
        if (heartbeat.memoryUsage > 90) {
            alerts.push(`High memory usage: ${heartbeat.memoryUsage}%`);
        }

        // Storage alerts
        if (heartbeat.storageUsage > 85) {
            alerts.push(`High storage usage: ${heartbeat.storageUsage}%`);
        }

        // Error alerts
        if (heartbeat.errorCount > 0) {
            alerts.push(`${heartbeat.errorCount} error(s) reported`);
        }

        if (alerts.length > 0) {
            this.emit('deviceAlert', { device, alerts, heartbeat });
        }
    }

    // OTA UPDATE MANAGEMENT
    public async createOTAUpdate(update: Partial<OTAUpdate>): Promise<OTAUpdate> {
        const updateId = crypto.randomUUID();
        
        const fullUpdate: OTAUpdate = {
            updateId,
            deviceId: update.deviceId,
            deviceType: update.deviceType,
            version: update.version || '1.0.0',
            releaseNotes: update.releaseNotes || '',
            packageUrl: update.packageUrl || '',
            packageSize: update.packageSize || 0,
            packageHash: update.packageHash || '',
            mandatory: update.mandatory || false,
            rolloutPercentage: update.rolloutPercentage || 100,
            createdAt: new Date(),
            scheduledAt: update.scheduledAt,
            status: 'PENDING',
            targetDevices: update.targetDevices || [],
            completedDevices: [],
            failedDevices: []
        };

        // Determine target devices
        if (!update.deviceId && !update.targetDevices?.length) {
            // Target all devices of specified type or all devices
            for (const device of this.activeDevices.values()) {
                if (!update.deviceType || device.deviceType === update.deviceType) {
                    fullUpdate.targetDevices.push(device.deviceId);
                }
            }
        } else if (update.deviceId) {
            fullUpdate.targetDevices = [update.deviceId];
        }

        this.otaUpdates.set(updateId, fullUpdate);
        
        logger.info(`🔄 Created OTA update ${updateId} for ${fullUpdate.targetDevices.length} devices`);
        
        // Start deployment if not scheduled
        if (!fullUpdate.scheduledAt) {
            await this.deployOTAUpdate(updateId);
        }

        return fullUpdate;
    }

    private async deployOTAUpdate(updateId: string): Promise<void> {
        const update = this.otaUpdates.get(updateId);
        if (!update) return;

        update.status = 'DEPLOYING';
        
        const rolloutCount = Math.ceil(update.targetDevices.length * (update.rolloutPercentage / 100));
        const deploymentDevices = update.targetDevices.slice(0, rolloutCount);

        for (const deviceId of deploymentDevices) {
            const socket = this.deviceSockets.get(deviceId);
            if (socket) {
                socket.emit('update:available', {
                    updateId,
                    version: update.version,
                    releaseNotes: update.releaseNotes,
                    packageUrl: update.packageUrl,
                    packageSize: update.packageSize,
                    packageHash: update.packageHash,
                    mandatory: update.mandatory
                });
                
                logger.info(`📤 Sent OTA update ${updateId} to device ${deviceId}`);
            }
        }

        this.emit('otaUpdateDeployed', update);
    }

    private async checkPendingUpdates(deviceId: string): Promise<void> {
        for (const update of this.otaUpdates.values()) {
            if (update.targetDevices.includes(deviceId) && 
                update.status === 'DEPLOYING' && 
                !update.completedDevices.includes(deviceId) &&
                !update.failedDevices.includes(deviceId)) {
                
                const socket = this.deviceSockets.get(deviceId);
                if (socket) {
                    socket.emit('update:available', {
                        updateId: update.updateId,
                        version: update.version,
                        releaseNotes: update.releaseNotes,
                        packageUrl: update.packageUrl,
                        packageSize: update.packageSize,
                        packageHash: update.packageHash,
                        mandatory: update.mandatory
                    });
                }
            }
        }
    }

    private processUpdateResponse(deviceId: string, response: any): void {
        const update = this.otaUpdates.get(response.updateId);
        if (!update) return;

        if (response.status === 'COMPLETED') {
            update.completedDevices.push(deviceId);
            logger.info(`✅ OTA update ${response.updateId} completed on device ${deviceId}`);
        } else if (response.status === 'FAILED') {
            update.failedDevices.push(deviceId);
            logger.error(`❌ OTA update ${response.updateId} failed on device ${deviceId}: ${response.error}`);
        }

        // Check if update is complete
        const totalResponses = update.completedDevices.length + update.failedDevices.length;
        if (totalResponses >= update.targetDevices.length) {
            update.status = update.failedDevices.length === 0 ? 'COMPLETED' : 'FAILED';
            this.emit('otaUpdateCompleted', update);
        }
    }

    // OFFLINE SYNC MANAGEMENT
    public async queueOfflineEvent(deviceId: string, event: Partial<OfflineEvent>): Promise<void> {
        const queue = this.offlineQueues.get(deviceId);
        if (!queue) return;

        const fullEvent: OfflineEvent = {
            eventId: crypto.randomUUID(),
            timestamp: event.timestamp || new Date(),
            eventType: event.eventType || 'UNKNOWN',
            data: event.data || {},
            retryCount: 0,
            priority: event.priority || 'MEDIUM',
            size: JSON.stringify(event.data).length
        };

        queue.queuedEvents.push(fullEvent);
        queue.totalSize += fullEvent.size;

        // Check storage limits
        const device = this.activeDevices.get(deviceId);
        const storageLimit = device?.configuration.offlineStorageLimit || 10; // MB
        
        if (queue.totalSize > storageLimit * 1024 * 1024) {
            // Remove oldest low-priority events
            this.pruneOfflineQueue(queue, storageLimit);
        }

        logger.debug(`📤 Queued offline event for device ${deviceId}: ${fullEvent.eventType}`);
        this.emit('offlineEventQueued', { deviceId, event: fullEvent });
    }

    private async processOfflineSync(deviceId: string, syncRequest: any): Promise<void> {
        const queue = this.offlineQueues.get(deviceId);
        if (!queue || queue.syncInProgress) return;

        queue.syncInProgress = true;

        try {
            const socket = this.deviceSockets.get(deviceId);
            if (!socket) return;

            // Process queued events in batches
            const batchSize = 50;
            const events = [...queue.queuedEvents];
            
            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                
                // Send batch to KMP Message Bus
                for (const event of batch) {
                    try {
                        await this.syncEventToKMP(event);
                        
                        // Remove from queue
                        const index = queue.queuedEvents.findIndex(e => e.eventId === event.eventId);
                        if (index > -1) {
                            const removedEvent = queue.queuedEvents.splice(index, 1)[0];
                            queue.totalSize -= removedEvent.size;
                        }
                        
                    } catch (error: any) {
                        event.retryCount++;
                        if (event.retryCount > 3) {
                            // Remove failed events after 3 retries
                            const index = queue.queuedEvents.findIndex(e => e.eventId === event.eventId);
                            if (index > -1) {
                                const removedEvent = queue.queuedEvents.splice(index, 1)[0];
                                queue.totalSize -= removedEvent.size;
                            }
                        }
                        logger.error(`Failed to sync event ${event.eventId}:`, error.message);
                    }
                }
            }

            queue.lastSync = new Date();
            
            // Send sync confirmation to device
            socket.emit('sync:complete', {
                syncedCount: events.length - queue.queuedEvents.length,
                failedCount: queue.queuedEvents.length,
                lastSync: queue.lastSync
            });

            logger.info(`✅ Offline sync completed for device ${deviceId}: ${events.length - queue.queuedEvents.length} events synced`);
            
        } finally {
            queue.syncInProgress = false;
        }
    }

    private async syncEventToKMP(event: OfflineEvent): Promise<void> {
        // Transform offline event to KMP supply chain event
        const kmpEvent = {
            productId: event.data.productId || event.data.barcode || 'UNKNOWN',
            location: event.data.location || 'UNKNOWN',
            eventType: this.mapOfflineEventToKMP(event.eventType),
            metadata: {
                ...event.data,
                offlineEvent: true,
                originalTimestamp: event.timestamp,
                syncTimestamp: new Date(),
                deviceSource: true,
                priority: event.priority
            }
        };

        // Send to KMP Message Bus
        await fetch(`${process.env.KMP_MESSAGE_BUS_URL}/api/supply-chain/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.KMP_API_TOKEN}`
            },
            body: JSON.stringify(kmpEvent)
        });
    }

    private mapOfflineEventToKMP(eventType: string): string {
        const eventMap: { [key: string]: string } = {
            'SCAN': 'BARCODE_SCAN',
            'RFID_READ': 'RFID_SCAN',
            'LOCATION_UPDATE': 'LOCATION_UPDATE',
            'QUALITY_CHECK': 'QUALITY_CHECK',
            'TEMPERATURE_READING': 'TEMPERATURE_LOG',
            'DAMAGE_REPORT': 'DAMAGE_REPORT',
            'INVENTORY_COUNT': 'INVENTORY_COUNT'
        };
        
        return eventMap[eventType] || eventType;
    }

    private pruneOfflineQueue(queue: OfflineQueue, limitMB: number): void {
        const limit = limitMB * 1024 * 1024;
        
        // Sort by priority and timestamp (keep high priority and recent events)
        queue.queuedEvents.sort((a, b) => {
            const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            
            return b.timestamp.getTime() - a.timestamp.getTime(); // Newer first
        });

        // Remove events until under limit
        while (queue.totalSize > limit && queue.queuedEvents.length > 0) {
            const removedEvent = queue.queuedEvents.pop();
            if (removedEvent) {
                queue.totalSize -= removedEvent.size;
            }
        }
    }

    // DEVICE CONFIGURATION
    public async updateDeviceConfiguration(deviceId: string, config: Partial<DeviceConfiguration>): Promise<void> {
        const device = this.activeDevices.get(deviceId);
        if (!device) throw new Error(`Device ${deviceId} not found`);

        // Update configuration
        device.configuration = { ...device.configuration, ...config };

        // Send to device if online
        const socket = this.deviceSockets.get(deviceId);
        if (socket) {
            socket.emit('config:update', device.configuration);
        }

        logger.info(`🔧 Updated configuration for device ${deviceId}`);
        this.emit('configurationUpdated', { deviceId, configuration: device.configuration });
    }

    private processConfigurationAck(deviceId: string, ack: any): void {
        logger.info(`✅ Configuration acknowledged by device ${deviceId}`);
        this.emit('configurationAcknowledged', { deviceId, ack });
    }

    // ERROR HANDLING
    private processScanData(deviceId: string, scanData: any): void {
        // Process real-time scan data
        logger.info(`📱 Scan data from device ${deviceId}: ${scanData.barcode || scanData.rfid}`);
        
        // Send to KMP immediately if online, otherwise queue
        if (scanData.online !== false) {
            this.syncEventToKMP({
                eventId: crypto.randomUUID(),
                timestamp: new Date(),
                eventType: 'SCAN',
                data: scanData,
                retryCount: 0,
                priority: 'MEDIUM',
                size: JSON.stringify(scanData).length
            }).catch(() => {
                // Queue if sync fails
                this.queueOfflineEvent(deviceId, {
                    eventType: 'SCAN',
                    data: scanData,
                    priority: 'MEDIUM'
                });
            });
        } else {
            this.queueOfflineEvent(deviceId, {
                eventType: 'SCAN',
                data: scanData,
                priority: 'MEDIUM'
            });
        }

        this.emit('scanData', { deviceId, scanData });
    }

    private processErrorReport(deviceId: string, errorReport: any): void {
        logger.error(`🚨 Error report from device ${deviceId}:`, errorReport);
        
        const device = this.activeDevices.get(deviceId);
        if (device && errorReport.severity === 'CRITICAL') {
            device.status = 'ERROR';
        }

        this.emit('deviceError', { deviceId, errorReport, device });
    }

    // MAINTENANCE TASKS
    private scheduleMaintenanceTasks(): void {
        // Clean up old heartbeats (every hour)
        cron.schedule('0 * * * *', () => {
            this.cleanupOldHeartbeats();
        });

        // Force sync offline queues (every 15 minutes)
        cron.schedule('*/15 * * * *', () => {
            this.forceSyncOfflineQueues();
        });

        // Check for scheduled OTA updates (every minute)
        cron.schedule('* * * * *', () => {
            this.checkScheduledUpdates();
        });
    }

    private cleanupOldHeartbeats(): void {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        for (const [deviceId, heartbeat] of this.deviceHeartbeats) {
            if (heartbeat.timestamp < cutoff) {
                this.deviceHeartbeats.delete(deviceId);
            }
        }
    }

    private async forceSyncOfflineQueues(): Promise<void> {
        for (const [deviceId, queue] of this.offlineQueues) {
            if (queue.queuedEvents.length > 0 && !queue.syncInProgress) {
                const device = this.activeDevices.get(deviceId);
                if (device?.status === 'ONLINE') {
                    await this.processOfflineSync(deviceId, { force: true });
                }
            }
        }
    }

    private async checkScheduledUpdates(): Promise<void> {
        const now = new Date();
        
        for (const update of this.otaUpdates.values()) {
            if (update.status === 'PENDING' && update.scheduledAt && update.scheduledAt <= now) {
                await this.deployOTAUpdate(update.updateId);
            }
        }
    }

    // UTILITY METHODS
    private generateDeviceId(deviceInfo: Partial<DeviceInfo>): string {
        const prefix = deviceInfo.deviceType?.substring(0, 3).toUpperCase() || 'DEV';
        const hash = crypto.createHash('sha256')
            .update(deviceInfo.macAddress || deviceInfo.deviceName || Math.random().toString())
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();
        
        return `${prefix}-${hash}`;
    }

    private getDefaultCapabilities(deviceType: string): DeviceCapability[] {
        const capabilityMap: { [key: string]: DeviceCapability[] } = {
            'SCANNER': [
                { type: 'BARCODE_SCAN', enabled: true },
                { type: 'WIFI', enabled: true },
                { type: 'BLUETOOTH', enabled: false }
            ],
            'TABLET': [
                { type: 'BARCODE_SCAN', enabled: true },
                { type: 'CAMERA', enabled: true },
                { type: 'GPS', enabled: true },
                { type: 'WIFI', enabled: true },
                { type: 'CELLULAR', enabled: false }
            ],
            'RASPBERRY_PI': [
                { type: 'BARCODE_SCAN', enabled: true },
                { type: 'RFID_READ', enabled: false },
                { type: 'SENSORS', enabled: true },
                { type: 'WIFI', enabled: true }
            ],
            'EMBEDDED': [
                { type: 'SENSORS', enabled: true },
                { type: 'WIFI', enabled: true }
            ]
        };
        
        return capabilityMap[deviceType] || capabilityMap['SCANNER'];
    }

    private getDefaultConfiguration(): DeviceConfiguration {
        return {
            scanningMode: 'TRIGGERED',
            syncInterval: 15, // minutes
            offlineStorageLimit: 10, // MB
            compressionEnabled: true,
            encryptionEnabled: true,
            autoUpdateEnabled: true,
            debugMode: false,
            customSettings: {}
        };
    }

    // PUBLIC API METHODS
    public getActiveDeviceCount(): number {
        return Array.from(this.activeDevices.values()).filter(d => d.status === 'ONLINE').length;
    }

    public getAllDevices(): DeviceInfo[] {
        return Array.from(this.activeDevices.values());
    }

    public getDevice(deviceId: string): DeviceInfo | undefined {
        return this.activeDevices.get(deviceId);
    }

    public getDevicesByCompany(companyId: string): DeviceInfo[] {
        return Array.from(this.activeDevices.values()).filter(d => d.companyId === companyId);
    }

    public getDevicesByLocation(location: string): DeviceInfo[] {
        return Array.from(this.activeDevices.values()).filter(d => d.location === location);
    }

    public getOfflineQueueStatus(deviceId: string): OfflineQueue | undefined {
        return this.offlineQueues.get(deviceId);
    }

    public getOTAUpdateStatus(updateId: string): OTAUpdate | undefined {
        return this.otaUpdates.get(updateId);
    }

    public async shutdown(): Promise<void> {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Gracefully disconnect all devices
        for (const socket of this.deviceSockets.values()) {
            socket.disconnect();
        }
        
        logger.info('🛑 Edge Device Manager shutdown complete');
    }
} 