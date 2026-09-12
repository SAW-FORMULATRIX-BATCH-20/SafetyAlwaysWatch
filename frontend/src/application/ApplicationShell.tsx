import { animate, createScope } from "animejs";
import { Activity, LogOut } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "../components/ui/button";
import type { Persona } from "./personas";
import { navigationGroupLabels, routes } from "./routes";

export function ApplicationShell({
  persona,
  onLogout,
  children,
}: {
  persona: Persona;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope({ root: shellRef });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) {
      scope.add(() => {
        animate("[data-shell-content]", { opacity: [0, 1], duration: 180, ease: "outQuad" });
      });
    }
    return () => scope.revert();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]" ref={shellRef}>
      <aside className="bg-slate-950 px-4 py-5 text-slate-200 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link aria-label="SAW home" className="font-mono text-lg font-medium tracking-[0.2em] text-white" to={persona.landingPath}>SAW</Link>
          <span className="rounded bg-amber-400 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-slate-950">DEMO</span>
        </div>
        <nav aria-label="Main navigation" className="mt-6 space-y-6">
          {navigationGroupLabels.map((group) => {
            const allowedItems = routes.filter((route) => route.group === group && route.roles.includes(persona.role));
            if (allowedItems.length === 0) return null;
            return (
              <section key={group}>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{group}</p>
                <ul className="mt-2 space-y-1">
                  {allowedItems.map((route) => {
                    const active = location.pathname === route.path;
                    return <li key={route.path}><Link aria-current={active ? "page" : undefined} className={`block rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`} to={route.path}>{route.title}</Link></li>;
                  })}
                </ul>
              </section>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Activity aria-hidden="true" className="size-4 text-amber-600" />Safety operations</div>
          <div className="flex items-center gap-3"><span className="hidden text-right text-sm sm:block"><span className="block font-medium text-slate-800">{persona.name}</span><span className="font-mono text-xs text-slate-500">DEMO-ROLE</span></span><Button aria-label="Sign out of SAW" onClick={onLogout} size="sm" variant="outline"><LogOut aria-hidden="true" className="mr-1.5 size-3.5" />Sign out</Button></div>
        </header>
        <main className="flex-1 p-5 sm:p-8" data-shell-content>{children}</main>
      </div>
    </div>
  );
}
