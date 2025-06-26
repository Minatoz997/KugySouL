'use client';

import React, { useEffect } from 'react';

/**
 * This component applies a direct fix to the NovelWriter component's autoPilotWrite function
 * by patching the global window object to handle different response formats from the backend.
 */
export default function DirectFixNovelWriter() {
  useEffect(() => {
    // Apply the patch to the window object
    if (typeof window !== 'undefined') {
      // Create a namespace for our patches if it doesn't exist
      if (!window.KugySouL) {
        (window as any).KugySouL = {};
      }

      // Add the response format handler function
      (window as any).KugySouL.handleApiResponse = (response: any): string => {
        let content = '';
        
        if (!response) return content;
        
        // Log the response structure for debugging
        console.log('🔍 Response structure:', Object.keys(response));
        
        // Handle different response formats
        if (typeof response === 'object') {
          // Try all possible response formats
          if (response.response && typeof response.response === 'string') {
            content = response.response;
            console.log('✅ Content extracted from response.response');
          } else if (response.message && typeof response.message === 'string') {
            content = response.message;
            console.log('✅ Content extracted from response.message');
          } else if (response.content && typeof response.content === 'string') {
            content = response.content;
            console.log('✅ Content extracted from response.content');
          } else if (response.data && typeof response.data === 'string') {
            content = response.data;
            console.log('✅ Content extracted from response.data');
          } else if (response.result && typeof response.result === 'object') {
            // Handle backend generate-human-content format
            if (response.result.content && typeof response.result.content === 'string') {
              content = response.result.content;
              console.log('✅ Content extracted from response.result.content');
            }
          } else if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            // Handle OpenAI/OpenRouter format
            const choice = response.choices[0];
            if (choice.message && choice.message.content) {
              content = choice.message.content;
              console.log('✅ Content extracted from response.choices[0].message.content');
            } else if (choice.text) {
              content = choice.text;
              console.log('✅ Content extracted from response.choices[0].text');
            }
          }
        } else if (typeof response === 'string') {
          content = response;
          console.log('✅ Response was a string');
        }
        
        return content;
      };
      
      console.log('✅ DirectFixNovelWriter patch applied successfully');
    }
    
    return () => {
      // Clean up the patch when component unmounts
      if (typeof window !== 'undefined' && (window as any).KugySouL) {
        delete (window as any).KugySouL.handleApiResponse;
      }
    };
  }, []);

  return null; // This component doesn't render anything
}