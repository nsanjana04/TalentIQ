import { describe, expect, it } from "vitest";
import { buildUserSearchWhere } from "@/lib/users/search-filter";

describe("buildUserSearchWhere", () => {
  it("returns empty object for blank search", () => {
    expect(buildUserSearchWhere("")).toEqual({});
    expect(buildUserSearchWhere("   ")).toEqual({});
  });

  it("includes first name, last name, and email conditions", () => {
    const where = buildUserSearchWhere("Paul");
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: "Paul", mode: "insensitive" } },
        { lastName: { contains: "Paul", mode: "insensitive" } },
        { email: { contains: "Paul", mode: "insensitive" } },
      ])
    );
  });

  it("matches full name across first and last name tokens", () => {
    const where = buildUserSearchWhere("Paul Adebayo");
    expect(where.OR).toEqual(
      expect.arrayContaining([
        {
          AND: [
            { firstName: { contains: "Paul", mode: "insensitive" } },
            { lastName: { contains: "Adebayo", mode: "insensitive" } },
          ],
        },
      ])
    );
  });

  it("matches department name", () => {
    const where = buildUserSearchWhere("Engineering");
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { department: { name: { contains: "Engineering", mode: "insensitive" } } },
      ])
    );
  });

  it("matches email local part style queries", () => {
    const where = buildUserSearchWhere("paul.adebayo");
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { email: { contains: "paul.adebayo", mode: "insensitive" } },
      ])
    );
  });
});
