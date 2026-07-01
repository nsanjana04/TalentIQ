import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function CompetencyModelsPage() {
  redirect(`${ROUTES.SKILLS}?tab=roles`);
}
