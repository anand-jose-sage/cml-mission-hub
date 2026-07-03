import { redirect } from "next/navigation";

export default function DeleteRegistrationTutorialEntry() {
  redirect("/?tutorial=delete-registration&step=pick");
}
