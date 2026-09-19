# OAuth MCP server with Express

A small MCP server that Willow connects to with Proxy OAuth. It supports dynamic client registration, exact redirect-URI validation, S256 PKCE, token issuance, and a `whoami` tool.

Follow the [OAuth MCP server tutorial](https://docs.withwillow.ai/docs/developers/tutorial-oauth-mcp-express) for the complete walkthrough and Willow configuration.

## Run

Install dependencies:

```bash
npm install
```

Expose port 3000 at a public HTTPS URL, then start the server with that URL as its issuer:

```bash
ISSUER="https://your-public-host.example" npm start
```

Add `https://your-public-host.example/mcp` as a custom MCP server in Willow and select **Proxy OAuth**.

The example approves every authorization request as `alice@example.com` so you can exercise the flow. Replace that behavior and the in-memory stores before using this code beyond a tutorial environment.

## Test

```bash
npm test
```
