export type DescriptionStyle = "read" | "write" | "destructive" | "external";

// Each suffix must communicate four things to a model choosing tools:
//   1. authentication posture (free vs. requires veyra_token)
//   2. side-effect posture   (none / local / destructive / external)
//   3. recovery path          (VeyraCommitRequired for writes)
//   4. a decision cue         (when to pick or skip this tool)

const READ_SUFFIX =
  "Free, no authentication needed. Read-only, no side effects. " +
  "Use this when you need to inspect or retrieve existing data before " +
  "deciding whether to perform a write.";

const WRITE_SUFFIX =
  "State-changing write operation. Requires veyra_token for authorization. " +
  "Without token, returns VeyraCommitRequired with retry instructions. " +
  "Use this only when you explicitly want to create, update, or change stored state.";

const DESTRUCTIVE_SUFFIX =
  "Destructive state-changing operation. Not reversible once executed. " +
  "Requires veyra_token. Use only when you explicitly want to remove existing state — " +
  "prefer reading the current record first to confirm you are removing the right target.";

const EXTERNAL_SUFFIX =
  "External side-effect operation. Triggers a real outbound action that is not " +
  "reversible once sent. Requires veyra_token. Use this only when you explicitly " +
  "want to produce an external effect — prefer inspecting state and delivery history first.";

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

// Short machine-ranked cue exposed in /tools and the pack manifest.
// Helps a model rank reads-before-writes without re-parsing descriptions.
const SELECTION_HINTS: Record<DescriptionStyle, string> = {
  read: "Prefer reads before writes when you need current context.",
  write: "Use only when a state change is explicitly intended.",
  destructive: "Not reversible — confirm intent and inspect state first.",
  external: "Triggers a real outbound effect — use only when intended.",
};

export function selectionHint(style: DescriptionStyle): string {
  return SELECTION_HINTS[style];
}
