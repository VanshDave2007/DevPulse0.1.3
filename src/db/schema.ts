import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table storing profiles, auth info, and preferences
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique ID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  passwordHash: text('password_hash'),
  learningLevel: text('learning_level').default('intermediate'),
  notificationEmail: text('notification_email'),
  emailAlertsEnabled: text('email_alerts_enabled').default('true'),
  customConfig: text('custom_config'), // Custom rules JSON (.devpulserc)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Analysis History table storing complete reopenable code audits
export const analysisHistory = pgTable('analysis_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  projectOrFileName: text('project_or_file_name').notNull(),
  language: text('language').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  healthScore: integer('health_score').notNull(),
  maintainabilityScore: integer('maintainability_score'),
  cyclomaticComplexity: integer('cyclomatic_complexity'),
  loc: integer('loc'),
  criticalFindings: integer('critical_findings').default(0),
  highFindings: integer('high_findings').default(0),
  mediumFindings: integer('medium_findings').default(0),
  lowFindings: integer('low_findings').default(0),
  summary: text('summary'),
  fullResult: text('full_result').notNull(), // Complete JSON result
  isShared: text('is_shared').default('false'),
  shareToken: text('share_token'),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Chat Conversation History per user and context
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  context: text('context').notNull(), // e.g. "analyzer:finding:DP-001", "learn:python:unit5"
  title: text('title').notNull(),
  messages: text('messages').notNull(), // JSON string of [{ role, content, timestamp }]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Learn Mode Progress tracked per user and per language
export const learnProgress = pgTable('learn_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  language: text('language').notNull(), // "python", "java", etc.
  lastUnit: text('last_unit'),
  lastTopic: text('last_topic'),
  unitStatus: text('unit_status').notNull().default('{}'), // JSON: { [unitId]: "not_started" | "in_progress" | "completed" }
  quizResults: text('quiz_results').notNull().default('{}'), // JSON: { [unitId]: { score, completedAt } }
  practiceStatus: text('practice_status').notNull().default('{}'), // JSON: { [unitId]: { attempted, completed } }
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notifications and Gmail alert log for security findings & tasks
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(), // 'vulnerability_alert' | 'analysis_complete' | 'system'
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  bodyText: text('body_text').notNull(),
  status: text('status').notNull().default('sent'), // 'sent' | 'failed' | 'pending'
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define Drizzle Relations
export const usersRelations = relations(users, ({ many }) => ({
  history: many(analysisHistory),
  conversations: many(aiConversations),
  learnProgresses: many(learnProgress),
  notifications: many(notifications),
}));

export const analysisHistoryRelations = relations(analysisHistory, ({ one }) => ({
  user: one(users, {
    fields: [analysisHistory.userId],
    references: [users.uid],
  }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.uid],
  }),
}));

export const learnProgressRelations = relations(learnProgress, ({ one }) => ({
  user: one(users, {
    fields: [learnProgress.userId],
    references: [users.uid],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.uid],
  }),
}));
