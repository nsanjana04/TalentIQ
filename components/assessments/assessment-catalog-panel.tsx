"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2, Plus, Search } from "lucide-react";
import {
  useAssessmentDetail,
  useAssessmentList,
  useAssessmentMutations,
} from "@/hooks/use-assessments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

export function AssessmentCatalogPanel() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: list, isLoading } = useAssessmentList(search, "all", { enabled: true });
  const { data: detail } = useAssessmentDetail(selectedId);
  const mutations = useAssessmentMutations();

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const created = await mutations.createAssessment.mutateAsync({
      title: newTitle.trim(),
      isPublished: false,
    });
    setCreateOpen(false);
    setNewTitle("");
    setSelectedId((created as { id: string }).id);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Assessment Catalog</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage assessments, publish them for learners, and edit questions linked
              to each assessment or course.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full lg:w-72">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">All assessments</h3>
              <PermissionGate elementId="assessments.manage.button">
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </PermissionGate>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search catalog…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {list?.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm",
                      selectedId === a.id ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.questionCount} Q · {a.passRate}% pass
                      {a.courseTitle ? ` · ${a.courseTitle}` : ""}
                    </p>
                  </button>
                ))}
                {!list?.length && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No assessments in catalog.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 flex-1">
          {detail ? (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{detail.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {detail.stats.questionCount} questions · {detail.passingScore}% to pass
                      {detail.timeLimitMinutes && ` · ${detail.timeLimitMinutes} min timer`}·{" "}
                      {detail.maxRetakes} retakes
                    </p>
                    {detail.courseTitle && (
                      <p className="text-xs text-muted-foreground">Course: {detail.courseTitle}</p>
                    )}
                  </div>
                  <PermissionGate elementId="assessments.manage.button">
                    <Button
                      size="sm"
                      onClick={() =>
                        mutations.updateAssessment.mutate({
                          id: detail.id,
                          data: { isPublished: !detail.isPublished },
                        })
                      }
                    >
                      {detail.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </PermissionGate>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Questions</p>
                  {detail.questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <Badge variant="outline" className="mr-2 text-[10px]">
                          {q.type}
                        </Badge>
                        {q.question}
                      </div>
                      <PermissionGate elementId="assessments.manage.button">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => mutations.deleteQuestion.mutate(q.id)}
                        >
                          Remove
                        </Button>
                      </PermissionGate>
                    </div>
                  ))}
                  {!detail.questions.length && (
                    <p className="text-sm text-muted-foreground">
                      No questions yet. Import from the Question Bank or generate from a linked
                      course on the Courses page.
                    </p>
                  )}
                  <PermissionGate elementId="assessments.manage.button">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mutations.importBank.mutate({
                          assessmentId: detail.id,
                          bankItemIds: ["seed-bank-mcq-1", "seed-bank-tf-1", "seed-bank-code-1"],
                        })
                      }
                    >
                      Import sample from Question Bank
                    </Button>
                  </PermissionGate>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Select an assessment from the catalog to view and manage its questions.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Assessment title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button className="w-full" onClick={handleCreate}>
            Create
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
