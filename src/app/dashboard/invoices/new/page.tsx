import { redirect } from "next/navigation";

export default function NewInvoiceRedirect() {
  redirect("/dashboard/documents?type=invoice");
}
