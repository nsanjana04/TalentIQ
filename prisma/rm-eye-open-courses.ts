import type { LearningResourceType, OpenCourseCategory } from "../types/learning-content";

export interface RmEyeOpenCourseSeed {
  id: string;
  title: string;
  description: string;
  /** MP4 filename placed under public/learning/training/ */
  fileName: string;
  sortOrder: number;
  isMandatory?: boolean;
}

/** RM Eye product training recordings — sole open-course library. */
export const RM_EYE_OPEN_COURSES: RmEyeOpenCourseSeed[] = [
  {
    id: "seed-rm-eye-01",
    title: "RM Eye Product Training — Meeting Recording",
    description: "Introductory RM Eye product training session (21 May 2024).",
    fileName: "RM Eye Product Training-20240521_151002-Meeting Recording.mp4",
    sortOrder: 0,
  },
  {
    id: "seed-rm-eye-02",
    title: "RM Eye Product Training — Admin & Assets",
    description: "Administration, asset setup, and platform configuration (22 May 2024).",
    fileName: "RM Eye Product Training-20240522_150735_Admin_ Assets.mp4",
    sortOrder: 1,
  },
  {
    id: "seed-rm-eye-03",
    title: "RM Eye Product Training — Devices",
    description: "Device onboarding, monitoring, and management (28 May 2024).",
    fileName: "RM Eye Product Training-20240528_150707-Devices.mp4",
    sortOrder: 2,
  },
  {
    id: "seed-rm-eye-04",
    title: "RM Eye Product Training — Mapping & Alarms",
    description: "Sensor mapping, alarm rules, and notification workflows (30 May 2024).",
    fileName: "RM Eye Product Training-20240530_150748-Mapping&Alarms.mp4",
    sortOrder: 3,
  },
  {
    id: "seed-rm-eye-05",
    title: "RM Eye Product Training — Analytics, Roles, Nameplate",
    description: "Analytics views, role-based access, and nameplate data (4 Jun 2024).",
    fileName: "RM Eye Product Training-20240604_152030-Analytics,Roles, Nameplate.mp4",
    sortOrder: 4,
  },
  {
    id: "seed-rm-eye-06",
    title: "RM Eye Product Training — Overview & Navigation",
    description: "Platform overview and navigation fundamentals (6 Jun 2024).",
    fileName: "RM Eye Product Training-20240606_151550-Mon-Overview&Navigation.mp4",
    sortOrder: 5,
  },
  {
    id: "seed-rm-eye-07",
    title: "RM Eye Product Training — Overview & Navigation (Part 2)",
    description: "Extended overview and navigation walkthrough (11 Jun 2024).",
    fileName: "RM Eye Product Training-20240611_151721-Overview&Navigation_2.mp4",
    sortOrder: 6,
  },
  {
    id: "seed-rm-eye-08",
    title: "RM Eye Product Training — DFR, Alerts, Fleet & EEPM System Status",
    description: "DFR, alerts, fleet views, and EEPM system status (20 Jun 2024).",
    fileName: "RM Eye Product Training-20240620_151317-DFR,Alerts,Fleet,EEPMSystemStatus.mp4",
    sortOrder: 7,
  },
  {
    id: "seed-rm-eye-09",
    title: "RM Eye Product Training — Transformers",
    description: "Transformer monitoring with ODI workflows (25 Jun 2024).",
    fileName: "RM Eye Product Training-20240625_151157-Transformers_w_ODI.mp4",
    sortOrder: 8,
  },
  {
    id: "seed-rm-eye-10",
    title: "RM Eye Product Training — Cable, Motor, Generator & BD",
    description: "Cable, motor, generator, and BD monitoring with ODI (4 Jul 2024).",
    fileName: "RM Eye Product Training-20240704_150958-Cable, Mot,Gen, BD_w_ODI.mp4",
    sortOrder: 9,
  },
  {
    id: "seed-rm-eye-11",
    title: "RM Eye Product Training — MV/HV Switchgear (AIS/GIS)",
    description: "Medium and high voltage switchgear — AIS and GIS (9 Jul 2024).",
    fileName: "RM Eye Product Training-20240709_150243-MV-HV_SWGR_AIS-GIS.mp4",
    sortOrder: 10,
  },
  {
    id: "seed-rm-eye-12",
    title: "RM Eye Product Training — ACUPS, VFD & Battery Charger",
    description: "ACUPS, VFD, and battery charger monitoring (16 Jul 2024).",
    fileName: "RM Eye Product Training-20240716_151149-ACUPS_VFD_BattChrgr .mp4",
    sortOrder: 11,
  },
  {
    id: "seed-rm-eye-13",
    title: "RM Eye Product Training — Asset Comparison, Reports & Troubleshooting",
    description: "Asset comparison, reports, and troubleshooting workflows (30 Jul 2024).",
    fileName: "RM Eye Product Training-20240730_151306-Asset Comparison, Reports, Troubleshooting1.mp4",
    sortOrder: 12,
  },
  {
    id: "seed-rm-eye-14",
    title: "RM Eye Product Training — Troubleshooting & SME",
    description: "Advanced troubleshooting and SME best practices (1 Aug 2024).",
    fileName: "RM Eye Product Training-20240801_151143-Troubleshooting+SME.mp4",
    sortOrder: 13,
    isMandatory: false,
  },
];

export const RM_EYE_OPEN_COURSE_IDS = RM_EYE_OPEN_COURSES.map((c) => c.id);

export function buildRmEyeVideoUrl(fileName: string): string {
  return `/learning/training/${encodeURIComponent(fileName)}`;
}

export function toOpenCourseSeed(
  course: RmEyeOpenCourseSeed,
  createdById?: string
): {
  id: string;
  title: string;
  description: string;
  category: OpenCourseCategory;
  type: LearningResourceType;
  url: string;
  provider: string;
  durationMinutes: null;
  isMandatory: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdById?: string;
} {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: "PRODUCT",
    type: "VIDEO",
    url: buildRmEyeVideoUrl(course.fileName),
    provider: "Video",
    durationMinutes: null,
    isMandatory: course.isMandatory ?? false,
    isPublished: true,
    sortOrder: course.sortOrder,
    createdById,
  };
}
