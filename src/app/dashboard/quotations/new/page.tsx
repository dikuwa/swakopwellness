import { redirect } from "next/navigation";

export default function NewQuotationRedirect() {
  redirect("/dashboard/documents?type=quotation");
}
