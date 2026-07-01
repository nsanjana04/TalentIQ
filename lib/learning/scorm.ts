/**
 * SCORM import scaffold — maps SCORM 1.2/2004 CMI data to xAPI statements.
 * Wire into POST /api/learning/lrs/xapi or a dedicated /api/learning/lrs/scorm route.
 */
import type { RecordLearningEventInput, XapiStatement } from "@/types/learning-lrs";
import { buildXapiStatement, parseXapiStatement } from "@/lib/learning/xapi";

export interface ScormCmiPayload {
  lessonStatus?: string;
  lessonLocation?: string;
  scoreRaw?: number;
  scoreMax?: number;
  sessionTime?: string;
  suspendData?: string;
}

export function scormStatusToVerb(status: string): RecordLearningEventInput["verb"] {
  switch (status.toLowerCase()) {
    case "completed":
    case "passed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "browsed":
      return "VIEWED";
    case "incomplete":
      return "STARTED";
    default:
      return "VIEWED";
  }
}

export function scormCmiToXapiStatement(
  userId: string,
  courseId: string,
  lessonId: string,
  cmi: ScormCmiPayload,
  objectName: string
): XapiStatement {
  const verb = scormStatusToVerb(cmi.lessonStatus ?? "incomplete");
  return buildXapiStatement({
    userId,
    verb,
    objectId: `scorm:${courseId}:${lessonId}`,
    objectName,
    objectType: "http://adlnet.gov/expapi/activities/module",
    courseId,
    lessonId,
    source: "SCORM",
    result: {
      score:
        cmi.scoreRaw != null
          ? { raw: cmi.scoreRaw, max: cmi.scoreMax ?? 100 }
          : undefined,
      completion: verb === "COMPLETED",
      success: cmi.lessonStatus?.toLowerCase() === "passed",
    },
  });
}

export function importScormPackageStatement(statement: XapiStatement): Partial<RecordLearningEventInput> {
  return { ...parseXapiStatement(statement), source: "SCORM" };
}
