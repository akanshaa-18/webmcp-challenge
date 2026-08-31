interface ToolRegistrationStatusProps {
  available: boolean;
  registeredTools: string[];
}

export function ToolRegistrationStatus({ available, registeredTools }: ToolRegistrationStatusProps) {
  return (
    <section>
      <h2 className="section-title">WebMCP registration</h2>
      {available ? (
        <p className="status-ok">Model context detected. Registered: {registeredTools.join(", ")}</p>
      ) : (
        <p className="status-error">
          Model context is unavailable in this browser context, so no tools are currently registered.
        </p>
      )}
    </section>
  );
}

