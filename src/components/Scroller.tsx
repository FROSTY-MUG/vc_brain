import React, { forwardRef } from 'react';

export interface ScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  className?: string;
}

const Scroller = forwardRef<HTMLDivElement, ScrollerProps>(
  ({ children, orientation = 'vertical', className = '', ...props }, ref) => {
    // Generate the overflow class based on orientation
    let overflowClass = 'overflow-auto';
    if (orientation === 'vertical') {
      overflowClass = 'overflow-y-auto overflow-x-hidden';
    } else if (orientation === 'horizontal') {
      overflowClass = 'overflow-x-auto overflow-y-hidden';
    }

    return (
      <div
        ref={ref}
        className={`custom-scrollbar ${overflowClass} min-h-0 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Scroller.displayName = 'Scroller';

export default Scroller;
