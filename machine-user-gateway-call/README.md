# Machine-user gateway call

Authenticate a Node.js script as a Willow machine user, list the tools it can access, and call one through the gateway.

Follow the [machine-user tutorial](https://docs.withwillow.ai/docs/developers/machine-user-first-call) for the corresponding Willow setup.

## Requirements

- Node.js 18 or later
- A Willow machine user with access to at least one MCP server

## Run

Set the machine-user credentials and your Willow gateway URL:

```bash
export WILLOW_GATEWAY_URL="https://your-org.mcp-s.com/mcp"
export WILLOW_ACCESS_KEY="your-access-key"
export WILLOW_SECRET="your-secret"
```

List the tools available to the machine user:

```bash
npm start -- list
```

Call a tool using its namespaced name and a JSON object of arguments:

```bash
npm start -- call slack__search-messages '{"query":"release notes"}'
```

The gateway returns the tool result as JSON. Tool names and arguments depend on the MCP servers assigned to the machine user's groups.
