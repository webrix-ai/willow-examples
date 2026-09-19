const assert = require("node:assert/strict");
const test = require("node:test");

const { app, pkceChallenge } = require("./server");

test("registers a client and enforces redirect URI and PKCE bindings", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const redirectUri = "https://client.example/callback";

  const registration = await fetch(`${base}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: [redirectUri] }),
  });
  assert.equal(registration.status, 201);
  const { client_id: clientId } = await registration.json();

  const verifier = "tutorial-verifier-0123456789abcdefghijklmnopqrstuvwxyz";
  const authorizationUrl = new URL(`${base}/authorize`);
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "test-state",
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  });

  const badRedirectUrl = new URL(authorizationUrl);
  badRedirectUrl.searchParams.set("redirect_uri", "https://attacker.example/callback");
  const badRedirect = await fetch(badRedirectUrl, { redirect: "manual" });
  assert.equal(badRedirect.status, 400);
  assert.equal(badRedirect.headers.has("location"), false);

  const authorization = await fetch(authorizationUrl, { redirect: "manual" });
  assert.equal(authorization.status, 302);
  const callback = new URL(authorization.headers.get("location"));
  assert.equal(callback.searchParams.get("state"), "test-state");
  const code = callback.searchParams.get("code");

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: "wrong-verifier",
  });
  const badToken = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  assert.equal(badToken.status, 400);

  tokenBody.set("code_verifier", verifier);
  const tokenResponse = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  assert.equal(tokenResponse.status, 200);
  const { access_token: accessToken } = await tokenResponse.json();

  const toolResponse = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "whoami", arguments: {} },
    }),
  });
  const toolResult = await toolResponse.json();
  assert.equal(toolResult.result.content[0].text, "Hello, alice@example.com");

  const replay = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  assert.equal(replay.status, 400);
});
