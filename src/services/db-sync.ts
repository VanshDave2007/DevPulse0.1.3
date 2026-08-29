// Client-side Database & API Synchronizer for DevPulse
// Connects UI with Cloud SQL PostgreSQL backend and Gmail alerts

export function getStoredAuthToken(): string | null {
  return localStorage.getItem('devpulse_auth_token') || localStorage.getItem('devpulse_session_token');
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem('devpulse_auth_token', token);
}

export function clearStoredAuthToken() {
  localStorage.removeItem('devpulse_auth_token');
  localStorage.removeItem('devpulse_session_token');
}

function getAuthHeader(tokenOverride?: string): Record<string, string> {
  const token = tokenOverride || getStoredAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// User Profile & Account Sync
export async function syncUserWithCloudSql(user: { uid: string; email: string; displayName?: string; photoUrl?: string }) {
  try {
    const res = await fetch('/api/auth/sync-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to sync profile to Cloud SQL');
    return await res.json();
  } catch (err) {
    console.warn('Sync user with Cloud SQL error:', err);
    return null;
  }
}

export async function fetchCloudSqlUserProfile(token?: string) {
  try {
    const res = await fetch('/api/user/profile', {
      headers: { ...getAuthHeader(token) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.warn('Fetch user profile error:', err);
    return null;
  }
}

export async function updateCloudSqlUserProfile(updates: any, token?: string) {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update profile settings');
  return await res.json();
}

export async function purgeAllUserDataFromCloudSql(token?: string) {
  const res = await fetch('/api/user/data', {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to purge user data');
  return await res.json();
}

// Analysis History Persistence (Cloud SQL)
export async function saveAnalysisToCloudSql(payload: {
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
  fullResult: any;
}, token?: string) {
  const res = await fetch('/api/history/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save analysis to Cloud SQL');
  }
  return await res.json();
}

export async function fetchAnalysisHistoryFromCloudSql(limit = 30, offset = 0, token?: string) {
  const res = await fetch(`/api/history?limit=${limit}&offset=${offset}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

export async function fetchAnalysisRecordById(id: number, token?: string) {
  const res = await fetch(`/api/history/${id}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to fetch analysis record');
  const data = await res.json();
  return data.record;
}

export async function deleteAnalysisRecordFromCloudSql(id: number, token?: string) {
  const res = await fetch(`/api/history/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to delete history record');
  return await res.json();
}

export async function clearAllAnalysisHistoryFromCloudSql(token?: string) {
  const res = await fetch('/api/history', {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to clear history');
  return await res.json();
}

export async function createShareLinkForAnalysis(id: number, token?: string) {
  const res = await fetch(`/api/history/${id}/share`, {
    method: 'POST',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to create share link');
  return await res.json();
}

export async function revokeShareLinkForAnalysis(id: number, token?: string) {
  const res = await fetch(`/api/history/${id}/share`, {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to revoke share link');
  return await res.json();
}

export async function fetchPublicSharedReport(shareToken: string) {
  const res = await fetch(`/api/public/shared/${shareToken}`);
  if (!res.ok) throw new Error('Shared report not found');
  const data = await res.json();
  return data.report;
}

export async function fetchHealthTrendsFromCloudSql(project?: string, token?: string) {
  const url = project ? `/api/history/trends?project=${encodeURIComponent(project)}` : '/api/history/trends';
  const res = await fetch(url, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.trends || [];
}

// AI Conversation Persistence (Cloud SQL)
export async function saveAiConversationToCloudSql(
  context: string,
  title: string,
  messages: Array<{ role: string; content: string; timestamp?: string; actionType?: string }>,
  conversationId?: number,
  token?: string
) {
  const res = await fetch('/api/ai/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ context, title, messages, conversationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to persist AI conversation');
  }
  return await res.json();
}

export async function fetchAiConversationsFromCloudSql(limit = 40, token?: string) {
  const res = await fetch(`/api/ai/conversations?limit=${limit}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations || [];
}

export async function fetchAiConversationByIdFromCloudSql(id: number, token?: string) {
  const res = await fetch(`/api/ai/conversations/${id}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to fetch conversation');
  const data = await res.json();
  return data.conversation;
}

export async function deleteAiConversationFromCloudSql(id: number, token?: string) {
  const res = await fetch(`/api/ai/conversations/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return await res.json();
}

export async function clearAllAiConversationsFromCloudSql(token?: string) {
  const res = await fetch('/api/ai/conversations', {
    method: 'DELETE',
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error('Failed to clear conversations');
  return await res.json();
}

// Learn Mode Curriculum Progress (Cloud SQL)
export async function fetchLearnProgressFromCloudSql(language: string, token?: string) {
  const res = await fetch(`/api/learn/progress/${encodeURIComponent(language.toLowerCase())}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.progress;
}

export async function fetchAllLearnProgressFromCloudSql(token?: string) {
  const res = await fetch('/api/learn/progress', {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.allProgress || {};
}

export async function saveLearnProgressToCloudSql(
  language: string,
  progress: {
    lastUnit?: string;
    lastTopic?: string;
    unitStatus?: Record<string, string>;
    quizResults?: Record<string, { score: number; completedAt: string }>;
    practiceStatus?: Record<string, { attempted: boolean; completed: boolean }>;
  },
  token?: string
) {
  const res = await fetch('/api/learn/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ language, ...progress }),
  });
  if (!res.ok) throw new Error('Failed to save learning progress');
  return await res.json();
}

// Gmail Notification & Alert Dispatcher
export async function dispatchGmailAlert(payload: {
  recipientEmail: string;
  subject: string;
  bodyText: string;
  type?: 'vulnerability_alert' | 'analysis_complete' | 'system';
  googleAccessToken?: string;
  metadata?: any;
}, token?: string) {
  const res = await fetch('/api/notifications/send-gmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send Gmail alert');
  return await res.json();
}

export async function fetchNotificationLogsFromCloudSql(token?: string) {
  const res = await fetch('/api/notifications', {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.notifications || [];
}
