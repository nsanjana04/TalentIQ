import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

const active = { deletedAt: null };

export const departmentRepository = {
  async findAll() {
    return prisma.department.findMany({
      where: active,
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.department.findFirst({
      where: { id, ...active },
      select: { id: true, name: true, code: true },
    });
  },

  async findAllDetailed() {
    return prisma.department.findMany({
      where: active,
      include: {
        parent: { select: { id: true, name: true, code: true } },
        teams: {
          where: active,
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            leader: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { members: { where: { isActive: true, ...active } } } },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            users: { where: { isActive: true, ...active } },
            teams: { where: active },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findByCode(code: string, excludeId?: string) {
    return prisma.department.findFirst({
      where: {
        code,
        ...active,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  async create(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({ data });
  },

  async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return prisma.department.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async findTeamById(id: string) {
    return prisma.team.findFirst({
      where: { id, ...active },
      include: { department: { select: { id: true, name: true } } },
    });
  },

  async findTeamByCode(code: string, excludeId?: string) {
    return prisma.team.findFirst({
      where: {
        code,
        ...active,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  async createTeam(data: Prisma.TeamCreateInput) {
    return prisma.team.create({ data });
  },

  async updateTeam(id: string, data: Prisma.TeamUpdateInput) {
    return prisma.team.update({ where: { id }, data });
  },

  async softDeleteTeam(id: string) {
    return prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
