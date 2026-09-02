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

      {/* Product ecosystem visualization */}
      <div className="hero-ecosystem">
        {/* Central creative canvas */}
        <div className="creative-canvas">
          <div className="canvas-inner">
            <div className="canvas-accent"></div>
          </div>
        </div>

        {/* Floating product nodes */}
        <div className="product-node product-node-ff" title="Adobe Firefly">
          <Image src="/assets/adobe/firefly-icon.svg" alt="Firefly" width={32} height={32} />
        </div>
        <div className="product-node product-node-ps" title="Adobe Photoshop">
          <Image src="/assets/adobe/photoshop-icon.svg" alt="Photoshop" width={32} height={32} />
        </div>
        <div className="product-node product-node-ai" title="Adobe Illustrator">
          <Image src="/assets/adobe/illustrator-icon.svg" alt="Illustrator" width={32} height={32} />
        </div>
        <div className="product-node product-node-ex" title="Adobe Express">
          <Image src="/assets/adobe/express-icon.svg" alt="Express" width={24} height={24} />
        </div>
        <div className="product-node product-node-pr" title="Adobe Premiere Pro">
          <Image src="/assets/adobe/premiere-icon.svg" alt="Premiere Pro" width={32} height={32} />
        </div>

        {/* Connection lines */}
        <svg className="ecosystem-connections" viewBox="0 0 300 350" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#FF4B4B", stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: "#001AFF", stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
