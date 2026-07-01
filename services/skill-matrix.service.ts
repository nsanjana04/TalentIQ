import type { RoleSlug } from "@/constants/role-slugs";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import {
  exportMatrixCsv,
  exportMatrixPdf,
  exportMatrixXlsx,
} from "@/lib/exports/skill-matrix-export";
import type { ExportFormat, MatrixView } from "@/types/skill-matrix";
import type { MatrixQuery } from "@/lib/validations/skill-matrix";
import { skillMatrixRepository } from "@/repositories/skill-matrix.repository";
import { auditService } from "@/services/audit.service";

function parseFilters(query: MatrixQuery) {
  return {
    departmentId: query.departmentId,
    teamId: query.teamId,
    jobRoleId: query.jobRoleId,
    categoryId: query.categoryId,
    skillIds: query.skillIds?.split(",").filter(Boolean),
  };
}

export const skillMatrixService = {
  async getMatrix(userId: string, role: RoleSlug, query: MatrixQuery) {
    const scope = await resolveDashboardScope(userId, role);
    const filters = parseFilters(query);

    switch (query.view) {
      case "department":
        return skillMatrixRepository.getDepartmentMatrix(scope, filters);
      case "team":
        return skillMatrixRepository.getTeamMatrix(scope, filters);
      case "role":
        return skillMatrixRepository.getRoleMatrix(scope, filters);
      case "heatmap":
        return skillMatrixRepository.getEmployeeMatrix(scope, filters, "heatmap");
      default:
        return skillMatrixRepository.getEmployeeMatrix(scope, filters, "employee");
    }
  },

  async getGaps(userId: string, role: RoleSlug, query: MatrixQuery) {
    const scope = await resolveDashboardScope(userId, role);
    const filters = parseFilters(query);
    return skillMatrixRepository.getGapAnalysis(scope, filters, query.view);
  },

  async getReadiness(userId: string, role: RoleSlug, query: MatrixQuery) {
    const scope = await resolveDashboardScope(userId, role);
    const filters = parseFilters(query);
    return skillMatrixRepository.getReadinessScores(scope, filters, query.view);
  },

  getFilters: () => skillMatrixRepository.getFilters(),

  async export(
    userId: string,
    role: RoleSlug,
    query: MatrixQuery & { format: ExportFormat }
  ) {
    const matrix = await this.getMatrix(userId, role, query);

    await auditService.log({
      action: "EXPORT",
      entityType: "SkillMatrix",
      actorId: userId,
      metadata: { format: query.format, view: query.view },
    });

    const filename = `skill-matrix-${query.view}-${new Date().toISOString().slice(0, 10)}`;

    switch (query.format) {
      case "csv": {
        const content = exportMatrixCsv(matrix);
        return {
          buffer: Buffer.from(content, "utf-8"),
          contentType: "text/csv",
          filename: `${filename}.csv`,
        };
      }
      case "xlsx": {
        const buffer = await exportMatrixXlsx(matrix);
        return {
          buffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          filename: `${filename}.xlsx`,
        };
      }
      case "pdf": {
        const buffer = exportMatrixPdf(matrix);
        return {
          buffer,
          contentType: "application/pdf",
          filename: `${filename}.pdf`,
        };
      }
    }
  },
};
