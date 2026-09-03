"use client";

import Image from "next/image";

interface Capability {
  id: string;
  label: string;
  title: string;
  products: Array<{ name: string; initials: string; color: string; icon?: string }>;
  gridSpan?: "tall" | "wide" | "normal";
  bgImage?: string;
}

const CAPABILITY_GROUPS: Capability[] = [
  {
    id: "generate",
    label: "Generate",
    title: "Generative Creation",
    products: [
      { name: "Firefly", initials: "Ff", color: "#FF4B4B", icon: "/assets/adobe/firefly-icon.svg" },
      { name: "Photoshop", initials: "Ps", color: "#001AFF", icon: "/assets/adobe/photoshop-icon.svg" },
    ],
    gridSpan: "wide",
  },
  {
    id: "edit",
    label: "Edit",
    title: "Professional Editing",
    products: [
      { name: "Photoshop", initials: "Ps", color: "#001AFF", icon: "/assets/adobe/photoshop-icon.svg" },
      { name: "Premiere Pro", initials: "Pr", color: "#9933FF", icon: "/assets/adobe/premiere-icon.svg" },
    ],
  },
  {
    id: "design",
    label: "Design",
    title: "Vector & Layout",
    products: [
      { name: "Illustrator", initials: "Ai", color: "#FF9B00", icon: "/assets/adobe/illustrator-icon.svg" },
      { name: "Adobe Express", initials: "Ex", color: "#FF0099", icon: "/assets/adobe/express-icon.svg" },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    title: "Social & Web",
    products: [{ name: "Express", initials: "Ex", color: "#FF0099", icon: "/assets/adobe/express-icon.svg" }],
    gridSpan: "tall",
  },
  {
    id: "video",
    label: "Video",
    title: "Motion & Editing",
    products: [{ name: "Premiere Pro", initials: "Pr", color: "#9933FF", icon: "/assets/adobe/premiere-icon.svg" }],
  },
  {
    id: "enhance",
    label: "Enhance",
    title: "Image Enhancement",
    products: [
      { name: "Photoshop", initials: "Ps", color: "#001AFF", icon: "/assets/adobe/photoshop-icon.svg" },
      { name: "Firefly", initials: "Ff", color: "#FF4B4B", icon: "/assets/adobe/firefly-icon.svg" },
    ],
  },
];

export function CapabilityGrid() {
  return (
    <section id="capabilities" className="capabilities-container">
      <h2 className="capabilities-heading">Creative Capabilities</h2>
      <div className="capabilities-bento">
        {CAPABILITY_GROUPS.map((capability) => (
          <div
            key={capability.id}
            className={`capability-card ${capability.gridSpan ? `capability-card-${capability.gridSpan}` : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`Explore ${capability.title}`}
          >
            <p className="capability-label">{capability.label}</p>
            <h3 className="capability-title">{capability.title}</h3>
            <div className="capability-products">
              {capability.products.map((product) => (
                <div key={product.name} className="capability-product-mark">
                  {product.icon ? (
                    <Image
                      src={product.icon}
                      alt={product.name}
                      width={24}
                      height={24}
                      className="product-icon-mini"
                    />
                  ) : (
                    <div
                      className="product-mark-mini"
                      style={{ backgroundColor: product.color }}
                    >
                      {product.initials}
                    </div>
                  )}
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
