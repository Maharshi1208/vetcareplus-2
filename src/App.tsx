import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import PetsPage from "./pages/Pets";
import AddPetPage from "./pages/AddPet";
import EditPetPage from "./pages/EditPet";
import PetDetailsPage from "./pages/PetDetails";

import VetsPage from "./pages/Vets";
import VetDetailsPage from "./pages/VetDetails";
import AddVetPage from "./pages/AddVet";
import EditVetPage from "./pages/EditVet";

import OwnersPage from "./pages/Owners";
import AddOwnerPage from "./pages/AddOwner";
import OwnerDetailsPage from "./pages/OwnerDetails";
import EditOwnerPage from "./pages/EditOwner";

import AppointmentsPage from "./pages/Appointments";
import AppointmentDetailsPage from "./pages/AppointmentDetails";
import AppointmentEdit from "./pages/AppointmentEdit";

import InvoicesPage from "./pages/Invoices";
import InvoiceDetailsPage from "./pages/InvoiceDetails";
import AddInvoicePage from "./pages/AddInvoice";
import EditInvoicePage from "./pages/EditInvoice";

import ApptCalendarPage from "./pages/ApptCalendar";
import HealthPage from "./pages/Health";
import PayCheckoutPage from "./pages/PayCheckout";
import PayResultPage from "./pages/PayResult";
import SettingsPage from "./pages/Settings";

import AddMedication from "./pages/AddMedication";
import AddVaccine from "./pages/AddVaccine";
import ViewVaccine from "./pages/ViewVaccine";
import EditVaccine from "./pages/EditVaccine";

import ResetPassword from "./pages/ResetPassword";   {/* ✅ Added import */}

import ProtectedRoute from "./components/ProtectedRoute";
import RequireRole from "./components/RequireRole";
import Forbidden from "./pages/Forbidden";

// (Optional) very small stub page for 404
const NotFound = () => (
  <div className="space-y-2">
    <h1 className="text-2xl font-bold">404 — Page Not Found</h1>
    <p className="text-gray-600">The page you’re looking for doesn’t exist.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public (no shell) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/*  Added route */}

        {/* Everything below requires auth */}
        <Route element={<ProtectedRoute />}>
          {/* Any authenticated role */}
          <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />

          {/* OWNER-only: pets */}
          <Route
            path="/pets"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><PetsPage /></AppShell></>}
          />
          <Route
            path="/pets/add"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><AddPetPage /></AppShell></>}
          />
          <Route
            path="/pets/:id/edit"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><EditPetPage /></AppShell></>}
          />
          <Route
            path="/pets/:id"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><PetDetailsPage /></AppShell></>}
          />

          {/* OWNER + VET: appointments */}
          <Route
            path="/appointments"
            element={<><RequireRole allow={["OWNER","VET"]} /><AppShell><AppointmentsPage /></AppShell></>}
          />
          <Route
            path="/appointments/add"
            element={<><RequireRole allow={["OWNER","VET"]} /><AppShell><AppointmentEdit /></AppShell></>}
          />
          <Route
            path="/appointments/:id/edit"
            element={<><RequireRole allow={["OWNER","VET"]} /><AppShell><AppointmentEdit /></AppShell></>}
          />
          <Route
            path="/appointments/:id"
            element={<><RequireRole allow={["OWNER","VET"]} /><AppShell><AppointmentDetailsPage /></AppShell></>}
          />
          <Route
            path="/appointments/calendar"
            element={<><RequireRole allow={["OWNER","VET","ADMIN"]} /><AppShell><ApptCalendarPage /></AppShell></>}
          />

          {/* Payments (mock): OWNER */}
          <Route
            path="/pay/checkout/:apptId"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><PayCheckoutPage /></AppShell></>}
          />
          <Route
            path="/pay/result"
            element={<><RequireRole allow={["OWNER"]} /><AppShell><PayResultPage /></AppShell></>}
          />

          {/* VET-only: medical */}
          <Route
            path="/health"
            element={<><RequireRole allow={["VET"]} /><AppShell><HealthPage /></AppShell></>}
          />
          <Route
            path="/health/add-medication"
            element={<><RequireRole allow={["VET"]} /><AppShell><AddMedication /></AppShell></>}
          />
          <Route
            path="/health/add-vaccine"
            element={<><RequireRole allow={["VET"]} /><AppShell><AddVaccine /></AppShell></>}
          />
          <Route
            path="/vaccines/:id/view"
            element={<><RequireRole allow={["VET"]} /><AppShell><ViewVaccine /></AppShell></>}
          />
          <Route
            path="/vaccines/:id/edit"
            element={<><RequireRole allow={["VET"]} /><AppShell><EditVaccine /></AppShell></>}
          />

          {/* ADMIN-only: master data */}
          <Route
            path="/vets"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><VetsPage /></AppShell></>}
          />
          <Route
            path="/vets/add"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><AddVetPage /></AppShell></>}
          />
          <Route
            path="/vets/:id"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><VetDetailsPage /></AppShell></>}
          />
          <Route
            path="/vets/:id/edit"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><EditVetPage /></AppShell></>}
          />
          <Route
            path="/owners"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><OwnersPage /></AppShell></>}
          />
          <Route
            path="/owners/add"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><AddOwnerPage /></AppShell></>}
          />
          <Route
            path="/owners/:id"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><OwnerDetailsPage /></AppShell></>}
          />
          <Route
            path="/owners/:id/edit"
            element={<><RequireRole allow={["ADMIN"]} /><AppShell><EditOwnerPage /></AppShell></>}
          />

          {/* Invoices: ADMIN or OWNER */}
          <Route
            path="/invoices"
            element={<><RequireRole allow={["ADMIN","OWNER"]} /><AppShell><InvoicesPage /></AppShell></>}
          />
          <Route
            path="/invoices/add"
            element={<><RequireRole allow={["ADMIN","OWNER"]} /><AppShell><AddInvoicePage /></AppShell></>}
          />
          <Route
            path="/invoices/:id"
            element={<><RequireRole allow={["ADMIN","OWNER"]} /><AppShell><InvoiceDetailsPage /></AppShell></>}
          />
          <Route
            path="/invoices/:id/edit"
            element={<><RequireRole allow={["ADMIN","OWNER"]} /><AppShell><EditInvoicePage /></AppShell></>}
          />

          {/* Settings: any authenticated role */}
          <Route path="/settings" element={<AppShell><SettingsPage /></AppShell>} />
        </Route>

        {/* Forbidden + redirects + 404 */}
        <Route path="/403" element={<Forbidden />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<AppShell><NotFound /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}
