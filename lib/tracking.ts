/**
 * Attribution & Instagram / Meta Conversion Tracking Helper
 * Captures UTM parameters, Facebook Click IDs (fbclid), and referral data,
 * persisting them across multi-step booking flows and transmitting to GHL.
 */

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  landingPage?: string;
  referralUrl?: string;
  capturedAt?: string;
}

const STORAGE_KEY = "tropica_ad_attribution";

/**
 * Reads a cookie value by name
 */
const getCookie = (name: string): string => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : "";
};

/**
 * Initializes and captures attribution from URL parameters on page load
 */
export const initAttributionTracking = (): AttributionData => {
  if (typeof window === "undefined") return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const existingRaw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    const existing: AttributionData = existingRaw ? JSON.parse(existingRaw) : {};

    const utm_source = urlParams.get("utm_source") || existing.utm_source || "";
    const utm_medium = urlParams.get("utm_medium") || existing.utm_medium || "";
    const utm_campaign = urlParams.get("utm_campaign") || existing.utm_campaign || "";
    const utm_content = urlParams.get("utm_content") || existing.utm_content || "";
    const utm_term = urlParams.get("utm_term") || existing.utm_term || "";
    const fbclid = urlParams.get("fbclid") || existing.fbclid || "";

    // Generate Facebook Click Cookie (_fbc) format if fbclid is present: fb.1.{timestamp}.{fbclid}
    let fbc = existing.fbc || getCookie("_fbc") || "";
    if (fbclid && !fbc) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    // Read Facebook Browser Cookie (_fbp)
    const fbp = existing.fbp || getCookie("_fbp") || "";

    const landingPage = existing.landingPage || window.location.href.split("?")[0];
    const referralUrl = existing.referralUrl || document.referrer || "";

    const attribution: AttributionData = {
      utm_source: utm_source || (document.referrer.includes("instagram.com") ? "instagram" : undefined),
      utm_medium: utm_medium || (document.referrer.includes("instagram.com") ? "social" : undefined),
      utm_campaign: utm_campaign || undefined,
      utm_content: utm_content || undefined,
      utm_term: utm_term || undefined,
      fbclid: fbclid || undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      landingPage,
      referralUrl,
      capturedAt: existing.capturedAt || new Date().toISOString()
    };

    // Store in both session & local storage to survive tab closures and reloads
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));

    return attribution;
  } catch (err) {
    console.warn("[Attribution Tracking Error]", err);
    return {};
  }
};

/**
 * Retrieves the stored attribution data formatted for booking submission
 */
export const getAttributionPayload = (): Record<string, string> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const data: AttributionData = JSON.parse(raw);
    const payload: Record<string, string> = {};

    if (data.utm_source) payload.utmSource = data.utm_source;
    if (data.utm_medium) payload.utmMedium = data.utm_medium;
    if (data.utm_campaign) payload.utmCampaign = data.utm_campaign;
    if (data.utm_content) payload.utmContent = data.utm_content;
    if (data.utm_term) payload.utmTerm = data.utm_term;
    if (data.fbclid) payload.fbclid = data.fbclid;
    if (data.fbc) payload.fbc = data.fbc;
    if (data.fbp) payload.fbp = data.fbp;
    if (data.landingPage) payload.referralUrl = data.landingPage;

    return payload;
  } catch {
    return {};
  }
};

/**
 * Triggers Meta / Facebook Pixel events if pixel is mounted on the page
 */
export const trackMetaConversion = (
  eventName: "Lead" | "ViewContent" | "Schedule" | "Purchase",
  params: Record<string, any> = {}
) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    try {
      (window as any).fbq("track", eventName, params);
      console.log(`[Meta Pixel] Tracked '${eventName}':`, params);
    } catch (e) {
      console.warn("[Meta Pixel Error]", e);
    }
  }
};
