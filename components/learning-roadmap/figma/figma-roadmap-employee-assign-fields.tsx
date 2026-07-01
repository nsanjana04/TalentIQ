"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { AssignableRole, AssignableUser } from "@/types/learning-admin";

interface FigmaRoadmapEmployeeAssignFieldsProps {
  roles: AssignableRole[] | undefined;
  users: AssignableUser[] | undefined;
  roleFilterId: string;
  onRoleFilterChange: (roleId: string) => void;
  targetId: string | null;
  onEmployeeSelect: (userId: string) => void;
  userSearch: string;
  onUserSearchChange: (value: string) => void;
}

export function FigmaRoadmapEmployeeAssignFields({
  roles,
  users,
  roleFilterId,
  onRoleFilterChange,
  targetId,
  onEmployeeSelect,
  userSearch,
  onUserSearchChange,
}: FigmaRoadmapEmployeeAssignFieldsProps) {
  const selectedRole = roles?.find((role) => role.id === roleFilterId);

  const filteredUsers = useMemo(() => {
    if (!users?.length || !selectedRole) return [];
    return users.filter(
      (user) => user.roleName?.toLowerCase() === selectedRole.name.toLowerCase()
    );
  }, [users, selectedRole]);

  const selectedEmployee = filteredUsers.find((user) => user.id === targetId);

  return (
    <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <div>
        <p className="text-sm font-medium text-[#111827]">
          Role <span className="text-red-500">*</span>
        </p>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          Filter employees by role before selecting who receives this course level.
        </p>
        <select
          value={roleFilterId}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Select role…</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.userCount} users)
            </option>
          ))}
        </select>
      </div>

      {selectedRole && (
        <>
          <div>
            <p className="text-sm font-medium text-[#111827]">
              Employee <span className="text-red-500">*</span>
            </p>
            <Input
              className="mt-2"
              placeholder={`Search ${selectedRole.name} employees…`}
              value={userSearch}
              onChange={(e) => onUserSearchChange(e.target.value)}
            />
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#E5E7EB] bg-white px-3 py-4 text-center text-sm text-[#6B7280]">
                No employees found for the {selectedRole.name} role.
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`flex w-full flex-col rounded border bg-white px-3 py-2 text-left text-sm ${
                    targetId === user.id ? "border-[#2563EB]" : "border-[#E5E7EB]"
                  }`}
                  onClick={() => onEmployeeSelect(user.id)}
                >
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {user.email} · {user.roleName}
                    {user.departmentName ? ` · ${user.departmentName}` : ""}
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedEmployee && (
            <p className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs text-[#1E40AF]">
              Assigning course to <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>{" "}
              ({selectedEmployee.roleName})
            </p>
          )}
        </>
      )}
    </div>
  );
}
