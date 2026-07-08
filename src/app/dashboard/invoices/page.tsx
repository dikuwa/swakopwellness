import { redirect } from "next/navigation";

export default function InvoicesRedirect() {
  redirect("/dashboard/documents?type=invoice");
}
