import { PageShell } from "@/components/enterprise/page-shell";
import { PageHeader } from "@/components/enterprise/page-header";
import { ForecastingPanel } from "@/components/enterprise-modules/forecasting-panel";

export default function ForecastingPage() {
  return (
    <PageShell>
      <PageHeader
        title="Workforce Forecasting"
        description="Predictive analytics for attrition, hiring, leadership gaps, certifications, and skill demand — XGBoost, LightGBM, and Random Forest models."
      />
      <ForecastingPanel />
    </PageShell>
  );
}
