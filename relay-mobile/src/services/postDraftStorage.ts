import { createMMKV } from 'react-native-mmkv';
import type { PostType, RecipientGroup } from '@/types/models';

const storage = createMMKV({ id: 'relay-post-drafts' });

function key(teamMemberId: string): string {
  return `post-draft-${teamMemberId}`;
}

export interface PostDraftPayload {
  type: PostType | null;
  recipientGroup: RecipientGroup | null;
  eventId: string | null;
  isUrgent: boolean;
  content: string;
  updatedAt: string; // ISO
}

export function loadPostDraft(teamMemberId: string): PostDraftPayload | null {
  const raw = storage.getString(key(teamMemberId));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PostDraftPayload;
  } catch {
    return null;
  }
}

export function savePostDraft(teamMemberId: string, payload: PostDraftPayload): void {
  storage.set(key(teamMemberId), JSON.stringify(payload));
}

export function clearPostDraft(teamMemberId: string): void {
  storage.remove(key(teamMemberId));
}

