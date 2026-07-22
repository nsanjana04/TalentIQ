/**
 * Maps open-course DB ids to actual MP4 filenames in public/learning/training/.
 * Source of truth for filenames: prisma/rm-eye-open-courses.ts
 */
import { buildRmEyeVideoUrl, RM_EYE_OPEN_COURSES } from "./rm-eye-open-courses";

/** DB course id → original recording filename on disk */
export const OPEN_RM_EYE_VIDEO_MAP: Record<string, string> = {
  "seed-open-rm-eye": "RM Eye Product Training-20240521_151002-Meeting Recording.mp4",
  "seed-open-rm-eye-course": "RM Eye Product Training-20240521_151002-Meeting Recording.mp4",
  "seed-open-rm-eye-admin-assets": "RM Eye Product Training-20240522_150735_Admin_ Assets.mp4",
  "seed-open-rm-eye-devices": "RM Eye Product Training-20240528_150707-Devices.mp4",
  "seed-open-rm-eye-mapping-alarms": "RM Eye Product Training-20240530_150748-Mapping&Alarms.mp4",
  "seed-open-rm-eye-analytics-roles-nameplate":
    "RM Eye Product Training-20240604_152030-Analytics,Roles, Nameplate.mp4",
  "seed-open-rm-eye-mon-overview-navigation":
    "RM Eye Product Training-20240606_151550-Mon-Overview&Navigation.mp4",
  "seed-open-rm-eye-overview-navigation-2":
    "RM Eye Product Training-20240611_151721-Overview&Navigation_2.mp4",
  "seed-open-rm-eye-dfr-alerts-fleet-eepm":
    "RM Eye Product Training-20240620_151317-DFR,Alerts,Fleet,EEPMSystemStatus.mp4",
  "seed-open-rm-eye-transformers-odi":
    "RM Eye Product Training-20240625_151157-Transformers_w_ODI.mp4",
  "seed-open-rm-eye-cable-mot-gen-bd-odi":
    "RM Eye Product Training-20240704_150958-Cable, Mot,Gen, BD_w_ODI.mp4",
  "seed-open-rm-eye-mv-hv-swgr-ais-gis":
    "RM Eye Product Training-20240709_150243-MV-HV_SWGR_AIS-GIS.mp4",
  "seed-open-rm-eye-acups-vfd-batt-chrgr":
    "RM Eye Product Training-20240716_151149-ACUPS_VFD_BattChrgr .mp4",
  "seed-open-rm-eye-asset-comparison-reports-troubleshooting":
    "RM Eye Product Training-20240730_151306-Asset Comparison, Reports, Troubleshooting1.mp4",
  "seed-open-rm-eye-troubleshooting-sme":
    "RM Eye Product Training-20240801_151143-Troubleshooting+SME.mp4",
};

/** Legacy seed-rm-eye-* ids from rm-eye-open-courses.ts */
for (const course of RM_EYE_OPEN_COURSES) {
  OPEN_RM_EYE_VIDEO_MAP[course.id] = course.fileName;
}

export function resolveRmEyeVideoUrl(courseId: string, storedUrl: string): string {
  const fileName = OPEN_RM_EYE_VIDEO_MAP[courseId];
  if (fileName) return buildRmEyeVideoUrl(fileName);
  return storedUrl;
}

export function listOpenRmEyeVideoFilenames(): string[] {
  return [...new Set(Object.values(OPEN_RM_EYE_VIDEO_MAP))];
}
