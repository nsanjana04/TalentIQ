import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ContractorsPage() {
  redirect(`${ROUTES.ADMIN_USERS}?filter=contractor`);
}
