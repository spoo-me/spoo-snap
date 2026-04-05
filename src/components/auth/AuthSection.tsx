import { ExternalLink, Key, Loader2, LogIn } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTH_ENDPOINTS } from "@/lib/constants";
import { deviceAuthStateStorage } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth";

/**
 * Single "Sign in" button that opens a dialog with Email and API Key tabs.
 * Only renders for anonymous users.
 */
export function AuthSection() {
  const { mode } = useAuthStore();
  const [open, setOpen] = useState(false);

  // Close dialog when auth succeeds (e.g., device flow completes in background)
  useEffect(() => {
    if (mode !== "anonymous") setOpen(false);
  }, [mode]);

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
            <WebLoginForm />
          </TabsContent>
          <TabsContent value="apikey" className="mt-3">
            <ApiKeyForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function WebLoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleWebLogin = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    const state = crypto.randomUUID();
    await deviceAuthStateStorage.setValue(state);
    try {
      await browser.tabs.create({
        url: `${AUTH_ENDPOINTS.deviceLogin}?app_id=spoo-snap&state=${state}`,
      });
    } catch {
      await deviceAuthStateStorage.setValue(null);
      setPending(false);
      setError("Failed to open sign in page");
    }
  };

  if (pending) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center">
          Waiting for sign in on spoo.me...
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => {
            setPending(false);
            deviceAuthStateStorage.setValue(null);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Sign in securely on spoo.me where you can verify the URL.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={handleWebLogin} size="sm" className="w-full">
        <ExternalLink className="size-3 mr-1" />
        Sign in on spoo.me
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">
        Don't have an account? You can register on spoo.me too.
      </p>
    </div>
  );
}

function ApiKeyForm({ onSuccess }: { onSuccess: () => void }) {
  const [key, setKey] = useState("");
  const { setApiKeyAuth } = useAuthStore();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith("spoo_")) {
      setError("API key must start with 'spoo_'");
      return;
    }
    setPending(true);
    try {
      await setApiKeyAuth(trimmed);
      onSuccess();
    } catch {
      setError("Failed to connect — check your API key and try again");
    } finally {
      setPending(false);
    }
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
      <Button type="submit" size="sm" className="w-full" disabled={!key.trim() || pending}>
        {pending ? "Connecting..." : "Connect"}
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
