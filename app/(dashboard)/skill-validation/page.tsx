import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function SkillValidationPage() {
  redirect(`${ROUTES.SKILLS}?tab=validity`);
}
