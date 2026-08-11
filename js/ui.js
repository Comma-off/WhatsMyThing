const STATUS_LABEL = {
  detected: "Detected",
  estimated: "Estimated",
  unavailable: "Unavailable",
  pending: "Working",
};

export const ICONS = {
  hardware:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="8" y="3" width="2" height="3"/><rect x="14" y="3" width="2" height="3"/><rect x="8" y="18" width="2" height="3"/><rect x="14" y="18" width="2" height="3"/><rect x="3" y="8" width="3" height="2"/><rect x="3" y="14" width="3" height="2"/><rect x="18" y="8" width="3" height="2"/><rect x="18" y="14" width="3" height="2"/></svg>',
  browser:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  os:
    '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6v2h3v2H7v-2h3v-2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m0 2v10h16V5Z"/></svg>',
  network:
    '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m-4.5-5.5a6.5 6.5 0 0 1 9 0l-1.5 1.5a4.4 4.4 0 0 0-6 0Zm-3.5-3.5a11 11 0 0 1 16 0l-1.5 1.5a8.9 8.9 0 0 0-13 0ZM.5 8.5a15.5 15.5 0 0 1 23 0L22 10a13.4 13.4 0 0 0-20 0Z"/></svg>',
  other:
    '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="m19.4 13-.1-1-.1-1 1.6-1.3a1 1 0 0 0 .2-1.3l-1.6-2.7a1 1 0 0 0-1.2-.4l-1.9.7a7.4 7.4 0 0 0-1.7-1L14.2 3a1 1 0 0 0-1-.8h-2.4a1 1 0 0 0-1 .8l-.4 2a7.4 7.4 0 0 0-1.7 1L5.8 5.3a1 1 0 0 0-1.2.4L3 8.4a1 1 0 0 0 .2 1.3L4.8 11l-.1 1 .1 1-1.6 1.3a1 1 0 0 0-.2 1.3l1.6 2.7a1 1 0 0 0 1.2.4l1.9-.7a7.4 7.4 0 0 0 1.7 1l.4 2a1 1 0 0 0 1 .8h2.4a1 1 0 0 0 1-.8l.4-2a7.4 7.4 0 0 0 1.7-1l1.9.7a1 1 0 0 0 1.2-.4l1.6-2.7a1 1 0 0 0-.2-1.3ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7"/></svg>',
};

const STATUS_GLYPH = {
  detected:
    '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="m9.5 16.5-4-4L7 11l2.5 2.5L17 6l1.5 1.5Z"/></svg>',
  estimated:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>',
  unavailable:
    '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 11h12v2H6Z"/></svg>',
  pending:
    '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 6a1 1 0 0 1 1 1v4.6l3.4 2a1 1 0 1 1-1 1.8l-3.9-2.3a1 1 0 0 1-.5-.9V7a1 1 0 0 1 1-1"/></svg>',
};

function statusBadge(status) {
  const span = document.createElement("span");
  span.className = `status-badge status-badge--${status}`;
  span.textContent = STATUS_LABEL[status] || status;
  return span;
}

function statusAvatar(status) {
  const span = document.createElement("span");
  span.className = "data-row__avatar";
  span.innerHTML = STATUS_GLYPH[status] || STATUS_GLYPH.pending;
  span.setAttribute("aria-hidden", "true");
  return span;
}

function dataRow(item) {
  const row = document.createElement("div");
  row.className = `data-row data-row--${item.status}`;

  const content = document.createElement("div");
  content.className = "data-row__content";

  const label = document.createElement("span");
  label.className = "data-row__label";
  label.textContent = item.label;

  const valueWrap = document.createElement("div");
  valueWrap.className = "data-row__value";

  const valueText = document.createTextNode(item.value);
  valueWrap.appendChild(valueText);

  if (item.sensitive && item.fullValue) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "reveal-toggle";
    toggle.textContent = "Show";
    let revealed = false;
    toggle.addEventListener("click", () => {
      revealed = !revealed;
      valueText.textContent = revealed ? item.fullValue : item.value;
      toggle.textContent = revealed ? "Hide" : "Show";
    });
    valueWrap.appendChild(toggle);
  }

  if (item.note) {
    const note = document.createElement("span");
    note.className = "data-row__note";
    note.textContent = item.note;
    valueWrap.appendChild(note);
  }

  if (item.raw && item.raw !== item.value) {
    const details = document.createElement("details");
    details.className = "data-row__raw";
    const summary = document.createElement("summary");
    summary.textContent = "Raw WebGL string";
    const code = document.createElement("code");
    code.textContent = item.raw;
    details.appendChild(summary);
    details.appendChild(code);
    valueWrap.appendChild(details);
  }

  content.appendChild(label);
  content.appendChild(valueWrap);

  row.appendChild(statusAvatar(item.status));
  row.appendChild(content);
  row.appendChild(statusBadge(item.status));
  return row;
}

function pendingRow() {
  const row = document.createElement("div");
  row.className = "data-row data-row--pending";

  const content = document.createElement("div");
  content.className = "data-row__content";
  const label = document.createElement("span");
  label.className = "data-row__label";
  label.textContent = "Reading…";
  content.appendChild(label);

  row.appendChild(statusAvatar("pending"));
  row.appendChild(content);
  row.appendChild(statusBadge("pending"));
  return row;
}

export function fillSection(card, items) {
  const list = card.querySelector(".section-card__list");
  list.innerHTML = "";
  items.forEach((item) => list.appendChild(dataRow(item)));
}

export function renderSection({ id, title, icon, items = null, delayIndex = 0 }) {
  const card = document.createElement("section");
  card.className = "section-card";
  card.style.animationDelay = `${delayIndex * 80}ms`;
  card.id = id;

  const header = document.createElement("div");
  header.className = "section-card__header";

  const iconWrap = document.createElement("span");
  iconWrap.className = "section-card__icon";
  iconWrap.innerHTML = icon;
  iconWrap.setAttribute("aria-hidden", "true");

  const heading = document.createElement("h2");
  heading.className = "section-card__title";
  heading.textContent = title;

  header.appendChild(iconWrap);
  header.appendChild(heading);

  const list = document.createElement("div");
  list.className = "section-card__list";
  if (items) {
    items.forEach((item) => list.appendChild(dataRow(item)));
  } else {
    list.appendChild(pendingRow());
  }

  card.appendChild(header);
  card.appendChild(list);
  return card;
}

export function buildSummaryChip(text, iconSvg) {
  const chip = document.createElement("span");
  chip.className = "summary-chip";
  chip.innerHTML = `${iconSvg}<span>${text}</span>`;
  return chip;
}

export function showSnackbar(message) {
  const el = document.getElementById("snackbar");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("visible"), 3000);
}

export function buildTextReport(sections) {
  const lines = [`WhatsMyThing - environment report`, `Generated ${new Date().toString()}`, ""];
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    for (const item of section.items) {
      const status = STATUS_LABEL[item.status] || item.status;
      lines.push(`- ${item.label}: ${item.value} [${status}]`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
