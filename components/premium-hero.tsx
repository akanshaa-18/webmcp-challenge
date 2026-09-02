"use client";

import Image from "next/image";

export function PremiumHero() {
  return (
    <section className="adobe-hero">
      <div className="hero-background">
        <Image
          src="/assets/adobe/creative-cloud-hero.jpg"
          alt="Creative cloud ecosystem"
          fill
          priority
          quality={85}
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1 className="adobe-hero-headline">Your creative ecosystem, understood.</h1>
        <p className="adobe-hero-subheading">
          Products, workflows, plans and compatibility — accessible to your AI assistant.
        </p>
      </div>
      <div className="hero-product-icons">
        <div className="hero-icon-container hero-icon-ps">
          <Image src="/assets/adobe/photoshop-icon.svg" alt="Photoshop" width={48} height={48} />
        </div>
        <div className="hero-icon-container hero-icon-ai">
          <Image src="/assets/adobe/illustrator-icon.svg" alt="Illustrator" width={48} height={48} />
        </div>
        <div className="hero-icon-container hero-icon-ff">
          <Image src="/assets/adobe/firefly-icon.svg" alt="Firefly" width={48} height={48} />
        </div>
        <div className="hero-icon-container hero-icon-ex">
          <Image src="/assets/adobe/express-icon.svg" alt="Adobe Express" width={32} height={32} />
        </div>
        <div className="hero-icon-container hero-icon-pr">
          <Image src="/assets/adobe/premiere-icon.svg" alt="Premiere Pro" width={48} height={48} />
        </div>
      </div>
    </section>
  );
}
