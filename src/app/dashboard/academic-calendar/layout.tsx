import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Calendar | Aditya University LMS",
  description: "Access Aditya University's academic calendar, milestones, examination schedules, official holidays, and co-curricular fests.",
};

export default function AcademicCalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
