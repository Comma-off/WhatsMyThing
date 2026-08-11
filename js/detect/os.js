import { detected, estimated, unavailable } from "../status.js";

// Coarse Windows 10/11 split from Sec-CH-UA-Platform-Version, per
// https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11
// First component 0 => Win7/8/8.1, 1-12 => Win10, 13+ => Win11.
function decodeWindowsVersion(platformVersion) {
  if (!platformVersion) return null;
  const major = parseInt(platformVersion.split(".")[0], 10);
  if (Number.isNaN(major)) return null;
  if (major >= 13) return "Windows 11";
  if (major > 0) return "Windows 10";
  return "Windows 7 / 8 / 8.1";
}

function parseUAForOS(ua) {
  const patterns = [
    { re: /Windows NT 10\.0/, family: "Windows", version: "10 (or 11)" },
    { re: /Windows NT 6\.3/, family: "Windows", version: "8.1" },
    { re: /Windows NT 6\.2/, family: "Windows", version: "8" },
    { re: /Windows NT 6\.1/, family: "Windows", version: "7" },
    { re: /Mac OS X (\d+[._]\d+(?:[._]\d+)?)/, family: "macOS", version: null },
    { re: /Android (\d+(?:\.\d+)?)/, family: "Android", version: null },
    { re: /CrOS/, family: "Chrome OS", version: null },
    { re: /iPhone OS (\d+[._]\d+)/, family: "iOS", version: null },
    { re: /Linux/, family: "Linux", version: null },
  ];

  for (const p of patterns) {
    const match = ua.match(p.re);
    if (match) {
      const version = p.version !== null ? p.version : match[1]?.replace(/_/g, ".");
      return { family: p.family, version: version || null };
    }
  }
  return { family: null, version: null };
}

export async function detectOS() {
  const items = [];
  const ua = navigator.userAgent || "";
  const uaData = navigator.userAgentData;
  const uaParsed = parseUAForOS(ua);
  let highEntropy = null;
  let platform = null;

  if (uaData) {
    try {
      highEntropy = await uaData.getHighEntropyValues([
        "platform",
        "platformVersion",
        "architecture",
        "bitness",
        "model",
      ]);
    } catch {
      highEntropy = null;
    }

    platform = highEntropy?.platform || uaData.platform;
    items.push(platform ? detected("Platform", platform) : unavailable("Platform"));

    if (platform === "Windows" && highEntropy?.platformVersion) {
      const winVersion = decodeWindowsVersion(highEntropy.platformVersion);
      items.push(
        winVersion
          ? detected("OS version", winVersion)
          : unavailable("OS version")
      );
    } else if (highEntropy?.platformVersion) {
      items.push(detected("OS version", highEntropy.platformVersion));
    } else if (uaParsed.version) {
      items.push(estimated("OS version", uaParsed.version, "Parsed from the User-Agent string."));
    } else {
      items.push(unavailable("OS version"));
    }

    if (highEntropy?.architecture) {
      const bitness = highEntropy.bitness ? `${highEntropy.bitness}-bit` : "";
      items.push(
        detected("Architecture", [highEntropy.architecture, bitness].filter(Boolean).join(", "))
      );
    } else {
      items.push(unavailable("Architecture"));
    }

    if (highEntropy?.model) {
      items.push(detected("Device model", highEntropy.model));
    }
  } else {
    items.push(
      uaParsed.family
        ? estimated("Platform", uaParsed.family, "Parsed from the User-Agent string; UA Client Hints unavailable.")
        : unavailable("Platform")
    );
    items.push(
      uaParsed.version
        ? estimated("OS version", uaParsed.version, "Parsed from the User-Agent string.")
        : unavailable("OS version")
    );
    items.push(unavailable("Architecture", "UA Client Hints not supported by this browser."));
  }

  // Linux distro: only occasionally present in the UA string of some
  // Firefox/Chromium builds (e.g. "X11; Ubuntu; Linux x86_64"). Never guessed.
  const distroMatch = ua.match(/X11;\s*([A-Za-z]+);\s*Linux/);
  if (distroMatch) {
    items.push(detected("Linux distribution", distroMatch[1]));
  } else if (/Linux/.test(ua) && !/Android/.test(ua)) {
    items.push(unavailable("Linux distribution", "Not included in this browser's User-Agent string."));
  }

  // Kernel: the literal "Linux" token in the UA string reliably names the
  // kernel family on desktop Linux (a direct read, not an inference). The
  // *version* is a different story: Chromium's Sec-CH-UA-Platform-Version
  // hint used to return the real kernel version string on Linux, until this
  // was patched to return an empty string (landed ~April 2025, see
  // https://github.com/web-platform-tests/wpt/pull/52191) specifically
  // because it had "no legitimate use on the web ... only for fingerprinting".
  // Up-to-date Chromium browsers will report Unavailable here; an older or
  // embedded Chromium build (e.g. some Electron apps) that predates the
  // patch may still hand it over, in which case it's shown as a genuine
  // Detected value, not a guess.
  const isLinuxDesktop = uaData
    ? platform === "Linux"
    : /Linux/.test(ua) && !/Android/.test(ua);

  if (isLinuxDesktop) {
    items.push(detected("Kernel family", "Linux"));
    if (highEntropy?.platformVersion) {
      items.push({
        ...detected("Kernel version", highEntropy.platformVersion),
        note: "Exposed via UA Client Hints. Most current Chromium browsers block this since April 2025 - seeing a real value here usually means an older or embedded Chromium build.",
      });
    } else {
      items.push(unavailable("Kernel version", "Not exposed by this browser."));
    }
  } else {
    items.push(unavailable("Kernel", "Not exposed by the browser."));
  }

  items.push(unavailable("OS build", "Not exposed by the browser."));

  return items;
}
