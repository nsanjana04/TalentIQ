"use client";

import { useEffect, useState } from "react";
import type { LearningResourceType, OpenCourse, OpenCourseCategory } from "@/types/learning-content";
import type { CreateOpenCourseInput } from "@/lib/validations/learning-content";
import { useAuth } from "@/hooks/use-auth";
import { useAdminLearningMutations } from "@/hooks/use-learning-content";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  LEARNING_RESOURCE_TYPE_LABELS,
  OPEN_COURSE_CATEGORY_LABELS,
} from "@/lib/utils/learning-url";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(OPEN_COURSE_CATEGORY_LABELS) as OpenCourseCategory[];
const RESOURCE_TYPES = Object.keys(LEARNING_RESOURCE_TYPE_LABELS) as LearningResourceType[];

type OpenCourseEditDialogProps = {
  course: OpenCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function OpenCourseEditDialog({
  course,
  open,
  onOpenChange,
  onSaved,
}: OpenCourseEditDialogProps) {
  const { user } = useAuth();
  const mutations = useAdminLearningMutations();
  const canSetOrgMandatory = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "GENERAL" as OpenCourseCategory,
    type: "VIDEO" as LearningResourceType,
    url: "",
    durationMinutes: "",
    isMandatory: false,
    isPublished: true,
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!course || !open) return;
    setForm({
      title: course.title,
      description: course.description ?? "",
      category: course.category,
      type: course.type,
      url: course.url,
      durationMinutes: course.durationMinutes?.toString() ?? "",
      isMandatory: course.isMandatory,
      isPublished: course.isPublished,
    });
    setSaveError(null);
  }, [course, open]);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!course) return;
    setSaveError(null);

    if (!form.title.trim() || !form.url.trim()) {
      setSaveError("Title and URL are required.");
      return;
    }

    const payload: CreateOpenCourseInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      type: form.type,
      url: form.url.trim(),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      isMandatory: form.isMandatory,
      isPublished: form.isPublished,
      sortOrder: course.sortOrder,
    };

    try {
      await mutations.updateOpenCourse.mutateAsync({ id: course.id, body: payload });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setSaveError(
        err instanceof ApiClientError ? err.message : "Failed to save course changes."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Open Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Video / course URL</label>
            <Input
              className="mt-1"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="/learning/training/video.mp4 or https://..."
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                className="mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as OpenCourseCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {OPEN_COURSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Content type</label>
              <Select
                className="mt-1"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as LearningResourceType })}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LEARNING_RESOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Duration (minutes)</label>
            <Input
              className="mt-1"
              type="number"
              min={0}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className={cn(
                "mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isMandatory}
              disabled={!canSetOrgMandatory}
              onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })}
            />
            Mandatory for all employees
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published
          </label>
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutations.updateOpenCourse.isPending}>
              {mutations.updateOpenCourse.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
