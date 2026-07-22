import type { UdemyCurriculum } from "@/types/udemy-curriculum";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PYTHON_UDEMY_CURRICULA } from "./python";
import { ROADMAP_UDEMY_CURRICULA } from "./roadmap";

const DATA_DIR = join(process.cwd(), "data", "udemy-curricula");

const ALL_CURRICULA: Record<string, UdemyCurriculum> = {
  ...PYTHON_UDEMY_CURRICULA,
  ...ROADMAP_UDEMY_CURRICULA,
};

function loadDataFileCurriculum(slug: string): UdemyCurriculum | null {
  const filePath = join(DATA_DIR, `${slug}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as UdemyCurriculum;
  } catch {
    return null;
  }
}

export function getBundledUdemyCurriculum(slug: string): UdemyCurriculum | null {
  return loadDataFileCurriculum(slug) ?? ALL_CURRICULA[slug] ?? null;
}

export function listBundledUdemyCurriculumSlugs(): string[] {
  return Object.keys(ALL_CURRICULA);
}

export function getAllBundledUdemyCurricula(): UdemyCurriculum[] {
  return Object.values(ALL_CURRICULA);
}
