"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, RefreshCw } from "lucide-react";
import { useForecasts, useRegenerateForecasts } from "@/hooks/use-enterprise-modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const MODELS = ["XGBOOST", "LIGHTGBM", "RANDOM_FOREST"] as const;

export function ForecastingPanel() {
  const [model, setModel] = useState<string>("XGBOOST");
  const { data, isLoading, isError, refetch } = useForecasts(model);
  const regenerate = useRegenerateForecasts();

  if (isLoading) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Loading forecasts…</CardContent></Card>;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Unable to load workforce forecasts.</p>
          <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const filtered = data.filter((f) => f.modelType === model);
  const chartData = filtered.map((f) => ({
    name: f.category.replace(/_/g, " "),
    value: f.predictedValue,
    confidence: Math.round(f.confidence * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <Select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${regenerate.isPending ? "animate-spin" : ""}`} />
          Regenerate forecasts
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>6-Month Predictions</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2F80ED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{f.category.replace(/_/g, " ")}</CardTitle>
                <Badge variant="outline">{Math.round(f.confidence * 100)}% confidence</Badge>
              </div>
              {f.department && <p className="text-sm text-muted-foreground">{f.department}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{f.predictedValue}</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Drivers</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {f.drivers.map((d) => (
                    <li key={d.factor}>{d.factor}: {d.impact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                  {f.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
