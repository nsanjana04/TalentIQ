import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function TeamAnalyticsPage() {
  redirect(`${ROUTES.ANALYTICS}?tab=team`);
}
