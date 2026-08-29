import { db } from './index.ts';
import { notifications } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface NotificationRecord {
  id: number;
  userId: string;
  type: string;
  recipientEmail: string;
  subject: string;
  bodyText: string;
  status: string;
  metadataJson?: string | null;
  createdAt: Date | null;
}

export async function logNotification(
  userId: string,
  type: 'vulnerability_alert' | 'analysis_complete' | 'system',
  recipientEmail: string,
  subject: string,
  bodyText: string,
  status: 'sent' | 'pending' | 'failed' = 'sent',
  metadata?: any
): Promise<NotificationRecord> {
  try {
    const inserted = await db
      .insert(notifications)
      .values({
        userId,
        type,
        recipientEmail,
        subject,
        bodyText,
        status,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database logNotification failed:', error);
    throw new Error('Failed to record notification log', { cause: error });
  }
}

export async function getUserNotifications(
  userId: string,
  limit: number = 30
): Promise<NotificationRecord[]> {
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Database getUserNotifications failed:', error);
    throw new Error('Failed to retrieve notification logs', { cause: error });
  }
}
