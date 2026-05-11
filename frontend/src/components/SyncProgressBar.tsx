import React from "react";

interface SyncProgressBarProps {
  status?: string;
  processed: number;
  total: number | null;
  compact?: boolean;
}

const SyncProgressBar: React.FC<SyncProgressBarProps> = ({ status, processed, total, compact = false }) => {
  const isCompleted = status === "completed";
  const isError = status === "error";
  
  // Calculate percentage
  let percentage = 0;
  if (total && total > 0) {
    percentage = Math.round((processed / total) * 100);
  } else if (status === "fetching") {
    percentage = 15;
  } else if (status === "indexing" || status === "syncing") {
    percentage = 45;
  } else if (isCompleted) {
    percentage = 100;
  }

  // Handle idle state
  if (!status || (!processed && !total && !isCompleted && !isError)) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'mt-1' : 'mt-4'}`}>
        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden opacity-30">
          <div className="h-full bg-on-surface-variant/20 w-full" />
        </div>
        {!compact && (
          <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-tighter opacity-50">
            Auto-Syncing
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      <div className="flex justify-between items-center text-[10px] font-mono tracking-tighter">
        <span className={`uppercase font-bold ${isError ? 'text-error' : isCompleted ? 'text-primary' : 'text-on-surface-variant'}`}>
          {isError ? "Sync Error" : isCompleted ? "Synced" : `${status}...`}
        </span>
        <span className="text-on-surface/70">
          {isCompleted ? `${processed.toLocaleString()} files` : `${processed}${total ? ` / ${total}` : ''}`} ({percentage}%)
        </span>
      </div>
      
      <div className={`${compact ? 'h-1' : 'h-1.5'} w-full bg-surface-container-highest rounded-full overflow-hidden relative`}>
        {/* Animated Background Shimmer for active state */}
        {!isCompleted && !isError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer -translate-x-full" />
        )}
        
        <div 
          className={`h-full transition-all duration-700 ease-out relative ${
            isError ? 'bg-error' : 'bg-gradient-to-r from-primary via-indigo-400 to-primary-container'
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* Pulsing glow at the tip */}
          {!isCompleted && !isError && (
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[4px] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncProgressBar;
