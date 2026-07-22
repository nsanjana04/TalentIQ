import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function TeamsPage() {
  redirect(`${ROUTES.ADMIN_ORGANIZATION}&view=teams`);
}
