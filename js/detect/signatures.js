// A small, evidence-based table of User-Agent substrings that reveal a page
// is running inside a specific runtime or host application rather than a
// standalone user-facing browser — e.g. VS Code's built-in browser reports
// itself as Chromium *and* appends its own "Code/x.x.x" and "Electron/x.x.x"
// tokens. Each entry only fires on a literal, documented token, so a browser
// that doesn't carry the token simply won't match (no guessing involved).
export const RUNTIME_SIGNATURES = [
  {
    id: "electron",
    test: /Electron\/([\d.]+)/,
    label: "Electron",
    role: "runtime",
    note: "This page is running inside an Electron app's embedded Chromium, not a standalone browser.",
  },
  {
    id: "vscode",
    test: /\bCode\/([\d.]+)/,
    label: "Visual Studio Code",
    role: "host",
  },
  {
    id: "obsidian",
    test: /\bobsidian\/([\d.]+)/i,
    label: "Obsidian",
    role: "host",
  },
  {
    id: "headless-chrome",
    test: /HeadlessChrome\/([\d.]+)/,
    label: "Headless Chrome",
    role: "runtime",
    note: "A headless/automated browser — likely a bot, test runner, or scraper rather than an interactive session.",
  },
  {
    id: "android-webview",
    test: /Version\/[\d.]+.*\bwv\)/,
    label: "Android WebView",
    role: "host",
    note: "An Android app embedded this page in a WebView instead of opening it in the browser.",
  },
];

export function identifyRuntimes(ua) {
  const matches = [];
  for (const sig of RUNTIME_SIGNATURES) {
    const m = ua.match(sig.test);
    if (m) matches.push({ ...sig, version: m[1] || null });
  }
  return matches;
}
