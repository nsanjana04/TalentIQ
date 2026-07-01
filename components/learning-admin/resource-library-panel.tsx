"use client";

import { useRef, useState } from "react";
import { ExternalLink, Link2, Loader2, Plus, Search, Trash2, Upload, UserPlus, AlertCircle } from "lucide-react";
import {
  useAdminLearningMutations,
  useAdminLearningResources,
  useLearningResources,
} from "@/hooks/use-learning-content";
import type { LearningResource, LearningResourceType } from "@/types/learning-content";
import { OpenResourceButton, ResourceTypeBadge } from "@/components/learning-content/open-resource-button";
import { ApiClientError } from "@/lib/api-client";
import {
  getAcceptForResourceType,
  LINK_ONLY_RESOURCE_TYPES,
  RESOURCE_URL_PLACEHOLDERS,
  UPLOADABLE_RESOURCE_TYPES,
} from "@/lib/utils/learning-file-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LEARNING_RESOURCE_TYPE_LABELS } from "@/lib/utils/learning-url";
import { ResourceAssignDialog } from "@/components/learning-admin/resource-assign-dialog";
import { cn } from "@/lib/utils";

const RESOURCE_TYPES = Object.keys(LEARNING_RESOURCE_TYPE_LABELS) as LearningResourceType[];

type SourceMode = "link" | "upload";

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "LINK" as LearningResourceType,
  url: "",
  tags: "",
  isPublished: true,
  sourceMode: "link" as SourceMode,
  pendingFile: null as File | null,
};

type ResourceLibraryPanelProps = {
  mode?: "admin" | "view";
};

export function ResourceLibraryPanel({ mode = "admin" }: ResourceLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignResource, setAssignResource] = useState<LearningResource | null>(null);
  const [editing, setEditing] = useState<LearningResource | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = {
    search: search || undefined,
    type: typeFilter || undefined,
  };

  const adminQuery = useAdminLearningResources(filters);
  const viewQuery = useLearningResources(filters);
  const { data: resources, isLoading, isError, error } =
    mode === "admin" ? adminQuery : viewQuery;
  const mutations = useAdminLearningMutations();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  }

  function openEdit(resource: LearningResource) {
    setEditing(resource);
    setForm({
      title: resource.title,
      description: resource.description ?? "",
      type: resource.type,
      url: resource.url,
      tags: resource.tags.join(", "),
      isPublished: resource.isPublished,
      sourceMode: "link",
      pendingFile: null,
    });
    setSaveError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  }

  function handleTypeChange(type: LearningResourceType) {
    setForm((prev) => ({
      ...prev,
      type,
      sourceMode: LINK_ONLY_RESOURCE_TYPES.has(type) ? "link" : prev.sourceMode,
      pendingFile: LINK_ONLY_RESOURCE_TYPES.has(type) ? null : prev.pendingFile,
    }));
    if (LINK_ONLY_RESOURCE_TYPES.has(type) && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) {
      setForm((prev) => ({ ...prev, pendingFile: null }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      pendingFile: file,
      sourceMode: "upload",
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^.]+$/, ""),
    }));
  }

  const supportsUpload = UPLOADABLE_RESOURCE_TYPES.has(form.type);
  const isSaving =
    mutations.createResource.isPending ||
    mutations.updateResource.isPending ||
    mutations.uploadResourceFile.isPending;

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaveError(null);

    if (!form.title.trim()) {
      setSaveError("Title is required.");
      return;
    }

    let url = form.url.trim();
    let type = form.type;

    if (form.sourceMode === "upload" && form.pendingFile) {
      try {
        const uploaded = await mutations.uploadResourceFile.mutateAsync(form.pendingFile);
        url = uploaded.url;
        type = uploaded.type;
      } catch (err) {
        setSaveError(
          err instanceof ApiClientError
            ? err.message
            : "Failed to upload file. Please try again."
        );
        return;
      }
    }

    if (!url) {
      setSaveError(
        supportsUpload && form.sourceMode === "upload"
          ? "Select a file to upload."
          : "URL is required."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type,
      url,
      isPublished: form.isPublished,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sortOrder: 0,
    };

    try {
      if (editing) {
        await mutations.updateResource.mutateAsync({ id: editing.id, body: payload });
      } else {
        await mutations.createResource.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setSaveError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to save resource. If using Docker, run: npx prisma db push"
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {LEARNING_RESOURCE_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        {mode === "admin" && (
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Could not load resources
          {error instanceof ApiClientError ? `: ${error.message}` : "."} Please refresh and try
          again.
        </p>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading resources…
          </CardContent>
        </Card>
      ) : !resources?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {mode === "admin"
                ? "No learning resources yet. Add YouTube links, external URLs, or upload PDFs, documents, and videos."
                : "No resources assigned to you yet. Your administrator will assign learning content when ready."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className={cn(
                "overflow-hidden",
                mode === "view" && resource.isAssigned && "border-amber-400/40"
              )}
            >
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={resource.navigation.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      {resource.title}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <ResourceTypeBadge type={resource.type} provider={resource.provider} />
                    {mode === "view" && resource.isAssigned && (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3" />
                        Assigned
                      </Badge>
                    )}
                    {mode === "admin" && (
                      <Badge variant={resource.isPublished ? "default" : "secondary"}>
                        {resource.isPublished ? "Published" : "Draft"}
                      </Badge>
                    )}
                    {mode === "admin" && (resource.assignmentCount ?? 0) > 0 && (
                      <Badge variant="outline">{resource.assignmentCount} assigned</Badge>
                    )}
                  </div>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  )}
                  <a
                    href={resource.navigation.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {resource.url}
                  </a>
                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpenResourceButton navigation={resource.navigation} label="Open link" variant="outline" />
                  {mode === "admin" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setAssignResource(resource)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign course level
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(resource)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={mutations.deleteResource.isPending}
                        onClick={() => mutations.deleteResource.mutate(resource.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mode === "admin" && (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Resource" : "Add Learning Resource"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Introduction to Java on Azure"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content type</label>
              <Select
                className="mt-1"
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as LearningResourceType)}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LEARNING_RESOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {LINK_ONLY_RESOURCE_TYPES.has(form.type)
                  ? "Paste the platform URL for this content type."
                  : "Paste a URL or upload a file from your computer."}
              </p>
            </div>

            {supportsUpload ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={form.sourceMode === "link" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, sourceMode: "link", pendingFile: null })}
                  >
                    <Link2 className="mr-1.5 h-3.5 w-3.5" />
                    Paste URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={form.sourceMode === "upload" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, sourceMode: "upload" })}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload file
                  </Button>
                </div>

                {form.sourceMode === "link" ? (
                  <Input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder={RESOURCE_URL_PLACEHOLDERS[form.type]}
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptForResourceType(form.type)}
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {form.pendingFile ? "Change file" : "Choose file"}
                    </Button>
                    {form.pendingFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {form.pendingFile.name} (
                        {(form.pendingFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </p>
                    )}
                    {!form.pendingFile && editing?.url && (
                      <p className="text-xs text-muted-foreground truncate">
                        Current: {editing.url}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported: PDF, Word, PowerPoint, Excel, text, and video (max 200 MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  className="mt-1"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder={RESOURCE_URL_PLACEHOLDERS[form.type]}
                  required
                />
              </div>
            )}

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
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                className="mt-1"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="java, azure, beginner"
              />
            </div>
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? mutations.uploadResourceFile.isPending
                    ? "Uploading…"
                    : "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add resource"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}

      <ResourceAssignDialog
        resource={assignResource}
        open={Boolean(assignResource)}
        onOpenChange={(next) => {
          if (!next) setAssignResource(null);
        }}
      />
    </div>
  );
}
