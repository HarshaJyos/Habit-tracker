
import * as React from 'react';
import { Task, Routine, JournalEntry, Note, Dump, Project } from '../types';
import { Trash2, RotateCcw, CheckSquare, PlayCircle, BookOpen, StickyNote, Brain, Briefcase, Download, Upload, RefreshCw } from 'lucide-react';

interface RestoreModuleProps {
  tasks: Task[];
  routines: Routine[];
  journalEntries: JournalEntry[];
  notes: Note[];
  dumps?: Dump[];
  projects?: Project[];
  onRestore: (id: string, type: 'task' | 'routine' | 'journal' | 'note' | 'dump' | 'project') => void;
  onDeleteForever: (id: string, type: 'task' | 'routine' | 'journal' | 'note' | 'dump' | 'project') => void;
  onExport?: () => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset?: () => void;
}

export const RestoreModule: React.FC<RestoreModuleProps> = ({ 
  tasks, routines, journalEntries, notes, dumps = [], projects = [], onRestore, onDeleteForever,
  onExport, onImport, onReset
}) => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'task' | 'routine' | 'journal' | 'note' | 'dump' | 'project'>('all');

  const deletedTasks = tasks.filter(t => t.deletedAt);
  const deletedRoutines = routines.filter(r => r.deletedAt);
  const deletedJournal = journalEntries.filter(j => j.deletedAt);
  const deletedNotes = notes.filter(n => n.deletedAt);
  const deletedDumps = dumps.filter(d => d.deletedAt);
  const deletedProjects = projects.filter(p => p.deletedAt);

  const getItems = () => {
    switch (activeTab) {
      case 'task': return deletedTasks.map(i => ({ ...i, content: i.description || '', type: 'task' as const }));
      case 'routine': return deletedRoutines.map(i => ({ ...i, content: `${i.steps.length} steps`, type: 'routine' as const }));
      case 'journal': return deletedJournal.map(i => ({ ...i, type: 'journal' as const }));
      case 'note': return deletedNotes.map(i => ({ ...i, type: 'note' as const }));
      case 'dump': return deletedDumps.map(i => ({ ...i, content: i.description, type: 'dump' as const }));
      case 'project': return deletedProjects.map(i => ({ ...i, content: i.description, type: 'project' as const }));
      default: return [
        ...deletedTasks.map(i => ({ ...i, content: i.description || '', type: 'task' as const })),
        ...deletedRoutines.map(i => ({ ...i, content: `${i.steps.length} steps`, type: 'routine' as const })),
        ...deletedJournal.map(i => ({ ...i, type: 'journal' as const })),
        ...deletedNotes.map(i => ({ ...i, type: 'note' as const })),
        ...deletedDumps.map(i => ({ ...i, content: i.description, type: 'dump' as const })),
        ...deletedProjects.map(i => ({ ...i, content: i.description, type: 'project' as const })),
      ].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    }
  };

  const items = getItems();

  const getIcon = (type: string) => {
      switch(type) {
          case 'task': return <CheckSquare size={16} className="text-blue-500" />;
          case 'routine': return <PlayCircle size={16} className="text-purple-500" />;
          case 'journal': return <BookOpen size={16} className="text-orange-500" />;
          case 'note': return <StickyNote size={16} className="text-yellow-500" />;
          case 'dump': return <Brain size={16} className="text-pink-500" />;
          case 'project': return <Briefcase size={16} className="text-indigo-500" />;
          default: return <Trash2 size={16} />;
      }
  };

  const handleDeleteForever = (e: React.MouseEvent, id: string, type: any) => {
      e.preventDefault();
      e.stopPropagation();
      onDeleteForever(id, type);
  }

  const handleRestore = (e: React.MouseEvent, id: string, type: any) => {
      e.preventDefault();
      e.stopPropagation();
      onRestore(id, type);
  }

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24 space-y-8 animate-fade-in">
      <div className="flex flex-col border-b border-gray-200 pb-6 gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <Trash2 className="text-black" size={32} /> Trash & Data
                </h2>
                <p className="text-gray-500 mt-1">Restore deleted items or manage app data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {onExport && (
                    <button onClick={onExport} className="bg-white border border-gray-200 hover:border-black text-gray-600 hover:text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <Download size={16} /> Export
                    </button>
                )}
                {onImport && (
                    <label className="bg-white border border-gray-200 hover:border-black text-gray-600 hover:text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer">
                        <input type="file" accept=".json" onChange={onImport} className="hidden" />
                        <Upload size={16} /> Import
                    </label>
                )}
                {onReset && (
                    <button onClick={onReset} className="bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors active:scale-95">
                        <RefreshCw size={16} /> Reset App
                    </button>
                )}
            </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
           {['all', 'task', 'routine', 'journal', 'note', 'dump', 'project'].map(tab => (
               <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
               >
                   {tab}
               </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item: any) => (
              <div key={`${item.type}-${item.id}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gray-200"></div>
                  <div className="flex justify-between items-start mb-2 pl-3">
                      <div className="flex items-center gap-2">
                          {getIcon(item.type)}
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{item.type}</span>
                      </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 pl-3 truncate pr-4">{item.title || 'Untitled'}</h3>
                  <div className="flex-1">
                    {item.content && <p className="text-xs text-gray-500 pl-3 line-clamp-3 mb-4">{item.content}</p>}
                    {!item.content && <p className="text-xs text-gray-400 pl-3 italic mb-4">No content</p>}
                  </div>
                  <div className="pl-3 mb-3">
                      <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          Deleted {new Date(item.deletedAt).toLocaleDateString()}
                      </span>
                  </div>
                  <div className="flex gap-2 pl-3 mt-auto">
                      <button type="button" onClick={(e) => handleRestore(e, item.id, item.type)} className="flex-1 bg-black text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors z-20 relative cursor-pointer">
                          <RotateCcw size={14} /> Restore
                      </button>
                      <button type="button" onClick={(e) => handleDeleteForever(e, item.id, item.type)} className="px-3 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100 transition-colors z-20 relative cursor-pointer" title="Delete Forever">
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {items.length === 0 && (
          <div className="text-center py-32 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Trash2 size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Trash is empty</h3>
              <p className="text-gray-500 mt-2">Items you delete will appear here.</p>
          </div>
      )}
    </div>
  );
};
