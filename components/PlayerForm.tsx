import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';

interface PlayerFormProps {
  onSubmit: (id: number) => void;
  isLoading: boolean;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(input.trim(), 10);
    if (!isNaN(id) && id > 0) {
      onSubmit(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits to be entered
    if (/^\d*$/.test(value)) {
      setInput(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mb-8 relative group">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-theme animate-pulse">
           <ChevronRight className="w-5 h-5" />
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={input}
          onChange={handleChange}
          placeholder="ENTER_ACCOUNT_ID..."
          className="w-full terminal-input bg-black text-theme border border-theme-dim py-4 px-4 pl-12 transition-all placeholder-theme-dim/70 text-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          disabled={isLoading}
          autoFocus
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !input}
          className="absolute right-2 hover-bg-theme text-theme border border-theme text-xs font-bold py-2 px-4 uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'PROCESSING...' : 'EXECUTE'}
        </button>
      </div>
      <p className="text-[10px] text-theme-dim mt-2 text-center uppercase tracking-widest opacity-80">
        EXAMPLE_TARGET: 88470560
      </p>
    </form>
  );
};

export default PlayerForm;