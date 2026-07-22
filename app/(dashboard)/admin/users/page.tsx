import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminUsersRedirectPage() {
  redirect(ROUTES.ADMIN_USERS);
}
