import { commitRequiredResponse } from "./errors.js";

const DEFAULT_VERIFY_ENDPOINT = "https://api.veyra.dev/v1/verify-token";
const DEFAULT_HEADER = "x-veyra-token";
const DEFAULT_PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export interface TrustedWriteOptions {
  verifyEndpoint?: string;
  headerName?: string;
  protectedMethods?: string[];
}

function sendCommitRequired(res: any, verifyEndpoint: string): void {
  const body = commitRequiredResponse(verifyEndpoint);
  if (res.header) {
    // Fastify
    res.header("WWW-Authenticate", 'VeyraCommit realm="api.veyra.dev"');
    res.status(403).send(body);
  } else if (res.set) {
    // Express
    res.set("WWW-Authenticate", 'VeyraCommit realm="api.veyra.dev"');
    res.status(403).json(body);
  }
}

/**
 * Express/Fastify-compatible middleware that enforces Veyra commit mode.
 * Read methods (GET/HEAD/OPTIONS) pass through. Write methods require
 * a valid Veyra execution token in the X-Veyra-Token header.
 */
export function requireTrustedWrite(options?: TrustedWriteOptions) {
  const verifyEndpoint = options?.verifyEndpoint ?? DEFAULT_VERIFY_ENDPOINT;
  const headerName = (options?.headerName ?? DEFAULT_HEADER).toLowerCase();
  const protectedMethods = (
    options?.protectedMethods ?? DEFAULT_PROTECTED_METHODS
  ).map((m) => m.toUpperCase());

  return async (req: any, res: any, next?: () => void) => {
    const method = (req.method ?? "GET").toUpperCase();

    if (!protectedMethods.includes(method)) {
      if (next) return next();
      return;
    }

    const token =
      req.headers?.[headerName] ??
      req.headers?.get?.(headerName);

    if (!token) {
      return sendCommitRequired(res, verifyEndpoint);
    }

    try {
      const verifyRes = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!verifyRes.ok) {
        return sendCommitRequired(res, verifyEndpoint);
      }

      const result = await verifyRes.json();

      if (!result.valid) {
        return sendCommitRequired(res, verifyEndpoint);
      }
    } catch {
      return sendCommitRequired(res, verifyEndpoint);
    }

    if (next) return next();
  };
}
