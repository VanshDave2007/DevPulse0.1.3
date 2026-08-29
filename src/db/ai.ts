import { db } from './index.ts';
import { aiConversations } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface AiConversationRecord {
  id: number;
  userId: string;
  context: string;
  title: string;
  messages: string; // JSON string
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function saveOrUpdateAiConversation(
  userId: string,
  context: string,
  title: string,
  messages: Array<{ role: string; content: string; timestamp?: string; actionType?: string }>,
  conversationId?: number
): Promise<AiConversationRecord> {
  try {
    const serializedMessages = JSON.stringify(messages);

    if (conversationId) {
      const updated = await db
        .update(aiConversations)
        .set({
          title,
          context,
          messages: serializedMessages,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiConversations.id, conversationId),
            eq(aiConversations.userId, userId)
          )
        )
        .returning();

      if (updated.length > 0) {
        return updated[0];
      }
    }

    // Check if there is an existing conversation with this exact context for the user
    const existing = await db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.userId, userId),
          eq(aiConversations.context, context)
        )
      )
      .orderBy(desc(aiConversations.updatedAt))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(aiConversations)
        .set({
          title: title || existing[0].title,
          messages: serializedMessages,
          updatedAt: new Date(),
        })
        .where(eq(aiConversations.id, existing[0].id))
        .returning();

      return updated[0];
    }

    const inserted = await db
      .insert(aiConversations)
      .values({
        userId,
        context,
        title: title || 'AI Consultation',
        messages: serializedMessages,
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database saveOrUpdateAiConversation failed:', error);
    throw new Error('Failed to persist AI conversation thread', { cause: error });
  }
}

export async function getAiConversations(
  userId: string,
  limit: number = 50
): Promise<AiConversationRecord[]> {
  try {
    const records = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(limit);

    return records;
  } catch (error) {
    console.error('Database getAiConversations failed:', error);
    throw new Error('Failed to query AI conversation history', { cause: error });
  }
}

export async function getAiConversationById(
  id: number,
  userId: string
): Promise<AiConversationRecord | null> {
  try {
    const records = await db
      .select()
      .from(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId))
      );

    return records[0] || null;
  } catch (error) {
    console.error('Database getAiConversationById failed:', error);
    throw new Error('Failed to fetch conversation thread', { cause: error });
  }
}

export async function deleteAiConversation(
  id: number,
  userId: string
): Promise<boolean> {
  try {
    const deleted = await db
      .delete(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId))
      )
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database deleteAiConversation failed:', error);
    throw new Error('Failed to delete conversation thread', { cause: error });
  }
}

export async function clearUserAiConversations(userId: string): Promise<number> {
  try {
    const deleted = await db
      .delete(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .returning();

    return deleted.length;
  } catch (error) {
    console.error('Database clearUserAiConversations failed:', error);
    throw new Error('Failed to clear all AI conversations', { cause: error });
  }
}
