import { toolManifests } from "@/lib/capability-registry";

export default function CapabilitiesPage() {
  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Developer / Judge View</p>
        <h1 className="hero-title">Capability registry</h1>
        <p className="hero-subtitle">DISCOVER GLOBALLY → EXECUTE LOCALLY → RESUME SEAMLESSLY</p>
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
            Each product surface registers and executes its own local tools with route-level lifecycle.
          </p>
        </article>
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>Tool name</th>
            <th>Owner surface</th>
            <th>Description</th>
            <th>Destination</th>
            <th>Mode</th>
            <th>Required context</th>
          </tr>
        </thead>
        <tbody>
          {toolManifests.map((manifest) => {
            return (
              <tr key={manifest.toolName}>
                <td>{manifest.toolName}</td>
                <td>{manifest.ownerSurface}</td>
                <td>{manifest.description}</td>
                <td>{manifest.destinationRoute ?? manifest.destinationUrl ?? "n/a"}</td>
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
