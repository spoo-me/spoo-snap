import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ApiKeyScope } from "@/api/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLogout } from "@/hooks/use-auth";
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/hooks/use-keys";
import { useAuthStore } from "@/stores/auth";

export function AccountTab() {
  const { mode, user } = useAuthStore();

  if (mode === "apikey") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <Key className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Connected via API Key</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in with email for full account management
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile */}
      {user && <ProfileSection user={user} />}

      <Separator />

      {/* API Keys */}
      <ApiKeysSection />
    </div>
  );
}

function ProfileSection({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]> }) {
  const logout = useLogout();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Profile
      </h3>
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={user.pfp?.url ?? undefined} />
          <AvatarFallback>
            {(user.user_name ?? user.email ?? "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.user_name ?? "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {user.plan}
        </Badge>
      </div>

      {!user.email_verified && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Email not verified.{" "}
          <a
            href="https://spoo.me/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Verify on dashboard
          </a>
        </p>
      )}

      {user.auth_providers.length > 0 && (
        <div className="flex gap-1.5">
          {user.auth_providers.map((p) => (
            <Badge key={p.provider} variant="outline" className="text-[10px]">
              {p.provider}
            </Badge>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        Sign out
      </Button>
    </div>
  );
}

function ApiKeysSection() {
  const { data, isLoading, error } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyToken, setNewKeyToken] = useState<string | null>(null);

  const handleCreate = () => {
    const scopes: ApiKeyScope[] = ["shorten:create", "urls:read", "stats:read"];
    createKey.mutate(
      { name: newKeyName, scopes },
      {
        onSuccess: (data) => {
          setNewKeyToken(data.token);
          setNewKeyName("");
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          API Keys
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setShowCreate(!showCreate);
            setNewKeyToken(null);
          }}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {showCreate && (
        <div className="space-y-2 rounded-lg border bg-card p-3">
          {newKeyToken ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                Key created! Copy it now — you won't see it again.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">
                  {newKeyToken}
                </code>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => navigator.clipboard.writeText(newKeyToken)}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyToken(null);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. My Extension)"
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleCreate}
                disabled={!newKeyName.trim() || createKey.isPending}
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </Button>
            </>
          )}
        </div>
      )}

      {isLoading && <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />}
      {error && <p className="text-xs text-destructive">{error.message}</p>}

      {data && data.keys.length === 0 && !showCreate && (
        <p className="text-xs text-muted-foreground py-4 text-center">No API keys</p>
      )}

      {data?.keys.map((key) => (
        <div key={key.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Key className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{key.name}</p>
            <div className="flex gap-1 mt-0.5">
              {key.scopes.map((s) => (
                <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          {key.revoked ? (
            <Badge variant="destructive" className="text-[10px]">
              Revoked
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => deleteKey.mutate({ keyId: key.id, revoke: true })}
              disabled={deleteKey.isPending}
              className="text-destructive hover:text-destructive"
              title="Revoke"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
