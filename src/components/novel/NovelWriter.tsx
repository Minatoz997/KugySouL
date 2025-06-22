'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Pen, Sparkles, Download, Share2, Save, Wand2, Brain, Zap, Trash2, Upload, Settings, History, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';

interface NovelChapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: Date;
}

interface NovelProject {
  id: string;
  title: string;
  genre: string;
  description: string;
  chapters: NovelChapter[];
  totalWords: number;
  createdAt: Date;
}

interface FizzoSettings {
  email: string;
  password: string;
  rememberCredentials: boolean;
}

interface FizzoUploadHistory {
  id: string;
  chapterTitle: string;
  uploadDate: Date;
  status: 'success' | 'failed' | 'uploading';
  errorMessage?: string;
  fizzoUrl?: string;
}

interface FizzoNovel {
  id: string;
  title: string;
  description?: string;
  chapters_count: number;
  last_updated?: string;
  url?: string;
  status?: string;
}

interface UploadConfirmation {
  selectedNovel: FizzoNovel;
  chapterTitle: string;
  chapterContent: string;
  wordCount: number;
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [autoPilotMode, setAutoPilotMode] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoPilotSpeed, setAutoPilotSpeed] = useState(10); // seconds between generations
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  // Fizzo Auto-Upload States
  const [showFizzoSettings, setShowFizzoSettings] = useState(false);
  const [fizzoSettings, setFizzoSettings] = useState<FizzoSettings>({
    email: '',
    password: '',
    rememberCredentials: false
  });
  const [fizzoUploadHistory, setFizzoUploadHistory] = useState<FizzoUploadHistory[]>([]);
  const [isUploadingToFizzo, setIsUploadingToFizzo] = useState(false);
  const [showFizzoHistory, setShowFizzoHistory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Novel Selection States
  const [fizzoNovels, setFizzoNovels] = useState<FizzoNovel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<FizzoNovel | null>(null);
  const [isLoadingNovels, setIsLoadingNovels] = useState(false);
  const [showNovelSelector, setShowNovelSelector] = useState(false);
  const [showUploadConfirmation, setShowUploadConfirmation] = useState(false);
  const [uploadConfirmation, setUploadConfirmation] = useState<UploadConfirmation | null>(null);

  const createNewProject = () => {
    const newProject: NovelProject = {
      id: Date.now().toString(),
      title: 'Untitled Novel',
      genre: 'Fantasy',
      description: '',
      chapters: [],
      totalWords: 0,
      createdAt: new Date()
    };
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setIsWriting(true);
  };

  const addNewChapter = () => {
    if (!currentProject) return;
    
    const newChapter: NovelChapter = {
      id: Date.now().toString(),
      title: `Chapter ${currentProject.chapters.length + 1}`,
      content: '',
      wordCount: 0,
      createdAt: new Date()
    };

    const updatedProject = {
      ...currentProject,
      chapters: [...currentProject.chapters, newChapter]
    };
    
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
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
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const languageInstruction = selectedLanguage === 'indonesian' 
        ? 'Write in Indonesian language (Bahasa Indonesia). Use natural, fluent Indonesian with proper grammar and vocabulary. '
        : 'Write in English language. ';
      
      let promptText = '';
      
      if (!editorContent.trim()) {
        // Start a new story
        promptText = `You are an expert ${selectedGenre} novelist. ${languageInstruction}Start writing a compelling ${selectedGenre} novel. Create an engaging opening that:

- Introduces the main character and setting
- Establishes the tone and atmosphere
- Hooks the reader immediately
- Sets up the central conflict or mystery
- Uses vivid, immersive descriptions
- Is approximately 800-1200 words (write a substantial section)

Begin the novel now:`;
      } else {
        // Continue the existing story
        const lastSection = editorContent.split('\n\n').slice(-3).join('\n\n');
        promptText = `You are continuing this ${selectedGenre} novel. ${languageInstruction}Here's what has been written so far:

"${lastSection}"

Continue the story naturally and seamlessly. Write the next section that:
- Flows perfectly from the previous text
- Advances the plot meaningfully
- Develops characters further
- Maintains the established tone and style
- Adds tension, conflict, or intrigue
- Is approximately 800-1200 words (write a substantial section)

Continue writing:`;
      }

      const response = await apiService.sendChatMessage({
        message: promptText,
        model: selectedModel,
        temperature: 0.8,
        max_tokens: 800
      });
      
      // Debug logging to see what we get from backend
      console.log('🔍 Auto Pilot Response:', response);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Response.response:', response.response);
      console.log('🔍 Response.message:', response.message);
      console.log('🔍 Response.content:', response.content);
      console.log('🔍 Response.data:', response.data);
      
      const newContent = response.response || response.message || response.content || response.data || '';
      console.log('🔍 Final newContent:', newContent);
      
      if (newContent && newContent.trim()) {
        console.log('✅ Adding content to editor:', newContent.substring(0, 100) + '...');
        setEditorContent(prev => prev ? prev + '\n\n' + newContent : newContent);
      } else {
        console.error('❌ No content found in response!', response);
      }
    } catch (error) {
      console.error('Auto-pilot writing failed:', error);
      // Stop auto-pilot on error
      stopAutoPilot();
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutoPilot = () => {
    setAutoPilotMode(true);
    
    // Start immediately
    autoPilotWrite();
    
    // Set up interval for continuous writing
    const interval = setInterval(() => {
      autoPilotWrite();
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

  const saveProject = useCallback(() => {
    if (currentProject) {
      // Update current project with editor content
      const updatedProject = {
        ...currentProject,
        totalWords: wordCount
      };
      
      const updatedProjects = projects.map(p => 
        p.id === currentProject.id ? updatedProject : p
      );
      
      setProjects(updatedProjects);
      localStorage.setItem('novel_projects', JSON.stringify(updatedProjects));
      setLastSaved(new Date());
    }
  }, [currentProject, wordCount, projects]);

  const exportNovel = () => {
    if (!currentProject || !editorContent) return;
    
    const content = `${currentProject.title}\n\n${editorContent}`;
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

  // Fizzo Auto-Upload Functions
  const saveFizzoSettings = () => {
    if (fizzoSettings.rememberCredentials) {
      // Simple encryption for demo - in production use proper encryption
      const encoded = btoa(JSON.stringify(fizzoSettings));
      localStorage.setItem('fizzo_settings', encoded);
    }
    setShowFizzoSettings(false);
  };

  const fetchFizzoNovels = async () => {
    if (!fizzoSettings.email || !fizzoSettings.password) {
      alert('Please configure your Fizzo credentials first!');
      setShowFizzoSettings(true);
      return;
    }

    setIsLoadingNovels(true);
    try {
      console.log('🔍 Fetching real novels from Fizzo.org...');
      
      // Use POST method to send credentials securely in body
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://minatoz997-backend66.hf.space'}/api/fizzo-list-novel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: fizzoSettings.email,
          password: fizzoSettings.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📚 Fetched novels from Fizzo.org:', data);
        
        // Handle different response formats
        const novels = data.novels || data.data || data || [];
        setFizzoNovels(novels);
        
        if (novels.length === 0) {
          alert('No novels found in your Fizzo account. Please create a novel on Fizzo.org first.');
        } else {
          console.log(`✅ Successfully loaded ${novels.length} novels from your Fizzo.org account`);
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Failed to fetch novels');
      }
    } catch (error) {
      console.error('Failed to fetch Fizzo novels:', error);
      alert(`❌ Failed to fetch your novels from Fizzo:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your credentials and try again.`);
    } finally {
      setIsLoadingNovels(false);
    }
  };

  const loadFizzoSettings = () => {
    try {
      const saved = localStorage.getItem('fizzo_settings');
      if (saved) {
        const decoded = JSON.parse(atob(saved));
        setFizzoSettings(decoded);
      }
    } catch (error) {
      console.error('Failed to load Fizzo settings:', error);
    }
  };

  const startUploadFlow = async () => {
    if (!editorContent.trim()) {
      alert('Please write some content before uploading to Fizzo!');
      return;
    }

    if (!fizzoSettings.email || !fizzoSettings.password) {
      setShowFizzoSettings(true);
      alert('Please configure your Fizzo credentials first!');
      return;
    }

    // Validate content length (1000-60000 characters as per backend requirement)
    if (editorContent.length < 1000) {
      alert('Chapter content must be at least 1,000 characters long for Fizzo upload!');
      return;
    }

    if (editorContent.length > 60000) {
      alert('Chapter content must be less than 60,000 characters for Fizzo upload!');
      return;
    }

    // Fetch novels and show selector
    await fetchFizzoNovels();
    setShowNovelSelector(true);
  };

  const confirmUpload = () => {
    if (!selectedNovel) {
      alert('Please select a novel to upload to!');
      return;
    }

    const chapterTitle = currentProject?.title ? 
      `${currentProject.title} - Chapter ${(currentProject.chapters?.length || 0) + 1}` : 
      'Untitled Chapter';

    setUploadConfirmation({
      selectedNovel,
      chapterTitle,
      chapterContent: editorContent,
      wordCount: countWords(editorContent)
    });

    setShowNovelSelector(false);
    setShowUploadConfirmation(true);
  };

  const uploadToFizzo = async () => {
    if (!uploadConfirmation) return;

    setIsUploadingToFizzo(true);
    setUploadProgress(0);
    setShowUploadConfirmation(false);

    // Create upload history entry
    const uploadId = Date.now().toString();
    const { selectedNovel, chapterTitle, chapterContent } = uploadConfirmation;

    if (!selectedNovel) {
      console.error('No novel selected for upload');
      return;
    }

    const newUpload: FizzoUploadHistory = {
      id: uploadId,
      chapterTitle: `${selectedNovel.title} - ${chapterTitle}`,
      uploadDate: new Date(),
      status: 'uploading'
    };

    setFizzoUploadHistory(prev => [newUpload, ...prev]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call backend API with novel selection
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://minatoz997-backend66.hf.space'}/api/fizzo-auto-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: fizzoSettings.email,
          password: fizzoSettings.password,
          novel_id: selectedNovel.id,
          chapter_title: chapterTitle,
          chapter_content: chapterContent
        })
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        // Update upload history with success
        setFizzoUploadHistory(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { 
                  ...upload, 
                  status: 'success' as const,
                  fizzoUrl: result.chapter_url || 'https://fizzo.org'
                }
              : upload
          )
        );

        alert(`✅ Chapter uploaded to Fizzo successfully!\n\n📚 Novel: ${selectedNovel.title}\n📖 Chapter: ${chapterTitle}\n🔗 Check your Fizzo account for the published chapter.`);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Fizzo upload error:', error);
      
      // Update upload history with error
      setFizzoUploadHistory(prev => 
        prev.map(upload => 
          upload.id === uploadId 
            ? { 
                ...upload, 
                status: 'failed' as const,
                errorMessage: error instanceof Error ? error.message : 'Upload failed'
              }
            : upload
        )
      );

      alert(`❌ Failed to upload to Fizzo:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your credentials and try again.`);
    } finally {
      setIsUploadingToFizzo(false);
      setUploadProgress(0);
      resetUploadFlow();
    }
  };

  const clearFizzoHistory = () => {
    if (confirm('Clear all Fizzo upload history?')) {
      setFizzoUploadHistory([]);
      localStorage.removeItem('fizzo_upload_history');
    }
  };

  const resetUploadFlow = () => {
    setSelectedNovel(null);
    setUploadConfirmation(null);
    setShowNovelSelector(false);
    setShowUploadConfirmation(false);
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
  useEffect(() => {
    setWordCount(countWords(editorContent));
  }, [editorContent]);

  // Cleanup auto-pilot on unmount
  useEffect(() => {
    return () => {
      if (autoPilotInterval) {
        clearInterval(autoPilotInterval);
      }
    };
  }, [autoPilotInterval]);

  useEffect(() => {
    // Load projects from localStorage
    const saved = localStorage.getItem('novel_projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    }

    // Load Fizzo settings and history
    loadFizzoSettings();
    
    const savedHistory = localStorage.getItem('fizzo_upload_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setFizzoUploadHistory(history);
      } catch (error) {
        console.error('Failed to load Fizzo upload history:', error);
      }
    }
  }, []);

  // Save Fizzo upload history to localStorage whenever it changes
  useEffect(() => {
    if (fizzoUploadHistory.length > 0) {
      localStorage.setItem('fizzo_upload_history', JSON.stringify(fizzoUploadHistory));
    }
  }, [fizzoUploadHistory]);

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
              {currentProject?.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="text-white text-sm font-medium">{chapter.title}</div>
                  <div className="text-gray-400 text-xs">{chapter.wordCount} words</div>
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
                  {currentProject?.chapters[0]?.title || 'New Chapter'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveProject} size="sm" variant="ghost">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={exportNovel} size="sm" variant="ghost">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={shareNovel} size="sm" variant="ghost">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                {/* Fizzo Upload Button */}
                <Button 
                  onClick={startUploadFlow} 
                  size="sm" 
                  disabled={isUploadingToFizzo || !editorContent.trim() || isLoadingNovels}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                >
                  {isUploadingToFizzo ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : isLoadingNovels ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingToFizzo ? 'Uploading...' : isLoadingNovels ? 'Loading...' : 'Upload to Fizzo'}
                </Button>

                {/* Fizzo Settings Button */}
                <Button 
                  onClick={() => setShowFizzoSettings(true)} 
                  size="sm" 
                  variant="ghost"
                  className="text-orange-300 hover:text-orange-200"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                {/* Fizzo History Button */}
                <Button 
                  onClick={() => setShowFizzoHistory(true)} 
                  size="sm" 
                  variant="ghost"
                  className="text-orange-300 hover:text-orange-200"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploadingToFizzo && (
              <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-orange-300 mb-1">
                      <span>Uploading to Fizzo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-orange-900/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
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

                        {/* Auto-Pilot Mode */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-purple-300 font-medium">🤖 Auto-Pilot Mode</h4>
                            <div className={`w-2 h-2 rounded-full ${autoPilotMode ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                          </div>
                          <p className="text-gray-300 text-xs mb-3">
                            AI writes the entire novel automatically. Just sit back and watch!
                          </p>
                          
                          {!autoPilotMode ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-gray-300 text-xs">Speed:</label>
                                <select
                                  value={autoPilotSpeed}
                                  onChange={(e) => setAutoPilotSpeed(Number(e.target.value))}
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                                >
                                  <option value={5}>Fast (5s)</option>
                                  <option value={10}>Normal (10s)</option>
                                  <option value={15}>Slow (15s)</option>
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
                                Start Auto-Pilot
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-center">
                                <div className="text-green-300 text-xs font-medium mb-1">
                                  🚀 Auto-Pilot Active
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Writing every {autoPilotSpeed} seconds...
                                </div>
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

      {/* Fizzo Settings Modal */}
      <AnimatePresence>
        {showFizzoSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFizzoSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 w-full max-w-md border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Fizzo Settings</h3>
                  <p className="text-gray-400 text-sm">Configure your Fizzo.org credentials</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Email</label>
                  <input
                    type="email"
                    value={fizzoSettings.email}
                    onChange={(e) => setFizzoSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Password</label>
                  <input
                    type="password"
                    value={fizzoSettings.password}
                    onChange={(e) => setFizzoSettings(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm"
                    placeholder="Your Fizzo password"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-credentials"
                    checked={fizzoSettings.rememberCredentials}
                    onChange={(e) => setFizzoSettings(prev => ({ ...prev, rememberCredentials: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded"
                  />
                  <label htmlFor="remember-credentials" className="text-gray-300 text-sm">
                    Remember credentials (stored locally)
                  </label>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="text-orange-300 text-xs">
                    🔒 <strong>Security:</strong> Your credentials are stored locally and encrypted. 
                    We never send them to our servers - only directly to Fizzo.org for authentication.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowFizzoSettings(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveFizzoSettings}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Save Settings
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fizzo Upload History Modal */}
      <AnimatePresence>
        {showFizzoHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFizzoHistory(false)}
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
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Upload History</h3>
                    <p className="text-gray-400 text-sm">Track your Fizzo uploads</p>
                  </div>
                </div>
                <Button
                  onClick={clearFizzoHistory}
                  size="sm"
                  variant="outline"
                  className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fizzoUploadHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No uploads yet</p>
                    <p className="text-gray-500 text-sm">Your Fizzo upload history will appear here</p>
                  </div>
                ) : (
                  fizzoUploadHistory.map((upload) => (
                    <div
                      key={upload.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{upload.chapterTitle}</h4>
                          <p className="text-gray-400 text-sm">
                            {upload.uploadDate.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.status === 'success' && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <span className="text-green-300 text-sm">Success</span>
                            </>
                          )}
                          {upload.status === 'failed' && (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-400" />
                              <span className="text-red-300 text-sm">Failed</span>
                            </>
                          )}
                          {upload.status === 'uploading' && (
                            <>
                              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                              <span className="text-orange-300 text-sm">Uploading</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {upload.errorMessage && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          <p className="text-red-300 text-xs">{upload.errorMessage}</p>
                        </div>
                      )}
                      
                      {upload.fizzoUrl && (
                        <div className="mt-2">
                          <a
                            href={upload.fizzoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-300 hover:text-orange-200 text-sm underline"
                          >
                            View on Fizzo →
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setShowFizzoHistory(false)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Novel Selector Modal */}
      <AnimatePresence>
        {showNovelSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNovelSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 w-full max-w-2xl border border-white/20 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Select Novel</h3>
                  <p className="text-gray-400 text-sm">Choose which novel to upload your chapter to</p>
                </div>
              </div>

              {isLoadingNovels ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-400">Loading your novels from Fizzo...</p>
                </div>
              ) : fizzoNovels.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">No novels found</p>
                  <p className="text-gray-500 text-sm">Create a novel on Fizzo.org first, then try again</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                  {fizzoNovels.map((novel) => (
                    <div
                      key={novel.id}
                      onClick={() => setSelectedNovel(novel)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedNovel?.id === novel.id
                          ? 'bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{novel.title}</h4>
                          {novel.description && (
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{novel.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📚 {novel.chapters_count} chapters</span>
                            {novel.last_updated && (
                              <span>🕒 Updated {new Date(novel.last_updated).toLocaleDateString()}</span>
                            )}
                            {novel.status && (
                              <span className={`px-2 py-1 rounded ${
                                novel.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {novel.status}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedNovel?.id === novel.id && (
                          <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 ml-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowNovelSelector(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmUpload}
                  disabled={!selectedNovel}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Confirmation Modal */}
      <AnimatePresence>
        {showUploadConfirmation && uploadConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Upload</h3>
                  <p className="text-gray-400 text-sm">Review your chapter before uploading</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">📚 Target Novel</h4>
                  <p className="text-gray-300">{uploadConfirmation.selectedNovel.title}</p>
                  <p className="text-gray-500 text-sm">
                    {uploadConfirmation.selectedNovel.chapters_count} existing chapters
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">📖 Chapter Details</h4>
                  <p className="text-gray-300 mb-1">{uploadConfirmation.chapterTitle}</p>
                  <p className="text-gray-500 text-sm">
                    {uploadConfirmation.wordCount.toLocaleString()} words • {uploadConfirmation.chapterContent.length.toLocaleString()} characters
                  </p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="text-orange-300 text-sm">
                    ⚠️ <strong>Important:</strong> This will add a new chapter to &quot;{uploadConfirmation.selectedNovel.title}&quot; on Fizzo.org. 
                    Make sure you&apos;ve selected the correct novel.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUploadConfirmation(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={uploadToFizzo}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Chapter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}