// npm run check: open the app in a headless browser and report what it sees.
//
//   npm run check                  checks the page at /
//   npm run check "?file=x.spz"    checks the page with ?file=x.spz
//
// Writes .check/report.json and .check/screenshot.png, prints a short summary
// and exits with code 1 if anything failed.
//
// The app tells the check how it is doing:
//   window.__APP_READY__ = true        when it has finished drawing
//   window.__APP_ERROR__ = 'message'   when it cannot start
//
// Checks that only make sense for one app go in scripts/app-checks.mjs (optional):
//   export const options = { readyTimeoutMs: 30_000 };   // optional
//   export default async function appChecks({ page, measure }) {
//     const canvas = await measure('canvas');            // colour statistics of an element
//     return [{ name: 'canvas is not blank', ok: canvas.nonBackgroundRatio > 0.01, detail: '...' }];
//   }
// `page` is a Playwright page: https://playwright.dev/docs/api/class-page

import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = process.cwd();
const OUT_DIR = resolve(ROOT, '.check');
const APP_CHECKS = resolve(ROOT, 'scripts', 'app-checks.mjs');
const PATH = process.argv[2] ?? '/';
const DEFAULTS = { readyTimeoutMs: 10_000, viewport: { width: 1280, height: 800 } };
// Software WebGL, so the check also works on machines without a usable GPU.
const BROWSER_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const started = Date.now();
const report = {
  ok: false,
  summary: '',
  url: '',
  ready: false,
  readyMs: null,
  errors: [],
  warnings: [],
  logs: [],
  failedRequests: [],
  checks: [],
  visual: null,
  page: null,
  webgl: null,
  screenshot: null,
  durationMs: 0,
};
let server;
let browser;
let collecting = true;
let finishing = false;
let firstPageErrorAt = null;
const hasAppChecks = existsSync(APP_CHECKS);

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => finish('check was interrupted'));
}
main().then(
  () => finish(),
  (error) => finish(`check crashed: ${error.message}`),
);

async function main() {
  const appChecks = await loadAppChecks();
  const options = { ...DEFAULTS, ...appChecks.options };
  const limitMs = options.readyTimeoutMs + 30_000;
  setTimeout(() => finish(`check timed out after ${limitMs} ms`), limitMs).unref();

  await mkdir(OUT_DIR, { recursive: true });
  // An old screenshot would show a result that is no longer true.
  await rm(resolve(OUT_DIR, 'screenshot.png'), { force: true });
  server = await createServer({
    root: ROOT,
    logLevel: 'error',
    clearScreen: false,
    server: { host: '127.0.0.1' },
  });
  await server.listen();
  report.url = new URL(PATH, server.resolvedUrls.local[0]).href;

  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: options.viewport });
  watch(page);

  const response = await page.goto(report.url, { waitUntil: 'load', timeout: options.readyTimeoutMs });
  if (!response?.ok()) {
    const status = response ? response.status() : 'no response';
    report.errors.push(`Nothing rendered yet: ${PATH} returned ${status}. Is there an index.html?`);
    const { pathname, search } = new URL(report.url);
    report.failedRequests = report.failedRequests.filter((request) => request.url !== pathname + search);
  } else {
    await waitForReady(page, options.readyTimeoutMs);
  }

  // Screenshot the app as it loaded, before the app checks click and type.
  report.webgl = await page.evaluate(webglInfo).catch(() => null);
  const png = await page.screenshot();
  await writeFile(resolve(OUT_DIR, 'screenshot.png'), png);
  report.screenshot = '.check/screenshot.png';
  report.page = await page.evaluate(pageText).catch(() => null);
  report.visual = await measure(png);

  if (report.ready && appChecks.run) report.checks = await runAppChecks(appChecks.run, page);
}

async function loadAppChecks() {
  if (!hasAppChecks) return {};
  try {
    const module = await import(pathToFileURL(APP_CHECKS).href);
    return { run: module.default, options: module.options };
  } catch (error) {
    report.errors.push(`scripts/app-checks.mjs failed to load: ${error.message}`);
    return {};
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ args: BROWSER_ARGS });
  } catch (error) {
    if (/Executable doesn't exist|playwright install/i.test(error.message)) {
      throw new Error('Chromium for Playwright is missing. Run: npx playwright install chromium');
    }
    throw error;
  }
}

function watch(page) {
  const origin = new URL(report.url).origin;
  const short = (url) => url.replace(origin, '');
  page.on('console', (message) => {
    if (!collecting) return;
    const text = message.text();
    // Failed resources are reported once, with their URL, in failedRequests.
    if (message.type() === 'error' && !text.startsWith('Failed to load resource')) {
      report.errors.push(`console: ${text}`);
    }
    if (message.type() === 'warning') report.warnings.push(`console: ${text}`);
    // console.log output from the app, to help with debugging. Vite's own messages are skipped.
    if (['log', 'info'].includes(message.type()) && !text.startsWith('[vite]') && report.logs.length < 50) {
      report.logs.push(text.slice(0, 300));
    }
  });
  // Where an error happened, e.g. " (at /src/main.js:9:24)".
  const location = (error) => {
    const line = error.stack?.split('\n').find((text) => text.includes(origin));
    const place = line && short(line).replace(/\?[^:]*/, '').match(/\/[^\s()]+:\d+:\d+/)?.[0];
    return place ? ` (at ${place})` : '';
  };
  page.on('pageerror', (error) => {
    firstPageErrorAt ??= Date.now();
    if (collecting) report.errors.push(`page error: ${error.message}${location(error)}`);
  });
  page.on('requestfailed', (request) => {
    if (!collecting) return;
    const error = request.failure()?.errorText ?? 'failed';
    // Aborted requests happen on reloads and are not a server problem.
    if (error.includes('ERR_ABORTED')) report.warnings.push(`request aborted: ${short(request.url())}`);
    else report.failedRequests.push({ url: short(request.url()), error });
  });
  page.on('response', (response) => {
    if (collecting && response.status() >= 400) {
      report.failedRequests.push({ url: short(response.url()), status: response.status() });
    }
  });
}

async function waitForReady(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Returns null while Vite reloads the page, which can happen once on first start.
    const state = await page
      .evaluate(() => ({ ready: window.__APP_READY__ === true, error: window.__APP_ERROR__ ?? null }))
      .catch(() => null);
    if (state?.error != null) {
      report.errors.push(`App error: ${state.error}`);
      return;
    }
    if (state?.ready) {
      report.ready = true;
      report.readyMs = Date.now() - started;
      return;
    }
    // After an uncaught error, give the app one more second instead of the full timeout.
    if (firstPageErrorAt && Date.now() - firstPageErrorAt > 1_000) {
      report.errors.push('App not ready: it stopped after the page error above.');
      return;
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  report.errors.push(
    `App not ready: window.__APP_READY__ was not set to true within ${timeoutMs} ms. Does the app set it when it has finished drawing?`,
  );
}

async function runAppChecks(run, page) {
  const measureElement = async (selector) => measure(await page.locator(selector).first().screenshot());
  try {
    const results = (await run({ page, measure: measureElement })) ?? [];
    return results.map(({ name, ok, detail }) => ({ name, ok: Boolean(ok), detail }));
  } catch (error) {
    return [{ name: 'app checks ran', ok: false, detail: error.message }];
  }
}

// Describes a screenshot in numbers, so the result is readable even without vision.
async function measure(png) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(analysePixels, png.toString('base64'));
  } finally {
    await page.close();
  }
}

// Runs in the browser.
async function analysePixels(base64) {
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const { width, height } = image;
  // willReadFrequently keeps this canvas on the CPU, away from a busy (software) GPU.
  const context = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, width, height).data;
  // Group similar colours into 4096 buckets and remember each bucket's average colour.
  const counts = new Uint32Array(4096);
  const sums = new Float64Array(4096 * 3);
  for (let i = 0; i < data.length; i += 4) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    counts[key] += 1;
    sums[key * 3] += data[i];
    sums[key * 3 + 1] += data[i + 1];
    sums[key * 3 + 2] += data[i + 2];
  }
  const total = width * height;
  const share = (count) => Math.round((count / total) * 1000) / 1000;
  const hex = (key) =>
    `#${[0, 1, 2].map((c) => Math.round(sums[key * 3 + c] / counts[key]).toString(16).padStart(2, '0')).join('')}`;
  const keys = [...counts.keys()].filter((key) => share(counts[key]) > 0).sort((a, b) => counts[b] - counts[a]);
  return {
    size: [width, height],
    background: hex(keys[0]),
    nonBackgroundRatio: share(total - counts[keys[0]]),
    topColors: keys.slice(0, 5).map((key) => ({ color: hex(key), share: share(counts[key]) })),
    distinctColors: keys.length,
  };
}

// Runs in the browser.
function webglInfo() {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return { available: false };
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const info = {
    available: true,
    version: gl.getParameter(gl.VERSION),
    renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  };
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return info;
}

// Runs in the browser.
function pageText() {
  const text = (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim();
  return { title: document.title, text: text.slice(0, 400) };
}

function summarise() {
  const failedChecks = report.checks.filter((check) => !check.ok);
  const problems = [
    ...report.errors,
    ...failedChecks.map((check) => `check "${check.name}" failed${check.detail ? `: ${check.detail}` : ''}`),
    ...report.failedRequests.map((request) => `request failed: ${request.url} (${request.status ?? request.error})`),
  ];
  report.ok = report.ready && problems.length === 0;
  report.summary = report.ok
    ? `OK: app ready, ${report.checks.length} app checks passed, ${report.warnings.length} warnings`
    : `FAILED: ${problems[0] ?? 'app not ready'}`;
  return problems;
}

function print(problems) {
  const seconds = (report.durationMs / 1000).toFixed(1);
  console.log(`check: ${report.ok ? 'OK' : 'FAILED'} (${seconds} s)`);
  if (report.ok) {
    const passed = report.checks.length;
    const readySeconds = (report.readyMs / 1000).toFixed(1);
    const checks = hasAppChecks ? `${passed}/${passed} app checks` : 'no scripts/app-checks.mjs yet';
    console.log(`  ready after ${readySeconds} s, 0 errors, ${report.warnings.length} warnings, ${checks}`);
    for (const warning of report.warnings.slice(0, 3)) console.log(`  warning: ${warning}`);
  } else {
    for (const problem of problems.slice(0, 5)) console.log(`  - ${problem}`);
    if (problems.length > 5) console.log(`  (+${problems.length - 5} more in .check/report.json)`);
  }
  if (report.visual) {
    const { background, nonBackgroundRatio } = report.visual;
    console.log(`  screenshot: background ${background}, ${Math.round(nonBackgroundRatio * 100)}% of pixels differ from it`);
  }
  console.log(report.screenshot ? '  see .check/report.json and .check/screenshot.png' : '  see .check/report.json');
}

async function finish(problem) {
  if (finishing) return;
  finishing = true;
  collecting = false;
  if (problem) report.errors.push(problem);
  report.durationMs = Date.now() - started;
  const problems = summarise();
  try {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(resolve(OUT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    console.error(`could not write .check/report.json: ${error.message}`);
  }
  print(problems);
  const timeout = new Promise((done) => setTimeout(done, 5_000));
  await Promise.race([Promise.allSettled([browser?.close(), server?.close()]), timeout]);
  process.exit(report.ok ? 0 : 1);
}
