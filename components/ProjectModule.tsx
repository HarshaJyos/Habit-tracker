

import * as React from 'react';
import { Project, Task, Dump, FocusSession, Note, NoteItem, Priority } from '../types';
import { Plus, Briefcase, Calendar, Clock, MoreHorizontal, ArrowRight, Archive, RefreshCcw, Edit2, Trash2, X, LayoutGrid, List, CheckCircle2, Play, AlertCircle, CheckSquare, StickyNote, Pin } from 'lucide-react';
import { NoteCard, NoteEditorModal } from './NotesModule';

interface ProjectModuleProps {
  projects: Project[];
  tasks: Task[];
  focusSessions: FocusSession[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  convertingDump?: Dump | null;
  onClearConvertingDump?: () => void;
  onArchiveProject: (id: string) => void;
  onUnarchiveProject: (id: string) => void;
  
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStartTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onReorder?: (projects: Project[]) => void;
}

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6'
];

export const ProjectModule: React.FC<ProjectModuleProps> = ({ 
    projects, tasks, focusSessions, onAddProject, onUpdateProject, onDeleteProject, convertingDump, onClearConvertingDump, onArchiveProject, onUnarchiveProject,
    onAddTask, onUpdateTask, onDeleteTask, onStartTask, onToggleTask, onReorder
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [viewingProjectId, setViewingProjectId] = React.useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  
  const [draggedProjectId, setDraggedProjectId] = React.useState<string | null>(null);

  // Form State
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [color, setColor] = React.useState(PROJECT_COLORS[0]);
  const [status, setStatus] = React.useState<'active' | 'completed' | 'on-hold'>('active');
  const [priority, setPriority] = React.useState<Priority>('Medium');

  const activeProjects = projects.filter(p => !p.deletedAt && !p.archivedAt);
  const archivedProjects = projects.filter(p => !p.deletedAt && p.archivedAt);
  
  const currentViewProjects = showArchived ? archivedProjects : activeProjects;
  
  // Sort: Pinned first, then Priority (High>Med>Low), then User Order (using array order implicitly for DnD)
  // For DnD to work well, we need to respect the array order but maybe apply filters.
  // If we want simple manual reordering, we just map currentViewProjects.
  // But if we want automatic priority sorting, we can't easily drag-reorder arbitrarily.
  // The user requirement: "add priority input... and sorting can be even done on priority".
  // This implies sorting is optional or secondary to manual ordering, or overrides it.
  // Let's implement manual reordering as the primary, and if user wants priority they might filter/sort?
  // Or: Sort pinned to top, then respect array order.
  const sortedProjects = React.useMemo(() => {
     // We sort Pinned first
     return [...currentViewProjects].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [currentViewProjects]);

  // Handle Brain Dump Conversion
  React.useEffect(() => {
    if (convertingDump) {
      setTitle(convertingDump.title);
      setDescription(convertingDump.description);
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setEditingProjectId(null);
      setColor(PROJECT_COLORS[0]);
      setStatus('active');
      setPriority('Medium');
      setIsModalOpen(true);
    }
  }, [convertingDump]);

  const resetForm = () => {
      setTitle(''); setDescription(''); setStartDate(''); setDueDate('');
      setColor(PROJECT_COLORS[0]); setStatus('active'); setPriority('Medium'); setEditingProjectId(null);
  };

  const openModal = (project?: Project) => {
      if (project) {
          setEditingProjectId(project.id);
          setTitle(project.title);
          setDescription(project.description);
          setStartDate(new Date(project.startDate).toISOString().split('T')[0]);
          setDueDate(new Date(project.dueDate).toISOString().split('T')[0]);
          setColor(project.color);
          setStatus(project.status);
          setPriority(project.priority || 'Medium');
      } else {
          resetForm();
          setStartDate(new Date().toISOString().split('T')[0]);
      }
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      resetForm();
      if (onClearConvertingDump) onClearConvertingDump();
  };

  const handleSave = () => {
      if (!title.trim() || !startDate || !dueDate) return;

      const projectData: Partial<Project> = {
          title, description, 
          startDate: new Date(startDate).getTime(),
          dueDate: new Date(dueDate).getTime(),
          color, status, priority
      };

      if (editingProjectId) {
          const existing = projects.find(p => p.id === editingProjectId);
          if (existing) onUpdateProject({ ...existing, ...projectData });
      } else {
          const newProject: Project = {
              id: Date.now().toString(), createdAt: Date.now(), 
              notes: [], 
              ...projectData as any
          };
          onAddProject(newProject);
      }
      closeModal();
  };
  
  const handleTogglePin = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      onUpdateProject({ ...project, isPinned: !project.isPinned });
  };
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedProjectId(id);
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedProjectId || draggedProjectId === targetId || !onReorder) return;
      
      const allProjects = [...projects];
      const fromIndex = allProjects.findIndex(r => r.id === draggedProjectId);
      const toIndex = allProjects.findIndex(r => r.id === targetId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
          const [moved] = allProjects.splice(fromIndex, 1);
          allProjects.splice(toIndex, 0, moved);
          onReorder(allProjects);
      }
      setDraggedProjectId(null);
  };

  const getProjectStats = (projectId: string) => {
      const projectTasks = tasks.filter(t => t.projectId === projectId && !t.deletedAt);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.isCompleted).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      let totalSeconds = 0;
      projectTasks.forEach(task => {
          const taskSessions = focusSessions.filter(s => s.routineId === `task-${task.id}`);
          totalSeconds += taskSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      });
      return { totalTasks, completedTasks, progress, totalSeconds };
  };

  const formatDuration = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
  };
  
  const getPriorityColor = (p: Priority) => {
      if (p === 'High') return 'bg-red-500';
      if (p === 'Medium') return 'bg-orange-500';
      return 'bg-blue-500';
  }

  if (viewingProjectId) {
      const project = projects.find(p => p.id === viewingProjectId);
      if (project) {
          return (
              <ProjectDetailView 
                  project={project} 
                  tasks={tasks.filter(t => t.projectId === project.id && !t.deletedAt)}
                  onBack={() => setViewingProjectId(null)}
                  onAddTask={onAddTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onStartTask={onStartTask}
                  onToggleTask={onToggleTask}
                  onUpdateProject={onUpdateProject}
                  stats={getProjectStats(project.id)}
              />
          );
      }
  }

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-8">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Briefcase className="text-black" size={32} /> Projects
            </h2>
            {showArchived && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">Archived View</span>}
            {!showArchived && <p className="text-gray-500 mt-1">Manage big goals, deadlines, and related tasks.</p>}
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={() => setShowArchived(!showArchived)} className={`p-2 rounded-xl transition-all ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`} title={showArchived ? "View Active" : "View Archive"}>
                <Archive size={20} />
            </button>
            <button onClick={() => openModal()} className="bg-black text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-2">
                <Plus size={18} /> New Project
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map(project => {
              const { totalTasks, completedTasks, progress, totalSeconds } = getProjectStats(project.id);
              const isOverdue = Date.now() > project.dueDate && progress < 100;

              return (
                  <div 
                    key={project.id} 
                    draggable={!showArchived}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, project.id)}
                    onClick={() => setViewingProjectId(project.id)} 
                    className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden ${project.isPinned ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}
                  >
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: project.color }}></div>
                      <div className="flex justify-between items-start mb-4 pl-2">
                          <div>
                              <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1 flex items-center gap-2">
                                  {project.title}
                                  {/* Priority Dot */}
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} title={`Priority: ${project.priority}`}></div>
                              </h3>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${project.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{project.status}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleTogglePin(e, project)} className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${project.isPinned ? 'text-black' : 'text-gray-400 hover:text-black'}`}><Pin size={14} fill={project.isPinned ? "currentColor" : "none"}/></button>
                                {showArchived ? (
                                    <button onClick={(e) => { e.stopPropagation(); onUnarchiveProject(project.id); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black"><RefreshCcw size={14} /></button>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onArchiveProject(project.id); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black"><Archive size={14} /></button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); openModal(project); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black"><Edit2 size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-6 pl-2 line-clamp-2 min-h-[2.5em]">{project.description || 'No description provided.'}</p>
                      <div className="space-y-4 pl-2">
                          <div>
                              <div className="flex justify-between items-end mb-1"><span className="text-xs font-bold text-gray-400 uppercase">Progress</span><span className="text-xs font-mono font-bold text-gray-700">{progress}%</span></div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: project.color }}></div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1"><div className="flex items-center gap-1.5 text-gray-400 text-xs"><Calendar size={12} /><span>Due Date</span></div><span className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-gray-800'}`}>{new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                              <div className="space-y-1"><div className="flex items-center gap-1.5 text-gray-400 text-xs"><Clock size={12} /><span>Time Spent</span></div><span className="text-sm font-bold text-gray-800">{formatDuration(totalSeconds)}</span></div>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">{editingProjectId ? 'Edit Project' : 'New Project'}</h2>
                      <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black" placeholder="e.g. Website Redesign" /></div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black min-h-[80px] resize-none" placeholder="Goals, scope, etc." /></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black">
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                              </select>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black">
                                  <option value="active">Active</option>
                                  <option value="on-hold">On Hold</option>
                                  <option value="completed">Completed</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black" /></div>
                          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black" /></div>
                      </div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Color Theme</label><div className="flex flex-wrap gap-2">{PROJECT_COLORS.map(c => (<button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-black scale-110' : ''}`} style={{ backgroundColor: c }} />))}</div></div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-3"><button onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={handleSave} className="px-6 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800">Save Project</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

const ProjectDetailView: React.FC<{
    project: Project;
    tasks: Task[];
    stats: { totalTasks: number, completedTasks: number, progress: number, totalSeconds: number };
    onBack: () => void;
    onAddTask: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onStartTask: (task: Task) => void;
    onToggleTask: (id: string) => void;
    onUpdateProject: (project: Project) => void;
}> = ({ project, tasks, stats, onBack, onAddTask, onUpdateTask, onDeleteTask, onStartTask, onToggleTask, onUpdateProject }) => {
    const [activeTab, setActiveTab] = React.useState<'tasks' | 'notes'>('tasks');
    const [newTaskTitle, setNewTaskTitle] = React.useState('');
    
    // Note State
    const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
    const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
    const [initialNoteData, setInitialNoteData] = React.useState<Partial<Note> | undefined>(undefined);

    const handleQuickAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            isCompleted: false,
            priority: 'Medium',
            category: 'Work',
            projectId: project.id,
            createdAt: Date.now(),
            duration: 30
        };
        onAddTask(newTask);
        setNewTaskTitle('');
    };

    const handleSaveNote = (noteData: Partial<Note>) => {
        let updatedNotes = project.notes ? [...project.notes] : [];
        
        if (editingNoteId) {
            updatedNotes = updatedNotes.map(n => n.id === editingNoteId ? { ...n, ...noteData, updatedAt: Date.now() } : n);
        } else {
            const newNote: Note = {
                id: Date.now().toString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                items: [],
                images: [],
                type: 'text',
                isPinned: false,
                color: '#ffffff',
                title: '', content: '',
                ...noteData
            };
            updatedNotes.push(newNote);
        }
        onUpdateProject({ ...project, notes: updatedNotes });
        closeNoteModal();
    };

    const handleDeleteNote = (noteId: string) => {
        const updatedNotes = (project.notes || []).filter(n => n.id !== noteId);
        onUpdateProject({ ...project, notes: updatedNotes });
    };

    const handleToggleNoteItem = (noteId: string, itemId: string) => {
        const note = project.notes?.find(n => n.id === noteId);
        if(note && note.items) {
            const updatedItems = note.items.map(i => i.id === itemId ? { ...i, isDone: !i.isDone } : i);
            const updatedNote = { ...note, items: updatedItems };
            const updatedNotes = project.notes!.map(n => n.id === noteId ? updatedNote : n);
            onUpdateProject({ ...project, notes: updatedNotes });
        }
    };

    const handleTogglePin = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        const updatedNotes = (project.notes || []).map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n);
        onUpdateProject({ ...project, notes: updatedNotes });
    };

    const openNoteModal = (note?: Note) => {
        if (note) {
            setEditingNoteId(note.id);
            setInitialNoteData(note);
        } else {
            setEditingNoteId(null);
            setInitialNoteData(undefined);
        }
        setIsNoteModalOpen(true);
    };

    const closeNoteModal = () => {
        setIsNoteModalOpen(false);
        setEditingNoteId(null);
        setInitialNoteData(undefined);
    };

    const pendingTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);
    const projectNotes = project.notes || [];

    return (
        <div className="w-full h-full flex flex-col bg-white animate-fade-in">
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black mb-4 font-medium text-sm transition-colors">
                    <ArrowRight size={16} className="rotate-180" /> Back to Projects
                </button>
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${project.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}>{project.status}</span>
                        </div>
                        <p className="text-gray-600 max-w-2xl">{project.description}</p>
                        <div className="flex items-center gap-6 mt-6 text-sm font-medium text-gray-500">
                            <div className="flex items-center gap-2"><Calendar size={16} /><span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.dueDate).toLocaleDateString()}</span></div>
                            <div className="flex items-center gap-2"><Clock size={16} /><span>{(stats.totalSeconds / 3600).toFixed(1)}h Spent</span></div>
                        </div>
                    </div>
                    <div className="w-full md:w-64">
                        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2"><span>Progress</span><span>{stats.progress}%</span></div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${stats.progress}%`, backgroundColor: project.color }}></div></div>
                        <p className="text-right text-xs text-gray-400 mt-1">{stats.completedTasks}/{stats.totalTasks} Tasks</p>
                    </div>
                </div>
            </div>

            <div className="flex px-8 border-b border-gray-200 shrink-0">
                <button onClick={() => setActiveTab('tasks')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Tasks</button>
                <button onClick={() => setActiveTab('notes')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'notes' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Notes</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'tasks' && (
                        <>
                            <div className="flex gap-2 mb-8">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Plus size={20} /></div>
                                    <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickAddTask()} placeholder="Add a task to this project..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all text-lg" />
                                </div>
                                <button onClick={handleQuickAddTask} disabled={!newTaskTitle.trim()} className="bg-black text-white px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors">Add</button>
                            </div>
                            <div className="space-y-3 mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Tasks</h3>
                                {pendingTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all group bg-white">
                                        <button onClick={() => onToggleTask(task.id)} className="text-gray-300 hover:text-black transition-colors"><div className="w-5 h-5 border-2 border-current rounded-md"></div></button>
                                        <div className="flex-1"><span className="font-medium text-gray-900">{task.title}</span><div className="flex items-center gap-3 mt-1 text-xs text-gray-400"><span className="uppercase font-bold">{task.priority}</span><span>{task.duration}m estimate</span></div></div>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity"><button onClick={() => onStartTask(task)} className="p-2 hover:bg-black hover:text-white rounded-lg text-gray-400 transition-colors" title="Focus"><Play size={16}/></button><button onClick={() => onDeleteTask(task.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors"><Trash2 size={16}/></button></div>
                                    </div>
                                ))}
                                {pendingTasks.length === 0 && <p className="text-gray-400 italic text-sm">No active tasks.</p>}
                            </div>
                            {completedTasks.length > 0 && (
                                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Completed</h3>
                                    {completedTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50">
                                            <button onClick={() => onToggleTask(task.id)} className="text-gray-400"><CheckSquare size={20} /></button>
                                            <span className="font-medium text-gray-500 line-through flex-1">{task.title}</span>
                                            <button onClick={() => onDeleteTask(task.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-300 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'notes' && (
                        <div>
                            <button onClick={() => openNoteModal()} className="mb-6 w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 font-bold hover:border-black hover:text-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <Plus size={20} /> Add Project Note
                            </button>
                            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                                {projectNotes.map(note => (
                                    <NoteCard 
                                        key={note.id} 
                                        note={note} 
                                        onClick={() => openNoteModal(note)}
                                        onPin={(e) => handleTogglePin(e, note)}
                                        onDelete={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                        onToggleItem={handleToggleNoteItem}
                                    />
                                ))}
                                {projectNotes.length === 0 && <p className="text-center col-span-full text-gray-400 py-10 italic">No private notes for this project yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isNoteModalOpen && (
                <NoteEditorModal 
                    initialNote={initialNoteData}
                    onSave={handleSaveNote}
                    onClose={closeNoteModal}
                    titleLabel={editingNoteId ? 'Edit Project Note' : 'New Project Note'}
                />
            )}
        </div>
    );
};
