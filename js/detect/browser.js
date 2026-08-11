import { detected, estimated, unavailable } from "../status.js";
import { parseUserAgent, guessEngineFromUA } from "./ua-parse.js";
import { identifyRuntimes } from "./signatures.js";

const ROLE_LABEL = {
  runtime: "Runtime",
  host: "Host application",
};

function brandFromUACH(brands) {
  if (!Array.isArray(brands)) return null;
  return brands.find(
    (b) => !/Not.?A.?Brand/i.test(b.brand)
  );
}

export async function detectBrowser() {
  const items = [];
  const ua = navigator.userAgent || "";
  const uaData = navigator.userAgentData;

  items.push(detected("User-Agent string", ua || "—"));

  if (uaData) {
    let highEntropy = null;
    try {
      highEntropy = await uaData.getHighEntropyValues([
        "fullVersionList",
        "platform",
        "platformVersion",
        "architecture",
        "bitness",
        "model",
      ]);
    } catch {
      highEntropy = null;
    }

    const brandList = highEntropy?.fullVersionList || uaData.brands;
    const brand = brandFromUACH(brandList);

    if (brand) {
      items.push(detected("Browser name", brand.brand));
      items.push(detected("Browser version", brand.version));
    } else {
      const parsed = parseUserAgent(ua);
      items.push(
        parsed.name ? estimated("Browser name", parsed.name, "Parsed from the User-Agent string.") : unavailable("Browser name")
      );
      items.push(
        parsed.version
          ? estimated("Browser version", parsed.version, "Parsed from the User-Agent string.")
          : unavailable("Browser version")
      );
    }

    // UA Client Hints is currently implemented only by Chromium-based
    // browsers, so its presence itself indicates the Blink engine.
    items.push(detected("Rendering engine", "Blink"));

    items.push(
      detected(
        "UA Client Hints brands",
        (uaData.brands || [])
          .map((b) => `${b.brand} ${b.version}`)
          .join(", ") || "—"
      )
    );
    items.push(detected("Mobile (UA-CH)", uaData.mobile ? "Yes" : "No"));
  } else {
    const parsed = parseUserAgent(ua);
    items.push(
      parsed.name
        ? estimated("Browser name", parsed.name, "Parsed from the User-Agent string; UA Client Hints unavailable.")
        : unavailable("Browser name")
    );
    items.push(
      parsed.version
        ? estimated("Browser version", parsed.version, "Parsed from the User-Agent string; UA Client Hints unavailable.")
        : unavailable("Browser version")
    );
    items.push(
      parsed.engine
        ? estimated("Rendering engine", parsed.engine, "Inferred from the User-Agent string.")
        : unavailable("Rendering engine")
    );
    items.push(unavailable("UA Client Hints", "Not supported by this browser."));
  }

  const runtimes = identifyRuntimes(ua);
  for (const match of runtimes) {
    const value = match.version ? `${match.label} ${match.version}` : match.label;
    items.push({
      label: ROLE_LABEL[match.role] || "Detected embedding",
      value,
      status: "detected",
      note: match.note,
    });
  }

  return items;
}
