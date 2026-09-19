const PROTOCOL_VERSION = "2024-11-05";

function parseMcpResponse(body) {
  try {
    return JSON.parse(body);
  } catch {
    const data = body
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .at(-1);

    if (!data) throw new Error(`Gateway returned an unreadable response: ${body}`);
    return JSON.parse(data);
  }
}

function createWillowClient({ gatewayUrl, accessKey, secret, fetchImpl = fetch }) {
  if (!gatewayUrl || !accessKey || !secret) {
    throw new Error(
      "Set WILLOW_GATEWAY_URL, WILLOW_ACCESS_KEY, and WILLOW_SECRET.",
    );
  }

  const authorization = `Bearer ${accessKey}:${secret}`;
  let nextId = 1;

  async function request(method, params = {}) {
    const response = await fetchImpl(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: nextId++,
        method,
        params,
      }),
    });

    const payload = parseMcpResponse(await response.text());
    if (!response.ok || payload.error) {
      const message = payload.error?.message || `${response.status} ${response.statusText}`;
      throw new Error(`Willow request failed: ${message}`);
    }

    return payload.result;
  }

  return {
    initialize: () =>
      request("initialize", {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "willow-machine-user-example", version: "1.0.0" },
      }),
    listTools: () => request("tools/list"),
    callTool: (name, args = {}) =>
      request("tools/call", { name, arguments: args }),
  };
}

async function main() {
  const [, , command = "list", toolName, rawArguments = "{}"] = process.argv;
  const client = createWillowClient({
    gatewayUrl: process.env.WILLOW_GATEWAY_URL,
    accessKey: process.env.WILLOW_ACCESS_KEY,
    secret: process.env.WILLOW_SECRET,
  });

  await client.initialize();

  if (command === "list") {
    const result = await client.listTools();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "call" && toolName) {
    const result = await client.callTool(toolName, JSON.parse(rawArguments));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(
    "Use `npm start -- list` or `npm start -- call <tool-name> '<json-arguments>'`.",
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { createWillowClient, parseMcpResponse };
