import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function DepartmentAnalyticsPage() {
  redirect(`${ROUTES.ANALYTICS}?tab=department`);
}
