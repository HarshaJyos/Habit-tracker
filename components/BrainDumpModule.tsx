
import * as React from 'react';
import { Dump } from '../types';
import { Plus, Trash2, ListTodo, StickyNote, BookOpen, Brain, X, Lightbulb, ArrowRight, CornerDownRight, Sparkles, Archive, RefreshCcw, Briefcase } from 'lucide-react';

interface BrainDumpModuleProps {
  dumps: Dump[];
  onAddDump: (dump: Dump) => void;
  onDeleteDump: (id: string) => void;
  onConvertToTask: (dump: Dump) => void;
  onConvertToNote: (dump: Dump) => void;
  onConvertToJournal: (dump: Dump) => void;
  onConvertToProject: (dump: Dump) => void;
  onArchiveDump: (id: string) => void;
  onUnarchiveDump: (id: string) => void;
  autoTrigger?: boolean; // New Prop
  onAutoTriggerHandled?: () => void; // New Prop
}

export const BrainDumpModule: React.FC<BrainDumpModuleProps> = ({ 
  dumps, onAddDump, onDeleteDump, onConvertToTask, onConvertToNote, onConvertToJournal, onConvertToProject, onArchiveDump, onUnarchiveDump,
  autoTrigger, onAutoTriggerHandled
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);

  const activeDumps = dumps.filter(d => !d.deletedAt && !d.archivedAt).sort((a, b) => b.createdAt - a.createdAt);
  const archivedDumps = dumps.filter(d => !d.deletedAt && d.archivedAt).sort((a, b) => b.createdAt - a.createdAt);
  
  const currentViewDumps = showArchived ? archivedDumps : activeDumps;

  // Handle Auto Trigger
  React.useEffect(() => {
      if (autoTrigger) {
          openModal();
          if (onAutoTriggerHandled) onAutoTriggerHandled();
      }
  }, [autoTrigger, onAutoTriggerHandled]);

  const handleSave = () => {
      if (!title.trim() && !description.trim()) return;

      const newDump: Dump = {
          id: Date.now().toString(),
          title: title.trim() || 'Untitled Idea',
          description: description,
          createdAt: Date.now()
      };
      
      onAddDump(newDump);
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
  };

  const openModal = () => {
      setTitle('');
      setDescription('');
      setIsModalOpen(true);
  };

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-8 overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 pb-4 shrink-0 gap-4">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Brain className="text-black" size={32} /> Brain Dump
            </h2>
            {showArchived && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">Archived View</span>}
            {!showArchived && <p className="text-gray-500 mt-1">Unload your mind. Capture raw ideas now, organize later.</p>}
         </div>
         
         <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowArchived(!showArchived)}
                className={`p-2 rounded-xl transition-all ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title={showArchived ? "View Active" : "View Archive"}
            >
                <Archive size={20} />
            </button>
            <button 
                onClick={openModal}
                className="bg-black text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-2"
            >
                <Plus size={18} /> New Idea
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-20">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {currentViewDumps.map(dump => (
                <div key={dump.id} className="break-inside-avoid bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative overflow-hidden">
                    {/* Decorative Accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-100 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600 border border-yellow-100 group-hover:scale-110 transition-transform">
                            <Lightbulb size={20} fill="currentColor" className="opacity-20" />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                            {new Date(dump.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{dump.title}</h3>
                    
                    <div className="mb-6 flex-1">
                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed line-clamp-[8]">
                            {dump.description || <span className="italic text-gray-300">No details provided...</span>}
                        </p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <CornerDownRight size={12} /> Convert
                            </span>
                            
                            <div className="flex gap-1">
                                {showArchived ? (
                                    <button 
                                        onClick={() => onUnarchiveDump(dump.id)}
                                        className="text-gray-300 hover:text-black transition-colors p-1"
                                        title="Restore"
                                    >
                                        <RefreshCcw size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => onArchiveDump(dump.id)}
                                        className="text-gray-300 hover:text-black transition-colors p-1"
                                        title="Archive"
                                    >
                                        <Archive size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => onDeleteDump(dump.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            <button 
                                onClick={() => onConvertToTask(dump)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 group/btn transition-all"
                                title="To Task"
                            >
                                <ListTodo size={16} className="text-gray-400 group-hover/btn:text-blue-600" />
                                <span className="text-[9px] font-bold text-gray-400 group-hover/btn:text-blue-600 uppercase">Task</span>
                            </button>
                            <button 
                                onClick={() => onConvertToNote(dump)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50 group/btn transition-all"
                                title="To Note"
                            >
                                <StickyNote size={16} className="text-gray-400 group-hover/btn:text-yellow-600" />
                                <span className="text-[9px] font-bold text-gray-400 group-hover/btn:text-yellow-600 uppercase">Note</span>
                            </button>
                            <button 
                                onClick={() => onConvertToJournal(dump)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 group/btn transition-all"
                                title="To Journal"
                            >
                                <BookOpen size={16} className="text-gray-400 group-hover/btn:text-green-600" />
                                <span className="text-[9px] font-bold text-gray-400 group-hover/btn:text-green-600 uppercase">Log</span>
                            </button>
                            <button 
                                onClick={() => onConvertToProject(dump)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 group/btn transition-all"
                                title="To Project"
                            >
                                <Briefcase size={16} className="text-gray-400 group-hover/btn:text-indigo-600" />
                                <span className="text-[9px] font-bold text-gray-400 group-hover/btn:text-indigo-600 uppercase">Project</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {currentViewDumps.length === 0 && (
                <div className="break-inside-avoid py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 col-span-full">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Sparkles size={32} className="text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{showArchived ? 'Archive Empty' : 'Your mind is clear'}</h3>
                    {!showArchived && (
                        <>
                             <p className="text-gray-500 max-w-sm mt-2 mb-6">Don't let ideas slip away. Dump everything here—messy, raw, incomplete. Sort it out later.</p>
                             <button onClick={openModal} className="text-black font-bold border-b-2 border-black hover:border-transparent transition-all pb-0.5">Start dumping ideas &rarr;</button>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                          <Lightbulb size={20} className="text-yellow-500" fill="currentColor" />
                          <h3 className="font-bold text-gray-800">New Idea</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-black transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
                          <input 
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              placeholder="What's the big idea?"
                              className="w-full text-lg font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                              autoFocus
                          />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Details</label>
                          <textarea 
                              value={description}
                              onChange={e => setDescription(e.target.value)}
                              placeholder="Flesh it out... (optional)"
                              className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all custom-scrollbar"
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">Discard</button>
                      <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 shadow-lg flex items-center gap-2 transition-all hover:gap-3">
                          Save Idea <ArrowRight size={16} />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
