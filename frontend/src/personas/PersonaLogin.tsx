import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/ui/button";
import { personas, type PersonaRole } from "../application/personas";

export function PersonaLogin({ onLogin }: { onLogin: (role: PersonaRole) => void }) {
  const [selectedRole, setSelectedRole] = useState<PersonaRole>("admin");

  return (
    <main className="grid min-h-screen bg-slate-950 p-5 text-slate-100 lg:grid-cols-[minmax(0,1fr)_30rem] lg:p-8">
      <section className="hidden border border-slate-800 bg-slate-900 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="font-mono text-sm tracking-[0.24em] text-amber-400">SAW</div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-400">Safety Always Watch</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white">Run workplace safety operations with clarity.</h1>
          <p className="mt-4 max-w-lg text-slate-400">Enter the demo environment to review the SAW experience for your operational role.</p>
        </div>
        <p className="font-mono text-xs text-slate-500">DEMO ENVIRONMENT · ENGLISH</p>
      </section>
      <section className="flex items-center bg-white p-6 text-slate-900 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="font-mono text-sm tracking-[0.24em] text-slate-950 lg:hidden">SAW</div>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Demo access</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to SAW</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Choose a persona to open the workspace with the appropriate access.</p>
          <fieldset className="mt-8 space-y-3">
            <legend className="sr-only">Demo persona</legend>
            {personas.map((persona) => (
              <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-4 transition-colors hover:border-amber-400 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50" key={persona.role}>
                <input checked={selectedRole === persona.role} className="mt-1 accent-amber-500" name="persona" onChange={() => setSelectedRole(persona.role)} type="radio" value={persona.role} />
                <span><span className="block font-medium">{persona.name}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{persona.description}</span></span>
              </label>
            ))}
          </fieldset>
          <Button className="mt-8 w-full" onClick={() => onLogin(selectedRole)}>Sign in to SAW<ChevronRight aria-hidden="true" className="ml-1 size-4" /></Button>
        </div>
      </section>
    </main>
  );
}
