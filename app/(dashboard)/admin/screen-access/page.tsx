import { redirect } from "next/navigation";

export default function AdminScreenAccessRedirectPage() {
  redirect("/admin/roles");
}
