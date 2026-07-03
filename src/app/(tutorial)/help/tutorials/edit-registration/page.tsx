import { redirect } from "next/navigation";

export default function EditRegistrationTutorialEntry() {
  redirect("/?tutorial=edit-registration&step=pick");
}
