import type pg from "pg";

export async function incrementUsage(
  pool: pg.Pool,
  tenantId: string,
  actionClass: string,
  amountEur: number,
): Promise<void> {
  await pool.query(
    `INSERT INTO billing_usage_daily (tenant_id, usage_date, action_class, action_count, total_eur)
     VALUES ($1, CURRENT_DATE, $2, 1, $3)
     ON CONFLICT (tenant_id, usage_date, action_class)
     DO UPDATE SET
       action_count = billing_usage_daily.action_count + 1,
       total_eur = billing_usage_daily.total_eur + $3,
       updated_at = now()`,
    [tenantId, actionClass, amountEur],
  );
}
