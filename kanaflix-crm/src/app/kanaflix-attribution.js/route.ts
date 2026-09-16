const attributionScript = String.raw`(() => {
  const parameterKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  const storageKey = "kanaflix_attribution_v1";

  function readStored() {
    try { return JSON.parse(window.localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  }

  function collect() {
    const stored = readStored();
    const query = new URLSearchParams(window.location.search);
    const current = {};
    for (const key of parameterKeys) {
      const value = query.get(key);
      if (value) current[key] = value.slice(0, 500);
    }
    const hasNewAttribution = Object.keys(current).length > 0;
    const attribution = { ...stored, ...current };
    if (hasNewAttribution || !attribution.landing_page_url) attribution.landing_page_url = window.location.href.slice(0, 1000);
    if ((hasNewAttribution || !attribution.referrer_url) && document.referrer) attribution.referrer_url = document.referrer.slice(0, 1000);
    try { window.localStorage.setItem(storageKey, JSON.stringify(attribution)); } catch {}
    return attribution;
  }

  function decorateForm(form, attribution) {
    if (!(form instanceof HTMLFormElement) || !form.matches("form[data-kanaflix-attribution]")) return;
    for (const [key, value] of Object.entries(attribution)) {
      if (!value) continue;
      const fieldName = "_" + key;
      let input = form.querySelector('input[name="' + fieldName + '"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = fieldName;
        form.appendChild(input);
      }
      input.value = String(value);
    }
  }

  function notifyFrame(frame, attribution) {
    if (!(frame instanceof HTMLIFrameElement) || !frame.matches("iframe[data-kanaflix-form]")) return;
    const send = () => {
      try {
        const targetOrigin = new URL(frame.src, window.location.href).origin;
        frame.contentWindow?.postMessage({ type: "kanaflix:attribution", attribution }, targetOrigin);
      } catch {}
    };
    frame.addEventListener("load", send, { once: false });
    window.setTimeout(send, 250);
  }

  const attribution = collect();
  const scan = (root = document) => {
    root.querySelectorAll?.("form[data-kanaflix-attribution]").forEach((form) => decorateForm(form, attribution));
    root.querySelectorAll?.("iframe[data-kanaflix-form]").forEach((frame) => notifyFrame(frame, attribution));
  };
  const start = () => {
    scan();
    new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        if (node.matches("form[data-kanaflix-attribution]")) decorateForm(node, attribution);
        if (node.matches("iframe[data-kanaflix-form]")) notifyFrame(node, attribution);
        scan(node);
      }
    }))).observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
  window.KanaflixAttribution = { get: () => ({ ...collect() }), decorate: () => scan() };
})();`;

export async function GET() {
  return new Response(attributionScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
