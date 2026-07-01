/**
 * Fetch or resolve Udemy curricula for TalentIQ courses.
 *
 * Udemy blocks unauthenticated page scraping (HTTP 403). Strategies, in order:
 * 1. Udemy Affiliate API — set UDEMY_CLIENT_ID + UDEMY_CLIENT_SECRET in .env
 * 2. Bundled snapshots — constants/udemy-curricula/ (default fallback)
 * 3. Local JSON — data/udemy-curricula/{slug}.json via --from-data
 *
 * Usage:
 *   npm run fetch:udemy-curricula
 *   npm run fetch:udemy-curricula -- python-101
 *   npm run fetch:udemy-curricula -- --bundled-only
 *   npm run fetch:udemy-curricula -- --write
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { UDEMY_PROGRAMMING_COURSES } from "@/constants/udemy-programming-courses";
import {
  getBundledUdemyCurriculum,
  listBundledUdemyCurriculumSlugs,
} from "@/constants/udemy-curricula";
import { parseUdemyCourseSlug, parseUdemyPageCurriculum } from "@/lib/learning/udemy-curriculum-parser";
import { fetchUdemyCurriculumViaApi, getUdemyApiCredentials } from "@/lib/learning/udemy-api";
import type { UdemyCurriculum } from "@/types/udemy-curriculum";

config();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const DATA_DIR = join(process.cwd(), "data", "udemy-curricula");

function parseArgs(argv: string[]) {
  return {
    bundledOnly: argv.includes("--bundled-only"),
    write: argv.includes("--write"),
    fromData: argv.includes("--from-data"),
    slug: argv.find((arg) => !arg.startsWith("--") && !argv[argv.indexOf(arg) - 1]?.startsWith("--")),
  };
}

function loadCurriculumFromDataDir(slug: string): UdemyCurriculum | null {
  const filePath = join(DATA_DIR, `${slug}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as UdemyCurriculum;
  } catch {
    return null;
  }
}

async function fetchCurriculumFromPage(slug: string, url: string): Promise<UdemyCurriculum | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (Udemy blocks unauthenticated scraping — use API or bundled data)`);
  }

  const html = await response.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([2-3])[^>]*>(.*?)<\/h\1>/gi, (_, level, inner) => {
      const hashes = "#".repeat(Number(level) + 1);
      return `\n${hashes} ${inner.replace(/<[^>]+>/g, "").trim()}\n`;
    })
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const sections = parseUdemyPageCurriculum(text);
  if (!sections.length) return null;

  return {
    slug,
    sourceUrl: url,
    capturedAt: new Date().toISOString().slice(0, 10),
    sections,
  };
}

async function resolveCurriculum(
  slug: string,
  url: string,
  options: { bundledOnly: boolean; fromData: boolean }
): Promise<{ curriculum: UdemyCurriculum | null; source: string }> {
  if (options.fromData) {
    const fromFile = loadCurriculumFromDataDir(slug);
    if (fromFile) return { curriculum: fromFile, source: "data-file" };
  }

  if (options.bundledOnly) {
    const bundled = getBundledUdemyCurriculum(slug);
    return { curriculum: bundled, source: bundled ? "bundled" : "none" };
  }

  const credentials = getUdemyApiCredentials();
  const udemySlug = parseUdemyCourseSlug(url);

  if (credentials && udemySlug) {
    try {
      const curriculum = await fetchUdemyCurriculumViaApi(slug, udemySlug, url, credentials);
      return { curriculum, source: "udemy-api" };
    } catch (error) {
      console.warn(
        `  ⚠ Udemy API failed for ${slug}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    const fromPage = await fetchCurriculumFromPage(slug, url);
    if (fromPage) return { curriculum: fromPage, source: "page-scrape" };
  } catch (error) {
    console.warn(
      `  ⚠ Page fetch failed for ${slug}:`,
      error instanceof Error ? error.message : error
    );
  }

  const bundled = getBundledUdemyCurriculum(slug);
  if (bundled) {
    return { curriculum: bundled, source: "bundled-fallback" };
  }

  return { curriculum: null, source: "none" };
}

function writeCurriculumFiles(output: Record<string, UdemyCurriculum>) {
  mkdirSync(DATA_DIR, { recursive: true });
  for (const [slug, curriculum] of Object.entries(output)) {
    const filePath = join(DATA_DIR, `${slug}.json`);
    writeFileSync(filePath, `${JSON.stringify(curriculum, null, 2)}\n`, "utf-8");
    console.log(`  → wrote ${filePath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const credentials = getUdemyApiCredentials();

  console.log("Udemy curriculum fetch\n");
  if (!credentials && !args.bundledOnly) {
    console.log(
      "Note: Udemy returns HTTP 403 for unauthenticated scraping.\n" +
        "  • Set UDEMY_CLIENT_ID + UDEMY_CLIENT_SECRET in .env (https://www.udemy.com/user/edit-api-clients/)\n" +
        "  • Or use --bundled-only to export bundled snapshots (no network)\n" +
        "  • Or place JSON files in data/udemy-curricula/{slug}.json\n"
    );
  } else if (credentials) {
    console.log("Using Udemy Affiliate API credentials from .env\n");
  }

  const courses = args.slug
    ? UDEMY_PROGRAMMING_COURSES.filter((c) => c.slug === args.slug)
    : UDEMY_PROGRAMMING_COURSES;

  if (args.slug && !courses.length) {
    console.error(`Unknown slug: ${args.slug}`);
    console.error(`Available: ${listBundledUdemyCurriculumSlugs().join(", ")}`);
    process.exit(1);
  }

  const output: Record<string, UdemyCurriculum> = {};
  const summary: { slug: string; source: string; sections: number }[] = [];

  for (const course of courses) {
    console.log(`Resolving ${course.slug}...`);
    const { curriculum, source } = await resolveCurriculum(course.slug, course.url, {
      bundledOnly: args.bundledOnly,
      fromData: args.fromData,
    });

    if (curriculum) {
      output[course.slug] = curriculum;
      summary.push({
        slug: course.slug,
        source,
        sections: curriculum.sections.length,
      });
      console.log(`  ✓ ${course.slug}: ${curriculum.sections.length} sections (${source})`);
    } else {
      console.log(`  ✗ ${course.slug}: no curriculum available`);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  if (args.write && Object.keys(output).length) {
    console.log("\nWriting data files...");
    writeCurriculumFiles(output);
  }

  console.log("\n── Summary ──");
  for (const row of summary) {
    console.log(`  ${row.slug}: ${row.sections} sections [${row.source}]`);
  }
  console.log(`\nTotal: ${summary.length} / ${courses.length} courses`);

  if (!summary.length) {
    process.exit(1);
  }

  console.log("\nJSON output:");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
