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
    what: "Get a value by key from persistent memory",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: { key: z.string().describe("Key to look up") },
  },
  {
    name: "memory_list",
    tool_family: "memory",
    what: "List keys in persistent memory, optionally filtered by prefix",
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
    what: "Search memory by keyword across keys, values, and tags",
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
    what: "List all notes, optionally filtered by tag",
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
    what: "Retrieve a note by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_notes",
    tool_family: "notes",
    what: "Search notes by query across title, content, and tags",
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
    what: "List tasks, optionally filtered by status, project, or priority",
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
    what: "Retrieve a task by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },

  // snippets
  {
    name: "list_snippets",
    tool_family: "snippets",
    what: "List code snippets, optionally filtered by language or tag",
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
    what: "Retrieve a code snippet by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_snippets",
    tool_family: "snippets",
    what: "Search snippets across title, code, and tags",
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
    what: "List bookmarks, optionally filtered by tag or category",
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
    what: "Retrieve a bookmark by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_bookmarks",
    tool_family: "bookmarks",
    what: "Search bookmarks across title, URL, and tags",
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
    what: "List contacts, optionally filtered by tag or company",
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
    what: "Retrieve a contact by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "search_contacts",
    tool_family: "contacts",
    what: "Search contacts across name, email, and company",
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
    what: "List all forms",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {},
  },
  {
    name: "get_form",
    tool_family: "forms",
    what: "Retrieve a form definition by ID",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: idSchema,
  },
  {
    name: "get_responses",
    tool_family: "forms",
    what: "List submitted responses for a form",
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
    what: "List registered webhook endpoints",
    style: "read",
    mode: "open",
    category: "read",
    side_effect_class: "none",
    schema: {},
  },
  {
    name: "get_history",
    tool_family: "webhooks",
    what: "Retrieve delivery history for a webhook",
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
    what: "Store a key-value pair in persistent memory",
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
    what: "Delete a key from persistent memory",
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
    what: "Clear all entries from persistent memory",
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
    what: "Create a new note",
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
    what: "Update an existing note",
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
    what: "Delete a note",
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
    what: "Create a task",
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
    what: "Update a task's fields",
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
    name: "complete_task",
    tool_family: "tasks",
    what: "Mark a task as complete",
    style: "write",
    mode: "commit",
    category: "consequence",
    side_effect_class: "state_mutation",
    risk_class: "A",
    outcome_type: "status_transition",
    is_external: false,
    is_reversible: true,
    operation: "complete_task",
    schema: withToken(idSchema),
  },
  {
    name: "delete_task",
    tool_family: "tasks",
    what: "Delete a task",
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
    what: "Save a new code snippet",
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
    what: "Update an existing snippet",
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
    what: "Delete a snippet",
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
    what: "Save a new bookmark",
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
    what: "Update a bookmark",
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
    what: "Delete a bookmark",
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
    what: "Create a new contact",
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
    what: "Update a contact",
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
    what: "Delete a contact",
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
    what: "Create a new form definition",
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
    what: "Submit a response to a form",
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
    what: "Delete a form definition and its responses",
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
    what: "Register a new webhook endpoint",
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
    what: "Send a webhook HTTP POST to a registered endpoint",
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
    what: "Delete a registered webhook endpoint",
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
  risk_class?: RiskClass;
  is_external?: boolean;
  is_reversible?: boolean;
}
