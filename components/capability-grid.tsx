"use client";

interface Capability {
  id: string;
  label: string;
  title: string;
  products: Array<{ name: string; initials: string; color: string }>;
  gridSpan?: "tall" | "wide" | "normal";
}

const CAPABILITY_GROUPS: Capability[] = [
  {
    id: "generate",
    label: "Generate",
    title: "Generative Creation",
    products: [
      { name: "Firefly", initials: "Ff", color: "#FF4B4B" },
      { name: "Photoshop", initials: "Ps", color: "#001AFF" },
    ],
    gridSpan: "wide",
  },
  {
    id: "edit",
    label: "Edit",
    title: "Professional Editing",
    products: [
      { name: "Photoshop", initials: "Ps", color: "#001AFF" },
      { name: "Premiere Pro", initials: "Pr", color: "#9933FF" },
    ],
  },
  {
    id: "design",
    label: "Design",
    title: "Vector & Layout",
    products: [
      { name: "Illustrator", initials: "Ai", color: "#FF9B00" },
      { name: "Express", initials: "Ex", color: "#FF0099" },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    title: "Social & Web",
    products: [{ name: "Express", initials: "Ex", color: "#FF0099" }],
    gridSpan: "tall",
  },
  {
    id: "video",
    label: "Video",
    title: "Motion & Editing",
    products: [{ name: "Premiere Pro", initials: "Pr", color: "#9933FF" }],
  },
  {
    id: "enhance",
    label: "Enhance",
    title: "Image Enhancement",
    products: [
      { name: "Photoshop", initials: "Ps", color: "#001AFF" },
      { name: "Firefly", initials: "Ff", color: "#FF4B4B" },
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
          >
            <p className="capability-label">{capability.label}</p>
            <h3 className="capability-title">{capability.title}</h3>
            <div className="capability-products">
              {capability.products.map((product) => (
                <div key={product.name} className="capability-product-mark">
                  <div
                    className="product-mark-mini"
                    style={{ backgroundColor: product.color }}
                  >
                    {product.initials}
                  </div>
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
