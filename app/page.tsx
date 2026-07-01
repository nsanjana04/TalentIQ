import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

const MODULES = [
  {
    title: "Command Center",
    href: ROUTES.DASHBOARD,
    description: "Workforce overview, learning velocity, assessments, and compliance signals.",
  },
  {
    title: "Learning Pathways",
    href: ROUTES.LEARNING,
    description: "Track enrollments, course progress, and mandatory training completion.",
  },
  {
    title: "Assessments",
    href: ROUTES.ASSESSMENTS,
    description: "Assessment attempts, pass rates, and review outcomes.",
  },
  {
    title: "Certifications",
    href: ROUTES.CERTIFICATIONS,
    description: "Active credentials, expiry windows, and compliance status by employee.",
  },
  {
    title: "Workforce Analytics",
    href: ROUTES.ANALYTICS,
    description: "Executive dashboards for organization, team, and employee intelligence.",
  },
  {
    title: "Reports",
    href: ROUTES.REPORTS,
    description: "Exportable workforce and learning reports.",
  },
  {
    title: "AI Workforce Copilot",
    href: ROUTES.AI_COPILOT,
    description:
      "Ask workforce questions and get ranked employees with readiness, certs, and drill-down profiles — powered by live database records.",
    featured: true,
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">TalentIQ</span>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.LOGIN}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.AI_COPILOT}>Open Copilot</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI-Powered Workforce Intelligence Platform
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Unify learning, assessments, certifications, and analytics into a single
            enterprise intelligence platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={ROUTES.LOGIN}>Sign in</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.AI_COPILOT}>
                <Bot className="mr-2 h-4 w-4" />
                AI Workforce Copilot
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <Link key={module.title} href={module.href} className="group block">
              <Card
                className={
                  "featured" in module && module.featured
                    ? "border-primary/40 bg-primary/5 transition-colors hover:border-primary"
                    : "transition-colors hover:border-primary/30"
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {module.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription>
                    {"featured" in module && module.featured
                      ? "Data-driven employee intelligence"
                      : "Live workforce module"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
