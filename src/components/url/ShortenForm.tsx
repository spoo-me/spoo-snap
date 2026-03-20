import { Check, Copy, Link, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShortenMutation } from "@/hooks/use-shorten";
import { isAnyUrl, normalizeUrl } from "@/lib/url-utils";

export function ShortenForm() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const shorten = useShortenMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!isAnyUrl(trimmed)) return;
    shorten.mutate({ long_url: normalizeUrl(trimmed) });
  };

  const handleCopy = async () => {
    if (!shorten.data) return;
    await navigator.clipboard.writeText(shorten.data.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            // Reset result when input changes
            if (shorten.data) shorten.reset();
          }}
          placeholder="Paste a URL to shorten..."
          className="h-9 text-sm"
          type="url"
        />
        <Button type="submit" size="sm" className="h-9" disabled={shorten.isPending || !url.trim()}>
          {shorten.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Link className="size-4" />
          )}
        </Button>
      </form>

      {shorten.data && (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <a
            href={shorten.data.short_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm font-medium text-primary hover:underline"
          >
            {shorten.data.short_url}
          </a>
          <Button variant="outline" size="icon-xs" onClick={handleCopy}>
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
          </Button>
        </div>
      )}

      {shorten.error && <p className="text-xs text-destructive">{shorten.error.message}</p>}
    </div>
  );
}
