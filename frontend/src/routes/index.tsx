import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ContractsList } from "@/components/ContractsList";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contracts | PeoplePay360 — HR & Payroll" },
      {
        name: "description",
        content:
          "Manage employment contracts in PeoplePay360, the enterprise HR & payroll suite. Track wages, pay frequency and contract status at a glance.",
      },
      { property: "og:title", content: "Contracts | PeoplePay360 — HR & Payroll" },
      {
        property: "og:description",
        content:
          "Manage employment contracts in PeoplePay360, the enterprise HR & payroll suite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <ContractsList />
    </AppShell>
  );
}
