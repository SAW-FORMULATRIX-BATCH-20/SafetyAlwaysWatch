import { animate, createScope, stagger } from "animejs";
import {
    Activity,
    AlertTriangle,
    Bell,
    Camera,
    FileCheck2,
    HardHat,
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    RotateCcw,
    ShieldAlert,
    Users,
    Video,
    X,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "../components/ui/button";
import type { Persona } from "./personas";
import { navigationGroupLabels, routes } from "./routes";

const routeIcons: Record<string, LucideIcon> = {
    "/overview": LayoutDashboard,
    "/compliance-report": FileCheck2,
    "/monitoring/live": Video,
    "/violations": ShieldAlert,
    "/employees": Users,
    "/camera-sources": Camera,
    "/hazardous-zones": AlertTriangle,
    "/canonical-ppe-classes": HardHat,
    "/score-reset": RotateCcw,
    "/notifications": Bell,
};

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
    const navRef = useRef<HTMLElement>(null);
    const uncollapseBtnRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

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

    // Smooth Anime.js transitions when sidebar collapses or expands
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) return;

        if (!isCollapsed && navRef.current) {
            const listItems = navRef.current.querySelectorAll("li");
            if (listItems.length > 0) {
                animate(listItems, {
                    opacity: [0, 1],
                    translateX: [-6, 0],
                    delay: stagger(15),
                    duration: 200,
                    ease: "outQuad",
                });
            }
        } else if (isCollapsed && uncollapseBtnRef.current) {
            animate(uncollapseBtnRef.current, {
                opacity: [0, 1],
                scale: [0.8, 1],
                duration: 180,
                ease: "outQuad",
            });
        }
    }, [isCollapsed]);

    // Smooth Anime.js transition when mobile drawer opens
    useEffect(() => {
        if (!isMobileOpen) return;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion || !navRef.current) return;

        const listItems = navRef.current.querySelectorAll("li");
        if (listItems.length > 0) {
            animate(listItems, {
                opacity: [0, 1],
                translateX: [-8, 0],
                delay: stagger(18),
                duration: 220,
                ease: "outQuad",
            });
        }
    }, [isMobileOpen]);

    // Close mobile drawer on route navigation
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    // Close mobile drawer on Escape key press
    useEffect(() => {
        if (!isMobileOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isMobileOpen]);

    return (
        <div
            className={`min-h-screen bg-slate-100 transition-[grid-template-columns] duration-300 ease-in-out lg:grid ${
                isCollapsed
                    ? "lg:grid-cols-[3.5rem_minmax(0,1fr)]"
                    : "lg:grid-cols-[17rem_minmax(0,1fr)]"
            }`}
            ref={shellRef}
        >
            {/* Mobile backdrop */}
            {isMobileOpen && (
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Aside */}
            <aside
                aria-label="Sidebar navigation"
                className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-200 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0 ${
                    isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                } ${
                    isCollapsed
                        ? "w-72 max-w-[85vw] lg:w-14 px-2 py-4"
                        : "w-72 max-w-[85vw] lg:w-[17rem] px-4 py-5"
                }`}
            >
                {isCollapsed ? (
                    /* Collapsed state on desktop: ONLY the uncollapse icon */
                    <div className="hidden lg:flex flex-col items-center" ref={uncollapseBtnRef}>
                        <button
                            aria-label="Uncollapse sidebar"
                            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                            onClick={() => setIsCollapsed(false)}
                            title="Uncollapse sidebar"
                            type="button"
                        >
                            <PanelLeftOpen className="size-5" />
                        </button>
                    </div>
                ) : (
                    /* Expanded state: Brand & Toggle Header */
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Link
                                aria-label="SAW home"
                                className="font-mono text-lg font-medium tracking-[0.2em] text-white hover:text-amber-400 transition-colors"
                                to={persona.landingPath}
                            >
                                SAW
                            </Link>
                            <span className="rounded bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-950">
                                DEMO
                            </span>
                        </div>

                        {/* Desktop collapse toggle button inside aside */}
                        <button
                            aria-label="Collapse sidebar"
                            className="hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors lg:inline-flex"
                            onClick={() => setIsCollapsed(true)}
                            title="Collapse sidebar"
                            type="button"
                        >
                            <PanelLeftClose className="size-4" />
                        </button>

                        {/* Mobile close button */}
                        <button
                            aria-label="Close sidebar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors lg:hidden"
                            onClick={() => setIsMobileOpen(false)}
                            type="button"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}

                {/* Mobile close button when isCollapsed on desktop is true but opened on mobile */}
                {isCollapsed && isMobileOpen && (
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 lg:hidden">
                        <div className="flex items-center gap-2">
                            <Link
                                aria-label="SAW home"
                                className="font-mono text-lg font-medium tracking-[0.2em] text-white"
                                to={persona.landingPath}
                            >
                                SAW
                            </Link>
                            <span className="rounded bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-950">
                                DEMO
                            </span>
                        </div>
                        <button
                            aria-label="Close sidebar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                            onClick={() => setIsMobileOpen(false)}
                            type="button"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}

                {/* Navigation Links: hidden when collapsed on desktop, visible when expanded and on mobile */}
                <nav
                    aria-label="Main navigation"
                    className={`mt-4 flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-1 ${
                        isCollapsed ? "hidden max-lg:block" : "block"
                    }`}
                    ref={navRef}
                >
                    {navigationGroupLabels.map((group) => {
                        const allowedItems = routes.filter(
                            (route) => route.navigation !== false && route.group === group && route.roles.includes(persona.role)
                        );
                        if (allowedItems.length === 0) return null;
                        return (
                            <section key={group}>
                                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 px-2">
                                    {group}
                                </p>
                                <ul className="mt-1 space-y-1">
                                    {allowedItems.map((route) => {
                                        const active = location.pathname === route.path;
                                        const Icon = routeIcons[route.path] ?? Activity;
                                        return (
                                            <li key={route.path}>
                                                <Link
                                                    aria-current={active ? "page" : undefined}
                                                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                                        active
                                                            ? "bg-slate-800 text-white font-medium shadow-xs"
                                                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                                                    }`}
                                                    onClick={() => setIsMobileOpen(false)}
                                                    to={route.path}
                                                >
                                                    <Icon
                                                        className={`size-4 shrink-0 transition-colors ${
                                                            active ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                                                        }`}
                                                    />
                                                    <span className="truncate">{route.title}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex min-w-0 flex-col">
                <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        {/* Mobile hamburger menu toggle */}
                        <button
                            aria-label="Open sidebar"
                            className="mr-1 -ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden focus:outline-hidden"
                            onClick={() => setIsMobileOpen(true)}
                            type="button"
                        >
                            <Menu aria-hidden="true" className="size-5" />
                        </button>

                        <Activity aria-hidden="true" className="size-4 text-amber-600" />
                        <span className="font-medium text-slate-700">Safety operations</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-right text-sm sm:block">
                            <span className="block font-medium text-slate-800">{persona.name}</span>
                            <span className="font-mono text-xs text-slate-500">DEMO-ROLE</span>
                        </span>
                        <Button aria-label="Sign out of SAW" onClick={onLogout} size="sm" variant="outline">
                            <LogOut aria-hidden="true" className="mr-1.5 size-3.5" />
                            Sign out
                        </Button>
                    </div>
                </header>
                <main className="flex-1 p-5 sm:p-8" data-shell-content>
                    {children}
                </main>
            </div>
        </div>
    );
}
