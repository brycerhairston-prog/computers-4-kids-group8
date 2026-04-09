import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emojis = ["😕", "😐", "🙂", "😊", "🤩"];

const FeedbackDialog = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    toast.success("Thanks for your feedback! 🎉");
    setRating(null);
    setComment("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-xs">
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Send Feedback
          </DialogTitle>
          <DialogDescription>Let us know how we can improve!</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">How's your experience?</p>
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
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Tell us more (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={rating === null} className="w-full">
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
