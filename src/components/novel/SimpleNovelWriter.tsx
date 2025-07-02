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
  const [novelTitle, setNovelTitle] = useState('Untitled Novel');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [chapters, setChapters] = useState<{id: string; title: string; content: string}[]>([
    { id: '1', title: 'Chapter 1', content: '' }
  ]);
  const [currentChapterId, setCurrentChapterId] = useState('1');
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load saved content and novel metadata on mount (safely for SSR)
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      // Try to load chapters first
      const savedChapters = localStorage.getItem('novel_chapters');
      if (savedChapters) {
        try {
          const parsedChapters = JSON.parse(savedChapters);
          setChapters(parsedChapters);
          
          // Set editor content to the first chapter's content
          if (parsedChapters.length > 0) {
            setEditorContent(parsedChapters[0].content || '');
            setCurrentChapterId(parsedChapters[0].id);
          }
        } catch (e) {
          console.error('Error parsing saved chapters:', e);
          
          // Fallback to old storage method
          const savedContent = localStorage.getItem('novel_content');
          if (savedContent) {
            setEditorContent(savedContent);
            // Migrate old content to new chapter system
            setChapters([{ id: '1', title: 'Chapter 1', content: savedContent }]);
          }
        }
      } else {
        // Fallback to old storage method
        const savedContent = localStorage.getItem('novel_content');
        if (savedContent) {
          setEditorContent(savedContent);
          // Migrate old content to new chapter system
          setChapters([{ id: '1', title: 'Chapter 1', content: savedContent }]);
        }
      }
      
      // Load saved novel title if exists
      const savedTitle = localStorage.getItem('novel_title');
      if (savedTitle) {
        setNovelTitle(savedTitle);
      }
      
      // Show onboarding tips for first-time users
      const hasSeenTips = localStorage.getItem('novel_tips_seen');
      if (!hasSeenTips) {
        // Mark tips as seen
        localStorage.setItem('novel_tips_seen', 'true');
        
        // Show welcome tip
        setTimeout(() => {
          toast.info(
            <div>
              <h3 className="font-medium mb-1">Welcome to Novel Writer!</h3>
              <p>Start typing or use AI to generate content for your story.</p>
            </div>,
            { duration: 5000 }
          );
        }, 1000);
        
        // Show keyboard shortcuts tip after a delay
        setTimeout(() => {
          toast.info(
            <div>
              <h3 className="font-medium mb-1">Keyboard Shortcuts Available</h3>
              <p>Press <kbd className="px-1 bg-gray-100 border rounded">Ctrl+G</kbd> to generate content with AI.</p>
            </div>,
            { duration: 5000 }
          );
        }, 8000);
        
        // Show auto-pilot tip after another delay
        setTimeout(() => {
          toast.info(
            <div>
              <h3 className="font-medium mb-1">Try Auto-Pilot Mode</h3>
              <p>Let AI write your entire chapter automatically!</p>
            </div>,
            { duration: 5000 }
          );
        }, 15000);
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
      
      // Escape key to exit focus mode or go back
      if (e.key === 'Escape') {
        e.preventDefault();
        if (focusMode) {
          setFocusMode(false);
        } else {
          router.back();
        }
      }
      
      // Ctrl+G or Cmd+G to generate content
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !isGenerating && !autoPilotMode) {
        e.preventDefault();
        generateContent();
      }
      
      // F11 or Ctrl+Shift+F for focus mode
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f')) {
        e.preventDefault();
        setFocusMode(!focusMode);
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
    
    // Update the current chapter's content
    if (editorContent !== undefined) {
      setChapters(prevChapters => 
        prevChapters.map(chapter => 
          chapter.id === currentChapterId 
            ? { ...chapter, content: editorContent } 
            : chapter
        )
      );
    }
  }, [editorContent, currentChapterId]);
  
  // Save chapters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && chapters.length > 0) {
      localStorage.setItem('novel_chapters', JSON.stringify(chapters));
      
      // For backward compatibility
      const currentChapter = chapters.find(ch => ch.id === currentChapterId);
      if (currentChapter) {
        localStorage.setItem('novel_content', currentChapter.content);
      }
    }
  }, [chapters, currentChapterId]);
  
  // Save novel title when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && novelTitle) {
      localStorage.setItem('novel_title', novelTitle);
    }
  }, [novelTitle]);
  
  // Handle title edit mode
  const startEditingTitle = () => {
    setIsEditingTitle(true);
    // Focus the input field after rendering
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 50);
  };
  
  const saveTitle = () => {
    setIsEditingTitle(false);
  };
  
  // Chapter management functions
  const addNewChapter = () => {
    setShowChapterDialog(true);
    setNewChapterTitle(`Chapter ${chapters.length + 1}`);
  };
  
  const createChapter = () => {
    if (!newChapterTitle.trim()) return;
    
    const newChapterId = Date.now().toString();
    const newChapter = {
      id: newChapterId,
      title: newChapterTitle,
      content: ''
    };
    
    setChapters(prev => [...prev, newChapter]);
    setCurrentChapterId(newChapterId);
    setEditorContent('');
    setShowChapterDialog(false);
    
    toast.success(`Created new chapter: ${newChapterTitle}`);
  };
  
  const switchChapter = (chapterId: string) => {
    // Save current chapter content first
    setChapters(prevChapters => 
      prevChapters.map(chapter => 
        chapter.id === currentChapterId 
          ? { ...chapter, content: editorContent } 
          : chapter
      )
    );
    
    // Switch to selected chapter
    const selectedChapter = chapters.find(ch => ch.id === chapterId);
    if (selectedChapter) {
      setCurrentChapterId(chapterId);
      setEditorContent(selectedChapter.content);
    }
  };

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
    // Create backup before deleting
    if (typeof window !== 'undefined') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      localStorage.setItem(`novel_backup_${timestamp}`, JSON.stringify({
        title: novelTitle,
        chapters: chapters
      }));
      
      localStorage.removeItem('novel_chapters');
      localStorage.removeItem('novel_content');
      localStorage.removeItem('novel_title');
    }
    
    // Reset state
    setEditorContent('');
    setChapterWordCount(0);
    setNovelTitle('Untitled Novel');
    setChapters([{ id: '1', title: 'Chapter 1', content: '' }]);
    setCurrentChapterId('1');
    
    toast.success('Novel deleted successfully. A backup has been saved.');
    setShowDeleteDialog(false);
  };
  
  // Delete a specific chapter
  const deleteChapter = (chapterId: string) => {
    if (chapters.length <= 1) {
      toast.error('Cannot delete the only chapter. Create a new chapter first.');
      return;
    }
    
    // Confirm before deleting
    if (confirm(`Are you sure you want to delete this chapter? This action cannot be undone.`)) {
      const updatedChapters = chapters.filter(ch => ch.id !== chapterId);
      setChapters(updatedChapters);
      
      // If we're deleting the current chapter, switch to the first available chapter
      if (chapterId === currentChapterId && updatedChapters.length > 0) {
        switchChapter(updatedChapters[0].id);
      }
      
      toast.success('Chapter deleted successfully');
    }
  };
  
  // Reset novel to start fresh
  const resetNovel = () => {
    if (editorContent.trim() === '') {
      toast.info('Novel is already empty');
      return;
    }
    
    // Save current content as backup
    if (typeof window !== 'undefined') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      localStorage.setItem(`novel_backup_${timestamp}`, editorContent);
    }
    
    // Clear the editor but keep the novel in localStorage
    setEditorContent('');
    toast.success('Novel reset successfully. Previous content saved as backup.');
  };

  // Detect if user is on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
    }
    
    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile);
      }
    };
  }, []);

  return (
    <div className={`${focusMode ? 'fixed inset-0 bg-black z-50' : 'container mx-auto p-4 max-w-6xl'}`}>
      {/* Focus Mode Controls */}
      {focusMode && (
        <div className="flex items-center justify-between absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10">
          {/* Mobile-friendly exit button */}
          <button 
            onClick={() => setFocusMode(false)}
            className="text-white/70 hover:text-white transition-colors p-2"
            title="Exit Focus Mode (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
          
          {/* Word count in focus mode */}
          <div className="text-white/70 text-sm">
            {chapterWordCount}/2000 words
          </div>
          
          {/* Generate button in focus mode */}
          <button
            onClick={generateContent}
            disabled={isGenerating}
            className="text-white/70 hover:text-white transition-colors p-2"
            title="Generate Content"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className={`flex items-center mb-4 ${focusMode ? 'hidden' : ''}`}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-1 mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </Button>
        
        <div className="flex-grow text-center">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={novelTitle}
              onChange={(e) => setNovelTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              className="text-2xl font-bold text-center w-full border-b-2 border-blue-300 focus:outline-none focus:border-blue-500"
              placeholder="Enter novel title..."
            />
          ) : (
            <h1 
              className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors group flex items-center justify-center"
              onClick={startEditingTitle}
              title="Click to edit title"
            >
              {novelTitle}
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </span>
            </h1>
          )}
          <p className="text-sm text-gray-500 mt-1">2000 Words per Chapter</p>
        </div>
        
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

      {/* Keyboard Shortcuts Info - Hide on mobile */}
      {!isMobile && (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700 ${focusMode ? 'hidden' : ''}`}>
          <h3 className="font-medium mb-1">Keyboard Shortcuts:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs">Ctrl+Shift+F</kbd>
              <span>Focus mode</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Tips - Only show on mobile */}
      {isMobile && !focusMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
          <h3 className="font-medium mb-1">Tips:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tap the blue button in the corner to enter focus mode</li>
            <li>Use the Generate button to continue your story with AI</li>
            <li>Swipe between chapters to navigate your novel</li>
          </ul>
        </div>
      )}

      {/* Chapter Selection */}
      <div className={`mb-4 ${focusMode ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Chapters</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addNewChapter}
            className="flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            New Chapter
          </Button>
        </div>
        
        <div className={`${isMobile ? 'flex snap-x snap-mandatory overflow-x-auto pb-2 -mx-4 px-4' : 'flex gap-2 overflow-x-auto pb-2'}`}>
          {chapters.map(chapter => (
            <button
              key={chapter.id}
              onClick={() => switchChapter(chapter.id)}
              className={`${isMobile ? 'snap-start mr-2 flex-shrink-0' : ''} px-3 py-2 rounded-md text-sm whitespace-nowrap flex items-center gap-1 ${
                chapter.id === currentChapterId 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {chapter.title}
              {chapters.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChapter(chapter.id);
                  }}
                  className={`ml-1 text-gray-500 hover:text-red-500 ${isMobile ? 'p-1' : ''}`}
                  title="Delete chapter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "16" : "14"} height={isMobile ? "16" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>
        
        {/* Mobile chapter navigation indicator */}
        {isMobile && chapters.length > 1 && (
          <div className="flex justify-center mt-1 mb-2">
            <div className="flex gap-1">
              {chapters.map((chapter, index) => (
                <div 
                  key={chapter.id} 
                  className={`h-1 rounded-full ${
                    chapter.id === currentChapterId 
                      ? 'w-4 bg-blue-500' 
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* New Chapter Dialog */}
        <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chapter</DialogTitle>
              <DialogDescription>
                Enter a title for your new chapter.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chapter title..."
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChapterDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createChapter}>
                Create Chapter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className={`grid grid-cols-1 gap-4 ${focusMode ? 'hidden' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {chapters.find(ch => ch.id === currentChapterId)?.title || 'Chapter 1'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-sm mr-2">{chapterWordCount}/2000 words</span>
              <Progress value={progressPercentage} className={`${isMobile ? 'w-20' : 'w-32'} h-2`} />
            </div>
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetNovel}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                title="Reset novel content (saves backup)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                <span>Reset</span>
              </Button>
            )}
            
            <Button 
              variant={autoPilotMode ? "destructive" : "default"} 
              size="sm" 
              onClick={autoPilotMode ? stopAutoPilot : startAutoPilot}
              disabled={isGenerating}
              className={isMobile ? "px-2" : ""}
            >
              {autoPilotMode ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  {isMobile ? "Stop" : "Stop Auto-Pilot"}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  {isMobile ? "Auto" : "Start Auto-Pilot"}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateContent}
              disabled={isGenerating || autoPilotMode}
              className={isMobile ? "px-2" : ""}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {isMobile ? "" : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {isMobile ? "" : "Generate"}
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
            className={
              focusMode 
                ? `min-h-${isMobile ? '[70vh]' : 'screen'} ${isMobile ? 'p-4 pt-16' : 'p-8'} font-serif ${isMobile ? 'text-lg' : 'text-xl'} leading-relaxed resize-none bg-black text-white border-none focus:ring-0 focus:outline-none` 
                : 'min-h-[60vh] p-4 font-serif text-lg leading-relaxed resize-none'
            }
          />
          
          {/* Focus Mode Toggle Button */}
          {!focusMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(true)}
              className={`absolute ${isMobile ? 'bottom-4 right-4 bg-blue-500 text-white hover:bg-blue-600 shadow-lg rounded-full p-3' : 'top-2 right-2 text-gray-400 hover:text-gray-700'}`}
              title={`Enter Focus Mode ${isMobile ? '' : '(Ctrl+Shift+F)'}`}
            >
              {isMobile ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                  <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                  <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                </svg>
              )}
            </Button>
          )}
          
          {/* Loading overlay when generating content */}
          {isGenerating && (
            <div className={`absolute inset-0 ${focusMode ? 'bg-black/80' : 'bg-white/80'} flex flex-col items-center justify-center`}>
              <div className={`${focusMode ? 'bg-gray-900 text-white' : 'bg-white'} ${isMobile ? 'p-4' : 'p-6'} rounded-lg shadow-lg flex flex-col items-center max-w-[90%]`}>
                <Loader2 className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} ${focusMode ? 'text-blue-400' : 'text-blue-500'} animate-spin mb-3`} />
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium ${focusMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>Generating Content...</h3>
                <p className={`${focusMode ? 'text-gray-400' : 'text-gray-600'} text-sm text-center`}>AI is crafting the next part of your story</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}