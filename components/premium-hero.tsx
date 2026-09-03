"use client";

import Image from "next/image";

export function PremiumHero() {
  return (
    <section className="adobe-hero-centered">
      {/* Top tagline */}
      <div className="hero-tagline">
        <span className="tagline-icon">✨</span>
        AI-powered. Human-inspired.
      </div>

      {/* Centered headline */}
      <h1 className="hero-headline">Your creative ecosystem, understood.</h1>

      {/* Supporting copy */}
      <p className="hero-supporting-copy">
        Connect with creative products, workflows and plans — guided by your AI assistant.
      </p>

      {/* Centered ecosystem composition */}
      <div className="hero-centered-composition">
        {/* Product nodes and connectors */}
        <svg className="ecosystem-svg-layer" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="firefly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="photoshop-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1473E6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1473E6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="illustrator-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9500" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF9500" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="express-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B21B6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#5B21B6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="premiere-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.1" />
            </linearGradient>
            <filter id="soft-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Subtle connectors from products to center */}
          {/* Firefly connector (top) */}
          <path d="M 400 120 Q 400 180, 400 280" stroke="url(#firefly-gradient)" strokeWidth="2.5" fill="none" filter="url(#soft-blur)" strokeLinecap="round" />

          {/* Photoshop connector (left) */}
          <path d="M 200 300 Q 300 320, 380 320" stroke="url(#photoshop-gradient)" strokeWidth="2.5" fill="none" filter="url(#soft-blur)" strokeLinecap="round" />

          {/* Illustrator connector (right) */}
          <path d="M 600 300 Q 500 320, 420 320" stroke="url(#illustrator-gradient)" strokeWidth="2.5" fill="none" filter="url(#soft-blur)" strokeLinecap="round" />

          {/* Express connector (bottom-right) */}
          <path d="M 580 480 Q 500 420, 420 340" stroke="url(#express-gradient)" strokeWidth="2.5" fill="none" filter="url(#soft-blur)" strokeLinecap="round" />

          {/* Premiere Pro connector (bottom-left) */}
          <path d="M 220 480 Q 300 420, 380 340" stroke="url(#premiere-gradient)" strokeWidth="2.5" fill="none" filter="url(#soft-blur)" strokeLinecap="round" />
        </svg>

        {/* Central creative artwork placeholder */}
        <div className="hero-central-artwork">
          <div className="artwork-placeholder">
            <div className="placeholder-content">
              Creative output will be displayed here
            </div>
          </div>
        </div>

        {/* Product capability nodes */}
        <div className="product-nodes-container">
          {/* Firefly - Top */}
          <div className="product-capability firefly-node">
            <div className="product-mark">
              <Image src="/assets/adobe/products/firefly-mark.svg" alt="Adobe Firefly" width={52} height={52} />
            </div>
            <div className="product-label">
              <div className="product-name">Adobe Firefly</div>
              <div className="product-capability-text">Generate & transform</div>
            </div>
          </div>

          {/* Photoshop - Left */}
          <div className="product-capability photoshop-node">
            <div className="product-mark">
              <Image src="/assets/adobe/products/photoshop-mark.svg" alt="Adobe Photoshop" width={52} height={52} />
            </div>
            <div className="product-label">
              <div className="product-name">Photoshop</div>
              <div className="product-capability-text">Edit & refine</div>
            </div>
          </div>

          {/* Illustrator - Right */}
          <div className="product-capability illustrator-node">
            <div className="product-mark">
              <Image src="/assets/adobe/products/illustrator-mark.svg" alt="Adobe Illustrator" width={52} height={52} />
            </div>
            <div className="product-label">
              <div className="product-name">Illustrator</div>
              <div className="product-capability-text">Design & illustrate</div>
            </div>
          </div>

          {/* Adobe Express - Bottom Right */}
          <div className="product-capability express-node">
            <div className="product-mark">
              <Image src="/assets/adobe/products/express-mark.svg" alt="Adobe Express" width={52} height={52} />
            </div>
            <div className="product-label">
              <div className="product-name">Adobe Express</div>
              <div className="product-capability-text">Publish & share</div>
            </div>
          </div>

          {/* Premiere Pro - Bottom Left */}
          <div className="product-capability premiere-node">
            <div className="product-mark">
              <Image src="/assets/adobe/products/premiere-mark.svg" alt="Adobe Premiere Pro" width={52} height={52} />
            </div>
            <div className="product-label">
              <div className="product-name">Premiere Pro</div>
              <div className="product-capability-text">Video & motion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent orchestration text */}
      <div className="hero-agent-statement">
        <span className="agent-icon">✨</span>
        AI Assistant orchestrates it all
      </div>
    </section>
  );
}
