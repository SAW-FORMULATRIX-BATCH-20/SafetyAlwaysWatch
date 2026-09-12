import type { CameraScope } from "../services/saw-service";

export type PersonaRole = "admin" | "supervisor" | "hrd";

export type Persona = {
  role: PersonaRole;
  name: string;
  description: string;
  landingPath: string;
  assignedArea?: string;
};

export const personas: readonly Persona[] = [
  {
    role: "admin",
    name: "Admin/Safety Officer",
    description: "Manage SAW safety operations and configuration.",
    landingPath: "/overview",
  },
  {
    role: "supervisor",
    name: "Area Supervisor",
    description: "Monitor the Hazardous Zones assigned to you.",
    landingPath: "/monitoring/live",
    assignedArea: "Production",
  },
  {
    role: "hrd",
    name: "Human Resources (HR)",
    description: "Review PPE Compliance trends and Employee safety records.",
    landingPath: "/compliance-report",
  },
];

export function getPersona(role: PersonaRole): Persona {
  return personas.find((persona) => persona.role === role)!;
}

export function cameraScopeFor(persona: Persona): CameraScope {
  return persona.role === "supervisor"
    ? { type: "supervisor-area", area: persona.assignedArea ?? "" }
    : "all";
}
