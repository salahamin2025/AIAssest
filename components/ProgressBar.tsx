import React from 'react';

export const ProgressBar: React.FC = () => {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-900/50 overflow-hidden"
      role="progressbar"
      aria-busy="true"
      aria-valuetext="Loading..."
    >
      <div className="progress-bar-indeterminate h-full w-full bg-blue-600"></div>
    </div>
  );
};
