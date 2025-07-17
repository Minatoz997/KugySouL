'use client';

import React, { useState, useEffect } from 'react';
import { StoryProject } from '@/types/kugysoul';
import { ProjectSelector } from './ProjectSelector';
import { IdeaSelector } from './IdeaSelector';
import { BrainstormingMenu } from './BrainstormingMenu';
import { StoryPlanning } from './StoryPlanning';
import { StoryWriting } from './StoryWriting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Lightbulb, PenTool, Settings, BarChart3 } from 'lucide-react';
import { StoryEngineStats } from './StoryEngineStats';

function StoryEngine() {
  const [currentProject, setCurrentProject] = useState<StoryProject | null>(null);
  const [projects, setProjects] = useState<StoryProject[]>([]);
  const [showIdeaSelector, setShowIdeaSelector] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'project' | 'stats'>('project');

  const phaseOrder: ('brainstorming' | 'planning' | 'writing')[] = ['brainstorming', 'planning', 'writing'];

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('kugysoul-projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastModified: new Date(p.lastModified)
      }));
      setProjects(parsedProjects);
    }
  }, []);

  // Save projects to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('kugysoul-projects', JSON.stringify(projects));
    }
  }, [projects]);

  const createNewProject = (hasIdea: boolean) => {
    const newProject: StoryProject = {
      id: Date.now().toString(),
      title: 'Untitled Story',
      createdAt: new Date(),
      lastModified: new Date(),
      genre: '',
      tone: '',
      style: '',
      braindump: '',
      synopsis: '',
      characters: [],
      worldbuilding: [],
      outline: { parts: [] },
      currentPhase: hasIdea ? 'planning' : 'brainstorming',
      hasIdea
    };

    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    setShowIdeaSelector(false);
  };

  const updateProject = (updatedProject: StoryProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setCurrentProject(updatedProject);
  };

  const navigateToPhase = (phase: 'brainstorming' | 'planning' | 'writing') => {
    if (!currentProject) return;
    const currentPhaseIndex = phaseOrder.indexOf(currentProject.currentPhase);
    const targetPhaseIndex = phaseOrder.indexOf(phase);

    if (targetPhaseIndex <= currentPhaseIndex) {
      setViewMode('project');
      updateProject({ ...currentProject, currentPhase: phase });
    }
  };

  const renderContent = () => {
    if (!currentProject) return null;

    if (viewMode === 'stats') {
      return <StoryEngineStats project={currentProject} />;
    }

    switch (currentProject.currentPhase) {
      case 'brainstorming':
        return <BrainstormingMenu project={currentProject} onUpdateProject={updateProject} />;
      case 'planning':
        return <StoryPlanning project={currentProject} onUpdateProject={updateProject} />;
      case 'writing':
        return <StoryWriting project={currentProject} onUpdateProject={updateProject} />;
      default:
        return null;
    }
  };

  // Main welcome screen
  if (!currentProject && !showIdeaSelector && !showProjectSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎭 KugySoul Story Engine
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Platform lengkap untuk membantu penulis membuat draft novel. 
              Anda menjadi sutradara cerita Anda sendiri.
            </p>
          </div>

          {/* Main Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => setShowIdeaSelector(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                  Mulai Proyek Baru
                </CardTitle>
                <CardDescription>
                  Buat novel baru dengan bantuan AI untuk brainstorming dan perencanaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Buat Proyek Baru
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setShowProjectSelector(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                  Lanjutkan Proyek
                </CardTitle>
                <CardDescription>
                  Lanjutkan mengerjakan novel yang sudah ada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Pilih Proyek ({projects.length})
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenTool className="h-5 w-5" />
                  Story Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Character Generator</li>
                  <li>• Worldbuilding Cards</li>
                  <li>• Outline System</li>
                  <li>• Scene Cards</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Brainstorming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Genre Selection</li>
                  <li>• Story Ideas</li>
                  <li>• AI Synopsis</li>
                  <li>• Character Development</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Planning Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 3-Act Structure</li>
                  <li>• Chapter Cards</li>
                  <li>• Multiple Openings</li>
                  <li>• Draft Generation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Idea Selector Screen
  if (showIdeaSelector) {
    return (
      <IdeaSelector 
        onCreateProject={createNewProject}
        onBack={() => setShowIdeaSelector(false)}
      />
    );
  }

  // Project Selector Screen
  if (showProjectSelector) {
    return (
      <ProjectSelector 
        projects={projects}
        onSelectProject={setCurrentProject}
        onBack={() => setShowProjectSelector(false)}
      />
    );
  }

  // Main Story Engine Interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentProject(null)}
            >
              ← Kembali ke Menu
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{currentProject?.title}</h1>
              <p className="text-sm text-gray-500">
                Phase: {currentProject?.currentPhase} • 
                Last modified: {currentProject?.lastModified.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Phase Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant={currentProject?.currentPhase === 'brainstorming' && viewMode === 'project' ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigateToPhase('brainstorming')}
            >
              Brainstorming
            </Button>
            <Button 
              variant={currentProject?.currentPhase === 'planning' && viewMode === 'project' ? 'default' : 'outline'}
              size="sm"
              disabled={!currentProject || phaseOrder.indexOf(currentProject.currentPhase) < phaseOrder.indexOf('planning')}
              onClick={() => navigateToPhase('planning')}
            >
              Planning
            </Button>
            <Button 
              variant={currentProject?.currentPhase === 'writing' && viewMode === 'project' ? 'default' : 'outline'}
              size="sm"
              disabled={!currentProject || phaseOrder.indexOf(currentProject.currentPhase) < phaseOrder.indexOf('writing')}
              onClick={() => navigateToPhase('writing')}
            >
              Writing
            </Button>
            <Button 
              variant={viewMode === 'stats' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('stats')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}

export { StoryEngine };
export default StoryEngine;