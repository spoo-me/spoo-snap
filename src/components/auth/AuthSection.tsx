import { Key, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth";

/**
 * Single "Sign in" button that opens a dialog with Email and API Key tabs.
 * Only renders for anonymous users.
 */
export function AuthSection() {
  const { mode } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (mode !== "anonymous") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <LogIn className="size-3" />
          Sign in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Sign in to spoo.me</DialogTitle>
          <DialogDescription>Manage URLs, view analytics, and more</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="email">
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1 text-xs">
              <LogIn className="size-3 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="apikey" className="flex-1 text-xs">
              <Key className="size-3 mr-1" />
              API Key
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="mt-3">
            <LoginForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="apikey" className="mt-3">
            <ApiKeyForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="login-email" className="text-xs">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="login-password" className="text-xs">
            Password
          </Label>
          <Input
            id="login-password"
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
      <Button type="submit" size="sm" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
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

function ApiKeyForm({ onSuccess }: { onSuccess: () => void }) {
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
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="dialog-apikey" className="text-xs">
          API Key
        </Label>
        <Input
          id="dialog-apikey"
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
      <Button type="submit" size="sm" className="w-full" disabled={!key.trim()}>
        Connect
      </Button>
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
