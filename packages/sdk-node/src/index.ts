export { VeyraClient } from "./client.js";
export { checkTrustStatus } from "./preflight.js";
export { verifyVeyraToken } from "./verify.js";
export { submitVeyraReceipt } from "./receipt.js";
export { handleCommitRequired, isVeyraCommitRequired } from "./recovery.js";
export type { RecoveryOptions, RecoveryResult } from "./recovery.js";
export { fetchCapability, readDiscoveryHeaders } from "./discovery.js";
export type { VeyraCapability, VeyraDiscoveryHeaders } from "./discovery.js";
export type {
  TrustStatus,
  VerifyResult,
  ReceiptResult,
  AuthorizeResult,
  VeyraClientOptions,
} from "./types.js";
