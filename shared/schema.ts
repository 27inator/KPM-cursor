import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  companyId: text("company_id").notNull().unique(),
  name: text("name").notNull(),
  hdPathIndex: integer("hd_path_index").notNull(),
  visibleFields: text("visible_fields").array(),
  commitEventTypes: text("commit_event_types").array(),
  walletAddress: text("wallet_address").notNull(),
  balance: real("balance").default(0),
  autoFundEnabled: boolean("auto_fund_enabled").default(true),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  companyId: text("company_id").notNull(),
  tagId: text("tag_id").notNull(),
  eventType: text("event_type").notNull(),
  ts: timestamp("ts").notNull(),
  blobCid: text("blob_cid"),
  leafHash: text("leaf_hash").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  txid: text("txid"),
  status: text("status").default("pending"),
  fee: real("fee").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseId: text("purchase_id").notNull().unique(),
  userId: text("user_id").notNull(),
  eventId: text("event_id").notNull(),
  stampTxid: text("stamp_txid"),
  tagId: text("tag_id").notNull(),
  productName: text("product_name"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const walletMetrics = pgTable("wallet_metrics", {
  id: serial("id").primaryKey(),
  masterWalletBalance: real("master_wallet_balance").default(0),
  totalFeesSpent: real("total_fees_spent").default(0),
  totalFeesSpentUsd: real("total_fees_spent_usd").default(0),
  activeCompanies: integer("active_companies").default(0),
  eventsToday: integer("events_today").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productTags = pgTable("product_tags", {
  id: serial("id").primaryKey(),
  tagId: text("tag_id").unique().notNull(),
  productName: text("product_name").notNull(),
  productId: text("product_id").notNull(),
  batchId: text("batch_id"),
  farmId: text("farm_id"),
  harvestDate: timestamp("harvest_date"),
  expiryDate: timestamp("expiry_date"),
  productType: text("product_type"),
  origin: text("origin"),
  certifications: text("certifications"), // JSON array
  description: text("description"),
  qrCode: text("qr_code"),
  nfcId: text("nfc_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Policy audit table for tracking changes
export const policyAudits = pgTable("policy_audits", {
  id: serial("id").primaryKey(),
  companyId: text("company_id").notNull(),
  actionType: text("action_type").notNull(), // "policy_update", "field_visibility", "event_type_change"
  fieldName: text("field_name"), // Which field was changed
  oldValue: text("old_value"),
  newValue: text("new_value"),
  adminUserId: text("admin_user_id"), // Who made the change
  reason: text("reason"), // Optional reason for the change
  createdAt: timestamp("created_at").defaultNow(),
});

// System alerts table for monitoring
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // "queue_lag", "dlq_overflow", "rpc_error", "wallet_low"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  message: text("message").notNull(),
  companyId: text("company_id"), // Optional, for company-specific alerts
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for user notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "info", "success", "warning", "error"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  userId: integer("user_id").references(() => users.id),
  companyId: text("company_id"),
  actionUrl: text("action_url"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertProductTagSchema = createInsertSchema(productTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicyAuditSchema = createInsertSchema(policyAudits).omit({
  id: true,
  createdAt: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type ProductTag = typeof productTags.$inferSelect;
export type InsertProductTag = z.infer<typeof insertProductTagSchema>;
export type WalletMetrics = typeof walletMetrics.$inferSelect;
export type PolicyAudit = typeof policyAudits.$inferSelect;
export type InsertPolicyAudit = z.infer<typeof insertPolicyAuditSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Audit logs table for security compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  companyId: varchar("company_id", { length: 255 }),
  resourceId: varchar("resource_id", { length: 255 }),
  resourceType: varchar("resource_type", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_company_id").on(table.companyId),
  index("idx_audit_logs_action").on(table.action),
]);

// Compliance reports table
export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  companyId: varchar("company_id", { length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  metrics: jsonb("metrics").notNull(),
  recommendations: jsonb("recommendations").default([]),
  generatedBy: varchar("generated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_compliance_reports_company_id").on(table.companyId),
  index("idx_compliance_reports_start_date").on(table.startDate),
]);

// Security incidents table
export const securityIncidents = pgTable("security_incidents", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id", { length: 255 }),
  companyId: varchar("company_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_security_incidents_type").on(table.type),
  index("idx_security_incidents_severity").on(table.severity),
  index("idx_security_incidents_resolved").on(table.resolved),
  index("idx_security_incidents_created_at").on(table.createdAt),
]);

// Data retention policies table
export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: serial("id").primaryKey(),
  dataType: varchar("data_type", { length: 100 }).notNull(),
  retentionPeriodDays: integer("retention_period_days").notNull(),
  autoDelete: boolean("auto_delete").default(true),
  companyId: varchar("company_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_data_retention_policies_data_type").on(table.dataType),
  index("idx_data_retention_policies_company_id").on(table.companyId),
]);

// Insert schemas for security compliance
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityIncidentSchema = createInsertSchema(securityIncidents).omit({
  id: true,
  createdAt: true,
});

export const insertDataRetentionPolicySchema = createInsertSchema(dataRetentionPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for security compliance
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = z.infer<typeof insertSecurityIncidentSchema>;
export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = z.infer<typeof insertDataRetentionPolicySchema>;

// Constants for event types and visible fields
export const EVENT_TYPES = [
  "FARM",
  "PROCESSING", 
  "WAREHOUSE",
  "TRANSPORT",
  "RETAIL",
  "PURCHASE",
  "QC_CHECK",
  "INSPECTION"
] as const;

export const VISIBLE_FIELDS = [
  "stage",
  "location", 
  "timestamp",
  "temperature",
  "humidity",
  "handler",
  "qualityScore",
  "certifications",
  "notes"
] as const;

export type EventType = typeof EVENT_TYPES[number];
export type VisibleField = typeof VISIBLE_FIELDS[number];

// Error tracking table for enhanced error handling
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  operationName: varchar("operation_name", { length: 255 }).notNull(),
  errorType: varchar("error_type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  context: jsonb("context"),
  companyId: varchar("company_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  eventId: varchar("event_id", { length: 255 }),
  tagId: varchar("tag_id", { length: 255 }),
  endpoint: varchar("endpoint", { length: 255 }),
  attempts: integer("attempts").default(1),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dead letter queue for failed operations
export const deadLetterQueue = pgTable("dead_letter_queue", {
  id: serial("id").primaryKey(),
  operationId: varchar("operation_id", { length: 255 }).notNull().unique(),
  operationName: varchar("operation_name", { length: 255 }).notNull(),
  payload: jsonb("payload").notNull(),
  context: jsonb("context").notNull(),
  attempts: integer("attempts").default(1),
  lastError: text("last_error").notNull(),
  nextRetryAt: timestamp("next_retry_at").notNull(),
  maxRetries: integer("max_retries").default(5),
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, failed, resolved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System health metrics
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 50 }).notNull(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  value: numeric("value").notNull(),
  unit: varchar("unit", { length: 20 }),
  tags: jsonb("tags"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertDeadLetterQueue = typeof deadLetterQueue.$inferInsert;
export type DeadLetterQueue = typeof deadLetterQueue.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
export type SystemMetric = typeof systemMetrics.$inferSelect;
