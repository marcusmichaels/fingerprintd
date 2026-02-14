// ---- small utils ----------------------------------------------------------
function safe(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mm(q) {
  return typeof matchMedia === "function" ? matchMedia(q).matches : null;
}

// ---- canvas fingerprint (toggleable) --------------------------------------
function canvasDataUrl() {
  try {
    const c = document.createElement("canvas");
    c.width = 260;
    c.height = 60;
    const x = c.getContext("2d");
    x.fillStyle = "#f0f0f0";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#111";
    x.textBaseline = "middle";
    x.font = '18px "Arial"';
    x.fillText("CanvasFingerprint ✓ 𝔗𝔢𝔰𝔱", 10, 22);
    x.fillStyle = "rgba(255,0,0,0.6)";
    x.beginPath();
    x.arc(200, 38, 10, 0, Math.PI * 2);
    x.fill();
    return c.toDataURL();
  } catch (e) {
    return null;
  }
}

// ---- WebGL info (vendor/renderer if available) ----------------------------
function webglInfo() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return null;
    const info = {
      antialias: gl.getContextAttributes()?.antialias ?? null,
      renderer: null,
      vendor: null,
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      version: gl.getParameter(gl.VERSION),
    };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) {
      info.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
      info.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    }
    return info;
  } catch (e) {
    return null;
  }
}

// ---- Quick font presence check (no network) -------------------------------
function detectFonts(
  list = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Comic Sans MS",
    "Monaco",
    "Helvetica Neue",
    "Georgia",
    "Verdana",
    "Impact",
    "Trebuchet MS",
  ]
) {
  try {
    const test = document.createElement("span");
    test.innerHTML = "mmmmmmmmmlllllIIIIWWWWW";
    test.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;font-size:32px;";
    document.body.appendChild(test);
    const base = {};
    for (const baseFam of ["monospace", "serif", "sans-serif"]) {
      test.style.fontFamily = baseFam;
      base[baseFam] = { w: test.offsetWidth, h: test.offsetHeight };
    }
    const present = {};
    for (const font of list) {
      let found = false;
      for (const baseFam of ["monospace", "serif", "sans-serif"]) {
        test.style.fontFamily = `'${font}',${baseFam}`;
        if (
          test.offsetWidth !== base[baseFam].w ||
          test.offsetHeight !== base[baseFam].h
        ) {
          found = true;
          break;
        }
      }
      present[font] = found;
    }
    document.body.removeChild(test);
    return present;
  } catch (e) {
    return null;
  }
}

// ---- Ad-block heuristic ---------------------------------------------------
function adblockHeuristic() {
  try {
    const bait = document.createElement("div");
    bait.className = "adsbox ad ads banner ad-placement ad-unit ad-zone";
    bait.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;";
    document.body.appendChild(bait);
    const blocked =
      getComputedStyle(bait).display === "none" ||
      bait.offsetParent === null ||
      bait.clientHeight === 0;
    document.body.removeChild(bait);
    return blocked;
  } catch (e) {
    return null;
  }
}

// ---- Count data points recursively ----------------------------------------
function countDataPoints(obj, depth = 0) {
  if (depth > 10) return 0;
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== "object") return 1;
  if (Array.isArray(obj))
    return obj.reduce((sum, item) => sum + countDataPoints(item, depth + 1), 0);
  return Object.values(obj).reduce(
    (sum, val) => sum + countDataPoints(val, depth + 1),
    0
  );
}

// ---- Gather everything ----------------------------------------------------
async function gather(opts) {
  const nav = navigator;

  // User-Agent Client Hints (low + some high-entropy if available)
  let uaCH = null;
  try {
    if (nav.userAgentData) {
      uaCH = {
        brands: nav.userAgentData.brands || null,
        mobile: nav.userAgentData.mobile || false,
        platform: nav.userAgentData.platform || null,
      };
      if (typeof nav.userAgentData.getHighEntropyValues === "function") {
        try {
          const high = await nav.userAgentData.getHighEntropyValues([
            "architecture",
            "bitness",
            "model",
            "platformVersion",
            "uaFullVersion",
          ]);
          Object.assign(uaCH, high);
        } catch (e) {}
      }
    }
  } catch (e) {}

  // Performance + paints + navigation entry
  const perf = {};
  try {
    const p = performance;
    const navEntry = p.getEntriesByType?.("navigation")?.[0] || null;
    const paints = p.getEntriesByType?.("paint") || [];
    perf.now = p.now?.() ?? null;
    perf.navigation = navEntry
      ? { type: navEntry.type, redirectCount: navEntry.redirectCount }
      : null;
    perf.timing = p.timing
      ? {
          navigationStart: p.timing.navigationStart,
          domContentLoadedEventEnd: p.timing.domContentLoadedEventEnd,
          loadEventEnd: p.timing.loadEventEnd,
        }
      : null;
    perf.paints = paints.map((x) => ({
      name: x.name,
      startTime: Math.round(x.startTime),
    }));
    perf.resources = (p.getEntriesByType?.("resource") || [])
      .slice(0, 8)
      .map((r) => ({
        name: r.name,
        initiatorType: r.initiatorType,
        duration: Math.round(r.duration),
      }));
    // Chrome-only memory stats (coarse)
    perf.memory = performance.memory
      ? {
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize,
        }
      : null;
  } catch (e) {}

  // Network information
  const conRaw =
    nav.connection || nav.mozConnection || nav.webkitConnection || null;
  const connection = conRaw
    ? {
        effectiveType: conRaw.effectiveType,
        downlink: conRaw.downlink,
        rtt: conRaw.rtt,
        saveData: conRaw.saveData,
      }
    : null;

  // Storage estimate
  const storage = await (nav.storage && nav.storage.estimate
    ? nav.storage.estimate()
    : Promise.resolve(null)
  ).catch(() => null);

  // AudioContext
  const audio = safe(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const info = { sampleRate: ctx.sampleRate };
    ctx.close?.();
    return info;
  });

  // Media devices (counts only; labels empty without permission)
  let mediaDevices = null;
  try {
    if (nav.mediaDevices?.enumerateDevices) {
      const list = await nav.mediaDevices.enumerateDevices();
      mediaDevices = ["audioinput", "audiooutput", "videoinput"].reduce(
        (acc, k) => ((acc[k] = list.filter((d) => d.kind === k).length), acc),
        {}
      );
    }
  } catch (e) {
    mediaDevices = null;
  }

  // Preferences via media queries
  const prefs = {
    prefersColorScheme: mm("(prefers-color-scheme: dark)")
      ? "dark"
      : mm("(prefers-color-scheme: light)")
        ? "light"
        : "no-preference",
    prefersReducedMotion: mm("(prefers-reduced-motion: reduce)"),
    prefersContrast: mm("(prefers-contrast: more)")
      ? "more"
      : mm("(prefers-contrast: less)")
        ? "less"
        : mm("(prefers-contrast: no-preference)")
          ? "no-preference"
          : null,
    forcedColors: mm("(forced-colors: active)"),
    invertedColors: mm("(inverted-colors: inverted)"),
    colorGamut: mm("(color-gamut: rec2020)")
      ? "rec2020"
      : mm("(color-gamut: p3)")
        ? "p3"
        : mm("(color-gamut: srgb)")
          ? "srgb"
          : null,
    hdr: mm("(dynamic-range: high)"),
    pointer: mm("(pointer: fine)")
      ? "fine"
      : mm("(pointer: coarse)")
        ? "coarse"
        : mm("(pointer: none)")
          ? "none"
          : null,
    hover: mm("(hover: hover)") ? "hover" : mm("(hover: none)") ? "none" : null,
  };

  // WebGL
  const webgl = opts.includeWebGL ? webglInfo() : null;

  // Canvas hash
  const canvasData = opts.includeCanvas ? canvasDataUrl() : null;
  const canvasHash = canvasData ? await sha256Hex(canvasData) : null;

  // Fonts quick check
  const fonts = opts.includeFonts ? detectFonts() : null;

  // Intl / timezone / locale
  const intl = safe(() => {
    const ro = Intl.DateTimeFormat().resolvedOptions();
    return {
      locale: ro.locale,
      timeZone: ro.timeZone,
      calendar: ro.calendar,
      numberingSystem: ro.numberingSystem,
      hourCycle: ro.hourCycle || null,
      timeZoneNameExample: new Date().toString(),
      utcOffsetMinutes: new Date().getTimezoneOffset(),
    };
  });

  // Screen & viewport
  const screenInfo = {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: safe(() => ({
      type: screen.orientation?.type || null,
      angle: screen.orientation?.angle || 0,
    })),
  };
  const viewport = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };

  // Document/page basics
  const page = {
    href: location.href,
    referrer: document.referrer || null,
    title: document.title || null,
    visibilityState: document.visibilityState,
    wasPrerendered: document.prerendering || false,
    historyLength: history.length,
  };

  // Features present
  const features = {
    cookiesEnabled: nav.cookieEnabled,
    documentCookie: document.cookie || null, // not HttpOnly
    localStorage: safe(() => typeof localStorage !== "undefined"),
    sessionStorage: safe(() => typeof sessionStorage !== "undefined"),
    serviceWorker: "serviceWorker" in nav,
    serviceWorkerControlled: !!nav.serviceWorker?.controller,
    webgl: !!webgl,
    webp: null,
    doNotTrack: nav.doNotTrack || null,
    onLine: nav.onLine,
    clipboard: "clipboard" in nav,
    share: "share" in nav,
    vibration: "vibrate" in nav,
  };

  // Quick WebP support check
  try {
    const img = new Image();
    features.webp = await new Promise((res) => {
      img.onload = () => res(img.width === 1 && img.height === 1);
      img.onerror = () => res(false);
      img.src =
        "data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
    });
  } catch (e) {
    features.webp = null;
  }

  // Ad-block heuristic
  const adblock = adblockHeuristic();

  // Navigator summary
  const navSummary = {
    userAgent: nav.userAgent,
    platform: nav.platform,
    languages: nav.languages || [nav.language || null],
    hardwareConcurrency: nav.hardwareConcurrency || null,
    deviceMemory: nav.deviceMemory || null,
    maxTouchPoints: nav.maxTouchPoints || 0,
    plugins: Array.from(nav.plugins || [])
      .map((p) => p.name)
      .slice(0, 12),
  };

  // Build collected object
  const collected = {
    ts: new Date().toISOString(),
    page,
    viewport,
    screen: screenInfo,
    navigator: navSummary,
    uaCH,
    prefs,
    connection,
    storage,
    audio,
    mediaDevices,
    performance: perf,
    webgl,
    canvasHash,
    fonts,
    intl,
    features,
    adblockDetected: adblock,
  };

  // Derived fingerprint (demo): hash a subset of relatively stable values
  const fpSource = JSON.stringify({
    ua: nav.userAgent,
    brands: uaCH?.brands,
    mobile: uaCH?.mobile,
    plat: uaCH?.platform,
    arch: uaCH?.architecture,
    bit: uaCH?.bitness,
    lang: nav.languages,
    tz: intl?.timeZone,
    offs: intl?.utcOffsetMinutes,
    scr: [
      screenInfo.width,
      screenInfo.height,
      screenInfo.colorDepth,
      screenInfo.pixelDepth,
      screenInfo.devicePixelRatio,
    ],
    pref: prefs,
    webgl: webgl ? [webgl.vendor, webgl.renderer] : null,
    fonts,
    hwc: nav.hardwareConcurrency,
    dm: nav.deviceMemory,
    touch: nav.maxTouchPoints,
    canvas: canvasHash,
  });
  collected.fingerprint = await sha256Hex(fpSource);

  return collected;
}

// ---- Simulated server log -------------------------------------------------
function makeSimulatedServerLog(col) {
  const time = new Date().toLocaleString();
  const path = new URL(col.page.href).pathname + new URL(col.page.href).search;
  const requestLine = `GET ${path || "/"} HTTP/1.1`;
  const referer = col.page.referrer || "-";
  const ua = col.navigator.userAgent || "-";
  const remoteAddr = "[YOUR_IP_ADDRESS]";
  const tls = "[TLS_VERSION, CIPHER_SUITE]";
  const xff = "[PROXY_CHAIN_IPS]";
  const status = 200,
    bytes = 12345;
  const rt = Math.round(col.performance?.now || 0);
  return `${remoteAddr} - - [${time}] "${requestLine}" ${status} ${bytes} "${referer}" "${ua}" rt=${rt}ms\n\nAdditional server-side data:\n- TLS: ${tls}\n- X-Forwarded-For: ${xff}\n- Accept-Language: ${col.navigator.languages?.join(", ")}\n- Screen: ${col.screen.width}x${col.screen.height}`;
}

// ---- Wire up UI -----------------------------------------------------------
(async function () {
  const out = document.getElementById("out");
  const serverEl = document.getElementById("serverLog");
  const copyBtn = document.getElementById("copyBtn");
  const dlBtn = document.getElementById("downloadBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const toggleCanvas = document.getElementById("toggleCanvas");
  const toggleWebGL = document.getElementById("toggleWebGL");
  const toggleFonts = document.getElementById("toggleFonts");
  const fpHashEl = document.getElementById("fpHash");
  const dataPointCountEl = document.getElementById("dataPointCount");
  const uniquenessEl = document.getElementById("uniquenessScore");
  const trackabilityEl = document.getElementById("trackability");

  async function update() {
    out.innerHTML =
      '<span class="loading">Collecting data from your browser...</span>';
    serverEl.innerHTML = '<span class="loading">Generating...</span>';
    fpHashEl.className = "loading";
    fpHashEl.textContent = "Calculating...";

    const data = await gather({
      includeCanvas: toggleCanvas.checked,
      includeWebGL: toggleWebGL.checked,
      includeFonts: toggleFonts.checked,
    });

    out.textContent = JSON.stringify(data, null, 2);
    serverEl.textContent = makeSimulatedServerLog(data);

    // Update fingerprint display
    fpHashEl.className = "";
    fpHashEl.textContent = data.fingerprint;

    // Update stats
    const pointCount = countDataPoints(data);
    dataPointCountEl.textContent = pointCount;

    // Estimate uniqueness based on key factors
    let uniqueFactors = 0;
    if (data.canvasHash) uniqueFactors += 3;
    if (data.webgl?.renderer) uniqueFactors += 2;
    if (data.fonts && Object.keys(data.fonts).length > 5) uniqueFactors += 2;
    if (data.screen.devicePixelRatio !== 1) uniqueFactors += 1;
    if (data.navigator.plugins?.length > 0) uniqueFactors += 1;
    if (data.uaCH?.architecture) uniqueFactors += 1;

    const uniqueLevel =
      uniqueFactors >= 7
        ? "Very High"
        : uniqueFactors >= 4
          ? "High"
          : uniqueFactors >= 2
            ? "Medium"
            : "Low";
    uniquenessEl.textContent = uniqueLevel;

    trackabilityEl.textContent =
      uniqueFactors >= 5 ? "Easily" : uniqueFactors >= 3 ? "Likely" : "Possibly";
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(out.textContent);
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
    } catch (e) {
      alert("Copy failed: " + e.message);
    }
  });

  dlBtn.addEventListener("click", () => {
    const blob = new Blob([out.textContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "browser-fingerprint.json",
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  refreshBtn.addEventListener("click", update);
  toggleCanvas.addEventListener("change", update);
  toggleWebGL.addEventListener("change", update);
  toggleFonts.addEventListener("change", update);

  await update();
})();
