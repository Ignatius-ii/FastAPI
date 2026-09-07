import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/LandingPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { LoginPage } from "@/pages/LoginPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { StaffDashboard } from "@/pages/StaffDashboard";
import { CustomerDashboard } from "@/pages/CustomerDashboard";
import { TicketDetailPage } from "@/pages/TicketDetailPage";
import { NewTicketPage } from "@/pages/NewTicketPage";
import { PartsSourcingPage } from "@/pages/PartsSourcingPage";
import { WarrantyClaimsPage } from "@/pages/WarrantyClaimsPage";
import { ReportsPage } from "@/pages/ReportsPage";

function RoleHome() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "staff") return <StaffDashboard />;
  return <CustomerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public entry points — redirect to /dashboard if already logged in */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* Authenticated app */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleHome />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewTicketPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:ticketId"
            element={
              <ProtectedRoute>
                <Layout>
                  <TicketDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parts-sourcing"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <PartsSourcingPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranty-claims"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <WarrantyClaimsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
