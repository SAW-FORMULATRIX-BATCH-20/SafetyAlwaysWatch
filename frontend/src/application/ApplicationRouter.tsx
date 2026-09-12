import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { PersonaLogin } from "../personas/PersonaLogin";
import { ApplicationShell } from "./ApplicationShell";
import { getPersona, type Persona, type PersonaRole } from "./personas";
import { legacyRouteRedirects, routes, type RouteDefinition } from "./routes";
import type { SawApplicationCapabilities } from "../services/saw-service";

function RestrictedAccess({ persona }: { persona: Persona }) {
  return (
    <section className="mx-auto max-w-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <LockKeyhole aria-hidden="true" className="size-6 text-amber-700" />
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800">Access control</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Restricted access</h1>
      <p className="mt-3 leading-6 text-slate-700">This page is not available to the {persona.name} persona. Choose a workspace that matches your role.</p>
      <Button className="mt-6" onClick={() => window.history.back()} variant="outline">Go back</Button>
    </section>
  );
}

function ProtectedFeaturePage({ page, persona, service }: { page: RouteDefinition; persona: Persona; service: SawApplicationCapabilities }) {
  if (!page.roles.includes(persona.role)) return <RestrictedAccess persona={persona} />;
  return page.render(persona, service);
}

export function ApplicationRouter({
  initialPersona,
  service,
}: {
  initialPersona?: PersonaRole;
  service: SawApplicationCapabilities;
}) {
  const [role, setRole] = useState<PersonaRole | undefined>(initialPersona);
  const navigate = useNavigate();
  const persona = role ? getPersona(role) : undefined;

  const login = (nextRole: PersonaRole) => {
    setRole(nextRole);
    navigate(getPersona(nextRole).landingPath, { replace: true });
  };

  const logout = () => {
    setRole(undefined);
    navigate("/login", { replace: true });
  };

  if (!persona) {
    return <Routes><Route path="*" element={<PersonaLogin onLogin={login} />} /></Routes>;
  }

  return (
    <ApplicationShell onLogout={logout} persona={persona}>
      <Routes>
        <Route path="/login" element={<Navigate replace to={persona.landingPath} />} />
        <Route path="/" element={<Navigate replace to={persona.landingPath} />} />
        {Object.entries(legacyRouteRedirects).map(([legacyPath, canonicalPath]) => <Route element={<Navigate replace to={canonicalPath} />} key={legacyPath} path={legacyPath} />)}
        {routes.map((page) => <Route element={<ProtectedFeaturePage page={page} persona={persona} service={service} />} key={page.path} path={page.path} />)}
        <Route path="*" element={<Navigate replace to={persona.landingPath} />} />
      </Routes>
    </ApplicationShell>
  );
}
