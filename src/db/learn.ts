import { db } from './index.ts';
import { learnProgress } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export interface LearnProgressRecord {
  id: number;
  userId: string;
  language: string;
  lastUnit?: string | null;
  lastTopic?: string | null;
  unitStatus: string; // JSON: { [unitId]: string }
  quizResults: string; // JSON: { [unitId]: { score: number, completedAt: string } }
  practiceStatus: string; // JSON: { [unitId]: { attempted: boolean, completed: boolean } }
  updatedAt: Date | null;
}

export async function getLearnProgress(
  userId: string,
  language: string
): Promise<LearnProgressRecord | null> {
  try {
    const records = await db
      .select()
      .from(learnProgress)
      .where(
        and(
          eq(learnProgress.userId, userId),
          eq(learnProgress.language, language.toLowerCase())
        )
      );

    return records[0] || null;
  } catch (error) {
    console.error('Database getLearnProgress failed:', error);
    throw new Error('Failed to load learning progress', { cause: error });
  }
}

export async function getAllUserLearnProgress(
  userId: string
): Promise<LearnProgressRecord[]> {
  try {
    return await db
      .select()
      .from(learnProgress)
      .where(eq(learnProgress.userId, userId));
  } catch (error) {
    console.error('Database getAllUserLearnProgress failed:', error);
    throw new Error('Failed to load all language learning tracks', { cause: error });
  }
}

export async function saveOrUpdateLearnProgress(
  userId: string,
  language: string,
  data: {
    lastUnit?: string;
    lastTopic?: string;
    unitStatus?: Record<string, string>;
    quizResults?: Record<string, { score: number; completedAt: string }>;
    practiceStatus?: Record<string, { attempted: boolean; completed: boolean }>;
  }
): Promise<LearnProgressRecord> {
  try {
    const lang = language.toLowerCase();
    const existing = await getLearnProgress(userId, lang);

    let mergedUnitStatus = data.unitStatus || {};
    let mergedQuizResults = data.quizResults || {};
    let mergedPracticeStatus = data.practiceStatus || {};

    if (existing) {
      try {
        const oldUnits = JSON.parse(existing.unitStatus || '{}');
        mergedUnitStatus = { ...oldUnits, ...mergedUnitStatus };
      } catch (e) {}

      try {
        const oldQuizzes = JSON.parse(existing.quizResults || '{}');
        mergedQuizResults = { ...oldQuizzes, ...mergedQuizResults };
      } catch (e) {}

      try {
        const oldPractice = JSON.parse(existing.practiceStatus || '{}');
        mergedPracticeStatus = { ...oldPractice, ...mergedPracticeStatus };
      } catch (e) {}

      const updated = await db
        .update(learnProgress)
        .set({
          lastUnit: data.lastUnit || existing.lastUnit,
          lastTopic: data.lastTopic || existing.lastTopic,
          unitStatus: JSON.stringify(mergedUnitStatus),
          quizResults: JSON.stringify(mergedQuizResults),
          practiceStatus: JSON.stringify(mergedPracticeStatus),
          updatedAt: new Date(),
        })
        .where(eq(learnProgress.id, existing.id))
        .returning();

      return updated[0];
    }

    const inserted = await db
      .insert(learnProgress)
      .values({
        userId,
        language: lang,
        lastUnit: data.lastUnit || null,
        lastTopic: data.lastTopic || null,
        unitStatus: JSON.stringify(mergedUnitStatus),
        quizResults: JSON.stringify(mergedQuizResults),
        practiceStatus: JSON.stringify(mergedPracticeStatus),
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database saveOrUpdateLearnProgress failed:', error);
    throw new Error('Failed to update learning curriculum progress', { cause: error });
  }
}
