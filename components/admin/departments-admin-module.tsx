"use client";

import { useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useDepartments, useDepartmentMutations } from "@/hooks/use-departments";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { MutationErrorBanner } from "@/components/feedback/mutation-error-banner";

export function DepartmentsAdminModule({ embedded = false }: { embedded?: boolean }) {
  const { data: departments, isLoading, isError, error, refetch, isFetching } = useDepartments();
  const mutations = useDepartmentMutations();
  const { can } = usePermissions();
  const canManage = can(Permission.DEPARTMENTS_MANAGE);
  const [deptDialog, setDeptDialog] = useState<"create" | { edit: string } | null>(null);
  const [teamDialog, setTeamDialog] = useState<{ departmentId: string; teamId?: string } | null>(
    null
  );
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");
  }

  function openCreateDept() {
    resetForm();
    setDeptDialog("create");
  }

  function openEditDept(id: string) {
    const dept = departments?.find((d) => d.id === id);
    if (!dept) return;
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description ?? "");
    setDeptDialog({ edit: id });
  }

  function openCreateTeam(departmentId: string) {
    resetForm();
    setTeamDialog({ departmentId });
  }

  function openEditTeam(departmentId: string, teamId: string) {
    const dept = departments?.find((d) => d.id === departmentId);
    const team = dept?.teams.find((t) => t.id === teamId);
    if (!team) return;
    setName(team.name);
    setCode(team.code);
    setDescription(team.description ?? "");
    setTeamDialog({ departmentId, teamId });
  }

  async function handleSaveDepartment() {
    if (!name.trim()) return;
    if (deptDialog === "create") {
      await mutations.createDepartment.mutateAsync({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });
    } else if (deptDialog && typeof deptDialog === "object") {
      await mutations.updateDepartment.mutateAsync({
        id: deptDialog.edit,
        data: {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
    }
    setDeptDialog(null);
    resetForm();
  }

  async function handleSaveTeam() {
    if (!name.trim() || !teamDialog) return;
    if (teamDialog.teamId) {
      await mutations.updateTeam.mutateAsync({
        id: teamDialog.teamId,
        data: {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
    } else {
      await mutations.createTeam.mutateAsync({
        departmentId: teamDialog.departmentId,
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });
    }
    setTeamDialog(null);
    resetForm();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="Could not load departments"
        action="Load departments"
        resource="/api/departments"
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const activeMutationError =
    mutations.createDepartment.error ??
    mutations.updateDepartment.error ??
    mutations.deleteDepartment.error ??
    mutations.createTeam.error ??
    mutations.updateTeam.error ??
    mutations.deleteTeam.error;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="mt-2 text-muted-foreground">
              Organization structure — departments, teams, and live headcount from the database.
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreateDept}>
              <Plus className="h-4 w-4" />
              Add department
            </Button>
          )}
        </div>
      )}

      {embedded && canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreateDept}>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        </div>
      )}

      {activeMutationError && (
        <MutationErrorBanner
          error={activeMutationError}
          action="Save department or team"
          onDismiss={() => {
            mutations.createDepartment.reset();
            mutations.updateDepartment.reset();
            mutations.deleteDepartment.reset();
            mutations.createTeam.reset();
            mutations.updateTeam.reset();
            mutations.deleteTeam.reset();
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments?.map((dept) => (
          <Card key={dept.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary" />
                    {dept.name}
                  </CardTitle>
                  <CardDescription>{dept.code}</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {dept.userCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dept.description && (
                <p className="text-sm text-muted-foreground">{dept.description}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Teams ({dept.teamCount})
                </p>
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => openCreateTeam(dept.id)}>
                    <Plus className="h-3.5 w-3.5" />
                    Team
                  </Button>
                )}
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {dept.teams.length > 0 ? (
                  dept.teams.map((team) => (
                    <li key={team.id} className="flex items-center justify-between gap-2">
                      <span>
                        {team.name}{" "}
                        <span className="text-xs">({team.memberCount} members)</span>
                      </span>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openEditTeam(dept.id, team.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => mutations.deleteTeam.mutate(team.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <li>No teams</li>
                )}
              </ul>
              {canManage && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDept(dept.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={dept.userCount > 0}
                    onClick={() => mutations.deleteDepartment.mutate(dept.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deptDialog} onOpenChange={() => setDeptDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deptDialog === "create" ? "Create department" : "Edit department"}
            </DialogTitle>
            <DialogDescription>Department name and code are stored in PostgreSQL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={mutations.createDepartment.isPending || mutations.updateDepartment.isPending}
              onClick={handleSaveDepartment}
            >
              Save department
            </Button>
            {(mutations.createDepartment.error || mutations.updateDepartment.error) && (
              <MutationErrorBanner
                error={mutations.createDepartment.error ?? mutations.updateDepartment.error}
                action="Save department"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!teamDialog} onOpenChange={() => setTeamDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{teamDialog?.teamId ? "Edit team" : "Create team"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={mutations.createTeam.isPending || mutations.updateTeam.isPending}
              onClick={handleSaveTeam}
            >
              Save team
            </Button>
            {(mutations.createTeam.error || mutations.updateTeam.error) && (
              <MutationErrorBanner
                error={mutations.createTeam.error ?? mutations.updateTeam.error}
                action="Save team"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
