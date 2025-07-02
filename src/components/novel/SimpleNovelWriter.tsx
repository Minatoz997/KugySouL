import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Play, Pause, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { sendChatMessage } from '@/services/api';
import { countWords } from '@/lib/utils';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export default function SimpleNovelWriter() {
  const router = useRouter();
  const [editorContent, setEditorContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPilotMode, setAutoPilotMode] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState<NodeJS.Timeout | null>(null);
  const [chapterWordCount, setChapterWordCount] = useState(0);
  const [selectedModel] = useState('gpt-3.5-turbo');
  const [selectedLanguage] = useState('indonesian');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load saved content on mount (safely for SSR)
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      const savedContent = localStorage.getItem('novel_content');
      if (savedContent) {
        setEditorContent(savedContent);
      }
    }
  }, []);
  
  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Content is already auto-saved, but we can show a toast to confirm
        toast.success('Novel saved successfully');
      }
      
      // Escape key to go back
      if (e.key === 'Escape') {
        e.preventDefault();
        router.back();
      }
      
      // Ctrl+G or Cmd+G to generate content
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !isGenerating && !autoPilotMode) {
        e.preventDefault();
        generateContent();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGenerating, autoPilotMode, router]);

  // Update word count when editor content changes and save content
  useEffect(() => {
    const words = countWords(editorContent);
    setChapterWordCount(words);
    
    // Save content to localStorage (safely for SSR)
    if (typeof window !== 'undefined' && editorContent) {
      localStorage.setItem('novel_content', editorContent);
    }
  }, [editorContent]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (autoPilotInterval) {
        clearInterval(autoPilotInterval);
      }
    };
  }, [autoPilotInterval]);

  const generateContent = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Write in Indonesian language (Bahasa Indonesia). ' 
        : 'Write in English language. ';
      
      let promptText = '';
      
      if (!editorContent.trim()) {
        // Start a new chapter
        promptText = `You are an expert fantasy novelist. ${languageInstruction}Write the BEGINNING of Chapter 1. Create an engaging opening with vivid descriptions, character development, and plot advancement. 

IMPORTANT: Write AT LEAST 500-800 words for this opening section. Be detailed and descriptive. The goal is to generate substantial content with each request.

WORD COUNT REQUIREMENT: Your response must be at least 500 words minimum.`;
      } else {
        // Get more context for better continuation
        const contextLength = Math.min(1000, editorContent.length);
        const lastSection = editorContent.slice(-contextLength);
        const wordsSoFar = chapterWordCount;
        
        const remainingWords = 2000 - wordsSoFar;
        const isChapterEnding = remainingWords <= 200;
        
        if (isChapterEnding) {
          promptText = `You are writing a fantasy novel. ${languageInstruction}

CURRENT CHAPTER PROGRESS: ${wordsSoFar}/2000 words

LAST PART OF THE STORY:
"${lastSection}"

TASK: Write the FINAL section to complete this chapter. Continue naturally from where the story ended. Write approximately ${remainingWords} words to reach the 2000-word chapter goal. End with a compelling cliffhanger or transition to the next chapter.

IMPORTANT: 
- Continue from the exact point where the story left off
- Do NOT repeat or rewrite any existing content
- Maintain the same writing style and tone
- Advance the plot meaningfully
- Write AT LEAST ${remainingWords} words to complete the chapter
- Be detailed and descriptive to reach the word count goal

WORD COUNT REQUIREMENT: Your response must be at least ${remainingWords} words to complete the chapter properly.`;
        } else {
          // Always target at least 500 words per request, unless we're very close to 2000
          // Calculate target words for this generation cycle
          Math.min(Math.max(500, Math.ceil((2000 - wordsSoFar) / 2)), 2000 - wordsSoFar);
          // Get last sentence for better continuation
          const sentences = editorContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const lastSentence = sentences[sentences.length - 1]?.trim() || '';
          
          promptText = `SYSTEM: You are a novel continuation AI. Your ONLY job is to ADD NEW CONTENT.

CRITICAL MISSION: CONTINUE the story from the exact ending point. DO NOT REWRITE ANYTHING.

CURRENT PROGRESS: ${wordsSoFar}/2000 words (generating AT LEAST 500 words this cycle)

STORY ENDING POINT:
"${lastSection}"

EXACT LAST SENTENCE: "${lastSentence}"

TASK: Write the NEXT 500-800 words that happen AFTER this sentence: "${lastSentence}"

ABSOLUTE RULES:
🚫 DO NOT repeat "${lastSentence}"
🚫 DO NOT rewrite any existing content
🚫 DO NOT start with "Chapter" or "Bab"
🚫 DO NOT summarize what happened
🚫 DO NOT change character names
✅ START with what happens NEXT
✅ Continue the same scene/action
✅ Add new dialogue, events, descriptions
✅ Move the story FORWARD
✅ WRITE AT LEAST 500 WORDS - BE DETAILED AND DESCRIPTIVE
✅ AIM FOR 500-800 WORDS IN YOUR RESPONSE

WORD COUNT REQUIREMENT: Your response must be at least 500 words minimum.

${languageInstruction}

BEGIN CONTINUATION NOW:`;
        }
      }
      
      console.log('🚀 Sending auto-pilot request...', {
        messageLength: promptText.length,
        model: selectedModel,
        maxTokens: 1500, // Increased to generate 500+ words per request
        backendUrl: 'https://minatoz997-backend66.hf.space/chat/message',
        promptPreview: promptText.substring(0, 200) + '...'
      });
      
      const response = await sendChatMessage({
        message: promptText,
        model: selectedModel,
        max_tokens: 1500, // Increased to generate 500+ words per request
        temperature: 0.7
      });
      
      if (response) {
        // Append the generated text to the editor
        const newContent = editorContent + (editorContent ? '\n\n' : '') + response;
        setEditorContent(newContent);
        
        // Scroll to the bottom of the editor
        if (editorRef.current) {
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.scrollTop = editorRef.current.scrollHeight;
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutoPilot = () => {
    if (autoPilotInterval) return;

    setAutoPilotMode(true);
    console.log('🚀 Starting Auto-Pilot mode with enhanced word generation');
    
    const interval = setInterval(async () => {
      if (isGenerating) return;

      // Check if current chapter is complete (2000+ words)
      if (chapterWordCount >= 2000) {
        console.log('✅ Chapter complete! Word count:', chapterWordCount);
        // Stop auto-pilot when chapter is complete
        stopAutoPilot();
        toast.success('Chapter complete! 2000 words reached.');
        return;
      }
      
      console.log('📊 Current chapter word count:', chapterWordCount, '/ 2000 words');

      // Continue writing the current chapter
      generateContent();
    }, 5000); // Check every 5 seconds

    setAutoPilotInterval(interval);
    toast.success('Auto-Pilot mode activated');
  };

  const stopAutoPilot = () => {
    if (autoPilotInterval) {
      clearInterval(autoPilotInterval);
      setAutoPilotInterval(null);
      setAutoPilotMode(false);
      toast.success('Auto-Pilot mode deactivated');
    }
  };

  // Calculate progress percentage
  const progressPercentage = chapterWordCount > 0 ? Math.min(100, (chapterWordCount / 2000) * 100) : 0;

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle novel deletion
  const handleDelete = () => {
    // Show the delete dialog instead of using the button state
    setShowDeleteDialog(true);
  };
  
  // Confirm deletion in the dialog
  const confirmDelete = () => {
    // Clear the content and localStorage
    setEditorContent('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('novel_content');
    }
    toast.success('Novel deleted successfully');
    setShowDeleteDialog(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-1 mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </Button>
        
        <h1 className="text-2xl font-bold flex-grow">Simple Novel Writer (2000 Words per Chapter)</h1>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete Novel
        </Button>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this novel? This action cannot be undone and all content will be permanently lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Yes, Delete Novel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
        <h3 className="font-medium mb-1">Keyboard Shortcuts:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs">Ctrl+S</kbd>
            <span>Save novel</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs">Esc</kbd>
            <span>Go back</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs">Ctrl+G</kbd>
            <span>Generate content</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Chapter 1</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-sm mr-2">{chapterWordCount}/2000 words</span>
              <Progress value={progressPercentage} className="w-32 h-2" />
            </div>
            
            <Button 
              variant={autoPilotMode ? "destructive" : "default"} 
              size="sm" 
              onClick={autoPilotMode ? stopAutoPilot : startAutoPilot}
              disabled={isGenerating}
            >
              {autoPilotMode ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop Auto-Pilot
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start Auto-Pilot
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateContent}
              disabled={isGenerating || autoPilotMode}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Textarea
            ref={editorRef}
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="Start writing or generate content..."
            className="min-h-[60vh] p-4 font-serif text-lg leading-relaxed resize-none"
          />
          
          {/* Loading overlay when generating content */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Generating Content...</h3>
                <p className="text-gray-600 text-sm">AI is crafting the next part of your story</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}