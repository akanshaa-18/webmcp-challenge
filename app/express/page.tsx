import { ExpressSurface } from "@/components/surfaces/express-surface";

interface ExpressPageProps {
  searchParams: Promise<{ handoff?: string }>;
}

export default async function ExpressPage({ searchParams }: ExpressPageProps) {
  const params = await searchParams;
  return <ExpressSurface handoffIdFromRoute={params.handoff ?? null} />;
}
