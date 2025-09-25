import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Role = "OWNER" | "VET" | "ADMIN";
type LinkClass =
  | string
  | ((args: { isActive: boolean; isPending: boolean }) => string);

export default function RoleNav({ linkClassName }: { linkClassName?: LinkClass }) {
  const { role } = useAuth();

  const allForAdmin = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/pets", label: "Pets" },
    { to: "/vets", label: "Vets" },
    { to: "/owners", label: "Owners" },
    { to: "/appointments", label: "Appointments" },
    { to: "/invoices", label: "Invoices" },
    { to: "/health", label: "Health" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ];

  const common = [{ to: "/dashboard", label: "Dashboard" }];
  const ownerOnly = [
    { to: "/pets", label: "Pets" },
    { to: "/appointments", label: "Appointments" },
    { to: "/invoices", label: "Invoices" },
  ];
  const vetOnly = [
    { to: "/health", label: "Health" },
    { to: "/reports", label: "Reports" }, // if vets should see reports
    { to: "/appointments", label: "Appointments" },

  ];
  const adminOnly = [
    { to: "/vets", label: "Vets" },
    { to: "/owners", label: "Owners" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ];

  let items = common;
  if (role === "ADMIN") items = allForAdmin;            // ⬅️ everything visible
  else if (role === "OWNER") items = [...common, ...ownerOnly];
  else if (role === "VET") items = [...common, ...vetOnly];

  return (
    <Fragment>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className={linkClassName}>
          {it.label}
        </NavLink>
      ))}
    </Fragment>
  );
}
