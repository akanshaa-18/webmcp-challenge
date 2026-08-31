"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMission } from "@/components/mission-provider";

function getMissionStage(step: string): number {
  if (step === "mission_complete") return 5;
  if (step.includes("delete") || step.includes("duplicate") || step.includes("cleanup")) return 4;
  if (step.includes("business_card")) return 3;
  if (step.includes("background")) return 2;
  return 1;
}

export function UniversalNav() {
  const pathname = usePathname();
  const { mission, resetDemo } = useMission();
  const stage = getMissionStage(mission.currentStep);
  const progressLabel =
    stage === 5 ? "Mission complete" : stage === 4 ? "Cleanup in progress" : stage === 3 ? "Adaptation complete" : stage === 2 ? "Background complete" : "Discovery in progress";

  return (
    <header className="mission-chip-shell">
      <div className="mission-chip">
        <p className="mission-chip-title">✦ Mission Control</p>
        <p className="mission-chip-meta">
          Kaftan · {stage}/5 · {progressLabel}
        </p>
      </div>
      <nav className="mission-mini-links">
        {[
          ["/plans", "Plans"],
          ["/cc-home", "Home"],
          ["/project/kaftan", "Project"],
          ["/firefly", "Firefly"],
          ["/express", "Express"],
          ["/capabilities", "Capabilities"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className={`mission-mini-link ${pathname === href ? "mission-mini-link-active" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={resetDemo} className="secondary-button">
        Reset Demo
      </button>
    </header>
  );
}
