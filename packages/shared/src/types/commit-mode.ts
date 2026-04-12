export interface VeyraCommitModeDeclaration {
  production_mode: "trusted" | "open";
  trusted_write_required: boolean;
  delegation_required: boolean;
  settlement_required: boolean;
  verification_provider: string | null;
  commit_mode_provider: string | null;
  verify_endpoint: string | null;
  commit_mode: boolean;
}
