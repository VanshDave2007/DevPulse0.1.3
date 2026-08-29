import { db } from './index.ts';
import { analysisHistory } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

export interface AnalysisHistoryRecord {
  id: number;
  userId: string;
  projectOrFileName: string;
  language: string;
  timestamp: Date;
  healthScore: number;
  maintainabilityScore?: number | null;
  cyclomaticComplexity?: number | null;
  loc?: number | null;
  criticalFindings?: number | null;
  highFindings?: number | null;
  mediumFindings?: number | null;
  lowFindings?: number | null;
  summary?: string | null;
  fullResult: string;
  isShared?: string | null;
  shareToken?: string | null;
  createdAt: Date | null;
}

export async function saveAnalysisHistory(
  userId: string,
  payload: {
    projectOrFileName: string;
    language: string;
    healthScore: number;
    maintainabilityScore?: number;
    cyclomaticComplexity?: number;
    loc?: number;
    criticalFindings?: number;
    highFindings?: number;
    mediumFindings?: number;
    lowFindings?: number;
    summary?: string;
    fullResult: any; // Stored as complete JSON
  }
): Promise<AnalysisHistoryRecord> {
  try {
    const serializedResult =
      typeof payload.fullResult === 'string'
        ? payload.fullResult
        : JSON.stringify(payload.fullResult);

    const inserted = await db
      .insert(analysisHistory)
      .values({
        userId,
        projectOrFileName: payload.projectOrFileName || 'Untitled Analysis',
        language: payload.language || 'python',
        healthScore: payload.healthScore ?? 80,
        maintainabilityScore: payload.maintainabilityScore ?? null,
        cyclomaticComplexity: payload.cyclomaticComplexity ?? null,
        loc: payload.loc ?? null,
        criticalFindings: payload.criticalFindings ?? 0,
        highFindings: payload.highFindings ?? 0,
        mediumFindings: payload.mediumFindings ?? 0,
        lowFindings: payload.lowFindings ?? 0,
        summary: payload.summary || null,
        fullResult: serializedResult,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database saveAnalysisHistory failed:', error);
    throw new Error('Failed to record analysis history in Cloud SQL', { cause: error });
  }
}

export async function getUserAnalysisHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AnalysisHistoryRecord[]> {
  try {
    const records = await db
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.userId, userId))
      .orderBy(desc(analysisHistory.timestamp))
      .limit(limit)
      .offset(offset);

    return records;
  } catch (error) {
    console.error('Database getUserAnalysisHistory failed:', error);
    throw new Error('Failed to query user analysis history', { cause: error });
  }
}

export async function getAnalysisHistoryById(
  id: number,
  userId: string
): Promise<AnalysisHistoryRecord | null> {
  try {
    const records = await db
      .select()
      .from(analysisHistory)
      .where(and(eq(analysisHistory.id, id), eq(analysisHistory.userId, userId)));

    return records[0] || null;
  } catch (error) {
    console.error('Database getAnalysisHistoryById failed:', error);
    throw new Error('Failed to fetch specific analysis record', { cause: error });
  }
}

export async function deleteAnalysisHistory(
  id: number,
  userId: string
): Promise<boolean> {
  try {
    const deleted = await db
      .delete(analysisHistory)
      .where(and(eq(analysisHistory.id, id), eq(analysisHistory.userId, userId)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database deleteAnalysisHistory failed:', error);
    throw new Error('Failed to delete analysis record', { cause: error });
  }
}

export async function clearUserAnalysisHistory(userId: string): Promise<number> {
  try {
    const deleted = await db
      .delete(analysisHistory)
      .where(eq(analysisHistory.userId, userId))
      .returning();

    return deleted.length;
  } catch (error) {
    console.error('Database clearUserAnalysisHistory failed:', error);
    throw new Error('Failed to clear all analysis records', { cause: error });
  }
}

export async function createShareLink(
  id: number,
  userId: string
): Promise<{ shareToken: string; shareUrl: string }> {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const updated = await db
      .update(analysisHistory)
      .set({
        isShared: 'true',
        shareToken: token,
      })
      .where(and(eq(analysisHistory.id, id), eq(analysisHistory.userId, userId)))
      .returning();

    if (!updated.length) {
      throw new Error('Analysis report not found or unauthorized');
    }

    return {
      shareToken: token,
      shareUrl: `/shared/${token}`,
    };
  } catch (error) {
    console.error('Database createShareLink failed:', error);
    throw new Error('Failed to generate share link', { cause: error });
  }
}

export async function revokeShareLink(
  id: number,
  userId: string
): Promise<boolean> {
  try {
    const updated = await db
      .update(analysisHistory)
      .set({
        isShared: 'false',
        shareToken: null,
      })
      .where(and(eq(analysisHistory.id, id), eq(analysisHistory.userId, userId)))
      .returning();

    return updated.length > 0;
  } catch (error) {
    console.error('Database revokeShareLink failed:', error);
    throw new Error('Failed to revoke share link', { cause: error });
  }
}

export async function getSharedAnalysis(
  shareToken: string
): Promise<AnalysisHistoryRecord | null> {
  try {
    const records = await db
      .select()
      .from(analysisHistory)
      .where(
        and(
          eq(analysisHistory.shareToken, shareToken),
          eq(analysisHistory.isShared, 'true')
        )
      );

    return records[0] || null;
  } catch (error) {
    console.error('Database getSharedAnalysis failed:', error);
    throw new Error('Failed to load shared analysis report', { cause: error });
  }
}

export async function getProjectTrends(
  userId: string,
  projectOrFileName?: string
): Promise<any[]> {
  try {
    const records = await db
      .select({
        id: analysisHistory.id,
        projectOrFileName: analysisHistory.projectOrFileName,
        language: analysisHistory.language,
        timestamp: analysisHistory.timestamp,
        healthScore: analysisHistory.healthScore,
        maintainabilityScore: analysisHistory.maintainabilityScore,
        cyclomaticComplexity: analysisHistory.cyclomaticComplexity,
        loc: analysisHistory.loc,
        criticalFindings: analysisHistory.criticalFindings,
        highFindings: analysisHistory.highFindings,
        mediumFindings: analysisHistory.mediumFindings,
        lowFindings: analysisHistory.lowFindings,
      })
      .from(analysisHistory)
      .where(
        projectOrFileName
          ? and(
              eq(analysisHistory.userId, userId),
              eq(analysisHistory.projectOrFileName, projectOrFileName)
            )
          : eq(analysisHistory.userId, userId)
      )
      .orderBy(analysisHistory.timestamp)
      .limit(100);

    return records;
  } catch (error) {
    console.error('Database getProjectTrends failed:', error);
    throw new Error('Failed to query project trends', { cause: error });
  }
}
