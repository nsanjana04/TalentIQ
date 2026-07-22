import { ROUTES } from "@/constants/routes";

/** Admin must always assign Course + Level + Audience + Due Date — never a generic course alone. */
export const ASSIGNMENT_POLICY = {
  title: "Assignment rule",
  description:
    "Every assignment must include a course, a specific level, an audience, and a due date. Generic course-only assignments are not allowed.",
  example: "Cyber Security Fundamentals + Basic + Engineering Department + Due Date",
  audienceTypes: [
    { type: "USER", label: "One user", description: "Assign one course level to a single user" },
    { type: "DEPARTMENT", label: "Department", description: "Assign one course level to an entire department" },
    { type: "TEAM", label: "Team", description: "Assign one course level to a team" },
    { type: "ROLE", label: "Role", description: "Assign one course level to all users with a role" },
    { type: "ORGANIZATION", label: "Organization", description: "Assign one course level to the entire organization" },
  ] as const,
  wizardPath: "/dashboard",
};

