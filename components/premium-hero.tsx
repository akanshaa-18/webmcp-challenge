"use client";

import Image from "next/image";

export function PremiumHero() {
  return (
    <section className="adobe-hero">
      <div className="hero-main">
        <div className="hero-content">
          <h1 className="adobe-hero-headline">Your creative ecosystem, understood.</h1>
          <p className="adobe-hero-subheading">
            Connect with creative products, workflows and plans — guided by your AI assistant.
          </p>
        </div>
        <div className="hero-product-icons">
          <div className="hero-icon-container hero-icon-ps">
            <Image src="/assets/adobe/photoshop-icon.svg" alt="Adobe Photoshop" width={48} height={48} />
          </div>
          <div className="hero-icon-container hero-icon-ai">
            <Image src="/assets/adobe/illustrator-icon.svg" alt="Adobe Illustrator" width={48} height={48} />
          </div>
          <div className="hero-icon-container hero-icon-ff">
            <Image src="/assets/adobe/firefly-icon.svg" alt="Adobe Firefly" width={48} height={48} />
          </div>
          <div className="hero-icon-container hero-icon-ex">
            <Image src="/assets/adobe/express-icon.svg" alt="Adobe Express" width={32} height={32} />
          </div>
          <div className="hero-icon-container hero-icon-pr">
            <Image src="/assets/adobe/premiere-icon.svg" alt="Adobe Premiere Pro" width={48} height={48} />
          </div>
        </div>
      </div>
      <div className="hero-artwork">
        <Image
          src="/assets/adobe/creative-community-lg.jpg"
          alt="Creative community ecosystem"
          fill
          priority
          quality={90}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
    </section>
  );
}
