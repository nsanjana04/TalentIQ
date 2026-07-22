import type { CopilotIntent } from "@/types/employee-intelligence";
import type { QueryEntities } from "./types";
import type { EmployeeIntelSnapshot } from "@/types/employee-intelligence";

const INTENT_PATTERNS: { intent: CopilotIntent; patterns: RegExp[] }[] = [
  {
    intent: "promotion_ready",
    patterns: [
      /promotion[- ]?ready/i,
      /eligible for promotion/i,
      /ready for (director|manager|lead|senior)/i,
      /who is promotion/i,
      /promotion in q\d/i,
    ],
  },
  {
    intent: "succession_planning",
    patterns: [
      /succession/i,
      /successor/i,
      /replace .+ manager/i,
      /who should replace/i,
      /bench strength/i,
    ],
  },
  {
    intent: "skill_gap_analysis",
    patterns: [
      /skill gap/i,
      /largest skill/i,
      /skill matrix/i,
      /missing .+ cert/i,
      /missing .+ certification/i,
      /missing aws/i,
      /underperforming skill/i,
    ],
  },
  {
    intent: "certification_risk",
    patterns: [
      /certif/i,
      /expire(s)? in (30|60|90)/i,
      /renewal/i,
      /expiring/i,
    ],
  },
  {
    intent: "compliance_risk",
    patterns: [
      /compliance/i,
      /not compliant/i,
      /non[- ]?compliant/i,
      /expired credential/i,
    ],
  },
  {
    intent: "learning_progress",
    patterns: [
      /learning/i,
      /training/i,
      /mandatory training/i,
      /leadership training/i,
      /course progress/i,
      /learning path/i,
      /falling behind/i,
      /completed aws/i,
      /aws 101/i,
      /who completed/i,
      /\bstuck\b/i,
      /most engaged/i,
      /learns fastest/i,
      /department learns/i,
      /certifications expire/i,
      /expire soon/i,
    ],
  },
  {
    intent: "attrition_risk",
    patterns: [
      /attrition/i,
      /not logged in/i,
      /inactive/i,
      /at risk/i,
      /most at risk/i,
    ],
  },
  {
    intent: "department_analysis",
    patterns: [
      /department/i,
      /compare .+ vs/i,
      /underperforming/i,
      /weakest team/i,
      /weakest teams/i,
      /engineering vs/i,
    ],
  },
  {
    intent: "employee_search",
    patterns: [
      /top \d+ performer/i,
      /bottom \d+ performer/i,
      /show top/i,
      /show bottom/i,
      /best performer/i,
      /worst performer/i,
    ],
  },
  {
    intent: "workforce_health",
    patterns: [/workforce health/i, /overall readiness/i, /organization health/i],
  },
];

export function classifyIntent(query: string): CopilotIntent {
  const q = query.trim();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(q))) return intent;
  }

  if (/manager/i.test(q) && (/coach|weak|team/i.test(q))) return "department_analysis";
  if (/gap/i.test(q)) return "skill_gap_analysis";
  if (/risk/i.test(q)) return "compliance_risk";
  if (/ready/i.test(q)) return "promotion_ready";
  if (/performer/i.test(q)) return "employee_search";

  return "workforce_health";
}

export function extractEntities(
  query: string,
  snapshots: EmployeeIntelSnapshot[]
): QueryEntities {
  const q = query.toLowerCase();
  const entities: QueryEntities = {};

  const departments = [
    ...new Map(
      snapshots
        .filter((s) => s.department)
        .map((s) => [s.department!.toLowerCase(), { name: s.department!, id: s.departmentId }])
    ).values(),
  ];
  for (const dept of departments) {
    if (q.includes(dept.name.toLowerCase())) {
      entities.department = dept.name;
      entities.departmentId = dept.id ?? undefined;
      break;
    }
  }

  const teams = [
    ...new Map(
      snapshots
        .filter((s) => s.team)
        .map((s) => [s.team!.toLowerCase(), { name: s.team!, id: s.teamId }])
    ).values(),
  ];
  for (const team of teams) {
    if (q.includes(team.name.toLowerCase())) {
      entities.team = team.name;
      entities.teamId = team.id ?? undefined;
    }
  }

  const certNames = new Set<string>();
  for (const s of snapshots) {
    for (const c of s.certifications) certNames.add(c.templateName);
  }
  for (const name of certNames) {
    if (q.includes(name.toLowerCase())) {
      entities.certification = name;
      break;
    }
  }
  if (!entities.certification) {
    const missing = query.match(/missing\s+([\w\s]+?)(?:\s+cert|\s+certification|$)/i);
    if (missing) entities.certification = missing[1].trim();
    else if (q.includes("aws")) entities.certification = "AWS";
  }

  const courseMatch = query.match(/completed\s+([\w\s\d]+?)(?:\?|$)/i);
  if (courseMatch) entities.course = courseMatch[1].trim();
  else if (q.includes("aws 101")) entities.course = "AWS 101";

  const skillNames = new Set<string>();
  for (const s of snapshots) {
    for (const sk of s.skillScores) skillNames.add(sk.skillName);
  }
  for (const name of skillNames) {
    if (q.includes(name.toLowerCase())) {
      entities.skill = name;
      break;
    }
  }

  const roleMatch = query.match(/ready for (\w+(?:\s+\w+)?)/i);
  if (roleMatch) entities.roleTitle = roleMatch[1];

  const replaceMatch = query.match(/replace\s+(.+?)\s+manager/i);
  if (replaceMatch) entities.managerRole = replaceMatch[1].trim();

  const compareMatch = query.match(/compare\s+(.+?)\s+vs\s+(.+?)(?:\?|$)/i);
  if (compareMatch) {
    entities.compareDepartments = [compareMatch[1].trim(), compareMatch[2].trim()];
  }

  const limitMatch = query.match(/(?:top|bottom)\s+(\d+)/i);
  if (limitMatch) {
    entities.limit = parseInt(limitMatch[1], 10);
    entities.sortAscending = /bottom/i.test(query);
  } else if (/top performer/i.test(q)) {
    entities.limit = 10;
    entities.sortAscending = false;
  } else if (/bottom performer/i.test(q)) {
    entities.limit = 10;
    entities.sortAscending = true;
  }

  const inactiveMatch = query.match(/not logged in for (\d+) days/i);
  entities.inactiveDays = inactiveMatch ? parseInt(inactiveMatch[1], 10) : q.includes("not logged in") ? 60 : undefined;

  return entities;
}
