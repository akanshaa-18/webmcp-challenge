import { runtimeToolNameForManifest, toolManifests } from "@/lib/capability-registry";

export default function CapabilitiesPage() {
  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Developer / Judge View</p>
        <h1 className="hero-title">Capability registry</h1>
        <p className="hero-subtitle">DISCOVER GLOBALLY → PREPARE CONTEXT → CONTINUE IN DESTINATION PRODUCT</p>
      </header>
      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Global capability discovery</h2>
          <p className="small-note">
            Universal tooling finds what to do next and hands off structured context.
          </p>
        </article>
        <article className="preview-card">
          <h2 className="section-title">Surface-owned execution</h2>
          <p className="small-note">
            Public discovery tools support direct destination handoff; Firefly/Express and Project local execution
            remain as legacy/demo route tooling.
          </p>
        </article>
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>Tool name</th>
            <th>Runtime tool</th>
            <th>Owner surface</th>
            <th>Description</th>
            <th>Destination</th>
            <th>Audience</th>
            <th>Mode</th>
            <th>Required context</th>
          </tr>
        </thead>
        <tbody>
          {toolManifests.map((manifest) => {
            const ownerSurface =
              manifest.ownerSurface === "Adobe Agentic Front Door"
                ? "Creative Community"
                : manifest.ownerSurface;
            return (
              <tr key={manifest.toolName}>
                <td>{manifest.toolName}</td>
                <td>{runtimeToolNameForManifest(manifest.toolName)}</td>
                <td>{ownerSurface}</td>
                <td>{manifest.description}</td>
                <td>{manifest.destinationRoute ?? manifest.destinationUrl ?? "n/a"}</td>
                <td>{manifest.audience === "legacy-private" ? "legacy/demo" : "public"}</td>
                <td>{manifest.readOnly ? "read-only" : "mutating"}</td>
                <td>{manifest.requiredContext.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
