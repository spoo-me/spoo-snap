import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import type { ExtensionSettings } from "@/schemas/settings";

export function SettingsTab() {
  const { settings, updateSettings, updateNotification, toggleAutoCopy, setTheme } = useSettings();

  return (
    <div className="space-y-5">
      {/* Theme */}
      <SettingsSection title="Appearance">
        <div className="space-y-1">
          <Label className="text-xs">Theme</Label>
          <Select
            value={settings.theme}
            onValueChange={(v) => setTheme(v as ExtensionSettings["theme"])}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
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
        <div className="space-y-2">
          <Label className="text-xs">Auto-hide duration: {settings.notification.duration}s</Label>
          <Slider
            min={1}
            max={60}
            step={1}
            value={[settings.notification.duration]}
            onValueChange={([v]) => updateNotification({ duration: v })}
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
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
