import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { env } from "../env.js";

const privateKey = createPrivateKey({
  key: Buffer.from(env.JWT_PRIVATE_KEY_BASE64, "base64"),
  format: "der",
  type: "pkcs8",
});

const publicKey = createPublicKey({
  key: Buffer.from(env.JWT_PUBLIC_KEY_BASE64, "base64"),
  format: "der",
  type: "spki",
});

export interface TokenPayload {
  token_id: string;
  tenant_id: string;
  agent_id: string;
  delegation_id: string;
  action_type: string;
  action_class: string;
  target_tenant_id?: string;
}

export async function signExecutionToken(
  payload: TokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "EdDSA" })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(`${env.TOKEN_TTL_SECONDS}s`)
    .sign(privateKey);
}

export async function verifyExecutionToken(
  token: string,
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return payload as unknown as TokenPayload;
}

/** Decode token payload without checking expiration. Use for
 *  post-execution steps (submit-receipt, settle-action) where
 *  the token is used for identification only. */
export function decodeTokenPayload(token: string): TokenPayload {
  return decodeJwt(token) as unknown as TokenPayload;
}
