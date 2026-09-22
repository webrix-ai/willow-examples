const crypto = require("crypto");
const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const ISSUER = process.env.ISSUER || `http://localhost:${PORT}`;

const clients = new Map();
const codes = new Map();
const tokens = new Map();

const rand = (prefix) => `${prefix}${crypto.randomBytes(16).toString("hex")}`;
const pkceChallenge = (verifier) =>
  crypto.createHash("sha256").update(verifier).digest("base64url");

const TOOL = {
  name: "whoami",
  description: "Returns the identity the server resolved from the OAuth token.",
  inputSchema: { type: "object", properties: {} },
};

app.post("/mcp", (req, res) => {
  const { id, method } = req.body || {};
  const reply = (result) => res.json({ jsonrpc: "2.0", id, result });

  if (method === "initialize") {
    return reply({
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "example-oauth-mcp", version: "1.0.0" },
    });
  }
  if (method === "notifications/initialized") return res.status(202).end();
  if (method === "tools/list") return reply({ tools: [TOOL] });
  if (method === "tools/call") {
    const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const session = tokens.get(token);
    if (!session) {
      return reply({
        content: [{ type: "text", text: "Unauthorized" }],
        isError: true,
      });
    }
    return reply({
      content: [{ type: "text", text: `Hello, ${session.user}` }],
      isError: false,
    });
  }
  return res.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  });
});

app.get("/.well-known/oauth-authorization-server", (req, res) => {
  res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/authorize`,
    token_endpoint: `${ISSUER}/token`,
    registration_endpoint: `${ISSUER}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
});

app.post("/register", (req, res) => {
  const { redirect_uris = [] } = req.body || {};

  if (
    !Array.isArray(redirect_uris) ||
    redirect_uris.length === 0 ||
    !redirect_uris.every((uri) => typeof uri === "string")
  ) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  const client_id = rand("client-");
  clients.set(client_id, new Set(redirect_uris));

  res.status(201).json({
    client_id,
    redirect_uris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code"],
    response_types: ["code"],
  });
});

app.get("/authorize", (req, res) => {
  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
  } = req.query;

  const redirectUris = clients.get(client_id);
  if (!redirectUris?.has(redirect_uri)) {
    return res.status(400).send("Invalid client or redirect URI");
  }
  if (!code_challenge || code_challenge_method !== "S256") {
    return res.status(400).send("PKCE with S256 is required");
  }

  const code = rand("code-");
  codes.set(code, {
    user: "alice@example.com",
    clientId: client_id,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
  });

  const url = new URL(redirect_uri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  res.redirect(302, url.toString());
});

app.post("/token", (req, res) => {
  const { code, client_id, redirect_uri, code_verifier } = req.body;
  const entry = codes.get(code);
  const wrongClient = client_id && client_id !== entry?.clientId;
  const wrongRedirect = redirect_uri !== entry?.redirectUri;
  const wrongVerifier =
    typeof code_verifier !== "string" ||
    pkceChallenge(code_verifier) !== entry?.codeChallenge;

  if (!entry || wrongClient || wrongRedirect || wrongVerifier) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  codes.delete(code);
  const token = rand("token-");
  tokens.set(token, { user: entry.user });
  res.json({ access_token: token, token_type: "Bearer", expires_in: 3600 });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`MCP server listening, issuer ${ISSUER}`));
}

module.exports = { app, pkceChallenge };
