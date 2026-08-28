import { User } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { name, email, role, userId } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account details</p>
        </div>
      </div>

      {/* detail card */}
      <div className="max-w-lg overflow-hidden rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold leading-tight">{name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{email ?? "—"}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="divide-y divide-border/60">
          <Field label="Email" value={email ?? "—"} />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="secondary">{role ?? "—"}</Badge>
          </div>
          <Field label="User ID" value={userId != null ? `#${userId}` : "—"} />
        </div>
      </div>
    </div>
  );
}
