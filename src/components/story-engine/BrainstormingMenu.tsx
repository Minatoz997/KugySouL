'use client';

import React, { useState } from 'react';
import { StoryProject, GENRES, StoryIdea } from '@/types/kugysoul';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

interface BrainstormingMenuProps {
  project: StoryProject;
  onUpdateProject: (project: StoryProject) => void;
}

// Sample story ideas for each genre
const STORY_IDEAS: Record<string, StoryIdea[]> = {
  'Romance': [
    {
      id: '1',
      title: 'Musuh Menjadi Cinta',
      description: 'Dua rival bisnis yang terpaksa bekerja sama',
      genre: 'Romance',
      premise: 'CEO muda yang ambisius bertemu dengan rival bisnis yang ternyata adalah cinta pertamanya di SMA'
    },
    {
      id: '2', 
      title: 'Cinta di Masa Pandemi',
      description: 'Percintaan yang dimulai dari video call',
      genre: 'Romance',
      premise: 'Dua orang yang bertemu secara virtual dan jatuh cinta tanpa pernah bertemu langsung'
    }
  ],
  'Fantasy': [
    {
      id: '3',
      title: 'Penjaga Gerbang Dimensi',
      description: 'Remaja yang menemukan kemampuan membuka portal',
      genre: 'Fantasy',
      premise: 'Seorang siswa SMA biasa yang menemukan bahwa dia adalah keturunan penjaga gerbang antar dimensi'
    },
    {
      id: '4',
      title: 'Akademi Sihir Modern',
      description: 'Sekolah sihir di era digital',
      genre: 'Fantasy', 
      premise: 'Akademi sihir yang menggunakan teknologi modern untuk mengajarkan mantra dan ramuan'
    }
  ],
  'Mystery': [
    {
      id: '5',
      title: 'Pembunuhan di Kampus',
      description: 'Mahasiswa detektif memecahkan kasus',
      genre: 'Mystery',
      premise: 'Mahasiswa kriminologi yang terlibat dalam investigasi pembunuhan dosen favoritnya'
    }
  ]
};

export function BrainstormingMenu({ project, onUpdateProject }: BrainstormingMenuProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);
  const [generatedSynopsis, setGeneratedSynopsis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'genre' | 'idea' | 'synopsis' | 'complete'>('genre');

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentStep('idea');
  };

  const handleIdeaSelect = (idea: StoryIdea) => {
    setSelectedIdea(idea);
    setCurrentStep('synopsis');
  };

  const generateSynopsis = async () => {
    if (!selectedIdea) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const synopsis = `${selectedIdea.premise}

Cerita dimulai ketika protagonis menghadapi konflik utama yang mengubah hidupnya selamanya. Dalam perjalanannya, dia akan bertemu dengan berbagai karakter yang akan membantu atau menghalangi tujuannya.

Klimaks cerita terjadi ketika protagonis harus membuat pilihan sulit yang akan menentukan nasib tidak hanya dirinya, tetapi juga orang-orang yang dicintainya. 

Resolusi memberikan penutup yang memuaskan sambil membuka kemungkinan untuk petualangan selanjutnya.`;
      
      setGeneratedSynopsis(synopsis);
      setIsGenerating(false);
      setCurrentStep('complete');
    }, 2000);
  };

  const completeBrainstorming = () => {
    const updatedProject: StoryProject = {
      ...project,
      genre: selectedGenre,
      synopsis: generatedSynopsis,
      title: selectedIdea?.title || 'Untitled Story',
      currentPhase: 'planning',
      lastModified: new Date()
    };
    
    onUpdateProject(updatedProject);
  };

  const renderGenreSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pilih Genre Novel
        </h2>
        <p className="text-gray-600">
          Pilih genre yang paling menarik bagi Anda untuk memulai brainstorming
        </p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {GENRES.map((genre) => (
          <Card 
            key={genre}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => handleGenreSelect(genre)}
          >
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">{genre}</h3>
              <p className="text-sm text-gray-500">
                {STORY_IDEAS[genre]?.length || 0} ide tersedia
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderIdeaSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pilih Ide Cerita - {selectedGenre}
          </h2>
          <p className="text-gray-600">
            Pilih salah satu ide cerita yang menarik untuk dikembangkan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('genre')}>
            Kembali
          </Button>
          {selectedIdea && (
            <Button onClick={() => setCurrentStep('synopsis')}>
              Lanjut
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {(STORY_IDEAS[selectedGenre] || []).map((idea) => (
          <Card 
            key={idea.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200"
            onClick={() => handleIdeaSelect(idea)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {idea.title}
                <Badge variant="secondary">{idea.genre}</Badge>
              </CardTitle>
              <CardDescription>{idea.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{idea.premise}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <h3 className="font-semibold text-gray-700 mb-2">
            Punya Ide Sendiri?
          </h3>
          <p className="text-gray-500 mb-4">
            Anda bisa melewati tahap ini dan langsung ke planning dengan ide Anda sendiri
          </p>
          <Button variant="outline" onClick={() => onUpdateProject({
            ...project,
            genre: selectedGenre,
            currentPhase: 'planning',
            lastModified: new Date()
          })}>
            Lanjut ke Planning
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSynopsisGeneration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generate Sinopsis
          </h2>
          <p className="text-gray-600">
            AI akan mengembangkan sinopsis berdasarkan ide yang Anda pilih
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('idea')}>
            Kembali
          </Button>
          {generatedSynopsis && (
            <Button onClick={() => setCurrentStep('complete')}>
              Lanjut
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Ide Terpilih: {selectedIdea?.title}
          </CardTitle>
          <CardDescription>{selectedIdea?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Premis:</h4>
            <p className="text-gray-600">{selectedIdea?.premise}</p>
          </div>

          {generatedSynopsis ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Sinopsis yang Dihasilkan:</h4>
              <Textarea 
                value={generatedSynopsis}
                onChange={(e) => setGeneratedSynopsis(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-sm text-gray-500">
                Anda dapat mengedit sinopsis di atas sebelum melanjutkan
              </p>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setCurrentStep('complete')}
                  className="flex items-center gap-2"
                >
                  Lanjut ke Langkah Berikutnya
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={generateSynopsis}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Sinopsis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Sinopsis dengan AI
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Brainstorming Selesai! 🎉
        </h2>
        <p className="text-gray-600">
          Sinopsis Anda sudah siap. Sekarang mari lanjut ke tahap planning untuk mengembangkan karakter dan outline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Brainstorming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">Genre:</h4>
            <Badge>{selectedGenre}</Badge>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Judul:</h4>
            <p>{selectedIdea?.title}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Sinopsis:</h4>
            <p className="text-gray-600 text-sm">{generatedSynopsis.substring(0, 200)}...</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setCurrentStep('synopsis')}>
          Edit Sinopsis
        </Button>
        <Button onClick={completeBrainstorming} className="flex-1">
          Lanjut ke Planning
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {['genre', 'idea', 'synopsis', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step ? 'bg-blue-500 text-white' :
                ['genre', 'idea', 'synopsis', 'complete'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  ['genre', 'idea', 'synopsis', 'complete'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-gray-500">
            {currentStep === 'genre' && 'Langkah 1: Pilih Genre'}
            {currentStep === 'idea' && 'Langkah 2: Pilih Ide Cerita'}
            {currentStep === 'synopsis' && 'Langkah 3: Generate Sinopsis'}
            {currentStep === 'complete' && 'Langkah 4: Selesai'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      {currentStep === 'genre' && renderGenreSelection()}
      {currentStep === 'idea' && renderIdeaSelection()}
      {currentStep === 'synopsis' && renderSynopsisGeneration()}
      {currentStep === 'complete' && renderComplete()}
      
      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            if (currentStep === 'idea') setCurrentStep('genre');
            if (currentStep === 'synopsis') setCurrentStep('idea');
            if (currentStep === 'complete') setCurrentStep('synopsis');
          }}
          disabled={currentStep === 'genre'}
        >
          Kembali
        </Button>
        
        <div className="flex-1 flex justify-center">
          <p className="text-sm text-gray-500">
            Langkah {
              currentStep === 'genre' ? '1/4' : 
              currentStep === 'idea' ? '2/4' : 
              currentStep === 'synopsis' ? '3/4' : '4/4'
            }
          </p>
        </div>
        
        <Button 
          onClick={() => {
            if (currentStep === 'genre' && selectedGenre) setCurrentStep('idea');
            if (currentStep === 'idea' && selectedIdea) setCurrentStep('synopsis');
            if (currentStep === 'synopsis' && generatedSynopsis) setCurrentStep('complete');
            if (currentStep === 'complete') completeBrainstorming();
          }}
          disabled={(currentStep === 'genre' && !selectedGenre) || 
                   (currentStep === 'idea' && !selectedIdea) || 
                   (currentStep === 'synopsis' && !generatedSynopsis)}
        >
          {currentStep === 'complete' ? 'Selesai' : 'Lanjut'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the fixed footer */}
      <div className="h-16"></div>
    </div>
  );
}