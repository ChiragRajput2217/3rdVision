import React from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';

interface GoogleLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-800 font-semibold py-3.5 px-6 rounded-xl border border-stone-300 shadow-xs hover:border-amber-600 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <svg className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
        />
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
        />
        <path
          fill="#FBBC05"
          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.4-.7-.6-1.5-.6-2.3z"
        />
        <path
          fill="#34A853"
          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
        />
      </svg>
      <span className="text-stone-800 font-semibold group-hover:text-stone-900">
        {isLoading ? 'Authenticating with Google...' : 'Continue with Google Account'}
      </span>
      <LogIn className="w-4 h-4 ml-auto text-stone-400 group-hover:text-amber-700 transition-colors" />
    </button>
  );
};
