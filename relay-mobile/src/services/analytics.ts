import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

type Props = Record<string, unknown>;

const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const queue: Array<{ eventName: string; properties: Props }> = [];

let getTeamSizeFromCache: (() => number | null) | null = null;

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return `u_${(h >>> 0).toString(16)}`;
}

function sanitize(input: Props): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(input)) {
    const key = k.toLowerCase();
    if (key.includes('email') || key.includes('phone') || key.includes('name')) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

function baseProps(): Props {
  const userId = useAuthStore.getState().userId;
  const teamId = useTeamStore.getState().activeTeamId;
  const role = useTeamStore.getState().role;
  const teamSize = getTeamSizeFromCache?.() ?? null;
  return {
    userId: userId ? hash(userId) : null,
    teamId,
    role,
    teamSize,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    timestamp: new Date().toISOString(),
    sessionId,
  };
}

function send(eventName: string, properties: Props): void {
  // Vendor adapter hook (Segment/Amplitude/Mixpanel).
  // Current implementation keeps a thin boundary and logs in dev.
  if (__DEV__) {
    console.log('[analytics]', eventName, properties);
  }
}

function flushIfOnline(): void {
  if (useUiStore.getState().isOffline) {
    return;
  }
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    send(next.eventName, next.properties);
  }
}

export const analytics = {
  configure(input: { getTeamSize: () => number | null }) {
    getTeamSizeFromCache = input.getTeamSize;
  },
  track(eventName: string, properties: Props = {}) {
    const payload = { ...baseProps(), ...sanitize(properties) };
    if (useUiStore.getState().isOffline) {
      queue.push({ eventName, properties: payload });
      return;
    }
    send(eventName, payload);
    flushIfOnline();
  },
  identify(pseudoUserId: string, traits: Props = {}) {
    const payload = sanitize(traits);
    if (__DEV__) {
      console.log('[analytics:identify]', pseudoUserId, payload);
    }
  },
  screen(screenName: string) {
    this.track('screen_viewed', { screenName });
  },
  flushQueueOnReconnect() {
    flushIfOnline();
  },
};

export function pseudonymizedUserId(rawUserId: string | null): string | null {
  return rawUserId ? hash(rawUserId) : null;
}
