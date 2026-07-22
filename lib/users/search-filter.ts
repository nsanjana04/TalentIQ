import type { Prisma } from "@prisma/client";

/**
 * Builds a Prisma where clause for user list search.
 * Supports first name, last name, full name (multi-token), email, department, and team.
 */
export function buildUserSearchWhere(search: string): Prisma.UserWhereInput {
  const term = search.trim();
  if (!term) return {};

  const insensitive = { contains: term, mode: "insensitive" as const };
  const tokens = term.split(/\s+/).filter(Boolean);

  const orConditions: Prisma.UserWhereInput[] = [
    { firstName: insensitive },
    { lastName: insensitive },
    { email: insensitive },
    { department: { name: insensitive } },
    { department: { code: insensitive } },
    { team: { name: insensitive } },
    { team: { code: insensitive } },
  ];

  if (tokens.length >= 2) {
    const [first, ...rest] = tokens;
    const last = rest.join(" ");

    orConditions.push({
      AND: [
        { firstName: { contains: first, mode: "insensitive" } },
        { lastName: { contains: last, mode: "insensitive" } },
      ],
    });

    orConditions.push({
      AND: [
        { firstName: { contains: last, mode: "insensitive" } },
        { lastName: { contains: first, mode: "insensitive" } },
      ],
    });
  }

  const emailLocal = term.includes("@") ? term.split("@")[0] : term.replace(/\s+/g, ".");
  if (emailLocal && emailLocal !== term) {
    orConditions.push({ email: { contains: emailLocal, mode: "insensitive" } });
  }

  return { OR: orConditions };
}
