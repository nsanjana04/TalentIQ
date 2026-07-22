import type { XapiVerb } from "@prisma/client";
import type { RecordLearningEventInput, XapiActor, XapiObject, XapiStatement } from "@/types/learning-lrs";

export const XAPI_VERB_IRIS: Record<XapiVerb, string> = {
  STARTED: "http://adlnet.gov/expapi/verbs/launched",
  PAUSED: "http://id.tincanapi.com/verb/paused",
  RESUMED: "http://adlnet.gov/expapi/verbs/resumed",
  COMPLETED: "http://adlnet.gov/expapi/verbs/completed",
  PASSED: "http://adlnet.gov/expapi/verbs/passed",
  FAILED: "http://adlnet.gov/expapi/verbs/failed",
  VIEWED: "http://id.tincanapi.com/verb/viewed",
  DOWNLOADED: "http://id.tincanapi.com/verb/downloaded",
  CERTIFIED: "http://id.tincanapi.com/verb/earned",
};

export const XAPI_VERB_DISPLAY: Record<XapiVerb, string> = {
  STARTED: "started",
  PAUSED: "paused",
  RESUMED: "resumed",
  COMPLETED: "completed",
  PASSED: "passed",
  FAILED: "failed",
  VIEWED: "viewed",
  DOWNLOADED: "downloaded",
  CERTIFIED: "certified",
};

export function buildXapiActor(name?: string, email?: string): XapiActor {
  const actor: XapiActor = { objectType: "Agent" };
  if (name) actor.name = name;
  if (email) actor.mbox = `mailto:${email}`;
  return actor;
}

export function buildXapiObject(
  objectId: string,
  objectName: string,
  objectType = "http://adlnet.gov/expapi/activities/course"
): XapiObject {
  return {
    objectType: "Activity",
    id: objectId,
    definition: {
      name: { "en-US": objectName },
      type: objectType,
    },
  };
}

export function buildXapiStatement(input: RecordLearningEventInput): XapiStatement {
  const actor = buildXapiActor(input.actorName, input.actorEmail);
  return {
    actor,
    verb: {
      id: XAPI_VERB_IRIS[input.verb],
      display: { "en-US": XAPI_VERB_DISPLAY[input.verb] },
    },
    object: buildXapiObject(input.objectId, input.objectName, input.objectType),
    result: input.result,
    context: input.context,
    timestamp: new Date().toISOString(),
  };
}

export function parseXapiStatement(statement: XapiStatement): Partial<RecordLearningEventInput> {
  const verbEntry = Object.entries(XAPI_VERB_IRIS).find(([, iri]) => iri === statement.verb.id);
  const verb = (verbEntry?.[0] ?? "VIEWED") as XapiVerb;

  return {
    verb,
    objectId: statement.object.id,
    objectName: statement.object.definition?.name?.["en-US"] ?? statement.object.id,
    objectType: statement.object.definition?.type,
    result: statement.result,
    context: statement.context,
    rawStatement: statement,
    source: "XAPI",
  };
}

export function msToIsoDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s}S`;
}
