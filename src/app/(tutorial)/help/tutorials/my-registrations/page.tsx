import { redirect } from "next/navigation";

export default function MyRegistrationsTutorialEntry() {
  redirect("/?tutorial=my-registrations&step=details");
}
