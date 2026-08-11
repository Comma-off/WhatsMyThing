import { detected, unavailable } from "../status.js";

const TIMEOUT_MS = 5000;

function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return promise(controller.signal).finally(() => clearTimeout(timer));
}

async function fetchIP(url) {
  try {
    const res = await withTimeout(
      (signal) => fetch(url, { signal, cache: "no-store" }),
      TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

function classifyIP(ip) {
  if (!ip) return null;
  return ip.includes(":") ? "IPv6" : "IPv4";
}

// Public IPs are sensitive - mask everything but the leading segment by
// default, and let the UI reveal the full value only on request.
function maskIP(ip) {
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.map((part, i) => (i < 1 ? part : "xxxx")).join(":");
  }
  const parts = ip.split(".");
  return parts.map((part, i) => (i < 1 ? part : "xxx")).join(".");
}

export async function detectNetwork() {
  const items = [];

  const [v4, v6] = await Promise.all([
    fetchIP("https://api.ipify.org?format=json"),
    fetchIP("https://api6.ipify.org?format=json"),
  ]);

  if (v4) {
    items.push({
      label: "Public IPv4 address",
      value: maskIP(v4),
      fullValue: v4,
      sensitive: true,
      status: "detected",
      note: "Looked up via api.ipify.org (the only external request this site makes). Masked by default - click Show to reveal.",
    });
  } else {
    items.push(unavailable("Public IPv4 address", "No IPv4 route, or the lookup service could not be reached."));
  }

  if (v6 && v6 !== v4) {
    items.push({
      label: "Public IPv6 address",
      value: maskIP(v6),
      fullValue: v6,
      sensitive: true,
      status: "detected",
      note: "Looked up via api6.ipify.org (the only external request this site makes). Masked by default - click Show to reveal.",
    });
  } else {
    items.push(unavailable("Public IPv6 address", "No IPv6 route from this network, or the lookup service could not be reached."));
  }

  const primary = v6 && v6 !== v4 ? v6 : v4;
  items.push(
    primary
      ? detected("Address family in use", classifyIP(primary))
      : unavailable("Address family in use")
  );

  if (navigator.connection) {
    const conn = navigator.connection;
    if (conn.effectiveType) {
      items.push({
        label: "Effective connection type",
        value: conn.effectiveType,
        status: "detected",
        note: "Browser-estimated connection quality (based on recent latency/throughput) - not the actual network technology. A fast wired connection can still be classified as \"4g\".",
      });
    }
    if (typeof conn.saveData === "boolean") {
      items.push(detected("Data saver enabled", conn.saveData ? "Yes" : "No"));
    }
  }

  items.push(detected("Online status", navigator.onLine ? "Online" : "Offline"));

  return items;
}
