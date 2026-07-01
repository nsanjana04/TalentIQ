"use client";

import { useState } from "react";
import { Code, Database, FileText, ListChecks, PenLine, Plus, Trash2 } from "lucide-react";
import { useAssessmentMutations, useQuestionBank } from "@/hooks/use-assessments";
import type { QuestionType } from "@/types/assessments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

const TYPES: { value: QuestionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "MULTIPLE_CHOICE", label: "MCQ", icon: ListChecks },
  { value: "TRUE_FALSE", label: "True/False", icon: ListChecks },
  { value: "ESSAY", label: "Essay", icon: PenLine },
  { value: "CODE", label: "Coding", icon: Code },
];

const TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE: "bg-blue-500/10 text-blue-700",
  TRUE_FALSE: "bg-violet-500/10 text-violet-700",
  ESSAY: "bg-amber-500/10 text-amber-700",
  CODE: "bg-rose-500/10 text-rose-700",
};

export function QuestionBankPanel() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    question: "",
    type: "MULTIPLE_CHOICE" as QuestionType,
    options: "",
    correctAnswer: "",
    codeTemplate: "",
    points: 1,
  });

  const { data: items, isLoading } = useQuestionBank(search);
  const mutations = useAssessmentMutations();

  async function handleCreate() {
    if (!form.question.trim()) return;
    await mutations.createBankItem.mutateAsync({
      question: form.question,
      type: form.type,
      options:
        form.type === "MULTIPLE_CHOICE"
          ? form.options.split("\n").filter(Boolean)
          : undefined,
      correctAnswer: form.correctAnswer || undefined,
      codeTemplate: form.type === "CODE" ? form.codeTemplate : undefined,
      points: form.points,
    });
    setOpen(false);
    setForm({
      question: "",
      type: "MULTIPLE_CHOICE",
      options: "",
      correctAnswer: "",
      codeTemplate: "",
      points: 1,
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Question Bank</h2>
            <p className="text-sm text-muted-foreground">
              Reusable question library for MCQ, true/false, essay, and coding items. Import bank
              questions into assessments from the Catalog tab.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search question bank…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <PermissionGate elementId="assessments.manage.button">
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Question
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items?.map((item) => {
            const TypeIcon = TYPES.find((t) => t.value === item.type)?.icon ?? FileText;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border bg-card/60 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge className={cn("text-[10px]", TYPE_COLORS[item.type])}>
                      {item.type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.points} pts</span>
                  </div>
                  <p className="mt-2 text-sm">{item.question}</p>
                  {item.tags.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {item.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <PermissionGate elementId="assessments.manage.button">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => mutations.deleteBankItem.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PermissionGate>
              </div>
            );
          })}
          {!items?.length && (
            <p className="py-12 text-center text-muted-foreground">No questions in the bank yet.</p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Question Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as QuestionType }))
              }
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <textarea
              className="w-full rounded-lg border bg-background p-3 text-sm"
              rows={3}
              placeholder="Question text"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
            {form.type === "MULTIPLE_CHOICE" && (
              <textarea
                className="w-full rounded-lg border bg-background p-3 text-sm"
                rows={4}
                placeholder="Options (one per line)"
                value={form.options}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
              />
            )}
            {form.type === "CODE" && (
              <textarea
                className="w-full rounded-lg border bg-muted/30 p-3 font-mono text-sm"
                rows={4}
                placeholder="Code template"
                value={form.codeTemplate}
                onChange={(e) => setForm((f) => ({ ...f, codeTemplate: e.target.value }))}
              />
            )}
            {form.type !== "ESSAY" && (
              <Input
                placeholder="Correct answer"
                value={form.correctAnswer}
                onChange={(e) => setForm((f) => ({ ...f, correctAnswer: e.target.value }))}
              />
            )}
            <Input
              type="number"
              placeholder="Points"
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
            />
            <Button className="w-full" onClick={handleCreate}>
              Save to Bank
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
