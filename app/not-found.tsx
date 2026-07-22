"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type FallbackAction = {
  href: string;
  label: string;
  breakOutOfFrame: boolean;
};

function resolveFallbackAction(): FallbackAction {
  if (typeof window === "undefined") {
    return { href: ROUTES.HOME, label: "Go home", breakOutOfFrame: false };
  }

  const inIframe = window.self !== window.top;
  const referrer = document.referrer;

  if (
    referrer.includes("/learning/open-courses") ||
    referrer.includes("tab=learning-content") ||
    referrer.includes("/learning")
  ) {
    return {
      href: ROUTES.LEARNING_OPEN_COURSES,
      label: "Back to Open Courses",
      breakOutOfFrame: inIframe,
    };
  }

  if (referrer.includes("/dashboard")) {
    return { href: ROUTES.DASHBOARD, label: "Back to Dashboard", breakOutOfFrame: inIframe };
  }

  return { href: ROUTES.HOME, label: "Go home", breakOutOfFrame: inIframe };
}

export default function NotFound() {
  const [action, setAction] = useState<FallbackAction>({
    href: ROUTES.HOME,
    label: "Go home",
    breakOutOfFrame: false,
  });

  useEffect(() => {
    setAction(resolveFallbackAction());
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      {action.breakOutOfFrame ? (
        <Button
          type="button"
          onClick={() => {
            window.top!.location.href = action.href;
          }}
        >
          {action.label}
        </Button>
      ) : (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
