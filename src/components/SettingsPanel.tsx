import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";

const SettingsPanel = () => {
  const { theme, setTheme, colorblindMode, setColorblindMode, textSize, setTextSize, fontSize, setFontSize, language, setLanguage } = useSettings();
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-xs" aria-label={t("settings.openSettings")}>
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" aria-hidden="true" /> {t("settings.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Language */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.language")} 🌐</p>
              <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger aria-label={t("settings.language")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.native} ({lang.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.darkMode")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.darkModeDesc")}</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Colorblind */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.colorblind")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.colorblindDesc")}</p>
            </div>
            <Switch
              checked={colorblindMode}
              onCheckedChange={setColorblindMode}
            />
          </div>

          {/* Text Size */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.textSize")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.textSizeDesc")}</p>
            </div>
            <RadioGroup value={textSize} onValueChange={(v) => setTextSize(v as "sm" | "md" | "lg")} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="sm" id="ts-sm" />
                <Label htmlFor="ts-sm" className="text-xs cursor-pointer">{t("settings.small")}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="md" id="ts-md" />
                <Label htmlFor="ts-md" className="text-sm cursor-pointer">{t("settings.medium")}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="lg" id="ts-lg" />
                <Label htmlFor="ts-lg" className="text-base cursor-pointer">{t("settings.large")}</Label>
              </div>
            </RadioGroup>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("settings.fineTune")}</span>
                <span className="text-xs font-medium text-foreground">{fontSize}px</span>
              </div>
              <Slider
                min={8}
                max={32}
                step={1}
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
