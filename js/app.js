import { detectHardware } from "./detect/hardware.js";
import { detectBrowser } from "./detect/browser.js";
import { detectOS } from "./detect/os.js";
import { detectNetwork } from "./detect/network.js";
import { detectOther } from "./detect/other.js";
import { renderSection, fillSection, ICONS, showSnackbar, buildTextReport } from "./ui.js";

const THEME_KEY = "whatsmything-theme";

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current =
      document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });
}

function countByStatus(items) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { detected: 0, estimated: 0, unavailable: 0 }
  );
}

function renderHeroSummary(sections) {
  const all = sections.flatMap((s) => s.items);
  const counts = countByStatus(all);
  const hero = document.getElementById("hero-summary");
  hero.innerHTML = "";

  const chipInfo = [
    {
      text: `${counts.detected} detected`,
      color: "detected",
    },
    {
      text: `${counts.estimated} estimated`,
      color: "estimated",
    },
    {
      text: `${counts.unavailable} unavailable`,
      color: "unavailable",
    },
  ];

  chipInfo.forEach(({ text }, i) => {
    const chip = document.createElement("span");
    chip.className = "summary-chip";
    chip.style.animationDelay = `${i * 60}ms`;
    chip.textContent = text;
    hero.appendChild(chip);
  });
}

async function main() {
  initTheme();

  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";

  const sectionDefs = [
    { id: "hardware", title: "Hardware", icon: ICONS.hardware, run: () => detectHardware() },
    { id: "browser", title: "Browser", icon: ICONS.browser, run: () => detectBrowser() },
    { id: "os", title: "Operating System", icon: ICONS.os, run: () => detectOS() },
    { id: "network", title: "Network", icon: ICONS.network, run: () => detectNetwork() },
    { id: "other", title: "Locale & Preferences", icon: ICONS.other, run: () => detectOther() },
  ];

  const cards = sectionDefs.map((def, i) => {
    const card = renderSection({
      id: def.id,
      title: def.title,
      icon: def.icon,
      delayIndex: i,
    });
    grid.appendChild(card);
    return card;
  });

  const resultPromises = sectionDefs.map(async (def, i) => {
    const items = await def.run();
    fillSection(cards[i], items);
    return { ...def, items };
  });

  const results = await Promise.all(resultPromises);
  renderHeroSummary(results);

  document.getElementById("copy-report").addEventListener("click", async () => {
    const report = buildTextReport(results);
    try {
      await navigator.clipboard.writeText(report);
      showSnackbar("Report copied to clipboard");
    } catch {
      showSnackbar("Couldn't access clipboard - copy manually from the console");
      console.log(report);
    }
  });
}

main();
