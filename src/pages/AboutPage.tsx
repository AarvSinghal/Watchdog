import React from 'react';
import {
  Globe,
  Radio,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  Code2,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-12 animate-in fade-in duration-200">
      {/* Title & Tagline */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#0E9AA7] dark:text-[#76E4EC] uppercase">
          ABOUT WATCHDOG
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#1E2A5A] dark:text-white tracking-tight">
          One tracker for anything on the web.
        </h1>
        <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed">
          Turning unstructured websites into personal structured feeds with autonomous web agents and smart diff alerts.
        </p>
      </div>

      {/* 1. Problem */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-sm space-y-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E8734A]">
          The Core Challenge
        </span>
        <h2 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white">
          &ldquo;The web has no API for the things you actually care about.&rdquo;
        </h2>
        <p className="text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
          Most pages send no alerts, so people refresh by hand and miss openings, discounts, stock changes and scholarship deadlines. Visualping, Distill and Google Alerts suit page or keyword alerts; job and price trackers are single-purpose and break on most sites. Watchdog extracts structured fields from any page and compares them in one feed.
        </p>
      </div>

      {/* 2. How It Works (5 steps) */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0E9AA7]">
            Workflow Architecture
          </span>
          <h2 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white mt-1">
            How Watchdog Works in 5 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            {
              step: '01',
              title: 'Enter a URL',
              desc: 'Give any link—from an internship portal to an e-commerce product.',
            },
            {
              step: '02',
              title: 'Describe Goal',
              desc: 'State what to watch in plain English (e.g. price drops or deadlines).',
            },
            {
              step: '03',
              title: 'Choose Cadence',
              desc: 'Set automatic checks: hourly, 6-hourly, daily, or manual.',
            },
            {
              step: '04',
              title: 'TinyFish Agent',
              desc: 'The web agent navigates the live page and streams structured JSON.',
            },
            {
              step: '05',
              title: 'Smart Diff Alert',
              desc: 'Watchdog compares with the last snapshot and alerts you on true changes.',
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-[#0E9AA7] dark:text-[#76E4EC]">
                  {s.step}
                </span>
                <h3 className="font-display font-semibold text-sm text-[#1E2A5A] dark:text-white mt-1">
                  {s.title}
                </h3>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. AI in Three Moments */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-[#FAF8F4] via-[#CFEDEF]/20 to-[#ECE9F8]/30 dark:from-[#131B3A] dark:to-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] space-y-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0E9AA7]">
            Intelligence Design
          </span>
          <h2 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white mt-1">
            AI in Three Key Moments
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            No machine learning training or fragile scrapers required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#0E9AA7]/10 text-[#0E9AA7] flex items-center justify-center mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-display font-semibold text-sm text-[#1E2A5A] dark:text-white">
              1. Understand the Goal (LLM)
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
              Gemini parses freeform sentences into schema parameters, numeric operators, and cadence rules.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#0E9AA7]/10 text-[#0E9AA7] flex items-center justify-center mb-2.5">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="font-display font-semibold text-sm text-[#1E2A5A] dark:text-white">
              2. Navigate Sites (TinyFish)
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
              TinyFish headless browser agent overcomes dynamic SPAs, DOM quirks, and bot challenges.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#0E9AA7]/10 text-[#0E9AA7] flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-display font-semibold text-sm text-[#1E2A5A] dark:text-white">
              3. Normalize & Rank (LLM)
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
              Scores items 0-100 against candidate profile with strict prompt injection guardrails.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Tech Stack Cards */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white">
          Production Tech Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'React + TypeScript + Tailwind', role: 'Frontend with hash routing (#/)' },
            { name: 'Node.js + Express', role: 'Secure backend proxy & rate limiter' },
            { name: 'TinyFish Agent API', role: 'Live browser streaming via run-sse' },
            { name: 'Gemini / Claude SDK', role: 'Natural language parsing & scoring' },
            { name: 'Browser Storage (v2)', role: 'Safe localStorage & JSON backup' },
            { name: 'Recharts & Motion', role: 'Price area charts & subtle transitions' },
          ].map((t, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs"
            >
              <p className="font-mono text-xs font-bold text-[#1E2A5A] dark:text-white">
                {t.name}
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TinyFish Integration & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-xs space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0E9AA7]">
            API Precision
          </span>
          <h3 className="font-display font-bold text-lg text-[#1E2A5A] dark:text-white">
            TinyFish Integration
          </h3>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
            URL + goal + output_schema in, structured JSON out; live browser stream; stealth mode for protected sites; retries and clear errors.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-xs space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1B8A5A]">
            Measurable Value
          </span>
          <h3 className="font-display font-bold text-lg text-[#1E2A5A] dark:text-white">
            Real Human Impact
          </h3>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
            Checking 5 pages a day at 3 minutes each costs about 90 hours a year; Watchdog turns it into one alert feed.
          </p>
        </div>
      </div>

      {/* 6. Roadmap */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-[#1E2A5A] dark:text-white">
            Future Product Roadmap
          </h3>
          <span className="text-[11px] font-mono text-[#94A3B8]">Upcoming Releases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            '24/7 background checks with cloud sync',
            'Email, WhatsApp and Telegram notifications',
            'Discover mode (find the pages for you)',
            'Login-protected pages',
            'Compare watches side by side',
            'Shared team watches',
            'Browser extension',
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8]/60 dark:border-[#24305E] text-xs flex items-center justify-between gap-2"
            >
              <span className="text-[#475569] dark:text-[#CBD5E1] font-medium">{item}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#CFEDEF] text-[#0E9AA7] dark:bg-[#0E9AA7]/20 shrink-0">
                Proposed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
