import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FileText, 
  Database, 
  MoreVertical, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Files,
  Diamond,
  Loader2
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { jobId } = await response.json();
      navigate(`/processing?jobId=${jobId}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf"
        onChange={handleFileChange}
      />

      {/* Quick Actions / Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative overflow-hidden group glass-panel rounded-3xl p-10 flex flex-col justify-center min-h-[240px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <h1 className="font-headline text-3xl text-white mb-2">{t('dashboard.hero')}</h1>
            <p className="text-on-surface-variant max-w-md mb-8">{t('dashboard.heroDesc')}</p>
            <div className="flex gap-4">
              <Button 
                onClick={handleUploadClick} 
                className="gap-2 h-12"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isUploading ? t('dashboard.uploading') : t('dashboard.createNew')}
              </Button>
            </div>
          </div>
          <div className="absolute right-[-40px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Files className="w-52 h-52 text-primary" />
          </div>
        </div>

        {/* Drop Zone */}
        <div 
          onClick={handleUploadClick}
          className="glass-panel bg-surface-container-low/30 backdrop-blur-md rounded-3xl border-dashed border-2 border-primary/20 flex flex-col items-center justify-center p-8 group hover:border-primary/50 transition-all cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-semibold text-on-surface text-center">{t('dashboard.dropZone')}</p>
          <p className="text-xs text-on-surface-variant text-center mt-1">{t('dashboard.dropZoneDesc')}</p>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Feed */}
        <div className="flex-grow space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="font-headline text-2xl text-white">Recently Uploaded</h2>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link to="/reader" className="glass-panel p-3 rounded-2xl hover:bg-white/10 transition-all group">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4">
                <img 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIVZ3BzN-lpmlE91bkU6cFL7bYO-8XNTzleQtA1E0LDlLvKzPTztGAq2NuKwRGwk1wULmFXHAVwrzhlwi2yl4Z19WefvBIt61p_v5JBqXtF2q2jIOrc4IDg_MYWmPAcAIQrssZTi3F3T3HObuWPOUfwHaoyA7hY7mk7wYWVipSLIdNgjzZcNU6LYX79C9Xvkr3eDGDgY9pexEhq5Mp6adE5_Przacaw5WkLhQ_R-TnW1TKXp3QKjMt3Pt0dKcNNwMiGg74qLY78592" 
                />
                <div className="absolute top-2 right-2 bg-secondary/20 text-secondary backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/20 glow-cyan">
                  <CheckCircle2 className="w-3 h-3 fill-current" /> Ready
                </div>
              </div>
              <div className="px-2">
                <p className="text-sm font-semibold text-on-surface truncate">Quantum Mechanics Basics.pdf</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-on-surface-variant">2 mins ago</p>
                  <MoreVertical className="w-4 h-4 text-on-surface-variant hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>

            {/* Card 2: AI Distilling */}
            <div className="glass-panel p-3 rounded-2xl bg-white/5 flex flex-col h-full opacity-80 border-primary/20">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4 bg-surface-container-high/40 flex items-center justify-center flex-grow">
                <div className="flex flex-col items-center gap-4">
                  <Zap className="w-10 h-10 text-primary animate-pulse" />
                  <div className="w-32 h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r from-secondary to-primary animate-[shimmer_2s_infinite]" />
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Distilling...</p>
                </div>
              </div>
              <div className="px-2">
                <p className="text-sm font-semibold text-on-surface truncate">Global Markets 2024.epub</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-on-surface-variant">Uploading</p>
                  <TrendingUp className="w-4 h-4 text-on-surface-variant animate-bounce" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <Link to="/reader" className="glass-panel p-3 rounded-2xl hover:bg-white/10 transition-all group">
               <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4">
                <img 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDONXaL4JaEaFdZg8OVczzG86tAUTDh6xURNwHmPu068TY5_vmAvDXGq-sveKc3QMQU7FXd-c-o8LC6WBf-77SLPEUcQktsGPXnufmict8QJ3D3qw9WA5mU69DNSMHxF1Ko5pummcxm-C-KEt1ioeQwvb5omCFdoeoQWT3hEVD8YZ3DmuWiURpwbCYguG6THbE86jmVik3LQ3tfavnWBXFnRLRiBD0xqe_qC7LiITeLTA70e9I0A9HXMZARN6zNvFWfZEWMzwNFdDZL" 
                />
                <div className="absolute top-2 right-2 bg-secondary/20 text-secondary backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/20 glow-cyan">
                  <CheckCircle2 className="w-3 h-3 fill-current" /> Ready
                </div>
              </div>
              <div className="px-2">
                <p className="text-sm font-semibold text-on-surface truncate">Sustainable Arch.pdf</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-on-surface-variant">1 hour ago</p>
                  <MoreVertical className="w-4 h-4 text-on-surface-variant hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="glass-panel rounded-3xl p-8">
            <h3 className="font-headline text-lg text-white mb-6">Analytics Hub</h3>
            <div className="space-y-4">
              <div className="bg-surface/40 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-on-surface-variant">Total Docs</p>
                </div>
                <p className="font-headline text-lg text-white">42</p>
              </div>
              <div className="bg-surface/40 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Database className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-xs text-on-surface-variant">Knowledge Base</p>
                </div>
                <p className="font-headline text-lg text-white">1.2GB</p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-xs font-bold text-primary mb-4 uppercase tracking-widest">Recent Quizzes</p>
              <div className="space-y-4">
                {[
                  { title: 'Modern Philosophy', score: '92%', time: '3h ago', color: 'bg-secondary' },
                  { title: 'Neural Networks', score: '85%', time: 'In Progress', color: 'bg-primary/30' },
                ].map((quiz, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={cn("w-1.5 h-10 rounded-full", quiz.color)} />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{quiz.title}</p>
                      <p className="text-[10px] text-on-surface-variant">Score: {quiz.score} • {quiz.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="glass" className="w-full mt-10 h-12 text-on-surface-variant">
              Export Summary Report
            </Button>
          </div>

          {/* Promo Card */}
          <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#1a1a2e] to-surface-container-lowest glass-panel">
            <div className="absolute -right-4 -bottom-4">
              <Diamond className="w-32 h-32 text-primary/5" />
            </div>
            <h4 className="font-headline text-lg text-white mb-2">Upgrade to Ultra</h4>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Unlimited PDF processing and advanced semantic search capabilities.</p>
            <Button className="w-full">Go Pro</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
