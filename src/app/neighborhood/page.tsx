import { redirect } from "next/navigation";

export const metadata = {
  title: "Brickell Pre-Construction Condos | New Development Miami",
  description:
    "Browse all active pre-construction condos in Brickell, Miami. Branded residences, pricing, floor plans, and construction updates.",
};

export default function Page() {
  redirect("/neighborhood/brickell");
}
