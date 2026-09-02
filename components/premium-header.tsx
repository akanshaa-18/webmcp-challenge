"use client";

export function PremiumHeader() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="adobe-header">
      <div className="adobe-header-logo">Creative Community</div>
      <nav className="adobe-header-nav">
        <a onClick={() => scrollToSection("products")} style={{ cursor: "pointer" }}>
          Products
        </a>
        <a onClick={() => scrollToSection("capabilities")} style={{ cursor: "pointer" }}>
          Capabilities
        </a>
        <a onClick={() => scrollToSection("workflows")} style={{ cursor: "pointer" }}>
          Workflows
        </a>
        <a onClick={() => scrollToSection("plans")} style={{ cursor: "pointer" }}>
          Plans
        </a>
      </nav>
      <div className="adobe-header-right">
        <div className="adobe-agent-ready">
          <div className="adobe-agent-dot"></div>
          Agent ready
        </div>
      </div>
    </header>
  );
}
