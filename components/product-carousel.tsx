"use client";

interface Product {
  id: string;
  name: string;
  role: string;
  icon: string;
  highlights: string[];
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "photoshop",
    name: "Photoshop",
    role: "Image editing & design",
    icon: "🎨",
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
    icon: "✏️",
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
    icon: "✨",
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
    icon: "🚀",
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
    icon: "🎬",
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
      <h2 className="product-carousel-heading">Adobe Product Family</h2>
      <div className="product-carousel">
        {FEATURED_PRODUCTS.map((product) => (
          <article key={product.id} className="product-card">
            <div className="product-icon">{product.icon}</div>
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
