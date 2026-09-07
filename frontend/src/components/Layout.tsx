import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const isCustomer = user?.role === "customer";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          background: "var(--nav-bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--brand-fill)",
              color: "var(--brand-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            LS
          </span>
          <span style={{ color: "var(--nav-text)", fontWeight: 500, fontSize: 15 }}>
            Lenovo support
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#ffffff",
              color: "var(--nav-bg)",
            }}
          >
            {isCustomer ? "Client portal" : "Staff portal"}
          </span>

          {user && (
            <>
              <button
                onClick={logout}
                style={{
                  fontSize: 13,
                  color: "var(--nav-text-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
              <span
                title={user.full_name}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#2b2d35",
                  color: "var(--nav-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {initials(user.full_name)}
              </span>
            </>
          )}
        </div>
      </header>

      <div style={{ display: "flex" }}>
        {!isCustomer && <Sidebar />}
        <main style={{ flex: 1, maxWidth: isCustomer ? 1000 : "none", margin: isCustomer ? "0 auto" : 0, padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
