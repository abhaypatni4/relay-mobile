/** Thin analytics wrapper — vendor TBD per docs/engineering/frontend-architecture.md */

export function trackEvent(_name: string, _payload?: Record<string, string | number | boolean>): void {
  // no-op in M0
}
