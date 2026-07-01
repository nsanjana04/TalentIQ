import { AppError } from "@/lib/errors/app-error";
import { toSlug } from "@/lib/utils/slug";
import type {
  CreateDepartmentInput,
  CreateTeamInput,
  UpdateDepartmentInput,
  UpdateTeamInput,
} from "@/lib/validations/departments";
import { departmentRepository } from "@/repositories/department.repository";
import { auditService } from "@/services/audit.service";

function mapDepartment(dept: Awaited<ReturnType<typeof departmentRepository.findAllDetailed>>[number]) {
  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    description: dept.description,
    parent: dept.parent,
    userCount: dept._count.users,
    teamCount: dept._count.teams,
    teams: dept.teams.map((team) => ({
      id: team.id,
      name: team.name,
      code: team.code,
      description: team.description,
      memberCount: team._count.members,
      leader: team.leader
        ? { id: team.leader.id, name: `${team.leader.firstName} ${team.leader.lastName}` }
        : null,
    })),
  };
}

export const departmentService = {
  async list() {
    const departments = await departmentRepository.findAllDetailed();
    return departments.map(mapDepartment);
  },

  async create(input: CreateDepartmentInput, actorId: string) {
    const code = input.code?.trim() || toSlug(input.name).replace(/-/g, "_").toUpperCase();
    const existing = await departmentRepository.findByCode(code);
    if (existing) throw new AppError("CONFLICT", "Department code already exists");

    const dept = await departmentRepository.create({
      name: input.name.trim(),
      code,
      description: input.description?.trim(),
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });

    await auditService.log({
      action: "CREATE",
      entityType: "Department",
      entityId: dept.id,
      actorId,
      metadata: { name: dept.name, code: dept.code },
    });

    const detailed = await departmentRepository.findAllDetailed();
    return mapDepartment(detailed.find((d) => d.id === dept.id)!);
  },

  async update(id: string, input: UpdateDepartmentInput, actorId: string) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Department not found");

    if (input.code) {
      const taken = await departmentRepository.findByCode(input.code, id);
      if (taken) throw new AppError("CONFLICT", "Department code already exists");
    }

    await departmentRepository.update(id, {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.code !== undefined && { code: input.code.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.parentId !== undefined && {
        parent: input.parentId ? { connect: { id: input.parentId } } : { disconnect: true },
      }),
    });

    await auditService.log({
      action: "UPDATE",
      entityType: "Department",
      entityId: id,
      actorId,
      metadata: { fields: Object.keys(input) },
    });

    const detailed = await departmentRepository.findAllDetailed();
    return mapDepartment(detailed.find((d) => d.id === id)!);
  },

  async remove(id: string, actorId: string) {
    const detailed = await departmentRepository.findAllDetailed();
    const dept = detailed.find((d) => d.id === id);
    if (!dept) throw new AppError("NOT_FOUND", "Department not found");
    if (dept._count.users > 0) {
      throw new AppError("CONFLICT", "Cannot delete department with active users");
    }

    await departmentRepository.softDelete(id);
    await auditService.log({
      action: "DELETE",
      entityType: "Department",
      entityId: id,
      actorId,
      metadata: { name: dept.name },
    });
  },

  async createTeam(input: CreateTeamInput, actorId: string) {
    const dept = await departmentRepository.findById(input.departmentId);
    if (!dept) throw new AppError("NOT_FOUND", "Department not found");

    const code = input.code?.trim() || toSlug(input.name).replace(/-/g, "_").toUpperCase();
    const existing = await departmentRepository.findTeamByCode(code);
    if (existing) throw new AppError("CONFLICT", "Team code already exists");

    const team = await departmentRepository.createTeam({
      name: input.name.trim(),
      code,
      description: input.description?.trim(),
      department: { connect: { id: input.departmentId } },
      ...(input.leaderId ? { leader: { connect: { id: input.leaderId } } } : {}),
    });

    await auditService.log({
      action: "CREATE",
      entityType: "Team",
      entityId: team.id,
      actorId,
      metadata: { name: team.name, departmentId: input.departmentId },
    });

    const detailed = await departmentRepository.findAllDetailed();
    return mapDepartment(detailed.find((d) => d.id === input.departmentId)!);
  },

  async updateTeam(teamId: string, input: UpdateTeamInput, actorId: string) {
    const team = await departmentRepository.findTeamById(teamId);
    if (!team) throw new AppError("NOT_FOUND", "Team not found");

    if (input.code) {
      const taken = await departmentRepository.findTeamByCode(input.code, teamId);
      if (taken) throw new AppError("CONFLICT", "Team code already exists");
    }

    await departmentRepository.updateTeam(teamId, {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.code !== undefined && { code: input.code.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.leaderId !== undefined && {
        leader: input.leaderId ? { connect: { id: input.leaderId } } : { disconnect: true },
      }),
    });

    await auditService.log({
      action: "UPDATE",
      entityType: "Team",
      entityId: teamId,
      actorId,
      metadata: { fields: Object.keys(input) },
    });

    const detailed = await departmentRepository.findAllDetailed();
    return mapDepartment(detailed.find((d) => d.id === team.departmentId)!);
  },

  async removeTeam(teamId: string, actorId: string) {
    const team = await departmentRepository.findTeamById(teamId);
    if (!team) throw new AppError("NOT_FOUND", "Team not found");

    await departmentRepository.softDeleteTeam(teamId);
    await auditService.log({
      action: "DELETE",
      entityType: "Team",
      entityId: teamId,
      actorId,
      metadata: { name: team.name },
    });
  },
};
