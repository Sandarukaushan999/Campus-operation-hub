import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import useAuth from "../../hooks/useAuth";
import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import UserDashboard from "../../features/dashboard/pages/UserDashboard";
import ResourceListPage from "../../features/resources/pages/ResourceListPage";
import CreateResourcePage from "../../features/resources/pages/CreateResourcePage";
import MyBookingsPage from "../../features/bookings/pages/MyBookingsPage";
import BookingListPage from "../../features/bookings/pages/BookingListPage";
import CreateBookingPage from "../../features/bookings/pages/CreateBookingPage";
import BookingDetailsPage from "../../features/bookings/pages/BookingDetailsPage";
// Module C - tickets
import MyTicketsPage from "../../features/tickets/pages/MyTicketsPage";
import CreateTicketPage from "../../features/tickets/pages/CreateTicketPage";
import TicketDetailsPage from "../../features/tickets/pages/TicketDetailsPage";
import TicketListPage from "../../features/tickets/pages/TicketListPage";
import AssignedTicketsPage from "../../features/tickets/pages/AssignedTicketsPage";
import AdminUsersPage from "../../features/admin/pages/AdminUsersPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return user?.role === "ADMIN" ? children : <Navigate to="/dashboard" replace />;
};

const StaffRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const allowed = user?.role === "ADMIN" || user?.role === "TECHNICIAN";
  return allowed ? children : <Navigate to="/dashboard" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRouter = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <LoginPage />
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
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<UserDashboard />} />
      <Route path="resources" element={<ResourceListPage />} />
      <Route
        path="resources/create"
        element={
          <AdminRoute>
            <CreateResourcePage />
          </AdminRoute>
        }
      />
      <Route path="bookings/my" element={<MyBookingsPage />} />
      <Route path="bookings/create" element={<CreateBookingPage />} />
      <Route path="bookings/:id" element={<BookingDetailsPage />} />
      <Route
        path="bookings"
        element={
          <AdminRoute>
            <BookingListPage />
          </AdminRoute>
        }
      />

      <Route
        path="admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />

      {/* Module C - tickets */}
      <Route path="tickets/my" element={<MyTicketsPage />} />
      <Route path="tickets/create" element={<CreateTicketPage />} />
      <Route
        path="tickets/assigned"
        element={
          <StaffRoute>
            <AssignedTicketsPage />
          </StaffRoute>
        }
      />
      <Route path="tickets/:id" element={<TicketDetailsPage />} />
      <Route
        path="tickets"
        element={
          <AdminRoute>
            <TicketListPage />
          </AdminRoute>
        }
      />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
