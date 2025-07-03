'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = 'Back', className = '' }: BackButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="default" 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 h-auto transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-50 active:scale-95 focus:ring-2 focus:ring-blue-300 ${className}`}
    >
      <ArrowLeft className="h-6 w-6" />
      <span className="font-medium">{label}</span>
    </Button>
  );
}