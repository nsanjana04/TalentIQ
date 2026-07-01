import { PageShell } from "@/components/enterprise/page-shell";
import { PageHeader } from "@/components/enterprise/page-header";
import { WarRoomPanel } from "@/components/enterprise-modules/war-room-panel";

export default function WarRoomPage() {
  return (
    <PageShell>
      <PageHeader
        title="Executive War Room"
        description="Executive command view — compliance alerts, learning signals, and workforce risk."
        live
      />
      <WarRoomPanel />
    </PageShell>
  );
}
