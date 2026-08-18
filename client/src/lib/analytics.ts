import { nanoid } from "nanoid";

const SESSION_KEY = "lps_session_id";
const SOURCE_KEY = "lps_traffic_source";

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = nanoid(21);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Determine traffic source from UTM params or referrer, persisted for the session */
export function getTrafficSource(): string {
  const stored = sessionStorage.getItem(SOURCE_KEY);
  if (stored) return stored;
  const params = new URLSearchParams(window.location.search);
  let source = params.get("utm_source") || params.get("ref") || "";
  if (!source && document.referrer) {
    try {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) source = host;
    } catch { /* ignore */ }
  }
  if (!source) source = "direct";
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const full = [source, medium, campaign].filter(Boolean).join(" / ").slice(0, 160);
  sessionStorage.setItem(SOURCE_KEY, full);
  return full;
}
