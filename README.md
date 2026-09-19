<p align="center">
  <a href="https://withwillow.ai/">
    <img src="https://icons.withwillow.ai/willow/full-logo-green.svg" alt="Willow" width="240" />
  </a>
</p>

# Willow examples

Runnable code for the [Willow developer tutorials](https://docs.withwillow.ai/docs/developers/).

| Example | What it demonstrates | Tutorial | Code |
| --- | --- | --- | --- |
| Machine-user gateway call | Authenticate a script, list available tools, and call one through the Willow gateway. | [Tutorial](https://docs.withwillow.ai/docs/developers/machine-user-first-call) | [`machine-user-gateway-call/`](./machine-user-gateway-call/) |
| OAuth MCP server with Express | Build an MCP server that Willow connects to with Proxy OAuth and PKCE. | [Tutorial](https://docs.withwillow.ai/docs/developers/tutorial-oauth-mcp-express) | [`oauth-mcp-express/`](./oauth-mcp-express/) |
| API-key MCP server with Express | Build an MCP server that validates the per-user API key Willow forwards. | [Tutorial](https://docs.withwillow.ai/docs/developers/tutorial-api-key-mcp-express) | [`api-key-mcp-express/`](./api-key-mcp-express/) |

For end-user STDIO connections from an AI client, use [`@mcp-s/mcp`](https://www.npmjs.com/package/@mcp-s/mcp).
