import { AssignmentDetailPanel } from "@/components/learning-admin/assignment-detail-panel";

type PageProps = { params: Promise<{ id: string }> };

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AssignmentDetailPanel id={id} />;
}
