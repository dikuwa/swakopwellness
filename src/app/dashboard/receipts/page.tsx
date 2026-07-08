import { redirect } from "next/navigation";

export default function ReceiptsRedirect() {
  redirect("/dashboard/documents?type=receipt");
}
