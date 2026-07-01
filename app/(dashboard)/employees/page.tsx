import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function EmployeesPage() {
  redirect(ROUTES.ADMIN_USERS);
}
