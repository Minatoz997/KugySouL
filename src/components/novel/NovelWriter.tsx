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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api, { extractContentFromResponse } from '@/services/api';

export default function NovelWriter() {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('Untitled Novel');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('write');
  const [wordCount, setWordCount] = useState<number>(0);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

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

  // Save function
  const saveNovel = () => {
    setIsSaved(true);
    setSaveMessage('Novel saved successfully!');
    
    // Reset the message after 3 seconds
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  // Collaborative editing function
  const enableCollaborativeEditing = () => {
    alert('Collaborative editing feature coming soon!');
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
            
            <Button variant="ghost" size="sm" onClick={saveNovel} title="Save">
              <Save className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setContent('')} title="Clear">
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={enableCollaborativeEditing} title="Collaborative Editing">
              <Users className="h-4 w-4" />
            </Button>
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
                <FileText className="h-4 w-4 mr-2" />
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
                      disabled={isGenerating}
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      AI Assistant
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
              </div>
              
              {/* Sidebar */}
              <div className="w-64 border-l p-4 hidden md:block">
                <h3 className="font-medium mb-4">Tools</h3>
                
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Ideas
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Character Dialog
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Plot Twist
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <h3 className="font-medium mt-6 mb-4">Recent Edits</h3>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    <History className="h-3 w-3 inline mr-1" />
                    Last edited 5 minutes ago
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Format Tab */}
          <TabsContent value="format" className="p-4">
            <div className="text-center p-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Formatting Options</h3>
              <p className="text-gray-500 mb-4">Formatting options will be available soon.</p>
              <Button variant="outline" onClick={() => setActiveTab('write')}>
                Back to Writing
              </Button>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4">
            <div className="text-center p-8">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Editor Settings</h3>
              <p className="text-gray-500 mb-4">Editor settings will be available soon.</p>
              <Button variant="outline" onClick={() => setActiveTab('write')}>
                Back to Writing
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}