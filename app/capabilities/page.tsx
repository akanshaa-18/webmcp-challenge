import { toolManifests } from "@/lib/capability-registry";

export default function CapabilitiesPage() {
  return (
    <div className="surface">
      <h1 className="section-title">Capability registry</h1>
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
                <td>{manifest.destinationRoute}</td>
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
