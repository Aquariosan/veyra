import { z, type ZodRawShape } from "zod";
import type { DescriptionStyle } from "./descriptions.js";

export type ToolMode = "open" | "commit";
export type ToolCategory = "read" | "consequence";
export type SideEffectClass =
  | "none"
  | "local_state_mutation"
  | "destructive_mutation"
  | "external_http_call"
  | "state_mutation";
export type RiskClass = "A" | "B" | "C" | "D";

export interface PackTool {
  name: string;
  tool_family: string;
  what: string;
  style: DescriptionStyle;
  mode: ToolMode;
  category: ToolCategory;
  side_effect_class: SideEffectClass;
  risk_class?: RiskClass;
  outcome_type?: string;
  is_external?: boolean;
  is_reversible?: boolean;
  operation?: string;
  schema: ZodRawShape;
}

// ── Shared schema fragments ──────────────────────────────────────────

const idSchema = { id: z.string().describe("Record ID") };
const tokenSchema = {
  veyra_token: z
    .string()
    .optional()
    .describe("Veyra execution token obtained via /v1/authorize-action"),
};

const withToken = (shape: ZodRawShape): ZodRawShape => ({
  ...shape,
  ...tokenSchema,
});

// ── READ TOOLS (24) ──────────────────────────────────────────────────

const readTools: PackTool[] = [
  // memory
  {
    name: "memory_get",
    tool_family: "memory",
    what: "Read a single value from the Veyra memory key-value store by key",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { key: z.string().describe("Key to look up") },
  },
  {
    name: "memory_list",
    tool_family: "memory",
    what: "List keys in the memory store, optionally filtered by a key prefix",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      prefix: z.string().optional().describe("Key prefix filter"),
      limit: z.number().optional().describe("Max results (default 50)"),
    },
  },
  {
    name: "memory_search",
    tool_family: "memory",
    what: "Full-text search across memory keys, values, and tags",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string().describe("Search keyword") },
  },

  // notes
  {
    name: "list_notes",
    tool_family: "notes",
    what: "Browse existing notes, optionally filtered by tag",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      tag: z.string().optional(),
      limit: z.number().optional(),
    },
  },
  {
    name: "get_note",
    tool_family: "notes",
    what: "Read one note's full title, content, and tags by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_notes",
    tool_family: "notes",
    what: "Full-text search over note titles, content, and tags",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string() },
  },

  // tasks
  {
    name: "list_tasks",
    tool_family: "tasks",
    what: "Browse tasks, optionally filtered by status, project, or priority",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      status: z.string().optional(),
      project: z.string().optional(),
      priority: z.string().optional(),
    },
  },
  {
    name: "get_task",
    tool_family: "tasks",
    what: "Read one task's fields (title, status, priority, due) by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_tasks",
    tool_family: "tasks",
    what: "Full-text search over task titles, projects, and tags",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string() },
  },

  // snippets
  {
    name: "list_snippets",
    tool_family: "snippets",
    what: "Browse code snippets, optionally filtered by language or tag",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      language: z.string().optional(),
      tag: z.string().optional(),
    },
  },
  {
    name: "get_snippet",
    tool_family: "snippets",
    what: "Read one snippet's full code and metadata by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_snippets",
    tool_family: "snippets",
    what: "Full-text search over snippet titles, code, and tags",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string() },
  },

  // bookmarks
  {
    name: "list_bookmarks",
    tool_family: "bookmarks",
    what: "Browse saved bookmarks, optionally filtered by tag or category",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      tag: z.string().optional(),
      category: z.string().optional(),
    },
  },
  {
    name: "get_bookmark",
    tool_family: "bookmarks",
    what: "Read one bookmark record by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_bookmarks",
    tool_family: "bookmarks",
    what: "Full-text search over bookmark titles, URLs, and tags",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string() },
  },

  // contacts
  {
    name: "list_contacts",
    tool_family: "contacts",
    what: "Browse contacts, optionally filtered by tag or company",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      tag: z.string().optional(),
      company: z.string().optional(),
    },
  },
  {
    name: "get_contact",
    tool_family: "contacts",
    what: "Read one contact's full record by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_contacts",
    tool_family: "contacts",
    what: "Full-text search over contact names, emails, and companies",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { query: z.string() },
  },

  // forms
  {
    name: "list_forms",
    tool_family: "forms",
    what: "Browse every defined form",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {},
  },
  {
    name: "get_form",
    tool_family: "forms",
    what: "Read one form's definition including its fields by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "get_responses",
    tool_family: "forms",
    what: "Read submitted responses for a specific form",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { form_id: z.string().describe("Form ID") },
  },

  // webhooks
  {
    name: "list_webhooks",
    tool_family: "webhooks",
    what: "Browse registered outbound webhook endpoints",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {},
  },
  {
    name: "get_webhook",
    tool_family: "webhooks",
    what: "Read one registered webhook definition by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "get_history",
    tool_family: "webhooks",
    what: "Read past delivery attempts for a webhook (status, timestamps, responses)",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {
      webhook_id: z.string().describe("Webhook ID"),
      limit: z.number().optional(),
    },
  },
];

// ── WRITE TOOLS (24) ─────────────────────────────────────────────────

const writeTools: PackTool[] = [
  // memory
  {
    name: "memory_set",
    tool_family: "memory",
    what: "Write or overwrite a value under a specific key in the memory store",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "local_state_mutation",
    risk_class: "A",
    outcome_type: "kv_upsert",
    is_external: false,
    is_reversible: true,
    operation: "set_key_value",
    schema: withToken({
      key: z.string(),
      value: z.string(),
      tags: z.string().optional(),
    }),
  },
  {
    name: "memory_delete",
    tool_family: "memory",
    what: "Remove a single key and its value from the memory store",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "kv_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_key",
    schema: withToken({ key: z.string() }),
  },
  {
    name: "memory_clear",
    tool_family: "memory",
    what: "Wipe every entry from the memory store in a single operation",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "B",
    outcome_type: "store_reset",
    is_external: false,
    is_reversible: false,
    operation: "clear_all",
    schema: withToken({ confirm: z.boolean() }),
  },

  // notes
  {
    name: "create_note",
    tool_family: "notes",
    what: "Create a new note record with title, content, and optional tags",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "create_note",
    schema: withToken({
      title: z.string(),
      content: z.string(),
      tags: z.string().optional(),
    }),
  },
  {
    name: "update_note",
    tool_family: "notes",
    what: "Modify the title or content of an existing note",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_update",
    is_external: false,
    is_reversible: true,
    operation: "update_note",
    schema: withToken({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
    }),
  },
  {
    name: "delete_note",
    tool_family: "notes",
    what: "Permanently delete a note and its content",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_note",
    schema: withToken(idSchema),
  },

  // tasks
  {
    name: "create_task",
    tool_family: "tasks",
    what: "Create a new task record",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "create_task",
    schema: withToken({
      title: z.string(),
      project: z.string().optional(),
      priority: z.string().optional(),
      due: z.string().optional(),
    }),
  },
  {
    name: "update_task",
    tool_family: "tasks",
    what: "Modify an existing task's fields (title, status, priority, due)",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_update",
    is_external: false,
    is_reversible: true,
    operation: "update_task",
    schema: withToken({
      id: z.string(),
      title: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
    }),
  },
  {
    name: "delete_task",
    tool_family: "tasks",
    what: "Permanently delete a task record",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_task",
    schema: withToken(idSchema),
  },

  // snippets
  {
    name: "save_snippet",
    tool_family: "snippets",
    what: "Save a new code snippet with title, language, and code body",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "save_snippet",
    schema: withToken({
      title: z.string(),
      code: z.string(),
      language: z.string().optional(),
      tags: z.string().optional(),
    }),
  },
  {
    name: "update_snippet",
    tool_family: "snippets",
    what: "Modify an existing snippet's code or title",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_update",
    is_external: false,
    is_reversible: true,
    operation: "update_snippet",
    schema: withToken({
      id: z.string(),
      code: z.string().optional(),
      title: z.string().optional(),
    }),
  },
  {
    name: "delete_snippet",
    tool_family: "snippets",
    what: "Permanently delete a code snippet",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_snippet",
    schema: withToken(idSchema),
  },

  // bookmarks
  {
    name: "save_bookmark",
    tool_family: "bookmarks",
    what: "Save a new bookmark with URL, title, and optional tags or category",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "save_bookmark",
    schema: withToken({
      url: z.string(),
      title: z.string().optional(),
      tags: z.string().optional(),
      category: z.string().optional(),
    }),
  },
  {
    name: "update_bookmark",
    tool_family: "bookmarks",
    what: "Modify an existing bookmark's title or category",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_update",
    is_external: false,
    is_reversible: true,
    operation: "update_bookmark",
    schema: withToken({
      id: z.string(),
      title: z.string().optional(),
      category: z.string().optional(),
    }),
  },
  {
    name: "delete_bookmark",
    tool_family: "bookmarks",
    what: "Permanently delete a bookmark",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_bookmark",
    schema: withToken(idSchema),
  },

  // contacts
  {
    name: "create_contact",
    tool_family: "contacts",
    what: "Create a new contact record with name, email, and company",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "B",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "create_contact",
    schema: withToken({
      name: z.string(),
      email: z.string().optional(),
      company: z.string().optional(),
      tags: z.string().optional(),
    }),
  },
  {
    name: "update_contact",
    tool_family: "contacts",
    what: "Modify an existing contact's fields",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "B",
    outcome_type: "record_update",
    is_external: false,
    is_reversible: true,
    operation: "update_contact",
    schema: withToken({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      company: z.string().optional(),
    }),
  },
  {
    name: "delete_contact",
    tool_family: "contacts",
    what: "Permanently delete a contact record",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "B",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_contact",
    schema: withToken(idSchema),
  },

  // forms
  {
    name: "create_form",
    tool_family: "forms",
    what: "Create a new form definition with a set of fields",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "create_form",
    schema: withToken({
      title: z.string(),
      fields: z
        .string()
        .describe("JSON string describing the form fields")
        .optional(),
    }),
  },
  {
    name: "submit_response",
    tool_family: "forms",
    what: "Submit a response payload to an existing form definition",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: false,
    operation: "submit_form_response",
    schema: withToken({
      form_id: z.string(),
      payload: z.string().describe("JSON string with the response payload"),
    }),
  },
  {
    name: "delete_form",
    tool_family: "forms",
    what: "Permanently delete a form definition and every submitted response",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_form",
    schema: withToken(idSchema),
  },

  // webhooks
  {
    name: "register_webhook",
    tool_family: "webhooks",
    what: "Register a new outbound webhook endpoint for a given event",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "record_create",
    is_external: false,
    is_reversible: true,
    operation: "register_webhook",
    schema: withToken({
      url: z.string(),
      event: z.string().optional(),
      secret: z.string().optional(),
    }),
  },
  {
    name: "send_webhook",
    tool_family: "webhooks",
    what: "Trigger a real outbound HTTP POST to a registered webhook URL",
    style: "external",
    mode: "commit",
    category: "consequence",
    side_effect_class: "external_http_call",
    risk_class: "C",
    outcome_type: "outbound_http",
    is_external: true,
    is_reversible: false,
    operation: "send_webhook",
    schema: withToken({
      webhook_id: z.string(),
      payload: z.string().describe("JSON string with the payload to deliver"),
    }),
  },
  {
    name: "delete_webhook",
    tool_family: "webhooks",
    what: "Permanently delete a registered webhook endpoint",
    style: "destructive",
    mode: "commit",
    category: "consequence",
    side_effect_class: "destructive_mutation",
    risk_class: "A",
    outcome_type: "record_delete",
    is_external: false,
    is_reversible: false,
    operation: "delete_webhook",
    schema: withToken(idSchema),
  },
];

export const TOOLS: PackTool[] = [...readTools, ...writeTools];

export const TOOL_FAMILIES = [
  "memory",
  "notes",
  "tasks",
  "snippets",
  "bookmarks",
  "contacts",
  "forms",
  "webhooks",
] as const;

export interface PublicToolDescriptor {
  name: string;
  description: string;
  tool_family: string;
  mode: ToolMode;
  category: ToolCategory;
  side_effect_class: SideEffectClass;
  install_hint: string;
  usage_hint: string;
  risk_class?: RiskClass;
  is_external?: boolean;
  is_reversible?: boolean;
}
