# API-key MCP server with Express

A small MCP server that validates the per-user API key Willow forwards in Proxy API Key mode and exposes a `whoami` tool.

Follow the [API-key MCP server tutorial](https://docs.withwillow.ai/docs/developers/tutorial-api-key-mcp-express) for the complete walkthrough and Willow configuration.

## Run

Install dependencies and start the server:

```bash
npm install
npm start
```

Expose port 3000 at a public HTTPS URL, add its `/mcp` endpoint as a custom MCP server in Willow, and select **Proxy API Key**.

Connect as an end user with one of the example keys:

| API key | Resolved user |
| --- | --- |
| `demo-alice-key` | `alice@example.com` |
| `demo-bob-key` | `bob@example.com` |

Call `whoami` to confirm that Willow forwarded the key and the server resolved its owner. Replace the in-memory key store before using this code beyond a tutorial environment.

## Test

```bash
npm test
```
