"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Theme-aware chart colors using CSS variables from globals.css       */
/* ------------------------------------------------------------------ */

const CHART_COLORS = [
  "oklch(0.585 0.233 277)", // accent
  "oklch(0.723 0.219 149)", // success
  "oklch(0.769 0.188 70)",  // warning
  "oklch(0.577 0.245 27)",  // danger
  "oklch(0.65 0.18 200)",   // teal accent
  "oklch(0.70 0.15 330)",   // pink accent
];

const tooltipStyle = {
  backgroundColor: "oklch(0.2 0 0)",
  border: "1px solid oklch(0.3 0 0)",
  borderRadius: "8px",
  color: "oklch(0.9 0 0)",
  fontSize: "13px",
};

/* ------------------------------------------------------------------ */
/*  RevenueChart — Line chart: revenue over time                       */
/* ------------------------------------------------------------------ */

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No revenue data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0 0 / 0.3)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
          tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS[0]}
          strokeWidth={2.5}
          dot={{ r: 3, fill: CHART_COLORS[0] }}
          activeDot={{ r: 5, strokeWidth: 2 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  OrdersChart — Bar chart: orders per day/week                       */
/* ------------------------------------------------------------------ */

interface OrdersChartProps {
  data: { date: string; orders: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No order data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0 0 / 0.3)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [Number(value), "Orders"]}
        />
        <Legend />
        <Bar
          dataKey="orders"
          fill={CHART_COLORS[1]}
          radius={[4, 4, 0, 0]}
          name="Orders"
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  TopProductsChart — Horizontal bar chart: products by revenue       */
/* ------------------------------------------------------------------ */

interface TopProductsChartProps {
  data: { name: string; revenue: number; orders: number }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No product data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0 0 / 0.3)" />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
          tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
          width={120}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value);
            const n = String(name);
            if (n === "Revenue") return [`$${v.toFixed(2)}`, n];
            return [v, n];
          }}
        />
        <Legend />
        <Bar
          dataKey="revenue"
          fill={CHART_COLORS[0]}
          radius={[0, 4, 4, 0]}
          name="Revenue"
          maxBarSize={32}
        />
        <Bar
          dataKey="orders"
          fill={CHART_COLORS[2]}
          radius={[0, 4, 4, 0]}
          name="Orders"
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  CategoryPieChart — Pie chart: sales by category                    */
/* ------------------------------------------------------------------ */

interface CategoryPieChartProps {
  data: { name: string; value: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No category data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
          labelLine={{ stroke: "oklch(0.5 0 0)" }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "13px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  ActiveUsersChart — Line chart: active users trend                   */
/* ------------------------------------------------------------------ */

interface ActiveUsersChartProps {
  data: { date: string; users: number }[];
}

export function ActiveUsersChart({ data }: ActiveUsersChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No user activity data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0 0 / 0.3)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.4 0 0 / 0.3)" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: unknown) => [Number(value), "Active Users"]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="users"
          stroke={CHART_COLORS[1]}
          strokeWidth={2.5}
          dot={{ r: 3, fill: CHART_COLORS[1] }}
          activeDot={{ r: 5, strokeWidth: 2 }}
          name="Active Users"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared empty state                                                  */
/* ------------------------------------------------------------------ */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-default bg-default/20">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
