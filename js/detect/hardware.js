import { detected, estimated, unavailable } from "../status.js";

// Chrome/Edge (and Firefox on Windows) report GPU info through ANGLE's
// translation layer as "ANGLE (<vendor>, <device + backend details>, <api>)".
// This pulls the three parts apart so the device name can be shown cleanly,
// while the untouched string stays available as the row's raw value.
function parseAngleRenderer(renderer) {
  const m = renderer.match(/^ANGLE \(([^,]+), (.+), ([^,]+)\)$/);
  if (!m) return null;
  const [, vendor, deviceRaw, api] = m;
  const device = deviceRaw
    .replace(/\s*Direct3D11(?:\s+vs_\d_\d\s+ps_\d_\d)?/i, "")
    .replace(/\/PCIe\/SSE2$/i, "")
    .replace(/\/PCIe$/i, "")
    .trim();
  return { vendor: vendor.trim(), device: device || deviceRaw.trim(), api: api.trim() };
}

function detectGPU() {
  const items = [];
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    const gl = gl2 || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return [
        unavailable("WebGL version", "WebGL is not supported in this browser."),
        unavailable("GPU vendor"),
        unavailable("GPU renderer"),
      ];
    }

    items.push(detected("WebGL version", gl2 ? "WebGL 2" : "WebGL 1"));

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const rawVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
      const rawRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      const parsed = rawRenderer ? parseAngleRenderer(rawRenderer) : null;

      if (parsed) {
        items.push({ ...detected("GPU vendor", parsed.vendor), raw: rawVendor });
        items.push({ ...detected("GPU renderer", parsed.device), raw: rawRenderer });
        items.push(detected("Native graphics API", parsed.api));
        items.push(detected("Rendering path", "ANGLE"));
      } else {
        items.push(rawVendor ? detected("GPU vendor", rawVendor) : unavailable("GPU vendor"));
        items.push(rawRenderer ? detected("GPU renderer", rawRenderer) : unavailable("GPU renderer"));
      }
    } else {
      const vendor = gl.getParameter(gl.VENDOR);
      const renderer = gl.getParameter(gl.RENDERER);
      const note = "Detailed GPU info is masked by this browser.";
      items.push(vendor ? estimated("GPU vendor", vendor, note) : unavailable("GPU vendor"));
      items.push(renderer ? estimated("GPU renderer", renderer, note) : unavailable("GPU renderer"));
    }
  } catch {
    return [unavailable("WebGL version"), unavailable("GPU vendor"), unavailable("GPU renderer")];
  }
  return items;
}

export function detectHardware() {
  const items = [];

  items.push(
    typeof navigator.hardwareConcurrency === "number"
      ? detected("Logical processors", String(navigator.hardwareConcurrency))
      : unavailable("Logical processors")
  );

  items.push(
    typeof navigator.deviceMemory === "number"
      ? estimated(
          "Approx. RAM",
          `${navigator.deviceMemory} GB`,
          "Reported by the browser in rounded steps, and capped at 8 GB by design."
        )
      : unavailable("Approx. RAM")
  );

  items.push(...detectGPU());

  items.push(
    detected("Screen resolution", `${screen.width} × ${screen.height} px`)
  );
  items.push(
    detected(
      "Available screen area",
      `${screen.availWidth} × ${screen.availHeight} px`
    )
  );
  items.push(
    detected("Device pixel ratio", `${window.devicePixelRatio || 1}×`)
  );

  const touchPoints = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0;
  const hasTouch = "ontouchstart" in window || touchPoints > 0;
  items.push(detected("Touch support", hasTouch ? "Yes" : "No"));
  if (touchPoints > 0) {
    items.push({
      ...detected("Max touch points", String(touchPoints)),
      note: "Reflects the display/input hardware the browser can see - not necessarily that the device is being used with touch right now.",
    });
  }

  return items;
}
