'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = 'Back', className = '' }: BackButtonProps) {
  // Create a handler that ensures the event is passed to the onClick function
  const handleClick = (e: React.MouseEvent) => {
    // Prevent default to avoid any browser navigation interference
    e.preventDefault();
    // Call the provided onClick handler with the event
    onClick(e);
  };

  return (
    <Button 
      variant="ghost" 
      size="default" 
      onClick={handleClick}
      className={`flex items-center gap-2 px-5 py-3.5 h-auto transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-50 active:scale-95 focus:ring-2 focus:ring-blue-300 ${className}`}
    >
      <ArrowLeft className="h-6 w-6" />
      <span className="font-medium">{label}</span>
    </Button>
  );
}