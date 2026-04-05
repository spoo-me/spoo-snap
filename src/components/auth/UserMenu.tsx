import { ExternalLink, Key, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth";

/**
 * Avatar button with dropdown menu showing user info and logout.
 * Used in both popup and sidepanel headers.
 */
export function UserMenu({ size = "sm" }: { size?: "sm" | "md" }) {
  const { mode, user } = useAuthStore();
  const logout = useLogout();

  if (mode === "anonymous") return null;

  const name = user?.user_name ?? (mode === "apikey" ? "API Key" : (user?.email ?? "User"));
  const avatarSize = size === "sm" ? "size-5" : "size-6";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="rounded-full">
          <Avatar className={avatarSize}>
            {mode === "jwt" && <AvatarImage src={user?.pfp?.url ?? undefined} />}
            <AvatarFallback className="text-[9px]">
              {mode === "apikey" ? <Key className="size-3" /> : name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{name}</p>
          {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
          {mode === "apikey" && (
            <p className="text-xs text-muted-foreground">Connected via API Key</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mode === "jwt" && (
          <DropdownMenuItem asChild>
            <a href="https://spoo.me/dashboard" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Dashboard
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
