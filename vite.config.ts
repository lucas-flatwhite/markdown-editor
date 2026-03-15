import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming
const MAX_LOG_REQUEST_BYTES = 256 * 1024; // 256KB per request
const MAX_LOG_ENTRIES_PER_SOURCE = 200;
const MAX_LOG_ENTRY_CHARS = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MANUS_DEBUG_COLLECTOR_ENABLED =
  process.env.MANUS_DEBUG_COLLECTOR === "true";
const ALLOWED_JSON_CONTENT_TYPE = "application/json";
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "api_key",
  "apikey",
];
const SAFE_HEADER_ALLOWLIST = new Set([
  "content-type",
  "content-length",
  "cache-control",
  "accept",
]);

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";
type RateLimitState = {
  count: number;
  windowStart: number;
};

const rateLimitTable = new Map<string, RateLimitState>();

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function truncateString(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}...[truncated]` : value;
}

function hasSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_FIELDS.some((field) => lower.includes(field));
}

function sanitizeLogValue(value: unknown, depth: number = 0): unknown {
  if (depth > 6) return "[Max Depth]";
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return truncateString(value, MAX_LOG_ENTRY_CHARS);
  }

  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .slice(-MAX_LOG_ENTRIES_PER_SOURCE)
      .map((item) => sanitizeLogValue(item, depth + 1));
  }

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();

    if (hasSensitiveKey(lower)) {
      output[key] = "[REDACTED]";
      continue;
    }

    if (lower === "body") {
      output[key] = "[OMITTED]";
      continue;
    }

    if (lower === "headers" && raw && typeof raw === "object") {
      const headers = raw as Record<string, unknown>;
      const safeHeaders: Record<string, unknown> = {};
      for (const [headerKey, headerValue] of Object.entries(headers)) {
        const headerLower = headerKey.toLowerCase();
        if (SAFE_HEADER_ALLOWLIST.has(headerLower) && !hasSensitiveKey(headerLower)) {
          safeHeaders[headerLower] = sanitizeLogValue(headerValue, depth + 1);
        }
      }
      output[key] = safeHeaders;
      continue;
    }

    output[key] = sanitizeLogValue(raw, depth + 1);
  }

  return output;
}

function serializeLogEntry(entry: unknown): string {
  const sanitized = sanitizeLogValue(entry);
  const serialized = JSON.stringify(sanitized);
  return truncateString(serialized, MAX_LOG_ENTRY_CHARS);
}

function getClientAddress(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0];
  }

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const state = rateLimitTable.get(clientId);
  if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitTable.set(clientId, { count: 1, windowStart: now });
    return false;
  }

  state.count += 1;
  return state.count > RATE_LIMIT_MAX_REQUESTS;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value)
    ? value.slice(-MAX_LOG_ENTRIES_PER_SOURCE)
    : [];
}

function normalizePayload(payload: unknown): {
  consoleLogs: unknown[];
  networkRequests: unknown[];
  sessionEvents: unknown[];
} {
  const base =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  return {
    consoleLogs: toArray(base.consoleLogs),
    networkRequests: toArray(base.networkRequests),
    sessionEvents: toArray(base.sessionEvents),
  };
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${serializeLogEntry(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const contentType = String(req.headers["content-type"] || "").toLowerCase();
        if (!contentType.includes(ALLOWED_JSON_CONTENT_TYPE)) {
          res.writeHead(415, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Unsupported content type. application/json is required.",
            })
          );
          return;
        }

        const clientId = getClientAddress(req);
        if (isRateLimited(clientId)) {
          res.writeHead(429, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Rate limit exceeded for debug log ingestion.",
            })
          );
          return;
        }

        const handlePayload = (payload: unknown) => {
          const normalized = normalizePayload(payload);

          // Write logs directly to files
          if (normalized.consoleLogs.length > 0) {
            writeToLogFile("browserConsole", normalized.consoleLogs);
          }
          if (normalized.networkRequests.length > 0) {
            writeToLogFile("networkRequests", normalized.networkRequests);
          }
          if (normalized.sessionEvents.length > 0) {
            writeToLogFile("sessionReplay", normalized.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(
            JSON.stringify({
              success: true,
              accepted: {
                consoleLogs: normalized.consoleLogs.length,
                networkRequests: normalized.networkRequests.length,
                sessionEvents: normalized.sessionEvents.length,
              },
            })
          );
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        let bodyBytes = 0;
        let terminated = false;

        req.on("data", (chunk) => {
          if (terminated) return;

          bodyBytes += chunk.length;
          if (bodyBytes > MAX_LOG_REQUEST_BYTES) {
            terminated = true;
            res.writeHead(413, {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            });
            res.end(
              JSON.stringify({
                success: false,
                error: `Payload too large. Max allowed is ${MAX_LOG_REQUEST_BYTES} bytes.`,
              })
            );
            req.destroy();
            return;
          }

          body += chunk.toString("utf-8");
        });

        req.on("end", () => {
          if (terminated) return;

          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

if (MANUS_DEBUG_COLLECTOR_ENABLED) {
  plugins.push(vitePluginManusDebugCollector());
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
