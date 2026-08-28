import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, Menu, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const ROUTE_LABELS: Record<string, string> = {
  "/":           "Dashboard",
  "/contacts":   "Contacts",
  "/deals":      "Deals",
  "/activities": "Activities",
  "/ai":         "AI Assistant",
  "/audit":      "Audit Log",
  "/profile":    "Profile",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, email, role, clear } = useAuthStore();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? "";

  function handleSignOut() {
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border/50 bg-background/90 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile: hamburger + brand */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-base font-semibold tracking-tight">CortexCRM</span>
      </div>

      {/* Desktop: breadcrumb */}
      {pageLabel && (
        <div className="hidden md:flex items-center gap-1.5 text-sm select-none">
          <span className="text-muted-foreground/70 font-medium">CortexCRM</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/35 shrink-0" />
          <span className="font-medium text-foreground">{pageLabel}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:block text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide select-none">
          {role}
        </span>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
