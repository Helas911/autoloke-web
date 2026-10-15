import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyTokenSignatureAndClaims } from "../src/lib/firebaseTokenVerifier";

const projectId = "autoloke-221b6";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
const now = Math.floor(Date.now() / 1000);

function token(overrides: Record<string, unknown> = {}, headerOverrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key", ...headerOverrides })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    sub: "firebase-user-123",
    exp: now + 3600,
    iat: now - 100,
    auth_time: now - 100,
    ...overrides,
  })).toString("base64url");
  const sig = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey).toString("base64url");
  return `${header}.${payload}.${sig}`;
}

test("accepts an authentic, project-bound Google-signed Firebase ID token", () => {
  assert.deepEqual(verifyTokenSignatureAndClaims(token(), pem, projectId, now), { uid: "firebase-user-123" });
});

test("rejects tampering, unsigned algorithms, and wrong signing keys", () => {
  const valid = token();
  const tampered = valid.split(".");
  tampered[1] = Buffer.from(JSON.stringify({ sub: "attacker", aud: projectId })).toString("base64url");
  assert.equal(verifyTokenSignatureAndClaims(tampered.join("."), pem, projectId, now).uid, null);
  assert.equal(verifyTokenSignatureAndClaims(token({}, { alg: "none" }), pem, projectId, now).uid, null);
  const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.equal(verifyTokenSignatureAndClaims(token(), other.publicKey.export({ type: "spki", format: "pem" }).toString(), projectId, now).uid, null);
});

test("rejects tokens for a different project or identity provider", () => {
  assert.equal(verifyTokenSignatureAndClaims(token({ aud: "other-project" }), pem, projectId, now).uid, null);
  assert.equal(verifyTokenSignatureAndClaims(token({ iss: "https://attacker.example" }), pem, projectId, now).uid, null);
  assert.equal(verifyTokenSignatureAndClaims(token({ sub: "" }), pem, projectId, now).uid, null);
});

test("rejects expired, future-issued and future-authenticated tokens", () => {
  assert.equal(verifyTokenSignatureAndClaims(token({ exp: now - 1 }), pem, projectId, now).uid, null);
  assert.equal(verifyTokenSignatureAndClaims(token({ iat: now + 10 }), pem, projectId, now).uid, null);
  assert.equal(verifyTokenSignatureAndClaims(token({ auth_time: now + 10 }), pem, projectId, now).uid, null);
});
