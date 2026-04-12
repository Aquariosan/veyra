type ActionClass = "A" | "B" | "C" | "D";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface Classification {
  action_class: ActionClass;
  risk_level: RiskLevel;
}

const HIGH_RISK = /deploy|delete|refund|send|merge/i;
const MEDIUM_RISK = /update|create|publish|write/i;

export function classifyAction(
  actionType: string,
  isCrossOrg: boolean,
): Classification {
  if (isCrossOrg) {
    return { action_class: "D", risk_level: "critical" };
  }
  if (HIGH_RISK.test(actionType)) {
    return { action_class: "C", risk_level: "high" };
  }
  if (MEDIUM_RISK.test(actionType)) {
    return { action_class: "B", risk_level: "medium" };
  }
  return { action_class: "A", risk_level: "low" };
}
