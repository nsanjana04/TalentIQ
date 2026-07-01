import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLearningReportsPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning Progress Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={ROUTES.ADMIN_LEARNING_PROGRESS} className="text-sm text-primary hover:underline">
            View progress table →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={ROUTES.ADMIN_LEARNING_DEPARTMENT_PROGRESS} className="text-sm text-primary hover:underline">
            View department metrics →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overdue Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={ROUTES.ADMIN_LEARNING_OVERDUE} className="text-sm text-primary hover:underline">
            View overdue list →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={ROUTES.REPORTS} className="text-sm text-primary hover:underline">
            Open enterprise reports →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
