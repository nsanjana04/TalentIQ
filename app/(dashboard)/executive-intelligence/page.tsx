import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ExecutiveIntelligencePage() {
  redirect(`${ROUTES.ANALYTICS}?tab=executive`);
}
