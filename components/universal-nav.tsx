"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMission } from "@/components/mission-provider";

export function UniversalNav() {
  const pathname = usePathname();
  const { resetDemo } = useMission();

  return (
    <header className="mission-chip-shell">
      <div className="mission-chip">
        <p className="mission-chip-title">✦ Creative Community Orchestrator</p>
      </div>
      <nav className="mission-mini-links">
        {[
          ["/cc-home", "Home"],
          ["/plans", "Plans"],
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
