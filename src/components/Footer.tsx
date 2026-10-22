import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0F1733] text-[#CBD5E1] text-[12px] sm:text-[13px] py-5 border-t border-[#1E2A5A]/50 mt-auto select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left leading-relaxed">
        {/* Left branding */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <span className="font-semibold text-white tracking-wide">
            Watchdog · Kritical Hacks 2026
          </span>
          <span className="hidden sm:inline text-[#94A3B8]">|</span>
          <span className="text-[#94A3B8]">Team Tech Spartans</span>
        </div>

        {/* Team leader & members */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-[#94A3B8]">
          <span>
            <strong className="text-white font-medium">Team Leader:</strong> Lakshit Goyal
          </span>
          <span className="hidden sm:inline text-[#475569]">·</span>
          <span>
            <strong className="text-white font-medium">Members:</strong> Prajjwal Hedaoo, Aarv Singhal, Gangadhar, Bharat Uniyal
          </span>
        </div>
      </div>
    </footer>
  );
};
