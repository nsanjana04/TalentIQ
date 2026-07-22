import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/design/tokens";
import { ROUTES } from "@/constants/routes";

export function AuthFormLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="command-gradient flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href={ROUTES.HOME} className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              RM
            </span>
            <span className="text-left">
              <span className="block text-lg font-bold text-foreground">{BRAND.name}</span>
              <span className="block text-xs text-muted-foreground">{BRAND.tagline}</span>
            </span>
          </Link>
        </div>
        <Card className="enterprise-panel-elevated border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
