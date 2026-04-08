type ServerAnalyticsProps = Record<string, string | number | boolean | null>;

export function trackServerEvent(eventName: string, properties: ServerAnalyticsProps): void {
  // Thin wrapper for analytics vendor wiring (Segment/Amplitude/Mixpanel).
  // Kept intentionally minimal during MVP freeze.
  console.log('[server-analytics]', eventName, properties);
}

