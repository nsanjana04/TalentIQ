import { apiSuccess, withRole } from "@/lib/api/with-auth";
import { zohoPeopleService } from "@/services/zoho-people.service";

export const GET = withRole(["ADMIN"], async () => {
  return apiSuccess(await zohoPeopleService.getStatus());
});
