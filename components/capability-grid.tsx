"use client";

interface Capability {
  id: string;
  label: string;
  title: string;
  products: string[];
}

const CAPABILITY_GROUPS: Capability[] = [
  {
    id: "generate",
    label: "Generate",
    title: "Generative Creation",
    products: ["Firefly", "Photoshop"],
  },
  {
    id: "edit",
    label: "Edit",
    title: "Professional Editing",
    products: ["Photoshop", "Premiere Pro"],
  },
  {
    id: "design",
    label: "Design",
    title: "Vector & Layout",
    products: ["Illustrator", "Express"],
  },
  {
    id: "publish",
    label: "Publish",
    title: "Social & Web",
    products: ["Express", "Adobe Express"],
  },
  {
    id: "video",
    label: "Video",
    title: "Motion & Editing",
    products: ["Premiere Pro"],
  },
  {
    id: "enhance",
    label: "Enhance",
    title: "Image Enhancement",
    products: ["Photoshop", "Firefly"],
  },
];

export function CapabilityGrid() {
  return (
    <section id="capabilities" className="capabilities-container">
      <h2 className="capabilities-heading">Creative Capabilities</h2>
      <div className="capabilities-bento">
        {CAPABILITY_GROUPS.map((capability) => (
          <div key={capability.id} className="capability-card">
            <p className="capability-label">{capability.label}</p>
            <h3 className="capability-title">{capability.title}</h3>
            <div className="capability-products">
              {capability.products.map((product) => (
                <span key={product} className="capability-product-tag">
                  {product}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
