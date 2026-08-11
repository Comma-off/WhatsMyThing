// Lightweight User-Agent string heuristics.
// Order matters: more specific tokens must be checked before generic ones,
// since e.g. Edge and Opera also contain "Chrome" in their UA string.
export function parseUserAgent(ua) {
  const tests = [
    { name: "Edge", re: /Edg\/([\d.]+)/, engine: "Blink" },
    { name: "Opera", re: /OPR\/([\d.]+)/, engine: "Blink" },
    { name: "Samsung Internet", re: /SamsungBrowser\/([\d.]+)/, engine: "Blink" },
    { name: "Vivaldi", re: /Vivaldi\/([\d.]+)/, engine: "Blink" },
    { name: "Brave", re: /Brave\/([\d.]+)/, engine: "Blink" },
    { name: "Firefox", re: /Firefox\/([\d.]+)/, engine: "Gecko" },
    { name: "Chrome", re: /Chrome\/([\d.]+)/, engine: "Blink" },
    { name: "Safari", re: /Version\/([\d.]+).*Safari/, engine: "WebKit" },
  ];

  for (const test of tests) {
    const match = ua.match(test.re);
    if (match) {
      return { name: test.name, version: match[1], engine: test.engine };
    }
  }

  return { name: null, version: null, engine: null };
}

export function guessEngineFromUA(ua) {
  if (/Gecko\/\d/.test(ua)) return "Gecko";
  if (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return "WebKit";
  if (/AppleWebKit/.test(ua)) return "Blink";
  if (/Trident/.test(ua)) return "Trident";
  return null;
}
