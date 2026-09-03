import { FireflySurface } from "@/components/surfaces/firefly-surface";

interface FireflyPageProps {
  searchParams: Promise<{ handoff?: string }>;
}

export default async function FireflyPage({ searchParams }: FireflyPageProps) {
  const params = await searchParams;
  return <FireflySurface handoffIdFromRoute={params.handoff ?? null} />;
}
