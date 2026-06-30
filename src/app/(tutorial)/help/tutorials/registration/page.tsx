import { redirect } from "next/navigation";

export default function TutorialEntry() {
  redirect("/?tutorial=registration&step=home");
}
