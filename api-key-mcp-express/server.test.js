const assert = require("node:assert/strict");
const test = require("node:test");

const { app } = require("./server");

async function callTool(base, headers = {}) {
  const response = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "whoami", arguments: {} },
    }),
  });
  return response.json();
}

test("resolves valid forwarded keys and rejects missing placeholders", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const rawAuthorization = await callTool(base, {
    authorization: "demo-alice-key",
  });
  assert.equal(rawAuthorization.result.isError, false);
  assert.equal(
    rawAuthorization.result.content[0].text,
    "Hello, alice@example.com",
  );

  const customHeader = await callTool(base, {
    "x-api-key": "demo-bob-key",
  });
  assert.equal(customHeader.result.isError, false);
  assert.equal(customHeader.result.content[0].text, "Hello, bob@example.com");

  const bearerHeader = await callTool(base, {
    authorization: "Bearer demo-alice-key",
  });
  assert.equal(bearerHeader.result.isError, false);

  const placeholder = await callTool(base, {
    authorization: "{{apiKey}}",
  });
  assert.equal(placeholder.result.isError, true);
  assert.equal(
    placeholder.result.content[0].text,
    "Invalid or missing API key",
  );
});
