import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { ProtectedRoute, PublicRoute } from "./components/routes/routes";

// ===== Páginas de Autenticación =====
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ResendVerificationPage from "./pages/auth/ResendVerificationPage";
import VerifyEmailSentPage from "./pages/auth/VerifyEmailSentPage"; // ✅ NUEVA página

// ===== Páginas principales =====
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import MyProductsPage from "./pages/products/MyProductsPage";
import CreateProductPage from "./pages/products/CreateProductPage";
import EditProductPage from "./pages/products/EditProductPage";
import FavoritesPage from "./pages/products/FavoritesPage";
import IncidentsPage from "./pages/incidents/IncidentsPage";
import ReportsPage from "./pages/incidents/ReportsPage";
import MyIncidentsPage from "./pages/incidents/MyIncidentsPage";
import ChatPage from "./pages/chat/ChatPage";
import UsersPage from "./pages/users/UsersPage";

// ⭐ Nuevo import para el panel del moderador
import ModeratorDashboardPage from "./pages/moderator/ModeratorDashboardPage";

import { useAuthStore } from "./store/authStore";
import { UserRole } from "./types";

function AppRouter() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* =====================
            RUTAS PÚBLICAS (sin sesión)
        ====================== */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email-sent"
          element={
            <PublicRoute>
              <VerifyEmailSentPage />
            </PublicRoute>
          }
        />
        <Route
          path="/resend-verification"
          element={
            <PublicRoute>
              <ResendVerificationPage />
            </PublicRoute>
          }
        />

        {/* =====================
            RUTAS PRIVADAS (requieren login)
        ====================== */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard general (según rol muestra cosas distintas) */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* ⭐ Nuevo: Panel específico del moderador/admin */}
          <Route
            path="moderator-dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MODERATOR, UserRole.ADMIN]}>
                <ModeratorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Productos / catálogo */}
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="favorites" element={<FavoritesPage />} />

          {/* --- SOLO VENDEDORES --- */}
          <Route
            path="my-products"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SELLER]}>
                <MyProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/create"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SELLER]}>
                <CreateProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SELLER]}>
                <EditProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-incidents"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SELLER]}>
                <MyIncidentsPage />
              </ProtectedRoute>
            }
          />

          {/* --- ADMIN / MODERADOR --- */}
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="incidents"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
                <IncidentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* --- Chat general --- */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:id" element={<ChatPage />} />
        </Route>

        {/* Si no coincide ninguna ruta */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
