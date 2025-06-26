'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Pen, 
  Sparkles, 
  Download, 
  Share2, 
  Save, 
  Wand2, 
  Brain, 
  Zap, 
  Trash2, 
  Upload, 
  History, 
  MessageSquare, 
  Settings,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  BookText,
  Theater,
  Palette,
  Music,
  ToggleLeft,
  ToggleRight,
  Clock,
  Bookmark,
  Star,
  Heart,
  PenTool,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api, { extractContentFromResponse } from '@/services/api';

export default function NovelWriter() {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('Untitled Novel');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);
  const [isAIAssistantEnabled, setIsAIAssistantEnabled] = useState<boolean>(true);
  const [isCollaborativeMode, setIsCollaborativeMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('write');
  const [wordCount, setWordCount] = useState<number>(0);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Fantasy');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedStyle, setSelectedStyle] = useState<string>('Descriptive');

  // Available genres
  const genres = [
    'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Horror', 
    'Adventure', 'Historical', 'Thriller', 'Comedy', 'Drama'
  ];

  // Available languages
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 
    'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Korean'
  ];

  // Available writing styles
  const styles = [
    'Descriptive', 'Concise', 'Poetic', 'Technical', 'Conversational',
    'Formal', 'Casual', 'Academic', 'Journalistic', 'Narrative'
  ];

  // Update word and character count
  useEffect(() => {
    if (content) {
      setWordCount(content.trim().split(/\s+/).length);
      setCharacterCount(content.length);
    } else {
      setWordCount(0);
      setCharacterCount(0);
    }
  }, [content]);

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
      // Include genre, language and style in the prompt
      const contextPrompt = `Write in ${selectedLanguage} language, in a ${selectedStyle} style, for a ${selectedGenre} novel.`;
      
      const prompt = content ? 
        `${contextPrompt} Continue this story: ${content.slice(-500)}` : 
        `${contextPrompt} Write a creative story beginning`;
      
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

  // AI Assistant function
  const askAIAssistant = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const prompt = 'I need help with my novel. Can you suggest some ideas for character development?';
      const response = await generateWithAI(prompt);
      
      // Display the response in a modal or toast
      alert(response);
    } catch (error) {
      console.error('AI Assistant error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate dialog function
  const generateDialog = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const prompt = `Generate a realistic dialog between two characters in my ${selectedGenre} story.`;
      const response = await generateWithAI(prompt);
      
      if (response) {
        setContent(prev => prev ? `${prev}\n\n${response}` : response);
      }
    } catch (error) {
      console.error('Generate dialog error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate plot twist function
  const generatePlotTwist = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const prompt = `Create an unexpected plot twist for my ${selectedGenre} story.`;
      const response = await generateWithAI(prompt);
      
      if (response) {
        setContent(prev => prev ? `${prev}\n\n${response}` : response);
      }
    } catch (error) {
      console.error('Generate plot twist error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save function
  const saveNovel = () => {
    setIsSaved(true);
    setSaveMessage('Novel saved successfully!');
    
    // Reset the message after 3 seconds
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  // Toggle AI Assistant
  const toggleAIAssistant = () => {
    setIsAIAssistantEnabled(!isAIAssistantEnabled);
  };

  // Toggle Collaborative Mode
  const toggleCollaborativeMode = () => {
    setIsCollaborativeMode(!isCollaborativeMode);
    if (!isCollaborativeMode) {
      alert('Collaborative mode enabled! Others can now join your writing session.');
    } else {
      alert('Collaborative mode disabled.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Novel Title"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="text-green-500 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {saveMessage}
              </span>
            )}
            
            <Button 
              variant={isAIAssistantEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAIAssistant} 
              title="Toggle AI Assistant"
              className={isAIAssistantEnabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isAIAssistantEnabled ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-1" />
                  AI On
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  AI Off
                </>
              )}
            </Button>
            
            <Button 
              variant={isCollaborativeMode ? "default" : "outline"} 
              size="sm" 
              onClick={toggleCollaborativeMode} 
              title="Toggle Collaborative Mode"
              className={isCollaborativeMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Users className="h-4 w-4 mr-1" />
              {isCollaborativeMode ? "Collab On" : "Collab Off"}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={saveNovel} title="Save">
              <Save className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setContent('')} title="Clear">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Genre, Language, Style Selection */}
        <div className="border-b p-2 flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-1">
            <BookText className="h-4 w-4 text-purple-500" />
            <select 
              value={selectedGenre} 
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-blue-500" />
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0"
            >
              {languages.map(language => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <PenTool className="h-4 w-4 text-green-500" />
            <select 
              value={selectedStyle} 
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0"
            >
              {styles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="write"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
              >
                <Pen className="h-4 w-4 mr-2" />
                Write
              </TabsTrigger>
              <TabsTrigger
                value="format"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
              >
                <Type className="h-4 w-4 mr-2" />
                Format
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Write Tab */}
          <TabsContent value="write" className="p-0 m-0">
            <div className="flex">
              {/* Main Editor */}
              <div className="flex-1 p-4">
                <textarea
                  className="w-full h-[500px] p-4 bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your novel here or use Auto-Pilot..."
                />
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    {wordCount} words | {characterCount} characters
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={askAIAssistant}
                      disabled={isGenerating || !isAIAssistantEnabled}
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      AI Assistant
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={autoPilotWrite}
                      disabled={isGenerating || !isAIAssistantEnabled}
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
              </div>
              
              {/* Sidebar */}
              <div className="w-64 border-l p-4 hidden md:block">
                <h3 className="font-medium mb-4">AI Tools</h3>
                
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={generateDialog}
                    disabled={isGenerating || !isAIAssistantEnabled}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Dialog
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={generatePlotTwist}
                    disabled={isGenerating || !isAIAssistantEnabled}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Plot Twist
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    disabled={isGenerating || !isAIAssistantEnabled}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Character Ideas
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    disabled={isGenerating || !isAIAssistantEnabled}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Scene Description
                  </Button>
                </div>
                
                <h3 className="font-medium mt-6 mb-4">Document</h3>
                
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                </div>
                
                <h3 className="font-medium mt-6 mb-4">Recent Edits</h3>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    <History className="h-3 w-3 inline mr-1" />
                    Last edited 5 minutes ago
                  </div>
                </div>
                
                {isCollaborativeMode && (
                  <>
                    <h3 className="font-medium mt-6 mb-4">Collaborators</h3>
                    <div className="space-y-2">
                      <div className="text-sm flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        User 1 (Online)
                      </div>
                      <div className="text-sm flex items-center">
                        <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                        User 2 (Offline)
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Format Tab */}
          <TabsContent value="format" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Text Formatting</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Family</label>
                    <select className="w-full p-2 border rounded">
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Courier New</option>
                      <option>Georgia</option>
                      <option>Verdana</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <select className="w-full p-2 border rounded">
                      <option>12pt</option>
                      <option>14pt</option>
                      <option>16pt</option>
                      <option>18pt</option>
                      <option>20pt</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Line Spacing</label>
                    <select className="w-full p-2 border rounded">
                      <option>Single</option>
                      <option>1.15</option>
                      <option>1.5</option>
                      <option>Double</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Document Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Page Size</label>
                    <select className="w-full p-2 border rounded">
                      <option>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Margins</label>
                    <select className="w-full p-2 border rounded">
                      <option>Normal (1 inch)</option>
                      <option>Narrow (0.5 inch)</option>
                      <option>Wide (1.5 inch)</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input type="checkbox" id="headers" className="mr-2" />
                    <label htmlFor="headers" className="text-sm">Include headers and footers</label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">AI Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">AI Model</label>
                    <select className="w-full p-2 border rounded">
                      <option>GPT-4</option>
                      <option>Claude 3</option>
                      <option>Llama 3</option>
                      <option>Mistral</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Creativity Level</label>
                    <input type="range" min="0" max="100" className="w-full" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Conservative</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input type="checkbox" id="auto-save" className="mr-2" checked />
                    <label htmlFor="auto-save" className="text-sm">Enable auto-save</label>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Collaboration Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Permissions</label>
                    <select className="w-full p-2 border rounded">
                      <option>View Only</option>
                      <option>Comment</option>
                      <option>Edit</option>
                      <option>Full Access</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Share Link</label>
                    <div className="flex">
                      <input type="text" value="https://kugysoul.app/share/abc123" className="flex-1 p-2 border rounded-l" readOnly />
                      <button className="p-2 bg-blue-500 text-white rounded-r">Copy</button>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input type="checkbox" id="track-changes" className="mr-2" />
                    <label htmlFor="track-changes" className="text-sm">Track changes</label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}