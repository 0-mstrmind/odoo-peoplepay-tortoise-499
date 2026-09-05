import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

interface MyRouterContext {
  queryClient: QueryClient;
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#714B67]/10 text-[#714B67] mb-4 font-bold text-2xl">
          P
        </div>
        <h1 className="text-2xl font-bold text-[#1A1F36] mb-2 tracking-tight">PeoplePay360</h1>
        <p className="text-sm text-[rgba(26,31,54,0.65)] mb-6">
          Enterprise Human Resource and Payroll Operations Platform
        </p>
        <SignInButton mode="modal">
          <button className="w-full bg-[#714B67] hover:bg-[#5e3e56] text-white font-medium py-2.5 px-4 rounded-[4px] text-sm transition-colors shadow-sm cursor-pointer">
            Sign In to Workspace
          </button>
        </SignInButton>
        <p className="text-xs text-[rgba(26,31,54,0.42)] mt-6">
          Compliant with Odoo Enterprise Standards
        </p>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const content = (
    <QueryClientProvider client={queryClient}>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </QueryClientProvider>
  );

  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PeoplePay360 — Enterprise HR & Payroll" },
      {
        name: "description",
        content:
          "PeoplePay360 is an enterprise HR & payroll application for managing employees, contracts, attendance, time off and payroll.",
      },
      { property: "og:title", content: "PeoplePay360 — Enterprise HR & Payroll" },
      {
        property: "og:description",
        content:
          "Enterprise HR & payroll: employees, contracts, attendance, time off and payroll in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
