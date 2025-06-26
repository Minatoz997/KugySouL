'use client';

import React from 'react';
import NovelWriter from './NovelWriter';

/**
 * Enhanced version of NovelWriter with improved features
 * This component is a placeholder that simply renders the original NovelWriter
 * In a real implementation, this would extend the NovelWriter with additional features
 */
export default function ImprovedNovelWriter() {
  return (
    <div className="relative">
      <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium rounded-bl-md z-50">
        Improved Version
      </div>
      
      <NovelWriter />
    </div>
  );
}