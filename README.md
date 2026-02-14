# Browser Fingerprint Demo

See what your browser reveals about you — without any cookies, logins, or permission prompts.

This is an educational tool that demonstrates how websites can collect detailed information about your browser and device to track you across the web. Everything runs entirely in your browser. No data is sent anywhere.

## What is browser fingerprinting?

Browser fingerprinting is a tracking technique that builds a unique identifier from various attributes of your browser and device. Unlike cookies, which you can delete, fingerprints are derived from characteristics you can't easily change.

Even without storing anything on your device, websites can identify you with surprising accuracy by combining things like your browser version, screen resolution, installed fonts, graphics card information, timezone, and dozens of other signals.

## What this demo collects

| Category                 | Examples                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Navigator and User Agent | Browser name, version, platform, architecture, mobile/desktop          |
| Display                  | Screen size, viewport, device pixel ratio, color depth, orientation    |
| User Preferences         | Dark mode, reduced motion, contrast settings, color gamut, HDR support |
| Hardware                 | CPU cores, device memory, GPU vendor/renderer, touch support           |
| Graphics                 | Canvas fingerprint hash, WebGL parameters                              |
| Timing and Performance   | Navigation type, first paint times, JS heap size                       |
| Network                  | Connection type (4G/WiFi), RTT estimate, Save-Data preference          |
| Locale and Timezone      | Language, timezone, calendar system, UTC offset                        |
| Media                    | Audio sample rate, available input/output device counts                |
| Features                 | Cookie support, localStorage, service workers, clipboard API           |
| Fonts                    | Detection of commonly installed fonts                                  |
| Ad Blocker               | Heuristic detection of ad-blocking extensions                          |

From these signals, the demo computes a SHA-256 hash that serves as your "fingerprint" — a likely-unique identifier derived purely from browser characteristics.

## How to use it

1. Open `index.html` in any modern browser
2. View your data in the JSON output
3. Toggle options to enable/disable canvas, WebGL, and font detection
4. Copy or download the data for analysis
5. Try it on different browsers or devices to see how fingerprints differ

## Why this matters

### For users

Understanding fingerprinting helps you make informed decisions about privacy:

- Browser extensions like uBlock Origin or Firefox's Enhanced Tracking Protection can limit some fingerprinting
- Tor Browser specifically resists fingerprinting by normalizing many of these signals
- Private browsing mode does not prevent fingerprinting — your fingerprint stays the same

### For developers

This demo shows why you should:

- Minimize data collection to what's actually needed
- Be transparent about what you collect
- Consider privacy-preserving alternatives to fingerprinting

## Technical details

### No server required

Everything runs client-side with vanilla JavaScript. The "simulated server log" shows what a real server would additionally see (IP address, TLS version, etc.).

### APIs used

- `navigator.userAgentData` for User-Agent Client Hints
- `navigator.connection` for Network Information API
- `navigator.mediaDevices.enumerateDevices()` for media device enumeration
- `performance.getEntriesByType()` for performance timing
- `matchMedia()` for CSS media query detection
- `CanvasRenderingContext2D` for canvas fingerprinting
- `WebGLRenderingContext` for GPU information

### The fingerprint hash

The demo creates a composite fingerprint by hashing stable attributes:

```
SHA-256(userAgent + screen + timezone + fonts + canvas + webgl + hardware...)
```

This demonstrates how trackers can identify you without storing any identifier on your device.

## Ethical use

This tool is for education only.

Acceptable uses:

- Understanding how tracking works
- Testing privacy tools and browser configurations
- Informing discussions about web privacy

Do not use fingerprinting to track users without consent or for advertising and surveillance purposes.

## Further reading

- [EFF: Cover Your Tracks](https://coveryourtracks.eff.org/) — Test your browser's fingerprint
- [Am I Unique?](https://amiunique.org/) — Academic fingerprinting research
- [MDN: Browser Fingerprinting](https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting)
- [Tor Project: Fingerprinting](https://tb-manual.torproject.org/security-settings/)

## License

MIT — Use freely for education and awareness.
