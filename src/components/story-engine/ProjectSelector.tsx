'use client';

import React from 'react';
import { StoryProject } from '@/types/kugysoul';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Users, Globe, FileText } from 'lucide-react';

interface ProjectSelectorProps {
  projects: StoryProject[];
  onSelectProject: (project: StoryProject) => void;
  onBack: () => void;
}

export function ProjectSelector({ projects, onSelectProject, onBack }: ProjectSelectorProps) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'brainstorming': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'writing': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'brainstorming': return 'Brainstorming';
      case 'planning': return 'Planning';
      case 'writing': return 'Writing';
      default: return 'Unknown';
    }
  };

  const getProjectStats = (project: StoryProject) => {
    return {
      characters: project.characters.length,
      worldbuilding: project.worldbuilding.length,
      chapters: project.outline.parts.reduce((total, part) => total + part.chapters.length, 0),
      parts: project.outline.parts.length
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pilih Proyek Novel
            </h1>
            <p className="text-gray-600 mt-2">
              Lanjutkan mengerjakan salah satu proyek novel Anda
            </p>
          </div>
        </div>
        
        {/* Instruksi yang jelas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Cara Memilih Proyek</h3>
            <p className="text-blue-700 text-sm">
              Klik kartu proyek atau tombol "Pilih Proyek" untuk melanjutkan pengerjaan novel Anda.
              Setiap proyek menampilkan informasi progres dan statistik penting.
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Belum Ada Proyek
              </h3>
              <p className="text-gray-500 mb-4">
                Anda belum memiliki proyek novel. Mulai dengan membuat proyek baru.
              </p>
              <Button onClick={onBack}>
                Buat Proyek Baru
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const stats = getProjectStats(project);
              
              return (
                <Card 
                  key={project.id} 
                  className="hover:shadow-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer relative overflow-hidden group"
                  onClick={() => onSelectProject(project)}
                >
                  {/* Indikator visual bahwa kartu bisa diklik */}
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Klik untuk membuka
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {project.genre && (
                            <Badge variant="outline" className="mr-2">
                              {project.genre}
                            </Badge>
                          )}
                          <Badge className={getPhaseColor(project.currentPhase)}>
                            {getPhaseLabel(project.currentPhase)}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Synopsis Preview */}
                    {project.synopsis && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Synopsis</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {project.synopsis}
                        </p>
                      </div>
                    )}

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{stats.characters} Characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>{stats.worldbuilding} Elements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        <span>{stats.parts} Parts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <span>{stats.chapters} Chapters</span>
                      </div>
                    </div>

                    {/* Last Modified */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Last modified: {project.lastModified.toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>
                          {project.currentPhase === 'brainstorming' && '25%'}
                          {project.currentPhase === 'planning' && '50%'}
                          {project.currentPhase === 'writing' && '75%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: project.currentPhase === 'brainstorming' ? '25%' :
                                   project.currentPhase === 'planning' ? '50%' :
                                   project.currentPhase === 'writing' ? '75%' : '0%'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Tombol Pilih yang jelas */}
                    <div className="mt-4 flex justify-end">
                      <Button 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah event bubbling
                          onSelectProject(project);
                        }}
                      >
                        Pilih Proyek
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tips */}
        {projects.length > 0 && (
          <div className="mt-12">
            <Card className="bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  💡 Tips Mengelola Proyek
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Fase Brainstorming:</h4>
                    <ul className="space-y-1">
                      <li>• Eksplorasi genre dan ide cerita</li>
                      <li>• Generate sinopsis dengan AI</li>
                      <li>• Kembangkan konsep dasar</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Fase Planning:</h4>
                    <ul className="space-y-1">
                      <li>• Buat character cards detail</li>
                      <li>• Bangun worldbuilding elements</li>
                      <li>• Susun outline dengan chapter cards</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}