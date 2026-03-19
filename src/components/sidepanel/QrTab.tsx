import { Download, QrCode } from "lucide-react";
import { useState } from "react";
import { classicQrUrl, gradientQrUrl } from "@/api/qr";
import type { GradientDirection, ModuleStyle } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QrTab() {
  const [content, setContent] = useState("");
  const [style, setStyle] = useState<"classic" | "gradient">("classic");
  const [moduleStyle, setModuleStyle] = useState<ModuleStyle>("rounded");
  const [color, setColor] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [gradientStart, setGradientStart] = useState("#6a1a4c");
  const [gradientEnd, setGradientEnd] = useState("#40353c");
  const [direction, setDirection] = useState<GradientDirection>("vertical");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generate = () => {
    const text = content.trim();
    if (!text) return;

    if (style === "gradient") {
      setPreviewUrl(
        gradientQrUrl({
          content: text,
          start: gradientStart,
          end: gradientEnd,
          background,
          style: moduleStyle,
          direction,
        }),
      );
    } else {
      setPreviewUrl(
        classicQrUrl({
          content: text,
          color,
          background,
          style: moduleStyle,
        }),
      );
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `qr-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Content</Label>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="URL or text to encode..."
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Style</Label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as "classic" | "gradient")}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
          >
            <option value="classic">Classic</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Module</Label>
          <select
            value={moduleStyle}
            onChange={(e) => setModuleStyle(e.target.value as ModuleStyle)}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
          >
            <option value="rounded">Rounded</option>
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="gapped">Gapped</option>
            <option value="horizontal_bars">H. Bars</option>
            <option value="vertical_bars">V. Bars</option>
          </select>
        </div>
      </div>

      {style === "classic" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-8 cursor-pointer rounded border p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">{color}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="size-8 cursor-pointer rounded border p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">{background}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientStart}
                  onChange={(e) => setGradientStart(e.target.value)}
                  className="size-8 cursor-pointer rounded border p-0.5"
                />
                <span className="text-xs text-muted-foreground font-mono">{gradientStart}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientEnd}
                  onChange={(e) => setGradientEnd(e.target.value)}
                  className="size-8 cursor-pointer rounded border p-0.5"
                />
                <span className="text-xs text-muted-foreground font-mono">{gradientEnd}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Direction</Label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as GradientDirection)}
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="radial">Radial</option>
              <option value="square">Square</option>
            </select>
          </div>
        </div>
      )}

      <Button onClick={generate} className="w-full" size="sm" disabled={!content.trim()}>
        <QrCode className="size-3.5" data-icon="inline-start" />
        Generate QR Code
      </Button>

      {previewUrl && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
          <img
            src={previewUrl}
            alt="QR Code"
            className="size-48 rounded-md"
            crossOrigin="anonymous"
          />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-3.5" data-icon="inline-start" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
