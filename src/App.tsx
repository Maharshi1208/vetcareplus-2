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
import AddAppointmentPage from "./pages/AddAppointment";
import AppointmentDetailsPage from "./pages/AppointmentDetails";



// simple stub pages (we'll design later)
const Page = ({ title }: { title: string }) => (
  <div className="space-y-2">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-gray-600">Frontend-only stub page. We will design this next.</p>
  </div>
);

function Vets() { return <Page title="Vets" />; }
function Owners() { return <Page title="Owners" />; }
function Appointments() { return <Page title="Appointments" />; }
function Invoices() { return <Page title="Invoices" />; }
function HealthRecords() { return <Page title="Health Records" />; }
function Settings() { return <Page title="Settings" />; }
function NotFound() { return <Page title="404 — Page Not Found" />; }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public (no AppShell) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App routes (with AppShell) */}
        <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />

        {/* Pets module */}
        <Route path="/pets" element={<AppShell><PetsPage /></AppShell>} />
        <Route path="/pets/add" element={<AppShell><AddPetPage /></AppShell>} />
        <Route path="/pets/:id/edit" element={<AppShell><EditPetPage /></AppShell>} />
        <Route path="/pets/:id" element={<AppShell><PetDetailsPage /></AppShell>} />
        
	{/* Vets module */}
	<Route path="/vets" element={<AppShell><VetsPage /></AppShell>} />
	<Route path="/vets/add" element={<AppShell><AddVetPage /></AppShell>} />
	<Route path="/vets/:id" element={<AppShell><VetDetailsPage /></AppShell>} />
	<Route path="/vets/:id/edit" element={<AppShell><EditVetPage /></AppShell>} />

	{/* Owners Module */}
	<Route path="/owners" element={<AppShell><OwnersPage /></AppShell>} />
	<Route path="/owners/add" element={<AppShell><AddOwnerPage /></AppShell>} />
	<Route path="/owners/:id" element={<AppShell><OwnerDetailsPage /></AppShell>} />
	<Route path="/owners/:id/edit" element={<AppShell><EditOwnerPage /></AppShell>} />


	{/* Appointments Module*/}
        <Route path="/appointments" element={<AppShell><AppointmentsPage /></AppShell>} />
	<Route path="/appointments/:id" element={<AppShell><AppointmentDetailsPage /></AppShell>} />

	{/* Other modules */}
        <Route path="/invoices" element={<AppShell><Invoices /></AppShell>} />
        <Route path="/health" element={<AppShell><HealthRecords /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />

        {/* Redirects & 404 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<AppShell><NotFound /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}
