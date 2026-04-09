import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/context/SettingsContext";

const SettingsPanel = () => {
  const { theme, setTheme, colorblindMode, setColorblindMode, textSize, setTextSize } = useSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-xs">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Settings
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle light/dark theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Colorblind */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Colorblind Mode</p>
              <p className="text-xs text-muted-foreground">Use blue/yellow for made/missed</p>
            </div>
            <Switch
              checked={colorblindMode}
              onCheckedChange={setColorblindMode}
            />
          </div>

          {/* Text Size */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Text Size</p>
              <p className="text-xs text-muted-foreground">Adjust the display text size</p>
            </div>
            <RadioGroup value={textSize} onValueChange={(v) => setTextSize(v as "sm" | "md" | "lg")} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="sm" id="ts-sm" />
                <Label htmlFor="ts-sm" className="text-xs cursor-pointer">Small</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="md" id="ts-md" />
                <Label htmlFor="ts-md" className="text-sm cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="lg" id="ts-lg" />
                <Label htmlFor="ts-lg" className="text-base cursor-pointer">Large</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
