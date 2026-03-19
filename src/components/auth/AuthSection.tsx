import { Key, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLogin, useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth";

type AuthView = "status" | "login" | "apikey";

export function AuthSection() {
  const { mode, user } = useAuthStore();
  const [view, setView] = useState<AuthView>("status");

  if (view === "login") return <LoginForm onBack={() => setView("status")} />;
  if (view === "apikey") return <ApiKeyForm onBack={() => setView("status")} />;

  // Anonymous
  if (mode === "anonymous") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Sign in for URL management & analytics</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setView("login")}>
            <LogIn className="size-3.5" data-icon="inline-start" />
            Sign in
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setView("apikey")}>
            <Key className="size-3.5" data-icon="inline-start" />
            API Key
          </Button>
        </div>
      </div>
    );
  }

  // API Key mode
  if (mode === "apikey") {
    return <AuthenticatedBadge label="API Key" onSignOut={() => setView("status")} />;
  }

  // JWT mode
  return (
    <AuthenticatedUser
      name={user?.user_name ?? user?.email ?? "User"}
      avatarUrl={user?.pfp?.url ?? undefined}
    />
  );
}

function AuthenticatedUser({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const logout = useLogout();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="text-[10px]">{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate text-sm font-medium">{name}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        title="Sign out"
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}

function AuthenticatedBadge({ label, onSignOut }: { label: string; onSignOut: () => void }) {
  const { clearAuth } = useAuthStore();

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        <Key className="size-3 mr-1" />
        {label}
      </Badge>
      <span className="flex-1" />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={async () => {
          await clearAuth();
          onSignOut();
        }}
        title="Disconnect"
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}

function LoginForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  // Auto-switch back to status view on success
  if (login.isSuccess) {
    onBack();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-8 text-sm"
            required
          />
        </div>
      </div>
      {login.error && <p className="text-xs text-destructive">{login.error.message}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={login.isPending}>
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
      <Separator />
      <p className="text-[11px] text-center text-muted-foreground">
        Don't have an account?{" "}
        <a
          href="https://spoo.me/register"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Register on spoo.me
        </a>
      </p>
    </form>
  );
}

function ApiKeyForm({ onBack }: { onBack: () => void }) {
  const [key, setKey] = useState("");
  const { setApiKeyAuth } = useAuthStore();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith("spoo_")) {
      setError("API key must start with 'spoo_'");
      return;
    }
    await setApiKeyAuth(trimmed);
    onBack();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="apikey" className="text-xs">
          API Key
        </Label>
        <Input
          id="apikey"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError("");
          }}
          placeholder="spoo_..."
          className="h-8 text-sm font-mono"
          required
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={!key.trim()}>
          Connect
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Get an API key from{" "}
        <a
          href="https://spoo.me/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          your dashboard
        </a>
      </p>
    </form>
  );
}
