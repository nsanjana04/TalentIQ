"use client";

import type { OpenCourse } from "@/types/learning-content";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StructuredAssignmentRedirect } from "@/components/learning-admin/assignment-policy-banner";

type Props = {
  course: OpenCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OpenCourseAssignDialog({ course, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign course level</DialogTitle>
        </DialogHeader>
        {course && (
          <StructuredAssignmentRedirect
            contentTitle={course.title}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
