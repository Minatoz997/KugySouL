'use client';

import React from 'react';
import NovelWriter from '@/components/novel/NovelWriter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FixedWordCountNovelWriterPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Fixed Word Count Auto-Pilot</h1>
          <p className="text-gray-500">
            This version fixes the auto-pilot feature to generate at least 500-800 words per request
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <NovelWriter />
        </div>
      </div>
    </div>
  );
}