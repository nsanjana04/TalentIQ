import Link from "next/link";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ASSIGNMENT_POLICY } from "@/lib/learning-admin/assignment-policy";

export function AssignmentPolicyBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <strong>Rule:</strong> Assign <strong>Course + Level + Audience + Due Date</strong> only.
        Example: {ASSIGNMENT_POLICY.example}
      </p>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/60">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="space-y-2 text-sm text-blue-950">
            <p className="font-semibold">{ASSIGNMENT_POLICY.title}</p>
            <p>{ASSIGNMENT_POLICY.description}</p>
            <p>
              <span className="font-medium">Example:</span> {ASSIGNMENT_POLICY.example}
            </p>
            <ul className="list-inside list-disc space-y-1 text-blue-900">
              {ASSIGNMENT_POLICY.audienceTypes.map((a) => (
                <li key={a.type}>{a.description}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StructuredAssignmentRedirect({
  contentTitle,
  onClose,
}: {
  contentTitle: string;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-4">
      <AssignmentPolicyBanner compact />
      <p className="text-sm text-muted-foreground">
        To assign <strong>{contentTitle}</strong>, use the structured assignment wizard and select the
        matching enterprise course, level, audience, and due date.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={ASSIGNMENT_POLICY.wizardPath} onClick={onClose}>
            Open assignment wizard
          </Link>
        </Button>
        {onClose && (
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
