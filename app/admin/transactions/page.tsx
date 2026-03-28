import { Chip } from "@heroui/react";
import {
  CreditCard,
  AlertCircle,
  CircleCheck,
  CircleX,
  RotateCcw,
} from "lucide-react";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { PaymentStatus } from "@/types/database";
import { TransactionFilters } from "./transaction-filters";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
};

function getPaymentStatusColor(
  status: PaymentStatus
): "default" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "succeeded":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "refunded":
      return "accent";
    default:
      return "default";
  }
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TransactionRow {
  id: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  refund_amount: number | null;
  created_at: string;
}

interface TransactionsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/*  Stat Card (local)                                                          */
/* -------------------------------------------------------------------------- */

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
}: SummaryCardProps) {
  return (
    <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-body text-sm font-medium text-[color:var(--muted)]">
            {title}
          </p>
          <p className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            {value}
          </p>
        </div>
        <div
          className={`flex size-10 items-center justify-center rounded-[10px] ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminTransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const page = Number(params.page) || 1;
  const perPage = 20;

  const user = await getUserWithRoles();
  if (!user || !user.roles.includes("admin")) {
    redirect("/");
  }

  const supabase = await createServerClient();

  /* -- Fetch payments ------------------------------------------------------ */
  let query = supabase
    .from("payments")
    .select("id, order_id, amount, status, refund_amount, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const offset = (page - 1) * perPage;
  query = query.range(offset, offset + perPage - 1);

  const { data: payments, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  const rows: TransactionRow[] = (payments ?? []).map((p) => ({
    id: p.id,
    order_id: p.order_id,
    amount: p.amount,
    status: p.status as PaymentStatus,
    refund_amount: p.refund_amount,
    created_at: p.created_at,
  }));

  /* -- Summary stats ------------------------------------------------------- */
  const succeededTotal = rows
    .filter((r) => r.status === "succeeded")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalRefunds = rows
    .filter((r) => r.refund_amount !== null)
    .reduce((sum, r) => sum + (r.refund_amount ?? 0), 0);

  const failedCount = rows.filter((r) => r.status === "failed").length;

  /* -- Render -------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Transactions
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Payment and transaction logs ({count ?? 0} total)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SummaryCard
          title="Succeeded (this page)"
          value={formatCurrency(succeededTotal)}
          icon={<CircleCheck className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
        />
        <SummaryCard
          title="Total Refunds (this page)"
          value={formatCurrency(totalRefunds)}
          icon={<RotateCcw className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--danger)]/10"
          iconColor="text-[var(--danger)]"
        />
        <SummaryCard
          title="Failed (this page)"
          value={String(failedCount)}
          icon={<CircleX className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--warning)]/10"
          iconColor="text-[var(--warning)]"
        />
      </div>

      {/* Filters + pagination */}
      <TransactionFilters
        currentStatus={statusFilter}
        page={page}
        totalPages={totalPages}
      />

      {/* Transactions table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <CreditCard
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No transactions found
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              {statusFilter
                ? `No transactions with status "${PAYMENT_STATUS_LABELS[statusFilter as PaymentStatus] ?? statusFilter}"`
                : "No payment records yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Payment ID
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Order ID
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Refund
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                {rows.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-medium text-[color:var(--foreground)]">
                        {tx.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-[color:var(--muted)]">
                        {tx.order_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Chip
                        color={getPaymentStatusColor(tx.status)}
                        variant="soft"
                        size="sm"
                      >
                        {PAYMENT_STATUS_LABELS[tx.status]}
                      </Chip>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.refund_amount !== null ? (
                        <span className="font-body text-sm font-medium tabular-nums text-[var(--danger)]">
                          {formatCurrency(tx.refund_amount)}
                        </span>
                      ) : (
                        <span className="font-body text-xs text-[color:var(--muted)]">
                          --
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
