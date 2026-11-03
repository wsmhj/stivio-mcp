# Stivio MCP

Turn a photo into a short AI video from inside your AI client. This repo holds setup notes for the hosted [Stivio](https://stivio.ai) MCP server: list video models, get an exact credit quote, upload an image, start a render and fetch the MP4.

- Endpoint: `https://stivio.ai/api/mcp` (Streamable HTTP)
- Auth: `Authorization: Bearer <key>`, key from [stivio.ai/mcp](https://stivio.ai/mcp)
- Official MCP Registry: `io.github.wsmhj/stivio-mcp`

The server is hosted, so most clients connect to the URL directly. For clients that only run local commands there is a small stdio bridge in this repo (`npx -y github:wsmhj/stivio-mcp`, source in [bin/](bin/)). The server code itself is not in this repo.

## Tools

| Tool | What it does | Key needed |
| --- | --- | --- |
| `list_video_models` | Models, supported settings and per-second credit rates | No |
| `estimate_video_cost` | Checks settings and returns the exact credit cost | No |
| `get_credit_balance` | Your spendable credit balance | Yes |
| `upload_image` | Uploads a PNG, JPEG or WebP (max 3 MiB) and returns a URL to animate | Yes |
| `generate_video` | Starts a paid render from an image or a text prompt | Yes |
| `get_video_status` | Polls your job; returns the MP4 URL when done | Yes |

Model listing and quotes work without a key, so you can try the server before signing up. Generation spends credits from your Stivio account, and failed renders are refunded automatically.

## Get a key

1. Sign in at [stivio.ai/mcp](https://stivio.ai/mcp).
2. Create a personal key. Keys last 30 days and can be revoked on the same page.
3. Paste it into your client config below in place of `YOUR_STIVIO_KEY`.

## Setup

### Claude Code

```sh
claude mcp add --transport http stivio https://stivio.ai/api/mcp \
  --header "Authorization: Bearer YOUR_STIVIO_KEY"
```

### Cursor

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project), also in [examples/cursor.json](examples/cursor.json):

```json
{
  "mcpServers": {
    "stivio": {
      "url": "https://stivio.ai/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_STIVIO_KEY" }
    }
  }
}
```

### VS Code

`.vscode/mcp.json`; VS Code asks for the key once and stores it. See [examples/vscode-mcp.json](examples/vscode-mcp.json).

### Claude Desktop and other stdio-only clients

Clients that only launch local commands can run the small bridge in this repo; it forwards everything to the hosted server (Node.js 18+):

```json
{
  "mcpServers": {
    "stivio": {
      "command": "npx",
      "args": ["-y", "github:wsmhj/stivio-mcp"],
      "env": { "STIVIO_API_KEY": "YOUR_STIVIO_KEY" }
    }
  }
}
```

Without `STIVIO_API_KEY` the bridge still lists models and gives quotes.

### Other clients

Any client that supports remote Streamable HTTP servers with a custom header works. Clients that only accept OAuth connectors are not supported yet.

## Example prompts

- "Which Stivio models can do 10-second videos, and what would 10 seconds at 720p cost?"
- "Upload `~/Pictures/beach.jpg` and animate it: slow push-in, waves rolling in, 5 seconds. Show me the quote first."
- "Check my Stivio video status and give me the MP4 link."

The server tells the assistant to show you the prompt, settings and credit cost and wait for your OK before it calls `generate_video`.

## Uploading local files from a shell

Clients with shell access can upload a file directly and pass the returned `url` to `generate_video`:

```sh
curl https://stivio.ai/api/upload \
  -H "Authorization: Bearer YOUR_STIVIO_KEY" \
  -F "file=@photo.jpg"
```

## Links

- Website: [stivio.ai](https://stivio.ai)
- MCP setup and keys: [stivio.ai/mcp](https://stivio.ai/mcp)
- Image to video in the browser: [stivio.ai/studio](https://stivio.ai/studio)
- Pricing: [stivio.ai/#pricing](https://stivio.ai/#pricing)
- Support: hello@stivio.ai

The docs and examples in this repo are MIT licensed.
