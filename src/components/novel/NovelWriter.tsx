'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Pen, Sparkles, Download, Share2, Save, Wand2, Brain, Zap, Trash2, Upload, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api, { extractContentFromResponse } from '@/services/api';

export default function NovelWriter() {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);

  // Function to generate content with AI
  const generateWithAI = async (prompt: string) => {
    try {
      setIsGenerating(true);
      const response = await api.sendChatMessage(prompt);
      console.log('AI Response:', response);
      
      // Extract content from various response formats
      const extractedContent = extractContentFromResponse(response);
      
      if (extractedContent) {
        return extractedContent;
      } else {
        console.error('Could not extract content from response:', response);
        return '';
      }
    } catch (error) {
      console.error('Error generating content:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-pilot write function
  const autoPilotWrite = async () => {
    if (isGenerating) return;
    
    setIsAutoPilotActive(true);
    
    try {
      const prompt = content ? 
        `Continue this story: ${content.slice(-500)}` : 
        'Write a creative story beginning';
      
      const generatedContent = await generateWithAI(prompt);
      
      if (generatedContent) {
        setContent(prev => prev ? `${prev}\n\n${generatedContent}` : generatedContent);
      }
    } catch (error) {
      console.error('Auto-pilot error:', error);
    } finally {
      setIsAutoPilotActive(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Novel Writer</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setContent('')}
              disabled={!content}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={autoPilotWrite}
              disabled={isGenerating}
              className={isAutoPilotActive ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {isAutoPilotActive ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Writing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Auto-Pilot
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="min-h-[400px] border rounded-lg p-4 mb-4">
          <textarea
            className="w-full h-[400px] bg-transparent focus:outline-none resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your novel here or use Auto-Pilot..."
          />
        </div>
      </div>
    </div>
  );
}

// Loading spinner component
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}