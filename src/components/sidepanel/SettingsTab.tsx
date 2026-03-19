import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/use-settings";
import type { ExtensionSettings } from "@/schemas/settings";

export function SettingsTab() {
  const {
    settings,
    updateSettings,
    updateNotification,
    toggleAutoCopy,
    toggleAutoShorten,
    setTheme,
  } = useSettings();

  return (
    <div className="space-y-5">
      {/* Theme */}
      <SettingsSection title="Appearance">
        <div className="space-y-1">
          <Label className="text-xs">Theme</Label>
          <select
            value={settings.theme}
            onChange={(e) => setTheme(e.target.value as ExtensionSettings["theme"])}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </SettingsSection>

      <Separator />

      {/* Behavior */}
      <SettingsSection title="Behavior">
        <ToggleRow
          label="Auto-copy shortened URL"
          description="Copy to clipboard after shortening"
          checked={settings.autoCopy}
          onChange={toggleAutoCopy}
        />
        <ToggleRow
          label="Auto-shorten on copy"
          description="Shorten URLs when you copy them on any page (opt-in)"
          checked={settings.autoShortenOnCopy}
          onChange={toggleAutoShorten}
        />
      </SettingsSection>

      <Separator />

      {/* Notifications */}
      <SettingsSection title="Notifications">
        <ToggleRow
          label="Stealth mode"
          description="Shorten silently without notifications"
          checked={settings.notification.stealthMode}
          onChange={() => updateNotification({ stealthMode: !settings.notification.stealthMode })}
        />
        <div className="space-y-1">
          <Label className="text-xs">Auto-hide duration: {settings.notification.duration}s</Label>
          <input
            type="range"
            min={1}
            max={60}
            value={settings.notification.duration}
            onChange={(e) => updateNotification({ duration: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1s</span>
            <span>60s</span>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* QR Defaults */}
      <SettingsSection title="QR Code Defaults">
        <ToggleRow
          label="Enable QR codes"
          description="Generate QR code when shortening"
          checked={settings.qr.enabled}
          onChange={() => updateSettings({ qr: { ...settings.qr, enabled: !settings.qr.enabled } })}
        />
        <ToggleRow
          label="Use original URL for QR"
          description="Encode the original URL instead of shortened"
          checked={settings.qr.useOriginalUrl}
          onChange={() =>
            updateSettings({
              qr: { ...settings.qr, useOriginalUrl: !settings.qr.useOriginalUrl },
            })
          }
        />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 rounded border accent-primary"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
