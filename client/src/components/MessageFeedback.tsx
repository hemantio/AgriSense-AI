import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Check } from "lucide-react";
import { api } from "@/lib/api-client";

interface MessageFeedbackProps {
  messageId: string;
}

export const MessageFeedback: React.FC<MessageFeedbackProps> = ({ messageId }) => {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (wasHelpful: boolean) => {
    const calculatedRating = wasHelpful ? 5 : 1;
    setRating(calculatedRating);

    if (wasHelpful) {
      setIsSubmitting(true);
      try {
        await api.submitFeedback({
          message_id: messageId,
          rating: calculatedRating,
          was_helpful: true,
        });
        setSubmitted(true);
      } catch (err) {
        console.error("Failed to submit feedback:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setShowCorrection(true);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        message_id: messageId,
        rating: rating,
        was_helpful: false,
        correction: correctionText.trim() || undefined,
      });
      setSubmitted(true);
      setShowCorrection(false);
    } catch (err) {
      console.error("Failed to submit correction feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1 pl-1 font-mono">
        <Check className="w-3 h-3" /> Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex flex-col items-start w-full">
      {!showCorrection ? (
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[10px] text-zinc-500 font-mono">Helpful?</span>
          <button
            onClick={() => handleFeedback(true)}
            disabled={isSubmitting}
            className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900 transition-all cursor-pointer"
            title="Yes, this was helpful"
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={isSubmitting}
            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-all cursor-pointer"
            title="No, incorrect or unhelpful"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleCorrectionSubmit} className="w-full max-w-[90%] mt-1.5 pl-1 flex flex-col gap-1.5">
          <div className="text-[10px] text-zinc-400 font-semibold">What was incorrect? How can we improve?</div>
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="e.g. Category should be seed..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-zinc-700 transition-colors"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !correctionText.trim()}
              className="p-1.5 bg-zinc-900 text-zinc-300 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-900/40 rounded-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="w-3 h-3 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
