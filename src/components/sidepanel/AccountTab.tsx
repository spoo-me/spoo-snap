import { ExternalLink, Key, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogout } from "@/hooks/use-auth";
import { useApiKeys, useDeleteApiKey } from "@/hooks/use-keys";
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

function ProfileSection({
  user,
}: {
  user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;
}) {
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
  const deleteKey = useDeleteApiKey();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          API Keys
        </h3>
        <a
          href="https://spoo.me/dashboard/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          New key
        </a>
      </div>

      {isLoading && <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />}
      {error && <p className="text-xs text-destructive">{error.message}</p>}

      {data && data.keys.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No API keys. Create one on your{" "}
          <a
            href="https://spoo.me/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            dashboard
          </a>
          .
        </p>
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
