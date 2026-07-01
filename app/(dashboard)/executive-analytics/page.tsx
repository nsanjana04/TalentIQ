import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ExecutiveAnalyticsPage() {
  redirect(`${ROUTES.ANALYTICS}?tab=executive`);
}
