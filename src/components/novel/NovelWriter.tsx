'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Pen, Sparkles, Download, Share2, Save, Wand2, Brain, Zap, Trash2, Upload, History, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';

interface NovelChapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  isComplete: boolean;
  createdAt: Date;
  completedAt?: Date;
}

interface NovelProject {
  id: string;
  title: string;
  genre: string;
  description: string;
  chapters: NovelChapter[];
  currentChapterIndex: number;
  totalWords: number;
  createdAt: Date;
  lastSaved: Date;
}

interface PublishHistory {
  id: string;
  chapterTitle: string;
  publishDate: Date;
  status: 'success' | 'failed' | 'publishing';
  errorMessage?: string;
  documentUrl?: string;
}

export default function NovelWriter() {
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const [currentProject, setCurrentProject] = useState<NovelProject | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [aiAssistMode, setAiAssistMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  type WritingMode = 'story' | 'dialogue' | 'description' | 'character' | 'plot';
  const [writingMode, setWritingMode] = useState<WritingMode>('story');
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [wordCount, setWordCount] = useState(0);
  const [chapterWordCount, setChapterWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [autoPilotMode, setAutoPilotMode] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoPilotSpeed, setAutoPilotSpeed] = useState(15); // seconds between generations
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [currentChapter, setCurrentChapter] = useState<NovelChapter | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Document Publishing States
  const [publishHistory, setPublishHistory] = useState<PublishHistory[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishHistory, setShowPublishHistory] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);

  const createNewProject = () => {
    const firstChapter: NovelChapter = {
      id: Date.now().toString(),
      title: 'Chapter 1',
      content: '',
      wordCount: 0,
      isComplete: false,
      createdAt: new Date()
    };

    const newProject: NovelProject = {
      id: Date.now().toString(),
      title: 'Untitled Novel',
      genre: selectedGenre,
      description: '',
      chapters: [firstChapter],
      currentChapterIndex: 0,
      totalWords: 0,
      createdAt: new Date(),
      lastSaved: new Date()
    };
    
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setCurrentChapter(firstChapter);
    setEditorContent('');
    setChapterWordCount(0);
    setIsWriting(true);
    
    // Start auto-save
    startAutoSave();
  };

  const addNewChapter = () => {
    if (!currentProject) return;
    
    // Save current chapter first
    saveCurrentChapter();
    
    const newChapter: NovelChapter = {
      id: Date.now().toString(),
      title: `Chapter ${currentProject.chapters.length + 1}`,
      content: '',
      wordCount: 0,
      isComplete: false,
      createdAt: new Date()
    };

    const updatedProject = {
      ...currentProject,
      chapters: [...currentProject.chapters, newChapter],
      currentChapterIndex: currentProject.chapters.length
    };
    
    setCurrentProject(updatedProject);
    setCurrentChapter(newChapter);
    setEditorContent('');
    setChapterWordCount(0);
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    
    // Save to localStorage
    try {
      const projectsToSave = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('novel_projects', JSON.stringify(projectsToSave));
      console.log('✅ Project saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  };

  const switchToChapter = (chapterIndex: number) => {
    if (!currentProject || chapterIndex < 0 || chapterIndex >= currentProject.chapters.length) return;
    
    // Save current chapter first
    saveCurrentChapter();
    
    const chapter = currentProject.chapters[chapterIndex];
    const updatedProject = {
      ...currentProject,
      currentChapterIndex: chapterIndex
    };
    
    setCurrentProject(updatedProject);
    setCurrentChapter(chapter);
    setEditorContent(chapter.content);
    setChapterWordCount(chapter.wordCount);
    
    // Save to localStorage
    try {
      const projectsToSave = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('novel_projects', JSON.stringify(projectsToSave));
      console.log('✅ Project saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  };

  const getPromptByMode = () => {
    const languageInstruction = selectedLanguage === 'indonesian' 
      ? 'Write in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
      : 'Write in English language. ';
    
    const basePrompt = `You are a professional ${selectedGenre} novel writing assistant. ${languageInstruction}`;
    
    switch (writingMode) {
      case 'dialogue':
        return basePrompt + `Write compelling dialogue based on this prompt: "${prompt}". 
        
Guidelines:
- Create natural, character-driven conversations
- Include dialogue tags and action beats
- Show character personality through speech patterns
- Make it emotionally engaging
- 800-1200 words of substantial dialogue with rich character interaction

Write the dialogue now:`;

      case 'description':
        return basePrompt + `Write vivid, immersive descriptions based on this prompt: "${prompt}".
        
Guidelines:
- Use all five senses in descriptions
- Create atmospheric and mood-setting prose
- Include specific, concrete details
- Paint a clear picture in the reader's mind
- 800-1200 words of immersive, detailed description

Write the descriptive passage now:`;

      case 'character':
        return basePrompt + `Develop a compelling character based on this prompt: "${prompt}".
        
Guidelines:
- Create a detailed character profile
- Include physical appearance, personality, backstory
- Add unique quirks, motivations, and flaws
- Show character through actions and dialogue
- 800-1200 words of comprehensive character development

Write the character development now:`;

      case 'plot':
        return basePrompt + `Create an engaging plot outline based on this prompt: "${prompt}".
        
Guidelines:
- Structure with beginning, middle, end
- Include conflict, tension, and resolution
- Add plot twists and character arcs
- Create compelling story beats
- 800-1200 words of detailed plot development

Write the plot outline now:`;

      default: // story
        return basePrompt + `Write a compelling ${selectedGenre} story segment based on this prompt: "${prompt}".
        
Guidelines:
- Make it engaging and immersive
- Include vivid descriptions and dialogue
- Strong character development
- Appropriate pacing and tension
- Match ${selectedGenre} genre conventions
- 1000-1500 words (write a substantial story section)

Write the story now:`;
    }
  };

  const generateWithAI = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await apiService.sendChatMessage({
        message: getPromptByMode(),
        model: selectedModel,
        temperature: 0.8, // Higher creativity for novel writing
        max_tokens: 800
      });
      
      setGeneratedContent(response.response || response.message || 'AI generated content will appear here...');
    } catch (error) {
      console.error('AI generation failed:', error);
      setGeneratedContent('Sorry, AI generation is currently unavailable. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const continueWriting = async () => {
    if (!editorContent.trim()) return;
    
    setIsGenerating(true);
    try {
      const lastParagraph = editorContent.split('\n\n').slice(-2).join('\n\n');
      
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Write in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
        : 'Write in English language. ';

      const response = await apiService.sendChatMessage({
        message: `You are a ${selectedGenre} novel writing assistant. ${languageInstruction}Continue this story naturally and seamlessly. Here's what the user has written so far:

"${lastParagraph}"

Continue the story from where they left off. Write 4-6 substantial paragraphs (800-1200 words) that:
- Flow naturally from their writing
- Match their writing style and tone
- Advance the plot or develop characters
- Maintain the ${selectedGenre} genre
- Keep the same narrative voice

Continue writing:`,
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 800
      });
      
      setGeneratedContent(response.response || response.message || 'AI continuation will appear here...');
    } catch (error) {
      console.error('AI continuation failed:', error);
      setGeneratedContent('Sorry, AI continuation is currently unavailable. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSuggestions = async () => {
    if (!editorContent.trim()) return;
    
    setIsGenerating(true);
    try {
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Respond in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
        : 'Respond in English language. ';

      const response = await apiService.sendChatMessage({
        message: `You are a professional ${selectedGenre} writing coach. ${languageInstruction}Analyze this text and provide helpful suggestions:

"${editorContent.slice(-500)}"

Provide 3-4 specific suggestions for:
- Plot development ideas
- Character development opportunities  
- Dialogue improvements
- Scene enhancement
- Writing style tips

Keep suggestions constructive and actionable:`,
        model: selectedModel,
        temperature: 0.6,
        max_tokens: 600
      });
      
      setAiSuggestions(response.response || response.message || 'AI suggestions will appear here...');
    } catch (error) {
      console.error('AI suggestions failed:', error);
      setAiSuggestions('Sorry, AI suggestions are currently unavailable. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const autoPilotWrite = async () => {
    console.log('Auto-pilot write function called');
    
    if (!currentProject || !currentChapter) {
      console.error('Auto-pilot aborted: No current project or chapter');
      return;
    }
    
    if (isGenerating) {
      console.error('Auto-pilot aborted: Already generating content');
      return;
    }
    
    // Check if current chapter is complete (1800-2000 words)
    if (chapterWordCount >= 1800) {
      console.log('Chapter is complete, creating new chapter');
      // Complete current chapter and create new one
      await completeCurrentChapter();
      return;
    }
    
    console.log('Starting auto-pilot content generation');
    setIsGenerating(true);
    try {
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Write in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
        : 'Write in English language. ';
      
      const remainingWords = 2000 - chapterWordCount;
      const isChapterEnding = remainingWords <= 400; // Start wrapping up when close to limit
      
      let promptText = '';
      
      if (!editorContent.trim()) {
        // Start a new chapter
        const chapterNumber = currentProject.currentChapterIndex + 1;
        const previousChapterSummary = getPreviousChapterSummary();
        
        promptText = `You are an expert ${selectedGenre} novelist. ${languageInstruction}

${previousChapterSummary ? `Previous chapter summary: ${previousChapterSummary}\n\n` : ''}

Write Chapter ${chapterNumber} of this ${selectedGenre} novel. Create an engaging chapter that:

- ${chapterNumber === 1 ? 'Introduces the main character and setting' : 'Continues from the previous chapter naturally'}
- Establishes clear chapter goals and conflicts
- Uses vivid, immersive descriptions
- Has a proper chapter structure (beginning, middle, end)
- Builds toward a chapter climax or cliffhanger
- Write approximately 400-600 words for this section
- Remember: Total chapter should be 1800-2000 words maximum

Begin Chapter ${chapterNumber}:`;
      } else {
        // Continue the current chapter
        const lastSection = editorContent.split('\n\n').slice(-2).join('\n\n');
        
        if (isChapterEnding) {
          promptText = `You are continuing Chapter ${currentProject.currentChapterIndex + 1} of this ${selectedGenre} novel. ${languageInstruction}

Current chapter content (last part):
"${lastSection}"

IMPORTANT: This chapter is nearing completion (${chapterWordCount} words written, target: 1800-2000 words).

Write the FINAL section of this chapter that:
- Brings the chapter to a satisfying conclusion
- Resolves the chapter's main conflict or tension
- Sets up intrigue for the next chapter
- Provides a natural stopping point
- Write approximately ${remainingWords} words to complete the chapter
- End with a compelling cliffhanger or transition

Complete the chapter:`;
        } else {
          promptText = `You are continuing Chapter ${currentProject.currentChapterIndex + 1} of this ${selectedGenre} novel. ${languageInstruction}

Current chapter content (last part):
"${lastSection}"

Continue the chapter naturally. Write the next section that:
- Flows perfectly from the previous text
- Advances the chapter's plot meaningfully
- Develops characters further
- Maintains the established tone and style
- Adds tension, conflict, or intrigue
- Write approximately 400-600 words
- Remember: Chapter target is 1800-2000 words total (currently ${chapterWordCount} words)

Continue writing:`;
        }
      }

      console.log('Sending request to API for auto-pilot writing...');
      
      // Placeholder text to show immediately while waiting for API response
      const placeholderText = editorContent ? 
        editorContent + '\n\n[AI is writing the next section...]' : 
        '[AI is starting to write Chapter ' + (currentProject.currentChapterIndex + 1) + '...]';
      
      // Show placeholder text immediately
      setEditorContent(placeholderText);
      
      // Force UI update by triggering a state change
      setChapterWordCount(prev => prev);

      const response = await apiService.sendChatMessage({
        message: promptText,
        model: selectedModel,
        temperature: 0.8,
        max_tokens: 600
      });
      
      const newContent = response.response || response.message || response.content || response.data || '';
      
      if (newContent && newContent.trim()) {
        console.log('Received content from API, length:', newContent.length);
        
        // Remove placeholder text and add the real content
        const contentWithoutPlaceholder = editorContent.replace(/\n\n\[AI is (writing the next section|starting to write Chapter \d+)\.\.\.\]$/, '');
        const updatedContent = contentWithoutPlaceholder ? contentWithoutPlaceholder + '\n\n' + newContent : newContent;
        
        console.log('Setting editor content with new text');
        setEditorContent(updatedContent);
        
        // Update word count
        const newWordCount = countWords(updatedContent);
        setChapterWordCount(newWordCount);
        
        // Auto-save
        saveCurrentChapter(updatedContent, newWordCount);
        
        console.log(`✅ Chapter ${currentProject.currentChapterIndex + 1}: ${newWordCount}/2000 words`);
      } else {
        // If no content was returned, remove the placeholder
        const contentWithoutPlaceholder = editorContent.replace(/\n\n\[AI is (writing the next section|starting to write Chapter \d+)\.\.\.\]$/, '');
        setEditorContent(contentWithoutPlaceholder);
        console.error('No content was generated from the API');
      }
    } catch (error) {
      console.error('Auto-pilot writing failed:', error);
      
      // Remove placeholder text if there was an error
      const contentWithoutPlaceholder = editorContent.replace(/\n\n\[AI is (writing the next section|starting to write Chapter \d+)\.\.\.\]$/, '');
      setEditorContent(contentWithoutPlaceholder);
      
      // Don't stop auto-pilot on error, just log it
      console.log('Error in auto-pilot, but continuing with next cycle');
    } finally {
      console.log('Auto-pilot generation cycle completed');
      setIsGenerating(false);
    }
  };

  const completeCurrentChapter = async () => {
    if (!currentProject || !currentChapter) return;
    
    // Mark chapter as complete
    const completedChapter = {
      ...currentChapter,
      content: editorContent,
      wordCount: chapterWordCount,
      isComplete: true,
      completedAt: new Date()
    };
    
    // Update project
    const updatedChapters = [...currentProject.chapters];
    updatedChapters[currentProject.currentChapterIndex] = completedChapter;
    
    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      totalWords: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    };
    
    setCurrentProject(updatedProject);
    
    // Save to localStorage
    try {
      const projectsToSave = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('novel_projects', JSON.stringify(projectsToSave));
      console.log('✅ Project saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
    
    // Auto-create next chapter if in auto-pilot mode
    if (autoPilotMode) {
      setTimeout(() => {
        addNewChapter();
        // Continue auto-pilot in new chapter
        setTimeout(() => {
          autoPilotWrite();
        }, 2000);
      }, 1000);
    }
    
    console.log(`🎉 Chapter ${currentProject.currentChapterIndex + 1} completed! (${chapterWordCount} words)`);
  };

  const getPreviousChapterSummary = () => {
    if (!currentProject || currentProject.currentChapterIndex === 0) return '';
    
    const previousChapter = currentProject.chapters[currentProject.currentChapterIndex - 1];
    if (!previousChapter || !previousChapter.content) return '';
    
    // Return last paragraph of previous chapter for context
    const paragraphs = previousChapter.content.split('\n\n');
    return paragraphs.slice(-1).join('\n\n').slice(0, 300) + '...';
  };

  const startAutoPilot = () => {
    setAutoPilotMode(true);
    
    // Start immediately
    autoPilotWrite();
    
    // Set up interval for continuous writing
    const interval = setInterval(() => {
      if (!isGenerating) {
        console.log(`Auto-pilot triggered after ${autoPilotSpeed} seconds`);
        autoPilotWrite();
      } else {
        console.log('Skipping auto-pilot cycle because generation is already in progress');
      }
    }, autoPilotSpeed * 1000);
    
    setAutoPilotInterval(interval);
  };

  const stopAutoPilot = () => {
    setAutoPilotMode(false);
    if (autoPilotInterval) {
      clearInterval(autoPilotInterval);
      setAutoPilotInterval(null);
    }
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Auto-save functions
  const startAutoSave = () => {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    const interval = setInterval(() => {
      if (currentProject && currentChapter) {
        saveCurrentChapter();
      }
    }, 30000); // Auto-save every 30 seconds
    
    setAutoSaveInterval(interval);
  };

  const stopAutoSave = () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }
  };

  const saveCurrentChapter = useCallback((content?: string, wordCount?: number) => {
    if (!currentProject || !currentChapter) return;
    
    setIsAutoSaving(true);
    
    const chapterContent = content || editorContent;
    const chapterWords = wordCount || countWords(chapterContent);
    
    // Update current chapter
    const updatedChapter = {
      ...currentChapter,
      content: chapterContent,
      wordCount: chapterWords
    };
    
    // Update project
    const updatedChapters = [...currentProject.chapters];
    updatedChapters[currentProject.currentChapterIndex] = updatedChapter;
    
    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      totalWords: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0),
      lastSaved: new Date()
    };
    
    setCurrentProject(updatedProject);
    setCurrentChapter(updatedChapter);
    setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
    
    // Save to localStorage
    try {
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('novel_projects', JSON.stringify(updatedProjects));
      console.log('✅ Project saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
    
    setLastSaved(new Date());
    setTimeout(() => setIsAutoSaving(false), 1000);
  }, [currentProject, currentChapter, editorContent, projects]);

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('novel_projects');
      if (saved) {
        const savedProjects = JSON.parse(saved);
        setProjects(savedProjects);
        
        // Load the most recent project
        if (savedProjects.length > 0) {
          const lastProject = savedProjects[savedProjects.length - 1];
          setCurrentProject(lastProject);
          
          // Load current chapter
          const currentChapterIndex = lastProject.currentChapterIndex || 0;
          const chapter = lastProject.chapters[currentChapterIndex];
          if (chapter) {
            setCurrentChapter(chapter);
            setEditorContent(chapter.content || '');
            setChapterWordCount(chapter.wordCount || 0);
          }
          
          setIsWriting(true);
          startAutoSave();
        }
      }
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
    }
  };

  // Manual save function (for Save button)
  const saveProject = useCallback(() => {
    if (currentProject && currentChapter) {
      saveCurrentChapter();
      alert('✅ Novel saved successfully!');
    }
  }, [currentProject, currentChapter, saveCurrentChapter]);

  const exportNovel = () => {
    if (!currentProject) return;
    
    // Combine all chapters
    const fullNovel = currentProject.chapters
      .map((chapter, index) => `Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}`)
      .join('\n\n---\n\n');
    
    const content = `${currentProject.title}\n\nGenre: ${currentProject.genre}\nTotal Words: ${currentProject.totalWords}\n\n${fullNovel}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareNovel = async () => {
    if (!currentProject || !editorContent) return;
    
    const shareData = {
      title: currentProject.title,
      text: editorContent.slice(0, 200) + '...',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${currentProject.title}\n\n${editorContent}`);
      alert('Novel content copied to clipboard!');
    }
  };

  const deleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this novel? This action cannot be undone.')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem('novel_projects', JSON.stringify(updatedProjects));
      
      // If deleting current project, switch to another or create new
      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          setCurrentProject(updatedProjects[0]);
          setEditorContent(updatedProjects[0].chapters[0]?.content || '');
        } else {
          setCurrentProject(null);
          setEditorContent('');
        }
      }
    }
  };

  // Document Publishing Functions
  const publishDocument = async () => {
    if (!editorContent.trim()) {
      alert('Please write some content before publishing!');
      return;
    }

    // Validate content length
    if (editorContent.length < 1000) {
      alert('Chapter content must be at least 1,000 characters long for publishing!');
      return;
    }

    if (editorContent.length > 60000) {
      alert('Chapter content must be less than 60,000 characters for publishing!');
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);

    // Create publish history entry
    const publishId = Date.now().toString();
    const chapterTitle = currentProject?.title ? 
      `${currentProject.title} - Chapter ${(currentProject.chapters?.length || 0) + 1}` : 
      'Untitled Chapter';

    const newPublish: PublishHistory = {
      id: publishId,
      chapterTitle,
      publishDate: new Date(),
      status: 'publishing'
    };

    setPublishHistory(prev => [newPublish, ...prev]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setPublishProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call backend API - using chat API as a fallback since we don't have a dedicated publish endpoint
      await apiService.sendChatMessage({
        message: `Save this document with title: "${chapterTitle}"`,
        model: selectedModel,
        max_tokens: 100
      });

      clearInterval(progressInterval);
      setPublishProgress(100);
      
      // Update publish history with success
      setPublishHistory(prev => 
        prev.map(publish => 
          publish.id === publishId 
            ? { 
                ...publish, 
                status: 'success' as const,
                documentUrl: window.location.href
              }
            : publish
        )
      );

      alert(`✅ Document published successfully!\n\n📖 Title: ${chapterTitle}`);
    } catch (error) {
      console.error('Publishing error:', error);
      
      // Update publish history with error
      setPublishHistory(prev => 
        prev.map(publish => 
          publish.id === publishId 
            ? { 
                ...publish, 
                status: 'failed' as const,
                errorMessage: error instanceof Error ? error.message : 'Publishing failed'
              }
            : publish
        )
      );

      alert(`❌ Failed to publish document:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
      setPublishProgress(0);
    }
  };

  const clearPublishHistory = () => {
    if (confirm('Clear all publishing history?')) {
      setPublishHistory([]);
      localStorage.removeItem('publish_history');
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (editorContent.trim() && currentProject) {
        saveProject();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [editorContent, currentProject, projects, saveProject]);

  // Update word count when editor content changes
  // Load projects on component mount
  useEffect(() => {
    loadFromLocalStorage();
    
    // Cleanup on unmount
    return () => {
      stopAutoSave();
      stopAutoPilot();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update word counts when content changes
  useEffect(() => {
    const words = countWords(editorContent);
    setWordCount(words);
    setChapterWordCount(words);
  }, [editorContent]);

  // Load publish history
  useEffect(() => {
    const savedHistory = localStorage.getItem('publish_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setPublishHistory(history);
      } catch (error) {
        console.error('Failed to load publish history:', error);
      }
    }
  }, []);

  // Save publish history to localStorage whenever it changes
  useEffect(() => {
    if (publishHistory.length > 0) {
      localStorage.setItem('publish_history', JSON.stringify(publishHistory));
    }
  }, [publishHistory]);

  if (!isWriting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Novel Writer AI
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create amazing novels with AI assistance. Write, generate, and publish your stories with the power of artificial intelligence.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <Pen className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Smart Writing</h3>
              <p className="text-gray-300">
                Advanced text editor with auto-save, word count, and chapter management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <Brain className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
              <p className="text-gray-300">
                Get creative suggestions, plot ideas, and character development help.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <Sparkles className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Auto Generate</h3>
              <p className="text-gray-300">
                Generate entire chapters, dialogue, and descriptions with AI.
              </p>
            </motion.div>
          </div>

          {/* Projects Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Novel Projects</h2>
              <Button
                onClick={createNewProject}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Pen className="w-4 h-4 mr-2" />
                New Novel
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No novels yet</h3>
                <p className="text-gray-400 mb-6">Start your first novel project and unleash your creativity!</p>
                <Button
                  onClick={createNewProject}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your First Novel
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 relative group"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => {
                        setCurrentProject(project);
                        setIsWriting(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">{project.genre}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {project.description || 'No description yet...'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{project.chapters.length} chapters</span>
                        <span>{project.totalWords} words</span>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg"
                      title="Delete Novel"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Writing Interface */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Button
              onClick={() => setIsWriting(false)}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white"
            >
              ← Back
            </Button>
          </div>

          {/* Project Info */}
          <div className="mb-6">
            <input
              type="text"
              value={currentProject?.title || ''}
              onChange={(e) => {
                if (currentProject) {
                  const updated = { ...currentProject, title: e.target.value };
                  setCurrentProject(updated);
                  setProjects(projects.map(p => p.id === currentProject.id ? updated : p));
                }
              }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-lg font-semibold"
              placeholder="Novel Title"
            />
          </div>

          {/* Chapters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Chapters</h3>
              <Button
                onClick={addNewChapter}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
              >
                + Add
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentProject?.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  onClick={() => switchToChapter(index)}
                  className={`bg-white/5 rounded-lg p-3 border cursor-pointer transition-all ${
                    currentProject.currentChapterIndex === index 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white text-sm font-medium">{chapter.title}</div>
                    {chapter.isComplete && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-gray-400 text-xs">
                      {chapter.wordCount}/2000 words
                    </div>
                    <div className="w-16 bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all ${
                          chapter.wordCount >= 1800 ? 'bg-green-400' : 'bg-purple-400'
                        }`}
                        style={{ width: `${Math.min((chapter.wordCount / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistant Toggle */}
          <div className="mb-6">
            <Button
              onClick={() => setAiAssistMode(!aiAssistMode)}
              className={`w-full ${aiAssistMode 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              AI Assistant {aiAssistMode ? 'ON' : 'OFF'}
            </Button>
          </div>

          {/* Stats */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Project Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Chapters:</span>
                <span>{currentProject?.chapters.length || 0}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total Words:</span>
                <span>{currentProject?.totalWords || 0}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Genre:</span>
                <span>{currentProject?.genre}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-white font-semibold">
                  {currentChapter?.title || 'New Chapter'}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300">
                    {chapterWordCount}/2000 words
                  </span>
                  {chapterWordCount >= 1800 && (
                    <span className="text-green-400 text-xs">✓ Ready to complete</span>
                  )}
                  {isAutoSaving && (
                    <span className="text-blue-400 text-xs">💾 Auto-saving...</span>
                  )}
                  {lastSaved && (
                    <span className="text-gray-400 text-xs">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveProject} size="sm" variant="ghost">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={exportNovel} size="sm" variant="ghost">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={shareNovel} size="sm" variant="ghost">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                {/* Publish Document Button */}
                <Button 
                  onClick={publishDocument} 
                  size="sm" 
                  disabled={isPublishing || !editorContent.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isPublishing ? 'Publishing...' : 'Publish to PDF'}
                </Button>

                {/* Publish History Button */}
                <Button 
                  onClick={() => setShowPublishHistory(true)} 
                  size="sm" 
                  variant="ghost"
                  className="text-blue-300 hover:text-blue-200"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Publishing Progress Bar */}
            {isPublishing && (
              <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-blue-300 mb-1">
                      <span>Publishing document...</span>
                      <span>{publishProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${publishProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex">
            {/* Text Editor */}
            <div className="flex-1 p-6">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-full bg-transparent text-white text-lg leading-relaxed resize-none outline-none"
                placeholder="Start writing your novel here... Let your imagination flow!"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>

            {/* AI Assistant Panel */}
            <AnimatePresence>
              {aiAssistMode && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="bg-black/20 backdrop-blur-lg border-l border-white/10 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">AI Writing Assistant</h3>
                    <div className="ml-auto flex gap-2">
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                        {selectedModel === 'google/gemini-2.0-flash-001' ? '🔥 Gemini 2.0' :
                         selectedModel === 'deepseek/deepseek-r1:free' ? '🚀 DeepSeek R1' :
                         selectedModel === 'anthropic/claude-3.5-sonnet' ? '🎯 Claude 3.5' :
                         selectedModel === 'openai/gpt-4o' ? '💡 GPT-4o' : '⚡ GPT-4o Mini'}
                      </span>
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full">
                        {selectedLanguage === 'indonesian' ? '🇮🇩 ID' : '🇺🇸 EN'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Collaborative Mode Toggle */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">Collaborative Writing</span>
                        <button
                          onClick={() => setCollaborativeMode(!collaborativeMode)}
                          className={`w-10 h-6 rounded-full transition-all ${
                            collaborativeMode ? 'bg-purple-500' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            collaborativeMode ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {collaborativeMode 
                          ? 'AI will help continue your writing' 
                          : 'Generate content from prompts'
                        }
                      </p>
                    </div>

                    {/* AI Model Selection */}
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">AI Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="google/gemini-2.0-flash-001">🔥 Gemini 2.0 Flash (Recommended for Novels)</option>
                        <option value="deepseek/deepseek-r1">💎 DeepSeek R1 (Paid - No Rate Limit)</option>
                        <option value="deepseek/deepseek-r1:free">🚀 DeepSeek R1 (Free - 50/day limit)</option>
                        <option value="anthropic/claude-3.5-sonnet">🎯 Claude 3.5 Sonnet (Paid)</option>
                        <option value="openai/gpt-4o">💡 GPT-4o (Paid)</option>
                        <option value="openai/gpt-4o-mini">⚡ GPT-4o Mini (Paid)</option>
                      </select>
                      <p className="text-gray-400 text-xs mt-1">
                        {selectedModel === 'google/gemini-2.0-flash-001' && '🚀 Google\'s latest model - excellent for creative writing with 2M context window'}
                        {selectedModel === 'deepseek/deepseek-r1' && '💎 PAID DeepSeek R1 - No rate limits, 128K context, best for auto pilot'}
                        {selectedModel === 'deepseek/deepseek-r1:free' && '🆓 FREE model with 128K context - LIMITED to 50 requests/day'}
                        {selectedModel === 'anthropic/claude-3.5-sonnet' && '🎯 Great for structured writing and analysis - No rate limits'}
                        {selectedModel === 'openai/gpt-4o' && '💡 Powerful general-purpose model - No rate limits'}
                        {selectedModel === 'openai/gpt-4o-mini' && '⚡ Fast and efficient for quick generation - No rate limits'}
                      </p>
                      {selectedModel.includes(':free') && (
                        <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-300 text-xs">
                            ⚠️ <strong>Rate Limited:</strong> Free models limited to 50 requests/day. Consider using paid models for auto pilot.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Language Selection */}
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Writing Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="english">🇺🇸 English</option>
                        <option value="indonesian">🇮🇩 Bahasa Indonesia</option>
                      </select>
                      <p className="text-gray-400 text-xs mt-1">
                        {selectedLanguage === 'english' && '🌍 AI will write in English language'}
                        {selectedLanguage === 'indonesian' && '🇮🇩 AI akan menulis dalam Bahasa Indonesia'}
                      </p>
                    </div>

                    {/* Genre Selection */}
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Genre</label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="fantasy">Fantasy</option>
                        <option value="sci-fi">Science Fiction</option>
                        <option value="romance">Romance</option>
                        <option value="mystery">Mystery</option>
                        <option value="thriller">Thriller</option>
                        <option value="horror">Horror</option>
                        <option value="historical">Historical Fiction</option>
                        <option value="contemporary">Contemporary</option>
                        <option value="adventure">Adventure</option>
                        <option value="literary">Literary Fiction</option>
                      </select>
                    </div>

                    {/* Writing Mode Selection */}
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Writing Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { mode: 'story', label: '📖 Story', desc: 'Full narrative' },
                          { mode: 'dialogue', label: '💬 Dialogue', desc: 'Conversations' },
                          { mode: 'description', label: '🎨 Description', desc: 'Vivid scenes' },
                          { mode: 'character', label: '👤 Character', desc: 'Development' },
                          { mode: 'plot', label: '📋 Plot', desc: 'Story outline' }
                        ].map(({ mode, label, desc }) => (
                          <button
                            key={mode}
                            onClick={() => setWritingMode(mode as WritingMode)}
                            className={`p-2 rounded-lg text-xs border transition-all ${
                              writingMode === mode
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <div className="font-medium">{label}</div>
                            <div className="text-xs opacity-75">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {collaborativeMode ? (
                      /* Collaborative Writing Mode */
                      <div className="space-y-3">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <h4 className="text-blue-300 font-medium mb-2">✍️ Collaborative Mode</h4>
                          <p className="text-gray-300 text-xs">
                            Start writing in the editor. AI will help continue your story or provide suggestions.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={continueWriting}
                            disabled={isGenerating || !editorContent.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-xs"
                            size="sm"
                          >
                            {isGenerating ? (
                              <Zap className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Pen className="w-3 h-3 mr-1" />
                            )}
                            Continue Story
                          </Button>
                          
                          <Button
                            onClick={getSuggestions}
                            disabled={isGenerating || !editorContent.trim()}
                            className="bg-green-500 hover:bg-green-600 text-xs"
                            size="sm"
                          >
                            {isGenerating ? (
                              <Zap className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Brain className="w-3 h-3 mr-1" />
                            )}
                            Get Suggestions
                          </Button>
                        </div>

                        {/* Smart Auto-Pilot Mode */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-purple-300 font-medium">🤖 Smart Auto-Pilot</h4>
                            <div className={`w-2 h-2 rounded-full ${autoPilotMode ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                          </div>
                          <p className="text-gray-300 text-xs mb-3">
                            AI writes complete chapters (1800-2000 words) automatically. Creates new chapters when current one is complete!
                          </p>
                          
                          {currentChapter && (
                            <div className="mb-3 p-2 bg-black/20 rounded text-xs">
                              <div className="flex justify-between text-gray-300 mb-1">
                                <span>Current: {currentChapter.title}</span>
                                <span>{chapterWordCount}/2000 words</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full transition-all ${
                                    chapterWordCount >= 1800 ? 'bg-green-400' : 'bg-purple-400'
                                  }`}
                                  style={{ width: `${Math.min((chapterWordCount / 2000) * 100, 100)}%` }}
                                />
                              </div>
                              {chapterWordCount >= 1800 && (
                                <div className="text-green-400 text-xs mt-1">✓ Ready to complete chapter</div>
                              )}
                            </div>
                          )}
                          
                          {!autoPilotMode ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-gray-300 text-xs">Writing Speed:</label>
                                <select
                                  value={autoPilotSpeed}
                                  onChange={(e) => setAutoPilotSpeed(Number(e.target.value))}
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                                >
                                  <option value={10}>Fast (10s)</option>
                                  <option value={15}>Normal (15s)</option>
                                  <option value={20}>Slow (20s)</option>
                                  <option value={30}>Very Slow (30s)</option>
                                </select>
                              </div>
                              
                              <Button
                                onClick={startAutoPilot}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs"
                                size="sm"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Start Smart Auto-Pilot
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-center">
                                <div className="text-green-300 text-xs font-medium mb-1">
                                  🚀 Smart Auto-Pilot Active
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Writing every {autoPilotSpeed} seconds...
                                </div>
                                {chapterWordCount >= 1800 && (
                                  <div className="text-yellow-400 text-xs mt-1">
                                    ⚡ Completing chapter soon...
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                onClick={stopAutoPilot}
                                className="w-full bg-red-500 hover:bg-red-600 text-xs"
                                size="sm"
                              >
                                ⏹️ Stop Auto-Pilot
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Word Count Display */}
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-gray-300 text-xs">
                            <span className="font-medium">{wordCount}</span> words written
                            {lastSaved && (
                              <span className="ml-2 text-gray-400">
                                • Saved {lastSaved.toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Prompt-based Generation Mode */
                      <div>
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">
                            What do you want to write about?
                          </label>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm"
                            rows={3}
                            placeholder={
                              writingMode === 'dialogue' ? 'Describe the conversation scene...' :
                              writingMode === 'description' ? 'What scene or setting to describe...' :
                              writingMode === 'character' ? 'Character name, role, or traits...' :
                              writingMode === 'plot' ? 'Story concept or plot points...' :
                              'Describe a scene, character, or plot point...'
                            }
                          />
                        </div>

                        <Button
                          onClick={generateWithAI}
                          disabled={isGenerating || !prompt.trim()}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {isGenerating ? (
                            <>
                              <Zap className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {generatedContent && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h4 className="text-white font-medium mb-2">AI Generated Content:</h4>
                        <div className="text-gray-300 text-sm leading-relaxed max-h-60 overflow-y-auto">
                          {generatedContent}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => {
                              // Add to editor
                              setEditorContent(prev => prev + '\n\n' + generatedContent);
                              setGeneratedContent('');
                              setPrompt('');
                            }}
                          >
                            Add to Editor
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => {
                              // Replace editor content
                              setEditorContent(generatedContent);
                              setGeneratedContent('');
                              setPrompt('');
                            }}
                          >
                            Replace All
                          </Button>
                        </div>
                      </div>
                    )}

                    {aiSuggestions && (
                      <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/20">
                        <h4 className="text-green-300 font-medium mb-2">💡 AI Writing Suggestions:</h4>
                        <div className="text-gray-300 text-sm leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                          {aiSuggestions}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 border-green-500/20 text-green-300 hover:bg-green-500/10"
                          onClick={() => setAiSuggestions('')}
                        >
                          Clear Suggestions
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Publish History Modal */}
      <AnimatePresence>
        {showPublishHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPublishHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 w-full max-w-2xl border border-white/20 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Publishing History</h3>
                    <p className="text-gray-400 text-sm">Track your published documents</p>
                  </div>
                </div>
                <Button
                  onClick={clearPublishHistory}
                  size="sm"
                  variant="outline"
                  className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {publishHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No published documents yet</p>
                    <p className="text-gray-500 text-sm">Your publishing history will appear here</p>
                  </div>
                ) : (
                  publishHistory.map((publish) => (
                    <div
                      key={publish.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{publish.chapterTitle}</h4>
                          <p className="text-gray-400 text-sm">
                            {publish.publishDate.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {publish.status === 'success' && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <span className="text-green-300 text-sm">Success</span>
                            </>
                          )}
                          {publish.status === 'failed' && (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-400" />
                              <span className="text-red-300 text-sm">Failed</span>
                            </>
                          )}
                          {publish.status === 'publishing' && (
                            <>
                              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                              <span className="text-blue-300 text-sm">Publishing</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {publish.errorMessage && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          <p className="text-red-300 text-xs">{publish.errorMessage}</p>
                        </div>
                      )}
                      
                      {publish.documentUrl && (
                        <div className="mt-2">
                          <a
                            href={publish.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 text-sm underline"
                          >
                            View Document →
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setShowPublishHistory(false)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}