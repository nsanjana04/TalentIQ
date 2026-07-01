import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function GoalsPage() {
  redirect(`${ROUTES.ANALYTICS}?tab=employee`);
}
