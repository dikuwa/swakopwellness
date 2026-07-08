import { redirect } from "next/navigation";

export default function NewReceiptRedirect() {
  redirect("/dashboard/documents?type=receipt");
}
