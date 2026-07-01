import type { UdemyCurriculum, UdemyCurriculumSection } from "@/types/udemy-curriculum";

const API_ROOT = "https://www.udemy.com/api-2.0/";

export interface UdemyApiCredentials {
  clientId: string;
  clientSecret: string;
}

export function getUdemyApiCredentials(): UdemyApiCredentials | null {
  const clientId = process.env.UDEMY_CLIENT_ID?.trim();
  const clientSecret = process.env.UDEMY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function basicAuthHeader(credentials: UdemyApiCredentials): string {
  const token = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  return `Basic ${token}`;
}

async function udemyApiGet<T>(path: string, credentials: UdemyApiCredentials): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: basicAuthHeader(credentials),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Udemy API HTTP ${response.status} for ${url}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  return response.json() as Promise<T>;
}

interface UdemyCourseDetail {
  id: number;
  title: string;
  url?: string;
}

interface UdemyCurriculumItem {
  _class: string;
  id: number;
  title: string;
  object_index?: number;
  asset?: {
    time_estimation?: number;
  } | null;
}

interface UdemyPagedResults<T> {
  count: number;
  next: string | null;
  results: T[];
}

export async function resolveUdemyCourseId(
  udemyCourseSlug: string,
  credentials: UdemyApiCredentials
): Promise<number> {
  const detail = await udemyApiGet<UdemyCourseDetail>(
    `courses/${encodeURIComponent(udemyCourseSlug)}/?fields[course]=id,title`,
    credentials
  );
  if (!detail?.id) {
    throw new Error(`Course not found on Udemy: ${udemyCourseSlug}`);
  }
  return detail.id;
}

export async function fetchUdemyPublicCurriculumItems(
  courseId: number,
  credentials: UdemyApiCredentials
): Promise<UdemyCurriculumItem[]> {
  const items: UdemyCurriculumItem[] = [];
  let nextUrl: string | null =
    `courses/${courseId}/public-curriculum-items/?page_size=100&fields[asset]=time_estimation`;

  while (nextUrl) {
    const currentUrl = nextUrl;
    const pageData: UdemyPagedResults<UdemyCurriculumItem> = await udemyApiGet(
      currentUrl,
      credentials
    );
    items.push(...pageData.results);
    nextUrl = pageData.next;
  }

  return items.sort((a, b) => (a.object_index ?? 0) - (b.object_index ?? 0));
}

export function mapUdemyCurriculumItemsToSections(
  items: UdemyCurriculumItem[]
): UdemyCurriculumSection[] {
  const sections: UdemyCurriculumSection[] = [];
  let current: UdemyCurriculumSection | null = null;

  for (const item of items) {
    const itemClass = item._class?.toLowerCase() ?? "";

    if (itemClass === "chapter") {
      current = { title: item.title.trim(), lectures: [] };
      sections.push(current);
      continue;
    }

    if (itemClass === "lecture" || itemClass === "quiz" || itemClass === "practice") {
      if (!current) {
        current = { title: "Course content", lectures: [] };
        sections.push(current);
      }
      const seconds = item.asset?.time_estimation;
      current.lectures.push({
        title: item.title.trim(),
        durationMinutes: seconds ? Math.max(1, Math.round(seconds / 60)) : undefined,
      });
    }
  }

  return sections
    .map((section) => ({
      ...section,
      lectures:
        section.lectures.length > 0
          ? section.lectures
          : [{ title: `Complete all lectures in "${section.title}" on Udemy` }],
    }))
    .filter((section) => section.title.length > 0);
}

export async function fetchUdemyCurriculumViaApi(
  talentIqSlug: string,
  udemyCourseSlug: string,
  sourceUrl: string,
  credentials: UdemyApiCredentials
): Promise<UdemyCurriculum> {
  const courseId = await resolveUdemyCourseId(udemyCourseSlug, credentials);
  const items = await fetchUdemyPublicCurriculumItems(courseId, credentials);
  const sections = mapUdemyCurriculumItemsToSections(items);

  if (!sections.length) {
    throw new Error(`No curriculum sections returned for Udemy course ${udemyCourseSlug}`);
  }

  return {
    slug: talentIqSlug,
    sourceUrl,
    capturedAt: new Date().toISOString().slice(0, 10),
    sections,
  };
}
