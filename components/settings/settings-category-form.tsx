"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useSettingsCategory, useSettingsMutations } from "@/hooks/use-settings";
import type { SettingsCategory } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SettingsCategoryForm({ category }: { category: SettingsCategory }) {
  const { data, isLoading } = useSettingsCategory(category);
  const { updateCategory } = useSettingsMutations();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.fields) {
      setForm(Object.fromEntries(data.fields.map((f) => [f.key, f.value])));
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading settings…
      </div>
    );
  }

  if (!data) return null;

  async function handleSave() {
    const settings: Record<string, string | number | boolean> = {};
    for (const field of data!.fields) {
      const raw = form[field.key] ?? field.value;
      if (field.valueType === "BOOLEAN") settings[field.key] = raw === "true";
      else if (field.valueType === "NUMBER") settings[field.key] = Number(raw);
      else settings[field.key] = raw;
    }
    await updateCategory.mutateAsync({ category, settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium">{field.label}</label>
            {field.inputType === "boolean" ? (
              <Select
                value={form[field.key] ?? field.value}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            ) : field.inputType === "select" && field.options ? (
              <Select
                value={form[field.key] ?? field.value}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            ) : field.inputType === "textarea" ? (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form[field.key] ?? field.value}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              />
            ) : (
              <Input
                type={field.inputType === "password" ? "password" : field.inputType === "number" ? "number" : field.inputType === "color" ? "color" : "text"}
                value={form[field.key] ?? field.value}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.description ?? undefined}
              />
            )}
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={updateCategory.isPending}>
            {updateCategory.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          {saved && <span className="text-sm text-emerald-600">Saved successfully</span>}
        </div>
      </CardContent>
    </Card>
  );
}
