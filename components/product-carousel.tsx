"use client";

import Image from "next/image";

interface Product {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  icon?: string;
  highlights: string[];
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "photoshop",
    name: "Photoshop",
    role: "Image editing & design",
    initials: "Ps",
    color: "#001AFF",
    icon: "/assets/adobe/photoshop-icon.svg",
    highlights: [
      "Remove & replace backgrounds",
      "Photo retouching & restoration",
      "Creative content generation",
      "Professional image composition",
    ],
  },
  {
    id: "illustrator",
    name: "Illustrator",
    role: "Vector design & illustration",
    initials: "Ai",
    color: "#FF9B00",
    icon: "/assets/adobe/illustrator-icon.svg",
    highlights: [
      "Create scalable vector graphics",
      "Brand design & typography",
      "Logo & icon creation",
      "Layout & composition",
    ],
  },
  {
    id: "firefly",
    name: "Firefly",
    role: "Generative creativity",
    initials: "Ff",
    color: "#FF4B4B",
    icon: "/assets/adobe/firefly-icon.svg",
    highlights: [
      "Text-to-image generation",
      "Background replacement",
      "Generative fill & expand",
      "Style transfer & variation",
    ],
  },
  {
    id: "express",
    name: "Adobe Express",
    role: "Social & web content",
    initials: "Ex",
    color: "#FF0099",
    icon: "/assets/adobe/express-icon.svg",
    highlights: [
      "Social media templates",
      "Quick design creation",
      "Template library",
      "Brand kit support",
    ],
  },
  {
    id: "premiere",
    name: "Premiere Pro",
    role: "Professional video editing",
    initials: "Pr",
    color: "#9933FF",
    icon: "/assets/adobe/premiere-icon.svg",
    highlights: [
      "Timeline-based editing",
      "Color grading & VFX",
      "Motion graphics",
      "Multi-track editing",
    ],
  },
];

export function ProductCarousel() {
  return (
    <section id="products" className="product-carousel-container">
      <h2 className="product-carousel-heading">Creative Products</h2>
      <div className="product-carousel">
        {FEATURED_PRODUCTS.map((product) => (
          <article key={product.id} className="product-card">
            <div className="product-icon-container">
              {product.icon ? (
                <Image src={product.icon} alt={product.name} width={48} height={48} className="product-icon-large" />
              ) : (
                <div className="product-mark" style={{ backgroundColor: product.color }}>
                  {product.initials}
                </div>
              )}
            </div>
            <h3>{product.name}</h3>
            <p className="product-role">{product.role}</p>
            <ul className="product-highlights">
              {product.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
