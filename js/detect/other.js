import { detected, unavailable } from "../status.js";

export function detectOther() {
  const items = [];

  items.push(detected("Language", navigator.language || "—"));
  items.push(
    detected(
      "Preferred languages",
      (navigator.languages && navigator.languages.join(", ")) || navigator.language || "—"
    )
  );

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    items.push(tz ? detected("Timezone", tz) : unavailable("Timezone"));
  } catch {
    items.push(unavailable("Timezone"));
  }

  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const offsetLabel = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  items.push(detected("UTC offset", offsetLabel));

  if (window.matchMedia) {
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const light = window.matchMedia("(prefers-color-scheme: light)");
    let scheme = "No preference";
    if (dark.matches) scheme = "Dark";
    else if (light.matches) scheme = "Light";
    items.push(detected("Color scheme preference", scheme));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    items.push(detected("Reduced motion preference", reducedMotion ? "Reduced" : "No preference"));

    const reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
    if (reducedData.media !== "not all") {
      items.push(detected("Reduced data preference", reducedData.matches ? "Reduced" : "No preference"));
    }

    const contrast = window.matchMedia("(prefers-contrast: more)");
    if (contrast.media !== "not all") {
      items.push(detected("High contrast preference", contrast.matches ? "More" : "No preference"));
    }
  } else {
    items.push(unavailable("Color scheme preference"));
    items.push(unavailable("Reduced motion preference"));
  }

  items.push(detected("Cookies enabled", navigator.cookieEnabled ? "Yes" : "No"));

  return items;
}
