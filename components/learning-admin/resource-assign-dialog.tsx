"use client";

import type { LearningResource } from "@/types/learning-content";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StructuredAssignmentRedirect } from "@/components/learning-admin/assignment-policy-banner";

type Props = {
  resource: LearningResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResourceAssignDialog({ resource, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign course level</DialogTitle>
        </DialogHeader>
        {resource && (
          <StructuredAssignmentRedirect
            contentTitle={resource.title}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
