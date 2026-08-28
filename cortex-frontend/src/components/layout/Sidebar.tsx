import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ListChecks,
  Sparkles,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const baseLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/deals", label: "Deals", icon: Briefcase },
  { to: "/activities", label: "Activities", icon: ListChecks },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const role = useAuthStore((s) => s.role);
  const canAudit = role === "ADMIN" || role === "MANAGER";

  const links = canAudit
    ? [...baseLinks, { to: "/audit", label: "Audit Log", icon: Shield }]
    : baseLinks;

  const navContent = (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2.5 border-b border-border/50 px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm shadow-primary/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">CortexCRM</span>
        </div>
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={onMobileClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "group flex h-11 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-150",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t px-5 py-3 text-xs text-muted-foreground">
        CortexCRM v1.0.0
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r bg-card md:flex">
        {navContent}
      </aside>

      {/* Mobile slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card shadow-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
