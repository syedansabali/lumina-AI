import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  BrainCircuit, 
  Database, 
  Sparkles,
  Zap,
  LayoutGrid,
  Bot,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Processing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      return;
    }

    const eventSource = new EventSource(`/api/status/${jobId}`);

    const handleData = (data: any) => {
      if (data.error) {
        if (data.error.includes('leaked')) {
          setError('CRITICAL: Your Gemini API Key has been reported as leaked. Please go to the AI Studio Settings menu and provide a fresh API Key to continue.');
        } else {
          setError(data.error);
        }
        eventSource.close();
        return;
      }
      setStatus(data);
      if (data.status === 'completed') {
        eventSource.close();
        setTimeout(() => navigate(`/reader?jobId=${jobId}`), 1500);
      } else if (data.status === 'failed') {
        setError(data.message || 'Processing failed');
        eventSource.close();
      }
    };

    eventSource.onmessage = (event) => {
      handleData(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      console.warn('SSE connection failed, falling back to polling...');
      eventSource.close();
      
      // Fallback polling
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/documents/${jobId}`);
          const data = await res.json();
          
          if (data.error && data.status !== 'parsing' && data.status !== 'extracting' && data.status !== 'indexing') {
            // If it's a real error and not just "in progress"
            if (res.status === 404) {
               setError('Job not found');
               clearInterval(pollInterval);
            }
            return;
          }

          if (data.text) {
            setStatus({ status: 'completed', progress: 100, message: 'Analysis complete.' });
            clearInterval(pollInterval);
            setTimeout(() => navigate(`/reader?jobId=${jobId}`), 1000);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 5000);
    };

    return () => eventSource.close();
  }, [jobId, navigate]);

  const steps = [
    { 
      label: 'Uploading', 
      desc: status?.status === 'uploading' ? 'Transferring data...' : 'Secure transfer complete', 
      icon: Check, 
      id: 'uploading' 
    },
    { 
      label: 'AI Distilling', 
      desc: status?.status === 'parsing' || status?.status === 'extracting' ? 'Semantic chunking active' : status?.status === 'completed' ? 'Extraction finished' : 'Waiting for data', 
      icon: BrainCircuit, 
      id: 'distilling' 
    },
    { 
      label: 'Vector Indexing', 
      desc: status?.status === 'completed' ? 'Index optimized' : 'Waiting for distillation', 
      icon: Database, 
      id: 'indexing' 
    },
  ];

  const getCurrentStepStatus = (id: string) => {
    if (!status) return 'pending';
    
    if (id === 'uploading') {
      return status.status === 'uploading' ? 'active' : 'complete';
    }
    if (id === 'distilling') {
      if (status.status === 'parsing' || status.status === 'extracting') return 'active';
      if (status.status === 'completed') return 'complete';
      return 'pending';
    }
    if (id === 'indexing') {
      return status.status === 'completed' ? 'complete' : 'pending';
    }
    return 'pending';
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-headline text-white mb-2">Processing Error</h2>
        <p className="text-on-surface-variant max-w-md mb-8">{error}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      <header className="mb-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-headline text-4xl text-white mb-6"
        >
          {status?.message || 'Initializing Pipeline...'}
        </motion.h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden relative">
            <motion.div 
              animate={{ width: `${status?.progress || 0}%` }}
              transition={{ duration: 0.5 }}
              className="bg-primary h-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              <div className="absolute right-0 top-0 h-full w-4 shadow-[0_0_15px_#bc13fe] bg-primary" />
            </motion.div>
          </div>
          <p className="text-sm font-medium text-white/40">
            {status?.status === 'completed' ? 'Preparation complete!' : `Progress: ${status?.progress || 0}%`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
        {/* Left: Stepper */}
        <div className="md:col-span-3 space-y-6">
          <div className="glass-panel p-8 rounded-2xl">
            <div className="flex items-center gap-2 mb-8">
              <Zap className="w-4 h-4 text-primary fill-current" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Processing Pipeline</h3>
            </div>
            
            <div className="space-y-12">
              {steps.map((step, i) => {
                const s = getCurrentStepStatus(step.id);
                return (
                  <div key={i} className={cn("flex gap-4 items-start", s === 'pending' && "opacity-40")}>
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        s === 'complete' ? "bg-primary border-primary text-white glow-purple" :
                        s === 'active' ? "bg-secondary/20 border-secondary text-secondary animate-pulse glow-cyan" :
                        "border-white/20"
                      )}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-12 mt-2",
                          s === 'complete' ? "bg-primary/40" : "bg-white/10"
                        )} />
                      )}
                    </div>
                    <div>
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", s === 'active' ? "text-secondary" : "text-white")}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Viz */}
        <div className="md:col-span-6">
          <div className="glass-panel bg-white/[0.02] backdrop-blur-3xl rounded-3xl h-full min-h-[500px] flex items-center justify-center p-12 relative overflow-hidden group">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-surface-container-high rounded-xl shadow-2xl overflow-hidden border border-white/5">
              <img 
                alt="Scanning..." 
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity grayscale" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpTDzxXG-dDlX0QShjWCmlWejRAe6J5spvvNnhvXTY8a-mf7hUOUaihZdZ4hOJCdb7Rb4t2oLwypeFkKJZi42Q5j5tgLgdhXKK2bFrmC-KdRKalvFK0ErU3hTIfQJm4aiYHfjEzrBTPjbuFoN9rpcuGi4ImpRMACZNw8RqaBYl8cDpBE57wUeana165UlhVJqIeuZpPcw5XA-9BAfg3rCPk6LAlCBhfpoxT-7ls5coFMHBeMJOvrsQLb0NaP0zHSrFPyVN5HwrcFqN" 
              />
              <div className="absolute inset-0">
                <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-transparent via-secondary/40 to-transparent animate-scan" />
              </div>

              {/* Tag Overlays */}
              <motion.div 
                animate={{ x: [0, 5, 0], y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-[20%] left-[20%] p-2 bg-secondary/10 border border-secondary/30 backdrop-blur-lg rounded font-mono text-[9px] text-secondary tracking-widest"
              >
                ENTITY_DETECTED: GPT-4o
              </motion.div>
              <motion.div 
                animate={{ x: [0, -10, 0], y: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-[30%] right-[15%] p-2 bg-primary/10 border border-primary/30 backdrop-blur-lg rounded font-mono text-[9px] text-primary tracking-widest"
              >
                CLUSTER: LLM_ARCH
              </motion.div>
            </div>
            
            {/* Background Orbs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
          </div>
        </div>

        {/* Right: Terminal */}
        <div className="md:col-span-3">
          <div className="glass-panel bg-black/40 backdrop-blur-3xl rounded-2xl flex flex-col h-full border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-on-surface-variant opacity-60">
                <Bot className="w-3.5 h-3.5" />
                Analysis Stream
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            
            <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed space-y-4 overflow-y-auto scrollbar-hide">
              <div className="text-secondary">&gt; Analyzing Page 45: Neural Network Architecture detected...</div>
              <div className="text-on-surface-variant">&gt; Extracting latent features...</div>
              <div className="text-on-surface-variant">&gt; Mapping cross-references to Page 12...</div>
              <div className="text-primary font-bold">&gt; [KEY_INSIGHT] Found: Multi-head Attention Scalability</div>
              <div className="text-on-surface-variant">&gt; Tokenizing section "Transformer Blocks"...</div>
              <div className="text-on-surface-variant">&gt; Generating vector embeddings for index 842...</div>
              <div className="text-secondary">&gt; Progressing to Page 46: Benchmarking Results...</div>
              <div className="text-on-surface-variant">&gt; Detecting tabular data structures...</div>
              <div className="text-tertiary">&gt; [ALERT] High information density detected...</div>
              <div className="text-on-surface-variant">&gt; Optimizing chunk overlap...</div>
              <div className="text-secondary animate-pulse">&gt; Initializing context-aware summary..._</div>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-center font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
                <span>Status: Active Pipeline</span>
                <span className="text-xs">64%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
