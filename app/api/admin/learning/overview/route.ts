import { apiSuccess, withLearningManager } from "@/lib/api/with-auth";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withLearningManager(async () => {
  return apiSuccess(await learningContentService.getOverview());
});
