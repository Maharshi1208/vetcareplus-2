import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PetsPage from "./pages/Pets";
import AddPetPage from "./pages/AddPet";
import EditPetPage from "./pages/EditPet";

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

        {/* Other modules */}
        <Route path="/vets" element={<AppShell><Vets /></AppShell>} />
        <Route path="/owners" element={<AppShell><Owners /></AppShell>} />
        <Route path="/appointments" element={<AppShell><Appointments /></AppShell>} />
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
