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
  const progress = ["1 Discover", "2 Create", "3 Adapt", "4 Clean up", "5 Complete"];

  return (
    <header className="mission-nav">
      <div className="mission-nav-inner">
        <div className="mission-nav-top">
          <strong>Adobe Creative Mission Control</strong>
          <button type="button" onClick={resetDemo} className="secondary-button">
            Reset Demo
          </button>
        </div>
        <div>
          <span className="chip">Project: Kaftan</span>
          <span className="chip">Mission: Finish client project</span>
          <span className="chip">Current step: {mission.currentStep}</span>
        </div>
        <div className="progress-track">
          {progress.map((item, index) => (
            <div key={item} className={`progress-step ${stage === index + 1 ? "progress-step-active" : ""}`}>
              {item}
            </div>
          ))}
        </div>
        <nav className="mission-nav-links">
          {[
            ["/plans", "Plans"],
            ["/cc-home", "CC Home"],
            ["/project/kaftan", "Project"],
            ["/firefly", "Firefly"],
            ["/express", "Express"],
            ["/capabilities", "Capabilities"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`mission-link ${pathname === href ? "mission-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
