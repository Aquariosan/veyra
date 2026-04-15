export type DescriptionStyle = "read" | "write" | "destructive" | "external";

const READ_SUFFIX =
  "Free, no authentication needed. Read-only, no side effects. " +
  "Use this to inspect or retrieve existing data.";

const WRITE_SUFFIX =
  "State-changing write operation. Requires veyra_token for authorization. " +
  "Without token, returns VeyraCommitRequired with retry instructions.";

const DESTRUCTIVE_SUFFIX =
  "Destructive state-changing operation, not reversible. " +
  "Requires veyra_token. Use only when you explicitly want to remove existing state.";

const EXTERNAL_SUFFIX =
  "External side-effect operation. Requires veyra_token. " +
  "Use this only when you explicitly want to trigger a real outbound action.";

export function describe(what: string, style: DescriptionStyle): string {
  switch (style) {
    case "read":
      return `${what}. ${READ_SUFFIX}`;
    case "write":
      return `${what}. ${WRITE_SUFFIX}`;
    case "destructive":
      return `${what}. ${DESTRUCTIVE_SUFFIX}`;
    case "external":
      return `${what}. ${EXTERNAL_SUFFIX}`;
  }
}
