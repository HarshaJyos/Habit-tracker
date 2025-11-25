

import * as React from 'react';
import { Routine, RoutineStep, Task, Habit, PausedRoutine, Reminder } from '../types';
import { Play, Plus, Trash2, X, ListPlus, Repeat, CalendarClock, ChevronUp, ChevronDown, Edit2, Clock, Zap, Archive, RefreshCcw, CheckCircle, PauseCircle, Timer, Bell, GripVertical, Pin } from 'lucide-react';

interface RoutineModuleProps {
  routines: Routine[];
  habits?: Habit[]; 
  pausedRoutines?: PausedRoutine[];
  onAddRoutine: (routine: Routine) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
  onStartRoutine: (id: string) => void;
  onResumeRoutine?: (paused: PausedRoutine) => void;
  onDiscardPaused?: (id: string) => void;
  tasks: Task[];
  onArchiveRoutine: (id: string) => void;
  onUnarchiveRoutine: (id: string) => void;
  onReorder?: (routines: Routine[]) => void;
}

export const RoutineModule: React.FC<RoutineModuleProps> = ({ 
    routines, habits = [], pausedRoutines = [], onAddRoutine, onUpdateRoutine, onDeleteRoutine, onStartRoutine, onResumeRoutine, onDiscardPaused, tasks, onArchiveRoutine, onUnarchiveRoutine, onReorder
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [newRoutineTitle, setNewRoutineTitle] = React.useState('');
  const [newSteps, setNewSteps] = React.useState<RoutineStep[]>([]);
  const [routineType, setRoutineType] = React.useState<'once' | 'repeatable'>('repeatable');
  
  const [stepTitle, setStepTitle] = React.useState('');
  const [stepMins, setStepMins] = React.useState('5');
  const [linkedHabitId, setLinkedHabitId] = React.useState(''); 
  
  const [showArchived, setShowArchived] = React.useState(false);
  
  // Reminders
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [newReminderOffset, setNewReminderOffset] = React.useState(15);

  const [draggedRoutineId, setDraggedRoutineId] = React.useState<string | null>(null);

  const activeRoutines = routines.filter(r => !r.deletedAt && !r.archivedAt);
  const archivedRoutines = routines.filter(r => !r.deletedAt && r.archivedAt);
  
  const currentViewRoutines = showArchived ? archivedRoutines : activeRoutines;
  // Sort pinned first
  const sortedRoutines = React.useMemo(() => {
     return [...currentViewRoutines].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [currentViewRoutines]);

  const openEditor = (routine?: Routine) => {
      if (routine) {
          setEditingId(routine.id);
          setNewRoutineTitle(routine.title);
          setNewSteps([...routine.steps]);
          setRoutineType(routine.type);
          setReminders(routine.reminders || []);
      } else {
          setEditingId(null);
          setNewRoutineTitle('');
          setNewSteps([]);
          setRoutineType('repeatable');
          setReminders([]);
      }
      setIsModalOpen(true);
  };

  const addStep = () => {
    if (!stepTitle) return;
    const step: RoutineStep = {
      id: Date.now().toString(),
      title: stepTitle,
      durationSeconds: parseInt(stepMins) * 60 || 300,
      linkedHabitId: linkedHabitId || undefined
    };
    setNewSteps([...newSteps, step]);
    setStepTitle('');
    setStepMins('5');
    setLinkedHabitId('');
  };

  const addStepFromTask = (task: Task) => {
    const durationSecs = (task.duration || 5) * 60;
    const step: RoutineStep = {
      id: Date.now().toString(),
      title: task.title,
      durationSeconds: durationSecs,
      linkedTaskId: task.id // Link the task
    };
    setNewSteps([...newSteps, step]);
  };

  const handleHabitSelect = (habitId: string) => {
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
          setStepTitle(habit.title);
          setLinkedHabitId(habit.id);
          // If habit has a duration goal, suggest that duration
          if (habit.type === 'elastic' && habit.elasticConfig) {
              setStepMins(habit.elasticConfig.elite.target.toString());
          } else if (habit.goal.type === 'duration') {
              setStepMins(habit.goal.target.toString());
          }
      } else {
          setLinkedHabitId('');
      }
  };

  const removeStep = (id: string) => { setNewSteps(newSteps.filter(s => s.id !== id)); };
  const moveStep = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index > 0) {
          const updated = [...newSteps]; [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]]; setNewSteps(updated);
      } else if (direction === 'down' && index < newSteps.length - 1) {
          const updated = [...newSteps]; [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]; setNewSteps(updated);
      }
  };
  
  const addReminder = () => {
      const newRem: Reminder = { id: Date.now().toString(), timeOffset: newReminderOffset, type: 'notification' };
      setReminders([...reminders, newRem]);
  };
  const removeReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));

  const saveRoutine = () => {
    if (!newRoutineTitle || newSteps.length === 0) return;
    const routineData = {
        title: newRoutineTitle, steps: newSteps, type: routineType, reminders
    };

    if (editingId) {
        const existing = routines.find(r => r.id === editingId);
        if(existing) onUpdateRoutine({ ...existing, ...routineData });
    } else {
        const routine: Routine = { id: Date.now().toString(), color: 'bg-black', startTime: routineType === 'once' ? Date.now() : undefined, ...routineData, steps: newSteps };
        onAddRoutine(routine);
    }
    setIsModalOpen(false); setEditingId(null); setNewRoutineTitle(''); setNewSteps([]); setRoutineType('repeatable'); setReminders([]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); onDeleteRoutine(id); };
  const handleEdit = (e: React.MouseEvent, routine: Routine) => { e.preventDefault(); e.stopPropagation(); openEditor(routine); };
  const handleArchive = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); onArchiveRoutine(id); };
  const handleUnarchive = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); onUnarchiveRoutine(id); };
  const handleTogglePin = (e: React.MouseEvent, routine: Routine) => { e.preventDefault(); e.stopPropagation(); onUpdateRoutine({ ...routine, isPinned: !routine.isPinned }); };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedRoutineId(id);
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedRoutineId || draggedRoutineId === targetId || !onReorder) return;
      
      const allRoutines = [...routines];
      const fromIndex = allRoutines.findIndex(r => r.id === draggedRoutineId);
      const toIndex = allRoutines.findIndex(r => r.id === targetId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
          const [moved] = allRoutines.splice(fromIndex, 1);
          allRoutines.splice(toIndex, 0, moved);
          onReorder(allRoutines);
      }
      setDraggedRoutineId(null);
  };

  const pendingTasks = tasks.filter(t => !t.isCompleted && !t.deletedAt);
  const unscheduledTasks = pendingTasks.filter(t => !t.startTime);

  const visibleRoutines = sortedRoutines.filter(r => {
      if (r.type === 'repeatable') return true;
      return !r.completedAt;
  });

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24">
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Routines</h2>
                {showArchived && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">Archived View</span>}
            </div>
            
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className={`p-2 rounded-xl transition-all ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title={showArchived ? "View Active" : "View Archive"}
                >
                    <Archive size={20} />
                </button>
                <button onClick={() => openEditor()} className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-gray-200">
                    <Plus size={18} /> New Flow
                </button>
            </div>
        </div>

        {/* Paused Routines Section */}
        {pausedRoutines.length > 0 && !showArchived && (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-xs tracking-wider px-1">
                    <PauseCircle size={14} /> Paused In Progress
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pausedRoutines.map(paused => {
                         const progress = Math.round(((paused.currentStepIndex) / paused.routine.steps.length) * 100);
                         return (
                            <div key={paused.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                                        <Timer size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{paused.routine.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Step {paused.currentStepIndex + 1}/{paused.routine.steps.length}</span>
                                            <span>•</span>
                                            <span>{progress}% Complete</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onResumeRoutine && onResumeRoutine(paused)}
                                        className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
                                    >
                                        Resume
                                    </button>
                                    <button 
                                        onClick={() => onDiscardPaused && onDiscardPaused(paused.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Discard"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleRoutines.map(routine => {
                const totalTime = Math.ceil(routine.steps.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
                return (
                    <div 
                        key={routine.id} 
                        draggable={!showArchived}
                        onDragStart={(e) => handleDragStart(e, routine.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, routine.id)}
                        className={`bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col cursor-pointer h-[320px] ${routine.isPinned ? 'border-black ring-1 ring-black shadow-md' : 'border-gray-200 hover:border-gray-300'}`} 
                        onClick={() => onStartRoutine(routine.id)}
                    >
                        <div className="p-6 flex flex-col h-full relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl bg-gray-50 border border-gray-100 ${routine.type === 'repeatable' ? 'text-black' : 'text-indigo-600'}`}>
                                    {routine.type === 'repeatable' ? <Zap size={20} fill="currentColor" className="opacity-20" strokeWidth={2} /> : <CalendarClock size={20} />}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleTogglePin(e, routine)} className={`p-2 rounded-lg transition-colors ${routine.isPinned ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`} title={routine.isPinned ? "Unpin" : "Pin"}><Pin size={16} fill={routine.isPinned ? "currentColor" : "none"}/></button>
                                    {showArchived ? (
                                        <button onClick={(e) => handleUnarchive(e, routine.id)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Restore">
                                            <RefreshCcw size={16} />
                                        </button>
                                    ) : (
                                        <button onClick={(e) => handleArchive(e, routine.id)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Archive">
                                            <Archive size={16} />
                                        </button>
                                    )}
                                    <button onClick={(e) => handleEdit(e, routine)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                                    <button onClick={(e) => handleDelete(e, routine.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">{routine.title}</h3>
                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    <span className="flex items-center gap-1"><ListPlus size={14} /> {routine.steps.length} Steps</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {totalTime} Min</span>
                                    {routine.reminders && routine.reminders.length > 0 && <span className="flex items-center gap-1"><Bell size={14}/> {routine.reminders.length}</span>}
                                </div>
                            </div>
                            <div className="flex-1 space-y-3 relative overflow-hidden">
                                {routine.steps.slice(0, 3).map((step, i) => (
                                    <div key={step.id} className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-black' : 'bg-gray-200'}`}></div>
                                        <span className="text-sm text-gray-600 font-medium truncate flex-1">{step.title}</span>
                                        <span className="text-xs text-gray-400 font-mono">{Math.round(step.durationSeconds/60)}m</span>
                                    </div>
                                ))}
                                {routine.steps.length > 3 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent h-12 flex items-end">
                                        <span className="text-xs text-gray-400 font-medium pl-5 pb-1">+{routine.steps.length - 3} more steps</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gray-50 border-t border-gray-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between z-20">
                                <span className="font-bold text-gray-900 text-sm">Start Session</span>
                                <div className="bg-black text-white p-2 rounded-full">
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            <button onClick={() => openEditor()} className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-black hover:border-black hover:bg-gray-50 transition-all group h-[320px]">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                <span className="font-bold">Create New Routine</span>
            </button>
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{editingId ? 'Edit Routine' : 'New Routine'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
                    <div className="space-y-6">
                        <div className="relative">
                            <input className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none p-0 focus:ring-0 focus:outline-none bg-transparent" placeholder="Routine Name..." value={newRoutineTitle} onChange={e => setNewRoutineTitle(e.target.value)} autoFocus />
                        </div>
                        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                            <button onClick={() => setRoutineType('repeatable')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${routineType === 'repeatable' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Repeat size={14} /> Repeatable</button>
                            <button onClick={() => setRoutineType('once')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${routineType === 'once' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><CalendarClock size={14} /> Run Once</button>
                        </div>
                    </div>
                    
                    {/* Reminders Section */}
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Bell size={12}/> Reminders</label>
                         </div>
                         <div className="space-y-2">
                             {reminders.map((r, idx) => (
                                 <div key={r.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                     <Clock size={14} className="text-gray-400"/>
                                     <span className="text-sm font-medium flex-1">{r.timeOffset === 0 ? 'At start time' : `${r.timeOffset} minutes before`}</span>
                                     <button onClick={() => removeReminder(r.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                 </div>
                             ))}
                             <div className="flex gap-2">
                                 <select value={newReminderOffset} onChange={e => setNewReminderOffset(parseInt(e.target.value))} className="bg-white border border-gray-200 rounded-lg p-2 text-sm flex-1">
                                     <option value={0}>At time of event</option>
                                     <option value={5}>5 minutes before</option>
                                     <option value={10}>10 minutes before</option>
                                     <option value={15}>15 minutes before</option>
                                     <option value={30}>30 minutes before</option>
                                     <option value={60}>1 hour before</option>
                                 </select>
                                 <button onClick={addReminder} className="px-3 py-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-sm font-bold transition-colors">Add</button>
                             </div>
                         </div>
                     </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sequence ({newSteps.length})</label>
                            <span className="text-xs text-gray-400 font-mono">Total: {Math.ceil(newSteps.reduce((acc,s) => acc + s.durationSeconds, 0)/60)}m</span>
                        </div>
                        
                        {/* Step Input */}
                        <div className="flex gap-2 items-center bg-gray-50 p-2 pr-3 rounded-xl border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                            <div className="pl-3 py-2 flex-1">
                                <input className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none" placeholder="Add a new step..." value={stepTitle} onChange={e => setStepTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStep()} />
                            </div>
                            <div className="h-6 w-px bg-gray-300"></div>
                            
                            {/* Habit Selector (New) */}
                            <div className="relative group">
                                <select 
                                    value={linkedHabitId} 
                                    onChange={e => handleHabitSelect(e.target.value)}
                                    className="w-20 bg-transparent text-xs font-medium text-gray-500 focus:outline-none cursor-pointer truncate"
                                >
                                    <option value="">No Link</option>
                                    {habits.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                                </select>
                            </div>

                            <div className="h-6 w-px bg-gray-300"></div>
                            <input type="number" className="w-12 bg-transparent text-center font-mono text-sm text-gray-900 focus:outline-none" placeholder="5" value={stepMins} onChange={e => setStepMins(e.target.value)} />
                            <span className="text-xs text-gray-400 font-medium mr-1">m</span>
                            <button onClick={addStep} disabled={!stepTitle} className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"><Plus size={16} /></button>
                        </div>
                        
                        {unscheduledTasks.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {unscheduledTasks.slice(0, 5).map(task => (
                                    <button key={task.id} onClick={() => addStepFromTask(task)} className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-black hover:text-black transition-colors"><ListPlus size={12} /> {task.title}</button>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2 mt-2">
                            {newSteps.map((step, idx) => (
                                <div key={step.id} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{idx + 1}</span>
                                        <span className="text-sm font-medium text-gray-900 truncate">{step.title}</span>
                                        {step.linkedHabitId && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1"><CheckCircle size={10}/> Habit</span>}
                                        {step.linkedTaskId && <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1"><ListPlus size={10}/> Task</span>}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">{Math.round(step.durationSeconds / 60)}m</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex flex-col gap-0.5"><button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-black disabled:opacity-0"><ChevronUp size={12}/></button><button onClick={() => moveStep(idx, 'down')} disabled={idx === newSteps.length - 1} className="text-gray-300 hover:text-black disabled:opacity-0"><ChevronDown size={12}/></button></div>
                                            <button onClick={() => removeStep(step.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {newSteps.length === 0 && <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl"><p className="text-gray-400 text-sm">No steps added yet.</p></div>}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={saveRoutine} disabled={!newRoutineTitle || newSteps.length === 0} className="px-6 py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors shadow-lg shadow-gray-200">{editingId ? 'Update Routine' : 'Create Routine'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
