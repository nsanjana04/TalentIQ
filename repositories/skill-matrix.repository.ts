import { prisma } from "@/lib/db/prisma";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";
import type {
  CellStatus,
  GapAnalysis,
  GapItem,
  MatrixCell,
  MatrixColumn,
  MatrixRow,
  MatrixView,
  ReadinessItem,
  ReadinessScores,
  SkillMatrixData,
} from "@/types/skill-matrix";

const notDeleted = { deletedAt: null };

function cellStatus(actual: number | null, required: number | null): CellStatus {
  if (required == null) return actual != null ? "exceeds" : "na";
  if (actual == null) return "missing";
  if (actual >= required) return actual > required ? "exceeds" : "met";
  if (actual >= required - 1) return "partial";
  return "missing";
}

function scoreFromRanks(actual: number | null, required: number | null, maxRank = 4): number {
  if (required == null) return actual != null ? Math.round((actual / maxRank) * 100) : 0;
  if (actual == null) return 0;
  return Math.min(100, Math.round((actual / required) * 100));
}

function gapSeverity(gap: number): GapItem["severity"] {
  if (gap <= -2) return "critical";
  if (gap <= -1) return "moderate";
  return "minor";
}

interface MatrixFilters {
  departmentId?: string;
  teamId?: string;
  jobRoleId?: string;
  categoryId?: string;
  skillIds?: string[];
}

async function loadSkills(filters: MatrixFilters) {
  return prisma.skill.findMany({
    where: {
      ...notDeleted,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.skillIds?.length && { id: { in: filters.skillIds } }),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

async function loadUsers(scope: DashboardScope, filters: MatrixFilters) {
  const baseWhere = buildUserWhere(scope);
  return prisma.user.findMany({
    where: {
      ...baseWhere,
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.teamId && { teamId: filters.teamId }),
      ...(filters.jobRoleId && { jobRoleId: filters.jobRoleId }),
    },
    include: {
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      jobRole: { select: { id: true, title: true } },
      experienceLevel: { select: { id: true, name: true } },
      employeeSkills: {
        where: notDeleted,
        include: { skill: true, skillLevel: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

function getRequiredRank(
  user: {
    jobRoleId: string | null;
    experienceLevelId: string | null;
    jobRole: {
      skillRequirements: {
        skillId: string;
        requiredSkillLevel: { rank: number; name: string };
      }[];
    } | null;
  },
  skillId: string
): { rank: number; name: string } | null {
  if (!user.jobRoleId || !user.experienceLevelId || !user.jobRole) return null;
  const req = user.jobRole.skillRequirements.find((r) => r.skillId === skillId);
  return req ? { rank: req.requiredSkillLevel.rank, name: req.requiredSkillLevel.name } : null;
}

async function enrichUsersWithRequirements(
  users: Awaited<ReturnType<typeof loadUsers>>
) {
  const jobRoleIds = [...new Set(users.map((u) => u.jobRoleId).filter(Boolean))] as string[];
  const requirements = await prisma.roleSkillRequirement.findMany({
    where: { jobRoleId: { in: jobRoleIds }, ...notDeleted, isMandatory: true },
    include: { requiredSkillLevel: true },
  });

  const reqByRole = new Map<string, typeof requirements>();
  for (const r of requirements) {
    const list = reqByRole.get(r.jobRoleId) ?? [];
    list.push(r);
    reqByRole.set(r.jobRoleId, list);
  }

  return users.map((u) => ({
    ...u,
    jobRole: u.jobRole
      ? {
          ...u.jobRole,
          skillRequirements: (reqByRole.get(u.jobRoleId!) ?? []).filter(
            (r) => r.experienceLevelId === u.experienceLevelId
          ),
        }
      : null,
  }));
}

function buildCell(
  actual: { rank: number; name: string; verified: boolean } | null,
  required: { rank: number; name: string } | null
): MatrixCell {
  const actualRank = actual?.rank ?? null;
  const requiredRank = required?.rank ?? null;
  const gap = actualRank != null && requiredRank != null ? actualRank - requiredRank : actualRank != null ? 0 : requiredRank != null ? -requiredRank : 0;
  return {
    actualRank,
    requiredRank,
    actualLabel: actual?.name ?? null,
    requiredLabel: required?.name ?? null,
    gap,
    score: scoreFromRanks(actualRank, requiredRank),
    status: cellStatus(actualRank, requiredRank),
    verified: actual?.verified ?? false,
  };
}

function computeSummary(
  rows: MatrixRow[],
  columns: MatrixColumn[],
  cells: Record<string, Record<string, MatrixCell>>
) {
  let totalScore = 0;
  let count = 0;
  let gapsCount = 0;

  for (const row of rows) {
    for (const col of columns) {
      const cell = cells[row.id]?.[col.id];
      if (!cell || cell.status === "na") continue;
      totalScore += cell.score;
      count++;
      if (cell.status === "missing" || cell.status === "partial") gapsCount++;
    }
  }

  return {
    totalRows: rows.length,
    totalColumns: columns.length,
    avgReadiness: count > 0 ? Math.round(totalScore / count) : 0,
    gapsCount,
  };
}

export const skillMatrixRepository = {
  async getFilters() {
    const [departments, teams, jobRoles, categories, skills] = await Promise.all([
      prisma.department.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.team.findMany({ where: notDeleted, select: { id: true, name: true, departmentId: true }, orderBy: { name: "asc" } }),
      prisma.jobRole.findMany({ where: notDeleted, select: { id: true, title: true }, orderBy: { title: "asc" } }),
      prisma.skillCategory.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.skill.findMany({ where: notDeleted, select: { id: true, name: true, categoryId: true }, orderBy: { name: "asc" } }),
    ]);
    return { departments, teams, jobRoles, categories, skills };
  },

  async getEmployeeMatrix(
    scope: DashboardScope,
    filters: MatrixFilters,
    view: MatrixView = "employee"
  ): Promise<SkillMatrixData> {
    const skills = await loadSkills(filters);
    const rawUsers = await loadUsers(scope, filters);
    const users = await enrichUsersWithRequirements(rawUsers);

    const columns: MatrixColumn[] = skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category.name,
    }));

    const rows: MatrixRow[] = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      subtitle: [u.jobRole?.title, u.department?.name].filter(Boolean).join(" · "),
    }));

    const cells: Record<string, Record<string, MatrixCell>> = {};
    const readinessByRow: Record<string, { met: number; total: number }> = {};

    for (const user of users) {
      cells[user.id] = {};
      let met = 0;
      let total = 0;
      const skillMap = new Map(
        user.employeeSkills.map((es) => [
          es.skillId,
          { rank: es.skillLevel.rank, name: es.skillLevel.name, verified: !!es.verifiedAt },
        ])
      );

      for (const skill of skills) {
        const actual = skillMap.get(skill.id) ?? null;
        const required = getRequiredRank(user, skill.id);
        if (required) {
          total++;
          if (actual && actual.rank >= required.rank) met++;
        }
        cells[user.id][skill.id] = buildCell(actual, required);
      }

      readinessByRow[user.id] = { met, total };
    }

    for (const row of rows) {
      const r = readinessByRow[row.id];
      row.readinessScore = r.total > 0 ? Math.round((r.met / r.total) * 100) : undefined;
    }

    return {
      view: view === "heatmap" ? "heatmap" : "employee",
      scopeLabel: scope.label,
      rows,
      columns,
      cells,
      summary: computeSummary(rows, columns, cells),
    };
  },

  async getDepartmentMatrix(scope: DashboardScope, filters: MatrixFilters): Promise<SkillMatrixData> {
    const skills = await loadSkills(filters);
    const rawUsers = await loadUsers(scope, filters);
    const users = await enrichUsersWithRequirements(rawUsers);

    const deptMap = new Map<string, { name: string; users: typeof users }>();
    for (const u of users) {
      if (!u.departmentId || !u.department) continue;
      const existing = deptMap.get(u.departmentId) ?? { name: u.department.name, users: [] };
      existing.users.push(u);
      deptMap.set(u.departmentId, existing);
    }

    const columns = skills.map((s) => ({ id: s.id, name: s.name, category: s.category.name }));
    const rows: MatrixRow[] = [];
    const cells: Record<string, Record<string, MatrixCell>> = {};

    for (const [deptId, dept] of deptMap) {
      rows.push({ id: deptId, name: dept.name, subtitle: `${dept.users.length} employees` });
      cells[deptId] = {};

      for (const skill of skills) {
        const actuals: number[] = [];
        const requireds: number[] = [];
        for (const u of dept.users) {
          const es = u.employeeSkills.find((e) => e.skillId === skill.id);
          if (es) actuals.push(es.skillLevel.rank);
          const req = getRequiredRank(u, skill.id);
          if (req) requireds.push(req.rank);
        }
        const avgActual = actuals.length ? Math.round(actuals.reduce((a, b) => a + b, 0) / actuals.length) : null;
        const avgRequired = requireds.length ? Math.round(requireds.reduce((a, b) => a + b, 0) / requireds.length) : null;
        cells[deptId][skill.id] = buildCell(
          avgActual != null ? { rank: avgActual, name: `L${avgActual}`, verified: false } : null,
          avgRequired != null ? { rank: avgRequired, name: `L${avgRequired}` } : null
        );
      }

      const scores = Object.values(cells[deptId]).filter((c) => c.status !== "na").map((c) => c.score);
      rows[rows.length - 1].readinessScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
    }

    return { view: "department", scopeLabel: scope.label, rows, columns, cells, summary: computeSummary(rows, columns, cells) };
  },

  async getTeamMatrix(scope: DashboardScope, filters: MatrixFilters): Promise<SkillMatrixData> {
    const skills = await loadSkills(filters);
    const rawUsers = await loadUsers(scope, filters);
    const users = await enrichUsersWithRequirements(rawUsers);

    const teamMap = new Map<string, { name: string; users: typeof users }>();
    for (const u of users) {
      if (!u.teamId || !u.team) continue;
      const existing = teamMap.get(u.teamId) ?? { name: u.team.name, users: [] };
      existing.users.push(u);
      teamMap.set(u.teamId, existing);
    }

    const columns = skills.map((s) => ({ id: s.id, name: s.name, category: s.category.name }));
    const rows: MatrixRow[] = [];
    const cells: Record<string, Record<string, MatrixCell>> = {};

    for (const [teamId, team] of teamMap) {
      rows.push({ id: teamId, name: team.name, subtitle: `${team.users.length} members` });
      cells[teamId] = {};

      for (const skill of skills) {
        const actuals: number[] = [];
        const requireds: number[] = [];
        for (const u of team.users) {
          const es = u.employeeSkills.find((e) => e.skillId === skill.id);
          if (es) actuals.push(es.skillLevel.rank);
          const req = getRequiredRank(u, skill.id);
          if (req) requireds.push(req.rank);
        }
        const avgActual = actuals.length ? Math.round(actuals.reduce((a, b) => a + b, 0) / actuals.length) : null;
        const avgRequired = requireds.length ? Math.round(requireds.reduce((a, b) => a + b, 0) / requireds.length) : null;
        cells[teamId][skill.id] = buildCell(
          avgActual != null ? { rank: avgActual, name: `L${avgActual}`, verified: false } : null,
          avgRequired != null ? { rank: avgRequired, name: `L${avgRequired}` } : null
        );
      }

      const scores = Object.values(cells[teamId]).filter((c) => c.status !== "na").map((c) => c.score);
      rows[rows.length - 1].readinessScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
    }

    return { view: "team", scopeLabel: scope.label, rows, columns, cells, summary: computeSummary(rows, columns, cells) };
  },

  async getRoleMatrix(scope: DashboardScope, filters: MatrixFilters): Promise<SkillMatrixData> {
    const skills = await loadSkills(filters);
    const requirements = await prisma.roleSkillRequirement.findMany({
      where: {
        ...notDeleted,
        isMandatory: true,
        ...(filters.jobRoleId && { jobRoleId: filters.jobRoleId }),
      },
      include: {
        jobRole: true,
        experienceLevel: true,
        requiredSkillLevel: true,
      },
    });

    const roleKeys = new Map<string, { jobRoleId: string; expId: string; title: string; expName: string }>();
    for (const r of requirements) {
      const key = `${r.jobRoleId}:${r.experienceLevelId}`;
      roleKeys.set(key, {
        jobRoleId: r.jobRoleId,
        expId: r.experienceLevelId,
        title: r.jobRole.title,
        expName: r.experienceLevel.name,
      });
    }

    const rawUsers = await loadUsers(scope, filters);
    const users = await enrichUsersWithRequirements(rawUsers);

    const columns = skills.map((s) => ({ id: s.id, name: s.name, category: s.category.name }));
    const rows: MatrixRow[] = [];
    const cells: Record<string, Record<string, MatrixCell>> = {};

    for (const [key, role] of roleKeys) {
      const roleUsers = users.filter(
        (u) => u.jobRoleId === role.jobRoleId && u.experienceLevelId === role.expId
      );
      rows.push({
        id: key,
        name: role.title,
        subtitle: `${role.expName} · ${roleUsers.length} employees`,
      });
      cells[key] = {};

      for (const skill of skills) {
        const req = requirements.find(
          (r) =>
            r.jobRoleId === role.jobRoleId &&
            r.experienceLevelId === role.expId &&
            r.skillId === skill.id
        );
        const required = req
          ? { rank: req.requiredSkillLevel.rank, name: req.requiredSkillLevel.name }
          : null;

        const actuals = roleUsers
          .map((u) => u.employeeSkills.find((e) => e.skillId === skill.id))
          .filter(Boolean);
        const avgActual =
          actuals.length > 0
            ? Math.round(actuals.reduce((s, e) => s + e!.skillLevel.rank, 0) / actuals.length)
            : null;

        cells[key][skill.id] = buildCell(
          avgActual != null ? { rank: avgActual, name: `L${avgActual}`, verified: false } : null,
          required
        );
      }

      const scores = Object.values(cells[key]).filter((c) => c.status !== "na").map((c) => c.score);
      rows[rows.length - 1].readinessScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
    }

    return { view: "role", scopeLabel: scope.label, rows, columns, cells, summary: computeSummary(rows, columns, cells) };
  },

  async getGapAnalysis(scope: DashboardScope, filters: MatrixFilters, view: MatrixView): Promise<GapAnalysis> {
    let matrix: SkillMatrixData;
    switch (view) {
      case "department":
        matrix = await this.getDepartmentMatrix(scope, filters);
        break;
      case "team":
        matrix = await this.getTeamMatrix(scope, filters);
        break;
      case "role":
        matrix = await this.getRoleMatrix(scope, filters);
        break;
      default:
        matrix = await this.getEmployeeMatrix(scope, filters, view);
    }

    const items: GapItem[] = [];
    const skillGapCounts = new Map<string, number>();

    for (const row of matrix.rows) {
      for (const col of matrix.columns) {
        const cell = matrix.cells[row.id]?.[col.id];
        if (!cell || cell.status === "met" || cell.status === "exceeds" || cell.status === "na") continue;
        if (cell.requiredRank == null) continue;

        items.push({
          id: `${row.id}:${col.id}`,
          entityType: matrix.view === "heatmap" ? "employee" : matrix.view,
          entityId: row.id,
          entityName: row.name,
          skillId: col.id,
          skillName: col.name,
          requiredLevel: cell.requiredLabel ?? `L${cell.requiredRank}`,
          actualLevel: cell.actualLabel,
          gapPoints: cell.gap,
          severity: gapSeverity(cell.gap),
        });

        skillGapCounts.set(col.name, (skillGapCounts.get(col.name) ?? 0) + 1);
      }
    }

    items.sort((a, b) => a.gapPoints - b.gapPoints);

    return {
      items: items.slice(0, 50),
      bySeverity: {
        critical: items.filter((i) => i.severity === "critical").length,
        moderate: items.filter((i) => i.severity === "moderate").length,
        minor: items.filter((i) => i.severity === "minor").length,
      },
      topGaps: [...skillGapCounts.entries()]
        .map(([skillName, count]) => ({ skillName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    };
  },

  async getReadinessScores(scope: DashboardScope, filters: MatrixFilters, view: MatrixView): Promise<ReadinessScores> {
    let matrix: SkillMatrixData;
    switch (view) {
      case "department":
        matrix = await this.getDepartmentMatrix(scope, filters);
        break;
      case "team":
        matrix = await this.getTeamMatrix(scope, filters);
        break;
      case "role":
        matrix = await this.getRoleMatrix(scope, filters);
        break;
      default:
        matrix = await this.getEmployeeMatrix(scope, filters, view);
    }

    const items: ReadinessItem[] = matrix.rows.map((row) => {
      let met = 0;
      let required = 0;
      for (const col of matrix.columns) {
        const cell = matrix.cells[row.id]?.[col.id];
        if (!cell || cell.requiredRank == null) continue;
        required++;
        if (cell.actualRank != null && cell.actualRank >= cell.requiredRank) met++;
      }
      return {
        id: row.id,
        name: row.name,
        type: matrix.view === "heatmap" ? "employee" : matrix.view,
        score: row.readinessScore ?? (required > 0 ? Math.round((met / required) * 100) : 0),
        skillsMet: met,
        skillsRequired: required,
      };
    });

    items.sort((a, b) => b.score - a.score);

    const overall =
      items.length > 0 ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0;

    const buckets = [
      { label: "Ready (80%+)", min: 80, fill: "oklch(55% 0.15 145)" },
      { label: "Developing (50-79%)", min: 50, fill: "oklch(45% 0.2 264)" },
      { label: "At Risk (<50%)", min: 0, fill: "oklch(55% 0.22 25)" },
    ];

    const distribution = buckets.map((b, i) => {
      const nextMin = buckets[i - 1]?.min ?? 101;
      const count = items.filter((item) => item.score >= b.min && item.score < nextMin).length;
      return { label: b.label, count, fill: b.fill };
    });

    return { overall, items, distribution };
  },
};
