#!/usr/bin/env node
// Local stdio bridge to the hosted Stivio MCP server (https://stivio.ai/api/mcp).
// For MCP clients that can only launch local commands. Every message is passed
// through unchanged; the server does all the work.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const HELP = `stivio-mcp - connect any stdio MCP client to the hosted Stivio server

Usage:
  STIVIO_API_KEY=<key> npx -y stivio-mcp

Environment:
  STIVIO_API_KEY   Personal key from https://stivio.ai/mcp. Without it, only
                   list_video_models and estimate_video_cost work.
  STIVIO_MCP_URL   Server URL (default https://stivio.ai/api/mcp).
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(HELP);
  process.exit(0);
}

const url = new URL(process.env.STIVIO_MCP_URL || "https://stivio.ai/api/mcp");
const key = (process.env.STIVIO_API_KEY || "").trim();
const headers = { "User-Agent": "stivio-mcp-bridge" };
if (key) headers.Authorization = `Bearer ${key}`;

const remote = new StreamableHTTPClientTransport(url, { requestInit: { headers } });
const local = new StdioServerTransport();
const log = (msg) => process.stderr.write(`[stivio-mcp] ${msg}\n`);

local.onmessage = (message) => {
  remote.send(message).catch((err) => {
    log(`request failed: ${err?.message ?? err}`);
    // Answer the request so the client does not wait forever.
    if (message && "id" in message && "method" in message) {
      local.send({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: `Stivio server unreachable: ${err?.message ?? err}` } }).catch(() => {});
    }
  });
};

remote.onmessage = (message) => {
  // Later requests must carry the negotiated protocol version header.
  const version = message?.result?.protocolVersion;
  if (typeof version === "string") remote.setProtocolVersion(version);
  local.send(message).catch((err) => log(`write failed: ${err?.message ?? err}`));
};

remote.onerror = (err) => log(`connection error: ${err?.message ?? err}`);
local.onerror = (err) => log(`stdio error: ${err?.message ?? err}`);

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  await remote.close().catch(() => {});
  process.exit(0);
};
local.onclose = shutdown;
process.stdin.on("end", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await remote.start();
await local.start();
if (!key) log("no STIVIO_API_KEY set: model listing and quotes only");
