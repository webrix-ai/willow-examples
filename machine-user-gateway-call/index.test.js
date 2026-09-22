const assert = require("node:assert/strict");
const test = require("node:test");

const { createWillowClient, parseMcpResponse } = require("./index");

test("uses the machine-user bearer token for MCP requests", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options, payload: JSON.parse(options.body) });
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: requests.length,
        result: requests.length === 1 ? { serverInfo: { name: "mcp-s" } } : { tools: [] },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const client = createWillowClient({
    gatewayUrl: "https://example.mcp-s.com/mcp",
    accessKey: "access",
    secret: "secret",
    fetchImpl,
  });

  await client.initialize();
  await client.listTools();
  await client.callTool("slack__search-messages", { query: "release notes" });

  assert.equal(requests.length, 3);
  assert.equal(requests[0].options.headers.Authorization, "Bearer access:secret");
  assert.equal(requests[0].payload.method, "initialize");
  assert.equal(requests[1].payload.method, "tools/list");
  assert.equal(requests[2].payload.method, "tools/call");
  assert.deepEqual(requests[2].payload.params, {
    name: "slack__search-messages",
    arguments: { query: "release notes" },
  });
});

test("parses an MCP response delivered as an SSE data event", () => {
  const payload = parseMcpResponse(
    'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"tools":[]}}\n\n',
  );

  assert.deepEqual(payload.result, { tools: [] });
});
