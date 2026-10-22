import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Tag, Briefcase, GraduationCap, Laptop } from 'lucide-react';

interface CommandBarProps {
  onSubmitPrompt: (text: string) => Promise<void>;
  isLoading: boolean;
  onOpenManualModal: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSubmitPrompt,
  isLoading,
  onOpenManualModal,
}) => {
  const [prompt, setPrompt] = useState('');

  const exampleChips = [
    {
      icon: Laptop,
      label: 'Price drop below ₹85k',
      text: 'Tell me when this MacBook Air drops below ₹85,000 https://amazon.in/dp/B0B3CZZV8N',
    },
    {
      icon: Briefcase,
      label: 'Software internships',
      text: 'Find all software engineering internships with deadline within 14 days https://careers.google.com/jobs',
    },
    {
      icon: GraduationCap,
      label: 'Scholarship deadlines',
      text: 'Watch upcoming STEM scholarships with deadlines within 30 days https://scholarships.gov.in',
    },
    {
      icon: Tag,
      label: 'Job openings',
      text: 'Track open backend developer jobs with salary above 12 lakh https://linkedin.com/jobs',
    },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmitPrompt(prompt.trim());
  };

  const handleSelectChip = (chipText: string) => {
    setPrompt(chipText);
    onSubmitPrompt(chipText);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <form
        onSubmit={handleSubmit}
        className="relative group bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] p-2 sm:p-2.5 shadow-md shadow-[#1E2A5A]/5 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#0E9AA7] focus-within:border-transparent"
      >
        <div className="flex items-center gap-3 px-3 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#CFEDEF] to-[#FAF8F4] dark:from-[#0E9AA7]/20 dark:to-[#1E2A5A] flex items-center justify-center text-[#0E9AA7] shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#0E9AA7]" />
            )}
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Describe what to watch, e.g. Tell me when this laptop drops below ₹60,000 https://…"
            className="flex-1 bg-transparent border-0 text-sm sm:text-base text-[#1E2A5A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-0"
          />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all duration-150"
            >
              <span>{isLoading ? 'Parsing...' : 'Create'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Clickable Example Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mr-1">
            Try:
          </span>
          {exampleChips.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectChip(chip.text)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8] hover:text-[#0E9AA7] dark:hover:text-[#76E4EC] hover:border-[#0E9AA7]/40 shadow-2xs transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-[#0E9AA7]" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenManualModal}
          className="text-xs text-[#0E9AA7] dark:text-[#76E4EC] hover:underline font-medium ml-auto"
        >
          or build manually →
        </button>
      </div>
    </div>
  );
};
