import { db } from '../db';
import { auditLogs, complianceReports } from '../../shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export interface ComplianceMetrics {
  totalRequests: number;
  failedRequests: number;
  securityIncidents: number;
  dataAccessLogs: number;
  passwordChanges: number;
  sessionActivity: number;
  complianceScore: number;
}

export interface SecurityIncident {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  resolved: boolean;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ComplianceService {
  // Log audit trail
  async logAuditEvent(event: {
    action: string;
    userId?: string;
    companyId?: string;
    resourceId?: string;
    resourceType?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await db.insert(auditLogs).values({
        action: event.action,
        userId: event.userId,
        companyId: event.companyId,
        resourceId: event.resourceId,
        resourceType: event.resourceType,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata || {},
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // Generate compliance report
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    companyId?: string
  ): Promise<{
    metrics: ComplianceMetrics;
    auditSummary: any[];
    recommendations: string[];
  }> {
    try {
      // Get audit logs for the period
      const auditQuery = db
        .select()
        .from(auditLogs)
        .where(
          and(
            gte(auditLogs.timestamp, startDate),
            lte(auditLogs.timestamp, endDate),
            companyId ? eq(auditLogs.companyId, companyId) : undefined
          )
        )
        .orderBy(desc(auditLogs.timestamp));

      const auditEvents = await auditQuery;

      // Calculate metrics
      const metrics: ComplianceMetrics = {
        totalRequests: auditEvents.length,
        failedRequests: auditEvents.filter(e => 
          e.action.includes('failed') || e.action.includes('error')
        ).length,
        securityIncidents: auditEvents.filter(e => 
          e.action.includes('security') || e.action.includes('breach')
        ).length,
        dataAccessLogs: auditEvents.filter(e => 
          e.action.includes('access') || e.action.includes('view')
        ).length,
        passwordChanges: auditEvents.filter(e => 
          e.action.includes('password')
        ).length,
        sessionActivity: auditEvents.filter(e => 
          e.action.includes('login') || e.action.includes('logout')
        ).length,
        complianceScore: 0
      };

      // Calculate compliance score (0-100)
      const failureRate = metrics.totalRequests > 0 ? 
        (metrics.failedRequests / metrics.totalRequests) * 100 : 0;
      const securityIncidentRate = metrics.totalRequests > 0 ? 
        (metrics.securityIncidents / metrics.totalRequests) * 100 : 0;
      
      metrics.complianceScore = Math.max(0, 100 - (failureRate * 2) - (securityIncidentRate * 10));

      // Generate audit summary
      const auditSummary = auditEvents.reduce((acc: any[], event) => {
        const existingAction = acc.find(a => a.action === event.action);
        if (existingAction) {
          existingAction.count++;
          existingAction.lastOccurrence = event.timestamp;
        } else {
          acc.push({
            action: event.action,
            count: 1,
            firstOccurrence: event.timestamp,
            lastOccurrence: event.timestamp
          });
        }
        return acc;
      }, []);

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (failureRate > 10) {
        recommendations.push('High failure rate detected. Review error handling and system stability.');
      }
      
      if (metrics.securityIncidents > 0) {
        recommendations.push('Security incidents detected. Implement additional security measures.');
      }
      
      if (metrics.passwordChanges === 0) {
        recommendations.push('No password changes detected. Encourage regular password updates.');
      }
      
      if (metrics.complianceScore < 80) {
        recommendations.push('Compliance score below 80%. Review security policies and procedures.');
      }

      return {
        metrics,
        auditSummary,
        recommendations
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  // Log security incident
  async logSecurityIncident(incident: Omit<SecurityIncident, 'id'>) {
    try {
      await this.logAuditEvent({
        action: `security_incident_${incident.type}`,
        userId: incident.userId,
        ipAddress: incident.ipAddress,
        userAgent: incident.userAgent,
        metadata: {
          type: incident.type,
          severity: incident.severity,
          description: incident.description,
          resolved: incident.resolved
        }
      });
    } catch (error) {
      console.error('Failed to log security incident:', error);
    }
  }

  // Get compliance metrics for dashboard
  async getComplianceMetrics(days: number = 30): Promise<ComplianceMetrics> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const report = await this.generateComplianceReport(startDate, endDate);
    return report.metrics;
  }

  // Data retention policy enforcement
  async enforceDataRetention(retentionDays: number = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete old audit logs
      await db.delete(auditLogs).where(
        lte(auditLogs.timestamp, cutoffDate)
      );

      console.log(`Data retention: Deleted audit logs older than ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to enforce data retention:', error);
    }
  }

  // Privacy compliance - data anonymization
  async anonymizeUserData(userId: string) {
    try {
      // Update audit logs to remove personal information
      await db.update(auditLogs)
        .set({
          userId: `anonymized_${Date.now()}`,
          metadata: {}
        })
        .where(eq(auditLogs.userId, userId));

      console.log(`Anonymized data for user: ${userId}`);
    } catch (error) {
      console.error('Failed to anonymize user data:', error);
    }
  }

  // Export compliance data (for audits)
  async exportComplianceData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const auditEvents = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            gte(auditLogs.timestamp, startDate),
            lte(auditLogs.timestamp, endDate)
          )
        )
        .orderBy(desc(auditLogs.timestamp));

      if (format === 'csv') {
        const headers = ['timestamp', 'action', 'userId', 'companyId', 'ipAddress', 'userAgent'];
        const csvData = [
          headers.join(','),
          ...auditEvents.map(event => [
            event.timestamp.toISOString(),
            event.action,
            event.userId || '',
            event.companyId || '',
            event.ipAddress || '',
            event.userAgent || ''
          ].join(','))
        ].join('\n');

        return csvData;
      }

      return JSON.stringify(auditEvents, null, 2);
    } catch (error) {
      console.error('Failed to export compliance data:', error);
      throw new Error('Failed to export compliance data');
    }
  }
}

export const complianceService = new ComplianceService();