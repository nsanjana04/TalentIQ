import { describe, expect, it, vi, beforeEach } from "vitest";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";

vi.mock("@/repositories/screen.repository", () => ({
  screenRepository: {
    getRoleScreenAccess: vi.fn(),
    upsertRoleScreenAccess: vi.fn(),
    createAudit: vi.fn(),
  },
}));

vi.mock("@/lib/rbac/permission-version.service", () => ({
  permissionVersionService: {
    bumpForRolePermissionChange: vi.fn().mockResolvedValue(2),
  },
}));

import { screenRepository } from "@/repositories/screen.repository";
import { screenAccessService } from "@/services/screen-access.service";

describe("screenAccessService audit logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggle creates ScreenAccessAudit record", async () => {
    const before = {
      id: "rsa-1",
      roleId: "role-hr",
      screenId: "screen-dept",
      enabled: true,
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const after = { ...before, enabled: false, canView: false };

    vi.mocked(screenRepository.getRoleScreenAccess).mockResolvedValue([before]);
    vi.mocked(screenRepository.upsertRoleScreenAccess).mockResolvedValue(after);
    vi.mocked(screenRepository.createAudit).mockResolvedValue({
      id: "audit-1",
      actorId: "admin-1",
      targetRoleId: "role-hr",
      targetUserId: null,
      screenId: "screen-dept",
      action: "ROLE_SCREEN_ACCESS_UPDATE",
      beforeJson: JSON.stringify(before),
      afterJson: JSON.stringify(after),
      createdAt: new Date(),
    });

    await screenAccessService.updateRoleScreenAccess("admin-1", "role-hr", "screen-dept", {
      enabled: false,
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManage: false,
    });

    expect(screenRepository.createAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        targetRoleId: "role-hr",
        screenId: "screen-dept",
        action: "ROLE_SCREEN_ACCESS_UPDATE",
      })
    );
    expect(permissionVersionService.bumpForRolePermissionChange).toHaveBeenCalled();
  });
});
