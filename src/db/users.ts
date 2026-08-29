import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  learningLevel?: string | null;
  notificationEmail?: string | null;
  emailAlertsEnabled?: string | null;
  customConfig?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string
): Promise<UserProfile> {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      if (displayName || photoUrl) {
        const updated = await db
          .update(users)
          .set({
            displayName: displayName || existing[0].displayName,
            photoUrl: photoUrl || existing[0].photoUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoUrl: photoUrl || null,
        notificationEmail: email,
        emailAlertsEnabled: 'true',
        learningLevel: 'intermediate',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || undefined,
          photoUrl: photoUrl || undefined,
          updatedAt: new Date(),
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Failed to retrieve or synchronize user profile', { cause: error });
  }
}

export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  try {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    return results[0] || null;
  } catch (error) {
    console.error('Database getUserByUid failed:', error);
    throw new Error('Failed to fetch user profile', { cause: error });
  }
}

export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const results = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    return results[0] || null;
  } catch (error) {
    console.error('Database getUserByEmail failed:', error);
    throw new Error('Failed to query user by email', { cause: error });
  }
}

export async function createLocalUser(
  uid: string,
  email: string,
  passwordHash: string,
  displayName?: string
): Promise<UserProfile> {
  try {
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName || email.split('@')[0],
        notificationEmail: email,
        emailAlertsEnabled: 'true',
        learningLevel: 'intermediate',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database createLocalUser failed:', error);
    throw new Error('Failed to create user account', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    learningLevel?: string;
    notificationEmail?: string;
    emailAlertsEnabled?: string;
    customConfig?: string;
  }
): Promise<UserProfile> {
  try {
    const updated = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    if (!updated.length) {
      throw new Error('User not found');
    }
    return updated[0];
  } catch (error) {
    console.error('Database updateUserProfile failed:', error);
    throw new Error('Failed to update user profile', { cause: error });
  }
}
