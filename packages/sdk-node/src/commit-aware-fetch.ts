import { isVeyraCommitRequired, handleCommitRequired } from "./recovery.js";
import type { RecoveryOptions } from "./recovery.js";

export interface CommitAwareFetchOptions extends RecoveryOptions {}

/**
 * Drop-in replacement for fetch() that transparently handles
 * Veyra commit mode. If the target endpoint returns
 * VeyraCommitRequired (403), this function automatically
 * authorizes the action and retries with a settlement token.
 *
 * Normal responses pass through unchanged.
 *
 * Usage:
 *   const res = await commitAwareFetch('https://tool.com/api/write', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name: 'Jane' }),
 *   }, {
 *     apiKey: 'tr_...',
 *     agentId: '...',
 *     actionType: 'create_contact',
 *     target: 'crm',
 *   })
 */
export async function commitAwareFetch(
  url: string,
  init?: RequestInit,
  options?: CommitAwareFetchOptions,
): Promise<Response> {
  const res = await fetch(url, init);

  // Not a commit-required response — return as-is
  if (res.status !== 403) return res;
  if (!options) return res;
  if (!(await isVeyraCommitRequired(res))) return res;

  // Transition: open → commit
  const recovery = await handleCommitRequired(res, options);
  return recovery.retryFetch(url, init);
}
