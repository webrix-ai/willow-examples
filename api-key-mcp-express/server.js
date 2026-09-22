const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const KEYS = new Map([
  ["demo-alice-key", "alice@example.com"],
  ["demo-bob-key", "bob@example.com"],
]);

const TOOL = {
  name: "whoami",
  description: "Returns the user the forwarded API key belongs to.",
  inputSchema: { type: "object", properties: {} },
};

function resolveUser(req) {
  const raw = req.get("x-api-key") || req.get("authorization") || "";
  const key = raw.replace(/^Bearer\s+/i, "").trim();
  if (!key || key.includes("{{")) return null;
  return KEYS.get(key) || null;
}

app.post("/mcp", (req, res) => {
  const { id, method } = req.body || {};
  const reply = (result) => res.json({ jsonrpc: "2.0", id, result });

  if (method === "initialize") {
    return reply({
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "example-apikey-mcp", version: "1.0.0" },
    });
  }
  if (method === "notifications/initialized") return res.status(202).end();
  if (method === "tools/list") return reply({ tools: [TOOL] });
  if (method === "tools/call") {
    const user = resolveUser(req);
    if (!user) {
      return reply({
        content: [{ type: "text", text: "Invalid or missing API key" }],
        isError: true,
      });
    }
    return reply({
      content: [{ type: "text", text: `Hello, ${user}` }],
      isError: false,
    });
  }
  return res.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`MCP server listening on :${PORT}`));
}

module.exports = { app, resolveUser };
