"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { CHART_COLORS, tooltipStyle } from "@/lib/design/tokens";
import { EmptyState } from "./states";

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface DonutChartCardProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  action?: React.ReactNode;
  colors?: string[];
}

export function DonutChartCard({ title, description, data, action, colors }: DonutChartCardProps) {
  const palette = colors ?? [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.accent,
    CHART_COLORS.danger,
  ];

  return (
    <ChartCard title={title} description={description} action={action}>
      {data.length === 0 ? (
        <EmptyState title="No chart data" description="Data will appear once records are available." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  action?: React.ReactNode;
  color?: string;
}

export function BarChartCard({
  title,
  description,
  data,
  dataKey = "value",
  action,
  color = CHART_COLORS.primary,
}: BarChartCardProps) {
  return (
    <ChartCard title={title} description={description} action={action}>
      {data.length === 0 ? (
        <EmptyState title="No chart data" description="Data will appear once records are available." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

interface LineChartCardProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  action?: React.ReactNode;
  color?: string;
}

export function LineChartCard({
  title,
  description,
  data,
  dataKey = "value",
  action,
  color = CHART_COLORS.primary,
}: LineChartCardProps) {
  return (
    <ChartCard title={title} description={description} action={action}>
      {data.length === 0 ? (
        <EmptyState title="No chart data" description="Data will appear once records are available." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
