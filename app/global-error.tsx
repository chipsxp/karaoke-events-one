"use client";

import { useEffect } from "react";

/**
 * Global error boundary (issue #2): catches failures in the root layout
 * itself (e.g. an auth provider that cannot initialize) and shows a friendly
 * message instead of a blank page or raw stack trace. Must render its own
 * <html>/<body>; inline styles are used because globals.css may not apply.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
            padding: 16,
          }}
        >
          <h1 style={{ fontSize: 24, margin: 0 }}>
            Karaoke Events is having technical trouble
          </h1>
          <p style={{ color: "#555", maxWidth: 480, margin: 0 }}>
            The app failed to start correctly. This often indicates a
            configuration problem (for example missing authentication
            credentials). Try reloading — if the problem persists, check the
            server logs.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Reload app
          </button>
        </div>
      </body>
    </html>
  );
}
