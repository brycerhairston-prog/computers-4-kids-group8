import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const emojis = ["😕", "😐", "🙂", "😊", "🤩"];

const FeedbackDialog = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    toast.success(t("feedback.thanks"));
    setRating(null);
    setComment("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-xs" aria-label={t("feedback.title")}>
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" /> {t("feedback.title")}
          </DialogTitle>
          <DialogDescription>{t("feedback.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("feedback.experience")}</p>
            <div className="flex gap-2 justify-center">
              {emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    rating === i + 1
                      ? "bg-primary/20 scale-125 ring-2 ring-primary"
                      : "hover:bg-muted hover:scale-110"
                  }`}
                  aria-label={`Rating ${i + 1}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder={t("feedback.tellMore")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={rating === null} className="w-full">
            {t("feedback.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
