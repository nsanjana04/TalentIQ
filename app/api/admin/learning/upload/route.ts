import { NextRequest } from "next/server";
import { apiSuccess, withResourceLibraryAdmin } from "@/lib/api/with-auth";
import { AppError } from "@/lib/errors/app-error";
import { storeLearningFile } from "@/lib/storage/learning-files";
import { assertAllowedLearningFile } from "@/lib/utils/learning-file-types";
import type { LearningResourceType } from "@/types/learning-content";

export const POST = withResourceLibraryAdmin(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new AppError("BAD_REQUEST", "No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let detected: { type: LearningResourceType; provider: string };

  try {
    detected = assertAllowedLearningFile(file.name, file.type || "application/octet-stream", file.size);
  } catch (error) {
    throw new AppError(
      "BAD_REQUEST",
      error instanceof Error ? error.message : "Invalid file"
    );
  }

  const url = await storeLearningFile(
    buffer,
    file.name,
    file.type || "application/octet-stream"
  );

  return apiSuccess({
    url,
    type: detected.type,
    provider: detected.provider,
    fileName: file.name,
    size: file.size,
  });
});
