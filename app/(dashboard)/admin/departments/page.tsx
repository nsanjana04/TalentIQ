import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminDepartmentsRedirectPage() {
  redirect(ROUTES.ADMIN_ORGANIZATION);
}
