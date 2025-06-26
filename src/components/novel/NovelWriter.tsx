'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Pen, 
  Sparkles, 
  Download, 
  Save, 
  Wand2, 
  Brain, 
  Zap, 
  Trash2, 
  History, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  Plus,
  FileText,
  Settings
} from 'lucide-react';
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

export default function NovelWriter() {
  // Core state
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const [currentProject, setCurrentProject] = useState<NovelProject | null>(null);
  const [currentChapter, setCurrentChapter] = useState<NovelChapter | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  
  // AI state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  
  // Auto-pilot state
  const [autoPilotMode, setAutoPilotMode] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoPilotSpeed, setAutoPilotSpeed] = useState(15);
  
  // Settings
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [writingMode, setWritingMode] = useState<'story' | 'dialogue' | 'description' | 'character' | 'plot'>('story');
  
  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [chapterWordCount, setChapterWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('novel_projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        if (parsedProjects.length > 0) {
          const lastProject = parsedProjects[parsedProjects.length - 1];
          setCurrentProject(lastProject);
          const currentChap = lastProject.chapters[lastProject.currentChapterIndex] || lastProject.chapters[0];
          setCurrentChapter(currentChap);
          setEditorContent(currentChap.content);
          setChapterWordCount(currentChap.wordCount);
          setIsWriting(true);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  // Update word counts when content changes
  useEffect(() => {
    const words = editorContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    setChapterWordCount(editorContent.trim() ? words : 0);
    
    if (currentProject) {
      const totalWords = currentProject.chapters.reduce((total, chapter, index) => {
        return total + (index === currentProject.currentChapterIndex ? words : chapter.wordCount);
      }, 0);
      setWordCount(totalWords);
    }
  }, [editorContent, currentProject]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentProject && currentChapter && editorContent !== currentChapter.content) {
        saveCurrentChapter();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentProject, currentChapter, editorContent]);

  const saveCurrentChapter = useCallback(() => {
    if (!currentProject || !currentChapter) return;

    setIsAutoSaving(true);
    
    const updatedChapter = {
      ...currentChapter,
      content: editorContent,
      wordCount: chapterWordCount
    };

    const updatedProject = {
      ...currentProject,
      chapters: currentProject.chapters.map((ch, index) => 
        index === currentProject.currentChapterIndex ? updatedChapter : ch
      ),
      totalWords: wordCount,
      lastSaved: new Date()
    };

    setCurrentChapter(updatedChapter);
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    setLastSaved(new Date());

    // Save to localStorage
    try {
      const projectsToSave = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('novel_projects', JSON.stringify(projectsToSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    setTimeout(() => setIsAutoSaving(false), 1000);
  }, [currentProject, currentChapter, editorContent, chapterWordCount, wordCount, projects]);

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
  };

  const addNewChapter = () => {
    if (!currentProject) return;
    
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
  };

  const switchToChapter = (chapterIndex: number) => {
    if (!currentProject || chapterIndex < 0 || chapterIndex >= currentProject.chapters.length) return;
    
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
  };

  const getPromptByMode = () => {
    const languageInstruction = selectedLanguage === 'indonesian' 
      ? 'Write in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
      : 'Write in English language. ';
    
    const basePrompt = `You are a professional ${selectedGenre} novel writing assistant. ${languageInstruction}`;
    
    switch (writingMode) {
      case 'dialogue':
        return basePrompt + `Write compelling dialogue based on this prompt: "${prompt}". Create natural, character-driven conversations with dialogue tags and action beats. Make it emotionally engaging. Write 800-1200 words of substantial dialogue.`;
      case 'description':
        return basePrompt + `Write vivid, immersive descriptions based on this prompt: "${prompt}". Use all five senses, create atmospheric prose with specific details. Write 800-1200 words of immersive description.`;
      case 'character':
        return basePrompt + `Develop a compelling character based on this prompt: "${prompt}". Include physical appearance, personality, backstory, unique quirks, motivations, and flaws. Write 800-1200 words of character development.`;
      case 'plot':
        return basePrompt + `Create an engaging plot outline based on this prompt: "${prompt}". Structure with beginning, middle, end, include conflict, tension, resolution, and character arcs. Write 800-1200 words of plot development.`;
      default:
        return basePrompt + `Write a compelling ${selectedGenre} story segment based on this prompt: "${prompt}". Make it engaging with vivid descriptions, dialogue, character development, and appropriate pacing. Write 1000-1500 words.`;
    }
  };

  const generateWithAI = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await apiService.sendChatMessage({
        message: getPromptByMode(),
        model: selectedModel,
        temperature: 0.8,
        max_tokens: 800
      });
      
      // The backend returns the AI response in the "response" field as per OpenHands-Backend
      setGeneratedContent(response.response || 'AI generated content will appear here...');
      
      console.log('AI Generation Response:', {
        status: response.status,
        model: response.model,
        conversationId: response.conversation_id,
        responseLength: response.response?.length || 0
      });
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
      const lastSection = editorContent.split('\n\n').slice(-3).join('\n\n');
      
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Write in Indonesian language (Bahasa Indonesia). '
        : 'Write in English language. ';

      const response = await apiService.sendChatMessage({
        message: `You are a ${selectedGenre} novel writing assistant. ${languageInstruction}CONTINUE this story naturally from where it left off. DO NOT rewrite or repeat existing content.

Here's what has been written so far:
"${lastSection}"

Write ONLY the NEXT section (4-6 substantial paragraphs, 800-1200 words) that naturally continues from where the story left off, advances the plot, and maintains the same style and tone.`,
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 800
      });
      
      // The backend returns the AI response in the "response" field as per OpenHands-Backend
      setGeneratedContent(response.response || 'AI continuation will appear here...');
      
      console.log('Continue Writing Response:', {
        status: response.status,
        model: response.model,
        conversationId: response.conversation_id,
        responseLength: response.response?.length || 0
      });
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
        ? 'Respond in Indonesian language (Bahasa Indonesia). '
        : 'Respond in English language. ';

      const response = await apiService.sendChatMessage({
        message: `You are a professional ${selectedGenre} writing coach. ${languageInstruction}Analyze this text and provide 3-4 specific suggestions for plot development, character development, dialogue improvements, and scene enhancement:

"${editorContent.slice(-500)}"

Provide constructive and actionable suggestions.`,
        model: selectedModel,
        temperature: 0.6,
        max_tokens: 600
      });
      
      // The backend returns the AI response in the "response" field as per OpenHands-Backend
      setAiSuggestions(response.response || 'AI suggestions will appear here...');
      
      console.log('Get Suggestions Response:', {
        status: response.status,
        model: response.model,
        conversationId: response.conversation_id,
        responseLength: response.response?.length || 0
      });
    } catch (error) {
      console.error('AI suggestions failed:', error);
      setAiSuggestions('Sorry, AI suggestions are currently unavailable. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutoPilot = () => {
    if (autoPilotInterval) return;
    
    setAutoPilotMode(true);
    const interval = setInterval(async () => {
      if (!currentProject || !currentChapter || isGenerating) return;
      
      // Check if current chapter is complete (2000+ words)
      if (chapterWordCount >= 2000) {
        // Mark chapter as complete and create new one
        const updatedChapter = { ...currentChapter, isComplete: true, completedAt: new Date() };
        const updatedProject = {
          ...currentProject,
          chapters: currentProject.chapters.map((ch, index) => 
            index === currentProject.currentChapterIndex ? updatedChapter : ch
          )
        };
        setCurrentProject(updatedProject);
        setCurrentChapter(updatedChapter);
        addNewChapter();
        return;
      }
      
      // Continue writing the current chapter
      setIsGenerating(true);
      try {
        const languageInstruction = selectedLanguage === 'indonesian' 
          ? 'Write in Indonesian language (Bahasa Indonesia). '
          : 'Write in English language. ';
        
        const remainingWords = 2000 - chapterWordCount;
        const isChapterEnding = remainingWords <= 200;
        
        let promptText = '';
        
        if (!editorContent.trim()) {
          // Start a new chapter
          const chapterNumber = currentProject.currentChapterIndex + 1;
          promptText = `You are an expert ${selectedGenre} novelist. ${languageInstruction}Write the BEGINNING of Chapter ${chapterNumber}. Create an engaging opening with vivid descriptions, character development, and plot advancement. Write approximately 500-800 words for this opening section.`;
        } else {
          // Get more context for better continuation
          const contextLength = Math.min(1000, editorContent.length);
          const lastSection = editorContent.slice(-contextLength);
          const wordsSoFar = chapterWordCount;
          
          if (isChapterEnding) {
            promptText = `You are writing a ${selectedGenre} novel. ${languageInstruction}

CURRENT CHAPTER PROGRESS: ${wordsSoFar}/2000 words

LAST PART OF THE STORY:
"${lastSection}"

TASK: Write the FINAL section to complete this chapter. Continue naturally from where the story ended. Write approximately ${remainingWords} words to reach the 2000-word chapter goal. End with a compelling cliffhanger or transition to the next chapter.

IMPORTANT: 
- Continue from the exact point where the story left off
- Do NOT repeat or rewrite any existing content
- Maintain the same writing style and tone
- Advance the plot meaningfully`;
          } else {
            const targetWords = Math.min(500, 2000 - wordsSoFar);
            // Get last sentence for better continuation
            const sentences = editorContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const lastSentence = sentences[sentences.length - 1]?.trim() || '';
            
            promptText = `SYSTEM: You are a novel continuation AI. Your ONLY job is to ADD NEW CONTENT.

CRITICAL MISSION: CONTINUE the story from the exact ending point. DO NOT REWRITE ANYTHING.

CURRENT PROGRESS: ${wordsSoFar}/2000 words (generating ${targetWords} words this cycle)

STORY ENDING POINT:
"${lastSection}"

EXACT LAST SENTENCE: "${lastSentence}"

TASK: Write the NEXT ${targetWords} words that happen AFTER this sentence: "${lastSentence}"

ABSOLUTE RULES:
🚫 DO NOT repeat "${lastSentence}" 
🚫 DO NOT rewrite any existing content
🚫 DO NOT start with "Chapter" or "Bab"
🚫 DO NOT summarize what happened
🚫 DO NOT change character names
🚫 DO NOT include any meta-text like "Here's the continuation" or "The story continues"
✅ START with what happens NEXT
✅ Continue the same scene/action
✅ Add new dialogue, events, descriptions
✅ Move the story FORWARD
✅ Maintain consistent tone and style

${languageInstruction}

BEGIN CONTINUATION NOW:`;
          }
        }

        console.log('🚀 Sending auto-pilot request...', {
          messageLength: promptText.length,
          model: selectedModel,
          maxTokens: 800,
          backendUrl: 'https://minatoz997-backend66.hf.space/chat/message',
          promptPreview: promptText.substring(0, 200) + '...'
        });

        const response = await apiService.sendChatMessage({
          message: promptText,
          model: selectedModel,
          temperature: 0.8,
          max_tokens: 800 // Optimized for 500-600 words per cycle (4 cycles to reach 2000 words)
        });
        
        // Log the response structure from the backend
        console.log('📥 Received response:', {
          status: response.status,
          responseLength: response.response?.length || 0,
          messageLength: response.message?.length || 0,
          fullResponse: response
        });
        
        // The backend returns the AI response in the "response" field as per OpenHands-Backend/openhands/server/routes/openrouter_chat.py
        const newContent = response.response || '';
        
        // Log detailed information about the extracted content
        console.log('🔍 AUTO-PILOT: Content extraction result', {
          hasContent: !!newContent.trim(),
          contentLength: newContent.length,
          contentPreview: newContent.substring(0, 200),
          responseFields: {
            hasResponse: !!response.response,
            responseLength: response.response?.length || 0,
            conversationId: response.conversation_id,
            model: response.model,
            timestamp: response.timestamp,
            status: response.status
          }
        });
        
        if (newContent.trim()) {
          // Clean the new content and check for repetition
          let cleanedContent = newContent.trim();
          
          // Remove common AI prefixes/suffixes
          cleanedContent = cleanedContent.replace(/^(Here's the continuation|Continuing the story|Here's what happens next)[:.]?\s*/i, '');
          cleanedContent = cleanedContent.replace(/\s*(The story continues|To be continued)\.?\s*$/i, '');
          
          // Check if the new content is too similar to existing content (improved check)
          const existingWords = editorContent.toLowerCase().split(/\s+/);
          const newWords = cleanedContent.toLowerCase().split(/\s+/);
          
          // Common words to ignore in similarity check
          const commonWords = ['dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah', 'akan', 'telah', 'sudah', 'masih', 'juga', 'atau', 'tetapi', 'namun', 'karena', 'sehingga', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
          
          // Filter out common words for similarity check
          const significantExistingWords = existingWords.filter(word => !commonWords.includes(word) && word.length > 2);
          const significantNewWords = newWords.filter(word => !commonWords.includes(word) && word.length > 2);
          
          // Count overlapping significant words
          let overlapCount = 0;
          for (const word of significantNewWords.slice(0, 15)) { // Check first 15 significant words
            if (significantExistingWords.includes(word)) {
              overlapCount++;
            }
          }
          
          const similarity = significantNewWords.length > 0 ? overlapCount / Math.min(15, significantNewWords.length) : 0;
          const similarityThreshold = 0.8; // Increased threshold
          
          // COMPLETELY DISABLE similarity check for auto-pilot to prevent content rejection
          console.log(`🔍 Similarity check: ${(similarity * 100).toFixed(1)}% (threshold: ${(similarityThreshold * 100).toFixed(1)}%)`);
          console.log(`📝 Content length: ${cleanedContent.length} characters`);
          console.log(`🤖 Auto-pilot active: ${autoPilotMode}`);
          
          // For auto-pilot: Accept ALL content to prevent rewriting loops
          // For manual: Use similarity check
          const shouldAcceptContent = autoPilotMode ? cleanedContent.length > 30 : (similarity < similarityThreshold && cleanedContent.length > 30);
          
          if (shouldAcceptContent) {
            // For auto-pilot: FORCE APPEND to prevent any content loss
            const separator = editorContent ? '\n\n' : '';
            const updatedContent = editorContent + separator + cleanedContent;
            setEditorContent(updatedContent);
            
            const oldWords = editorContent.split(' ').filter(w => w.trim()).length;
            const newWords = updatedContent.split(' ').filter(w => w.trim()).length;
            const addedWords = newWords - oldWords;
            console.log(`✅ Content added! +${addedWords} words (${oldWords} → ${newWords}) | Progress: ${newWords}/2000 words`);
            
            // Update word count immediately
            const newWordCount = updatedContent.trim().split(/\s+/).filter(word => word.length > 0).length;
            setChapterWordCount(newWordCount);
            
            // Update the chapter in the project
            const updatedChapter = {
              ...currentChapter,
              content: updatedContent,
              wordCount: newWordCount,
              lastModified: new Date()
            };
            
            const updatedProject = {
              ...currentProject,
              chapters: currentProject.chapters.map((ch, index) => 
                index === currentProject.currentChapterIndex ? updatedChapter : ch
              ),
              totalWords: currentProject.chapters.reduce((total, ch, index) => 
                total + (index === currentProject.currentChapterIndex ? newWordCount : ch.wordCount), 0
              ),
              lastModified: new Date()
            };
            
            setCurrentProject(updatedProject);
            setCurrentChapter(updatedChapter);
            
            // Save to localStorage
            setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
            
            console.log(`Auto-pilot: Added ${cleanedContent.length} characters, new word count: ${newWordCount}`);
          } else {
            console.log(`❌ Content REJECTED! Similarity: ${(similarity * 100).toFixed(1)}%, Length: ${cleanedContent.length}, Auto-pilot: ${autoPilotMode}`);
            console.log(`🚫 Rejected content preview: "${cleanedContent.substring(0, 100)}..."`);
            
            // For auto-pilot, this should NEVER happen now
            if (autoPilotMode) {
              console.error('🚨 AUTO-PILOT CONTENT REJECTED! This should not happen with new logic!');
            }
          }
        } else {
          console.log('❌ AUTO-PILOT: No content received from backend!', {
            responseType: typeof response,
            responseKeys: Object.keys(response || {}),
            fullResponse: response
          });
        }
      } catch (error) {
        console.error('🚨 Auto-pilot failed:', error);
        console.error('🚨 Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } finally {
        setIsGenerating(false);
      }
    }, autoPilotSpeed * 1000);
    
    setAutoPilotInterval(interval);
  };
  
  const stopAutoPilot = () => {
    if (autoPilotInterval) {
      clearInterval(autoPilotInterval);
      setAutoPilotInterval(null);
    }
    setAutoPilotMode(false);
    console.log('Auto-pilot mode stopped');
  };

  const insertGeneratedContent = () => {
    if (generatedContent.trim()) {
      const updatedContent = editorContent + (editorContent ? '\n\n' : '') + generatedContent.trim();
      setEditorContent(updatedContent);
      setGeneratedContent('');
      
      // Update word count immediately
      const newWordCount = updatedContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      setChapterWordCount(newWordCount);
      
      // Update the chapter in the project
      if (currentProject && currentChapter) {
        const updatedChapter = {
          ...currentChapter,
          content: updatedContent,
          wordCount: newWordCount,
          lastModified: new Date()
        };
        
        const updatedProject = {
          ...currentProject,
          chapters: currentProject.chapters.map((ch, index) => 
            index === currentProject.currentChapterIndex ? updatedChapter : ch
          ),
          totalWords: currentProject.chapters.reduce((total, ch, index) => 
            total + (index === currentProject.currentChapterIndex ? newWordCount : ch.wordCount), 0
          ),
          lastModified: new Date()
        };
        
        setCurrentProject(updatedProject);
        setCurrentChapter(updatedChapter);
        
        // Save to localStorage
        setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
      }
    }
  };

  const downloadProject = () => {
    if (!currentProject) return;
    
    let content = `${currentProject.title}\n${'='.repeat(currentProject.title.length)}\n\n`;
    content += `Genre: ${currentProject.genre}\n`;
    content += `Total Words: ${currentProject.totalWords}\n`;
    content += `Created: ${currentProject.createdAt.toLocaleDateString()}\n\n`;
    
    currentProject.chapters.forEach((chapter, index) => {
      content += `\n\n${chapter.title}\n${'-'.repeat(chapter.title.length)}\n\n`;
      content += chapter.content;
      if (index < currentProject.chapters.length - 1) {
        content += '\n\n---\n';
      }
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isWriting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 text-purple-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Novel Writer</h1>
            <p className="text-xl text-gray-600 mb-8">Create your masterpiece with AI assistance</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Start New Project</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="fantasy">Fantasy</option>
                      <option value="romance">Romance</option>
                      <option value="mystery">Mystery</option>
                      <option value="sci-fi">Science Fiction</option>
                      <option value="thriller">Thriller</option>
                      <option value="drama">Drama</option>
                      <option value="adventure">Adventure</option>
                      <option value="horror">Horror</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="english">English</option>
                      <option value="indonesian">Indonesian</option>
                    </select>
                  </div>
                  <Button onClick={createNewProject} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Novel
                  </Button>
                </div>
              </div>
              
              {projects.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
                  <div className="space-y-2">
                    {projects.slice(-3).map((project) => (
                      <div
                        key={project.id}
                        onClick={() => {
                          setCurrentProject(project);
                          const currentChap = project.chapters[project.currentChapterIndex] || project.chapters[0];
                          setCurrentChapter(currentChap);
                          setEditorContent(currentChap.content);
                          setChapterWordCount(currentChap.wordCount);
                          setIsWriting(true);
                        }}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500">
                          {project.genre} • {project.totalWords} words • {project.chapters.length} chapters
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentProject?.title || 'Untitled Novel'}
              </h1>
              <div className="text-sm text-gray-500">
                {currentChapter?.title} • {chapterWordCount} words • {selectedGenre}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAutoSaving && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </div>
            )}
            {lastSaved && (
              <div className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <Button onClick={saveCurrentChapter} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button onClick={downloadProject} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Chapter Navigation */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Chapters</h3>
              <Button onClick={addNewChapter} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentProject?.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  onClick={() => switchToChapter(index)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    index === currentProject.currentChapterIndex
                      ? 'bg-purple-100 text-purple-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-sm">{chapter.title}</div>
                  <div className="text-xs text-gray-500">
                    {chapter.wordCount} words
                    {chapter.isComplete && <CheckCircle className="h-3 w-3 inline ml-1 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Controls */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">AI Assistant</h3>
            
            {/* Writing Mode */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={writingMode}
                onChange={(e) => setWritingMode(e.target.value as any)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="story">Story</option>
                <option value="dialogue">Dialogue</option>
                <option value="description">Description</option>
                <option value="character">Character</option>
                <option value="plot">Plot</option>
              </select>
            </div>

            {/* AI Model Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="openai/gpt-4o">GPT-4o</option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                <option value="mistralai/mistral-large">Mistral Large</option>
                <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B</option>
              </select>
            </div>

            {/* Language Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="english">English</option>
                <option value="indonesian">Bahasa Indonesia</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div className="mb-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your writing prompt..."
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            </div>

            {/* AI Buttons */}
            <div className="space-y-2">
              <Button
                onClick={generateWithAI}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate
              </Button>
              
              <Button
                onClick={continueWriting}
                disabled={isGenerating || !editorContent.trim()}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Continue
              </Button>
              
              <Button
                onClick={getSuggestions}
                disabled={isGenerating || !editorContent.trim()}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Brain className="h-4 w-4 mr-1" />
                )}
                Suggestions
              </Button>
            </div>

            {/* Auto-pilot */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Auto-Pilot</span>
                <Button
                  onClick={autoPilotMode ? stopAutoPilot : startAutoPilot}
                  size="sm"
                  variant={autoPilotMode ? "destructive" : "outline"}
                >
                  {autoPilotMode ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                Speed: {autoPilotSpeed}s intervals
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={autoPilotSpeed}
                onChange={(e) => setAutoPilotSpeed(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Generated Content</h3>
                <Button onClick={insertGeneratedContent} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Insert
                </Button>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {generatedContent}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-2">AI Suggestions</h3>
              <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {aiSuggestions}
              </div>
            </div>
          )}
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentChapter?.title}
                </h2>
                {autoPilotMode && (
                  <div className="flex items-center text-sm text-green-600">
                    <Zap className="h-4 w-4 mr-1" />
                    Auto-Pilot Active
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {chapterWordCount} / 2000 words
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Start writing your story here..."
              className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 leading-relaxed"
              style={{ fontSize: '16px', lineHeight: '1.6' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}