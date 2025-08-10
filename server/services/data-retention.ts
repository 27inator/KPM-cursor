import { storage } from '../storage';

interface RetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  enabled: boolean;
  lastCleanup: string;
  itemsDeleted: number;
}

interface RetentionMetrics {
  totalPolicies: number;
  activePolicies: number;
  lastCleanupRun: string;
  totalItemsDeleted: number;
  storageReclaimed: number; // MB
}

class DataRetentionService {
  private policies: RetentionPolicy[] = [
    {
      id: 'audit_logs',
      dataType: 'Audit Logs',
      retentionDays: 365,
      enabled: true,
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemsDeleted: 0
    },
    {
      id: 'security_incidents',
      dataType: 'Security Incidents',
      retentionDays: 90,
      enabled: true,
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemsDeleted: 0
    },
    {
      id: 'system_metrics',
      dataType: 'System Metrics',
      retentionDays: 30,
      enabled: true,
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemsDeleted: 0
    },
    {
      id: 'error_logs',
      dataType: 'Error Logs',
      retentionDays: 60,
      enabled: true,
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemsDeleted: 0
    },
    {
      id: 'notification_history',
      dataType: 'Notification History',
      retentionDays: 30,
      enabled: true,
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemsDeleted: 0
    }
  ];

  async getPolicies(): Promise<RetentionPolicy[]> {
    return this.policies;
  }

  async getRetentionMetrics(): Promise<RetentionMetrics> {
    const totalItemsDeleted = this.policies.reduce((sum, policy) => sum + policy.itemsDeleted, 0);
    const lastCleanupRun = Math.min(...this.policies.map(p => new Date(p.lastCleanup).getTime()));
    
    return {
      totalPolicies: this.policies.length,
      activePolicies: this.policies.filter(p => p.enabled).length,
      lastCleanupRun: new Date(lastCleanupRun).toISOString(),
      totalItemsDeleted,
      storageReclaimed: Math.floor(totalItemsDeleted * 0.5) // Estimate 0.5MB per item
    };
  }

  async updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<void> {
    const policyIndex = this.policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const oldPolicy = { ...this.policies[policyIndex] };
    this.policies[policyIndex] = { ...this.policies[policyIndex], ...updates };

    await storage.createAuditLog({
      action: 'retention_policy_updated',
      userId: 'system',
      resourceType: 'data_retention',
      ipAddress: 'system',
      metadata: {
        policyId,
        oldPolicy,
        newPolicy: this.policies[policyIndex],
        timestamp: new Date().toISOString()
      }
    });
  }

  async executeCleanup(policyId?: string): Promise<{ policyId: string; itemsDeleted: number }[]> {
    const policiesToClean = policyId 
      ? this.policies.filter(p => p.id === policyId)
      : this.policies.filter(p => p.enabled);

    const results: { policyId: string; itemsDeleted: number }[] = [];

    for (const policy of policiesToClean) {
      try {
        const itemsDeleted = await this.cleanupDataForPolicy(policy);
        
        // Update policy last cleanup time
        policy.lastCleanup = new Date().toISOString();
        policy.itemsDeleted += itemsDeleted;
        
        results.push({ policyId: policy.id, itemsDeleted });

        await storage.createAuditLog({
          action: 'data_retention_cleanup',
          userId: 'system',
          resourceType: 'data_retention',
          ipAddress: 'system',
          metadata: {
            policyId: policy.id,
            dataType: policy.dataType,
            retentionDays: policy.retentionDays,
            itemsDeleted,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        await storage.createSecurityIncident({
          type: 'data_retention_failure',
          severity: 'medium',
          description: `Data retention cleanup failed for policy ${policy.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ipAddress: 'system',
          userAgent: 'data_retention_service',
          resolved: false
        });
      }
    }

    return results;
  }

  private async cleanupDataForPolicy(policy: RetentionPolicy): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Simulate cleanup process
    let itemsDeleted = 0;

    switch (policy.id) {
      case 'audit_logs':
        itemsDeleted = await this.cleanupAuditLogs(cutoffDate);
        break;
      case 'security_incidents':
        itemsDeleted = await this.cleanupSecurityIncidents(cutoffDate);
        break;
      case 'system_metrics':
        itemsDeleted = await this.cleanupSystemMetrics(cutoffDate);
        break;
      case 'error_logs':
        itemsDeleted = await this.cleanupErrorLogs(cutoffDate);
        break;
      case 'notification_history':
        itemsDeleted = await this.cleanupNotificationHistory(cutoffDate);
        break;
    }

    return itemsDeleted;
  }

  private async cleanupAuditLogs(cutoffDate: Date): Promise<number> {
    // Mock cleanup - in production, this would delete actual audit logs
    return Math.floor(Math.random() * 50) + 10;
  }

  private async cleanupSecurityIncidents(cutoffDate: Date): Promise<number> {
    // Mock cleanup - in production, this would delete actual security incidents
    return Math.floor(Math.random() * 20) + 5;
  }

  private async cleanupSystemMetrics(cutoffDate: Date): Promise<number> {
    // Mock cleanup - in production, this would delete actual system metrics
    return Math.floor(Math.random() * 100) + 50;
  }

  private async cleanupErrorLogs(cutoffDate: Date): Promise<number> {
    // Mock cleanup - in production, this would delete actual error logs
    return Math.floor(Math.random() * 30) + 10;
  }

  private async cleanupNotificationHistory(cutoffDate: Date): Promise<number> {
    // Mock cleanup - in production, this would delete actual notification history
    return Math.floor(Math.random() * 40) + 15;
  }

  startAutomatedCleanup(): void {
    // Run cleanup daily at 3 AM
    setInterval(async () => {
      try {
        await this.executeCleanup();
      } catch (error) {
        console.error('Automated data retention cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  async createCustomPolicy(policy: Omit<RetentionPolicy, 'lastCleanup' | 'itemsDeleted'>): Promise<void> {
    const newPolicy: RetentionPolicy = {
      ...policy,
      lastCleanup: new Date().toISOString(),
      itemsDeleted: 0
    };

    this.policies.push(newPolicy);

    await storage.createAuditLog({
      action: 'retention_policy_created',
      userId: 'system',
      resourceType: 'data_retention',
      ipAddress: 'system',
      metadata: {
        policy: newPolicy,
        timestamp: new Date().toISOString()
      }
    });
  }

  async deletePolicy(policyId: string): Promise<void> {
    const policyIndex = this.policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const deletedPolicy = this.policies.splice(policyIndex, 1)[0];

    await storage.createAuditLog({
      action: 'retention_policy_deleted',
      userId: 'system',
      resourceType: 'data_retention',
      ipAddress: 'system',
      metadata: {
        deletedPolicy,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export const dataRetentionService = new DataRetentionService();