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
      size="sm" 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 h-auto transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-50 active:scale-95 ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Button>
  );
}