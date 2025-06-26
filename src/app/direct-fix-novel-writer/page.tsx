'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NovelWriter from '@/components/novel/NovelWriter';
import ApiKeySetup from '@/components/novel/ApiKeySetup';

export default function DirectFixNovelWriterPage() {
  return (
    <div className="min-h-screen">
      <div className="p-4 flex justify-between items-center">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <div>
          <ApiKeySetup />
        </div>
      </div>
      
      {/* Render the fixed NovelWriter component */}
      <div className="relative">
        <div className="absolute top-0 right-0 bg-green-100 text-green-800 px-2 py-1 text-xs rounded-br-md z-50">
          Direct Fix Auto-Pilot
        </div>
        <NovelWriter />
      </div>
    </div>
  );
}