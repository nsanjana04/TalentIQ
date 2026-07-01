import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ComplianceAnalyticsPage() {
  redirect(`${ROUTES.ANALYTICS}?tab=compliance`);
}
