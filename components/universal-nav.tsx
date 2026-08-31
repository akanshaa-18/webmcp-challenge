"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMission } from "@/components/mission-provider";

export function UniversalNav() {
  const pathname = usePathname();
  const { mission, resetDemo } = useMission();

  return (
    <header
      style={{
        background: "#111827",
        color: "#f9fafb",
        borderBottom: "1px solid #374151",
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          margin: "0 auto",
          padding: "12px 16px",
          display: "grid",
          gap: "8px",
        }}
      >
        <strong>Adobe Creative Mission Control</strong>
        <div>
          <span className="chip">Project: Kaftan</span>
          <span className="chip">Mission: Finish client project</span>
          <span className="chip">Current step: {mission.currentStep}</span>
        </div>
        <nav style={{ display: "flex", gap: "12px", fontSize: "0.9rem" }}>
          {[
            ["/cc-home", "CC Home"],
            ["/project/kaftan", "Project"],
            ["/firefly", "Firefly"],
            ["/express", "Express"],
            ["/plans", "Plans"],
            ["/capabilities", "Capabilities"],
          ].map(([href, label]) => (
            <Link key={href} href={href} style={{ textDecoration: pathname === href ? "underline" : "none" }}>
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={resetDemo}
            style={{
              marginLeft: "auto",
              border: "1px solid #9ca3af",
              background: "transparent",
              color: "#f9fafb",
              borderRadius: "8px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Reset Demo
          </button>
        </nav>
      </div>
    </header>
  );
}
