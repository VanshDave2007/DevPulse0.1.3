import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Heart,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FeedbackCategory =
  | 'General Experience'
  | 'Code Analysis Quality'
  | 'Feature Request'
  | 'Bug / UI Issue'
  | 'AI / Tutor Assistance'
  | 'Performance & Speed';

export interface StoredFeedback {
  id: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  userEmail?: string;
  activeTab: string;
  timestamp: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, activeTab, addToast } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('General Experience');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setCategory('General Experience');
      setMessage('');
      setSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ESC key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: FeedbackCategory[] = [
    'General Experience',
    'Code Analysis Quality',
    'Feature Request',
    'Bug / UI Issue',
    'AI / Tutor Assistance',
    'Performance & Speed',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast({
        title: 'Feedback Required',
        description: 'Please write a brief message before submitting.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackEntry: StoredFeedback = {
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        rating,
        category,
        message: message.trim(),
        userEmail: user?.email || userProfile?.email || undefined,
        activeTab,
        timestamp: new Date().toISOString(),
      };

      // Persist feedback history in localStorage
      const existingRaw = localStorage.getItem('devpulse_user_feedbacks');
      const existingList: StoredFeedback[] = existingRaw ? JSON.parse(existingRaw) : [];
      existingList.unshift(feedbackEntry);
      localStorage.setItem('devpulse_user_feedbacks', JSON.stringify(existingList.slice(0, 50)));

      setIsSubmitting(false);
      setSubmitted(true);

      addToast({
        title: 'Feedback Received',
        description: 'Thank you for sharing your experience! Your feedback directly shapes DevPulse.',
        type: 'success',
      });

      // Auto close modal after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to save feedback:', err);
      setIsSubmitting(false);
      addToast({
        title: 'Submission Error',
        description: 'Could not record feedback. Please try again.',
        type: 'error',
      });
    }
  };

  const modalContent = (
    <div
      id="devpulse-feedback-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-pulse-elevated border-b border-pulse-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="text-base sm:text-lg font-bold text-pulse-primary">
                Share Your Feedback
              </h2>
              <p className="text-xs text-pulse-secondary">
                Help us improve the DevPulse engineering intelligence platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-surface border border-transparent hover:border-pulse-subtle transition cursor-pointer"
            aria-label="Close Feedback Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-pulse-primary">Thank You!</h3>
              <p className="text-xs text-pulse-secondary max-w-xs mx-auto">
                Your feedback has been successfully recorded. We appreciate your insights!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto [scrollbar-width:thin]">
            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-pulse-secondary uppercase tracking-wider block">
                Rate your experience
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentActive = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1.5 rounded-xl hover:bg-pulse-elevated transition cursor-pointer focus:outline-hidden"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-6 w-6 transition-transform hover:scale-115 ${
                          currentActive
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-pulse-muted hover:text-pulse-secondary'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-mono font-bold text-pulse-primary ml-2">
                  {rating === 5 && '🌟 Exceptional'}
                  {rating === 4 && '👍 Great'}
                  {rating === 3 && '👌 Good'}
                  {rating === 2 && '⚠️ Needs Work'}
                  {rating === 1 && '🚨 Poor'}
                </span>
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-pulse-secondary uppercase tracking-wider block">
                Topic Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-medium border transition cursor-pointer truncate ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-300 font-semibold'
                          : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:border-pulse-strong hover:text-pulse-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="feedback-message-textarea"
                  className="text-xs font-mono font-semibold text-pulse-secondary uppercase tracking-wider"
                >
                  Your Message
                </label>
                <span className="text-[10px] font-mono text-pulse-muted">
                  {message.length}/1000
                </span>
              </div>
              <textarea
                id="feedback-message-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                rows={4}
                required
                placeholder="What did you like? What was confusing or could be improved? Feel free to mention features or analyzers..."
                className="w-full rounded-2xl bg-pulse-elevated border border-pulse-subtle p-3 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-hidden focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition resize-none"
              />
            </div>

            {/* User context note */}
            <div className="flex items-center justify-between text-[11px] text-pulse-muted font-mono pt-1">
              <span>View: {activeTab}</span>
              <span>{user?.email || 'Anonymous Developer'}</span>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-surface text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
