"use client";

import { RevenueChart } from "@/components/ui/charts";

interface SalesOverviewChartProps {
  data: { date: string; revenue: number }[];
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  return <RevenueChart data={data} />;
}
