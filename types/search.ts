export type SearchResultCategory =
  | "employees"
  | "departments"
  | "courses"
  | "certifications"
  | "skills"
  | "assessments"
  | "reports";

export interface SearchResultItem {
  id: string;
  category: SearchResultCategory;
  title: string;
  subtitle: string | null;
  href: string;
  meta?: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  groups: {
    category: SearchResultCategory;
    label: string;
    items: SearchResultItem[];
  }[];
}

export const SEARCH_CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  employees: "Employees",
  departments: "Departments",
  courses: "Courses",
  certifications: "Certifications",
  skills: "Skills",
  assessments: "Assessments",
  reports: "Reports",
};
