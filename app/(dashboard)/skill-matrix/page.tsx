import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function SkillMatrixPage() {
  redirect(`${"/dashboard"}?tab=executive`);
}

