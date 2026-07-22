import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { RoleSlug } from "@/constants/role-slugs";

vi.mock("@/repositories/learning-admin.repository", () => ({
  learningAdminRepository: {
    findCourseLevel: vi.fn(),
    createAssignmentBatch: vi.fn(),
    createUserAssignments: vi.fn(),
    findAssignmentBatch: vi.fn(),
    listAssignableUsers: vi.fn(),
    syncOverdueStatuses: vi.fn(),
  },
}));

vi.mock("@/lib/learning-admin/assignment-resolver", () => ({
  resolveTargetUsers: vi.fn(),
  findDuplicateAssignments: vi.fn(),
  findPrerequisiteWarnings: vi.fn(),
  filterBlockedByPrerequisite: vi.fn((ids: string[]) => ids),
}));

vi.mock("@/services/audit.service", () => ({
  auditService: { log: vi.fn() },
}));

vi.mock("@/services/notification.service", () => ({
  notificationService: { notify: vi.fn() },
}));

import { learningAdminService } from "@/services/learning-admin.service";
import { learningAdminRepository } from "@/repositories/learning-admin.repository";
import {
  resolveTargetUsers,
  findDuplicateAssignments,
  findPrerequisiteWarnings,
} from "@/lib/learning-admin/assignment-resolver";

describe("learningAdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks duplicate active assignments in preview", async () => {
    vi.mocked(learningAdminRepository.findCourseLevel).mockResolvedValue({
      id: "level-1",
      courseId: "course-1",
      unlockRule: null,
      course: { id: "course-1", title: "Cyber Security", adminStatus: "ACTIVE" },
    } as never);

    vi.mocked(resolveTargetUsers).mockResolvedValue({
      userIds: ["u1"],
      inactiveSkipped: [],
      targetLabel: "Jane Doe",
    });

    vi.mocked(findDuplicateAssignments).mockResolvedValue([
      {
        id: "u1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        departmentName: "Engineering",
      },
    ]);

    vi.mocked(findPrerequisiteWarnings).mockResolvedValue([]);
    vi.mocked(learningAdminRepository.listAssignableUsers).mockResolvedValue([]);

    const preview = await learningAdminService.previewAssignment({
      courseId: "course-1",
      courseLevelId: "level-1",
      targetType: "USER",
      targetId: "u1",
    });

    expect(preview.duplicateUsers).toHaveLength(1);
    expect(preview.finalAssignableUsers).toHaveLength(0);
  });

  it("rejects assignment creation when no eligible users remain", async () => {
    vi.spyOn(learningAdminService, "previewAssignment").mockResolvedValue({
      targetType: "USER",
      targetLabel: "Jane",
      usersAffected: 1,
      duplicateUsers: [{ id: "u1", firstName: "J", lastName: "D", email: "j@x.com", departmentName: null }],
      inactiveUsersSkipped: [],
      prerequisiteWarnings: [],
      finalAssignableUsers: [],
    });

    await expect(
      learningAdminService.createAssignment("admin-1", RoleSlug.ADMIN, {
        courseId: "c1",
        courseLevelId: "l1",
        targetType: "USER",
        targetId: "u1",
        dueDate: new Date().toISOString(),
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects non-learning-manager from creating assignments", async () => {
    vi.spyOn(learningAdminService, "previewAssignment").mockResolvedValue({
      targetType: "USER",
      targetLabel: "Jane",
      usersAffected: 1,
      duplicateUsers: [],
      inactiveUsersSkipped: [],
      prerequisiteWarnings: [],
      finalAssignableUsers: [{ id: "u1", firstName: "J", lastName: "D", email: "j@x.com", departmentName: null }],
    });

    await expect(
      learningAdminService.createAssignment("emp-1", RoleSlug.EMPLOYEE, {
        courseId: "c1",
        courseLevelId: "l1",
        targetType: "USER",
        targetId: "u1",
        dueDate: new Date().toISOString(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("assignment resolver expectations", () => {
  it("documents active assignment statuses used for duplicate detection", async () => {
    const { ACTIVE_ASSIGNMENT_STATUSES } = await import("@/types/learning-admin");
    expect(ACTIVE_ASSIGNMENT_STATUSES).toContain("NOT_STARTED");
    expect(ACTIVE_ASSIGNMENT_STATUSES).toContain("IN_PROGRESS");
    expect(ACTIVE_ASSIGNMENT_STATUSES).toContain("OVERDUE");
  });
});
