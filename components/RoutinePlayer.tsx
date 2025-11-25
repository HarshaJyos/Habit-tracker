
import * as React from 'react';
import { Routine, RoutineStep, StepLog, Task, Habit } from '../types';
import { Pause, Play, X, Check, FastForward, CheckSquare, Clock, GripVertical, List, Layers, ArrowDown, PauseCircle, CheckCircle, Maximize2, SkipForward, PanelLeft, ListPlus } from 'lucide-react';
import { playSound } from '../utils/sounds';

interface RoutinePlayerProps {
  routine: Routine;
  steps: RoutineStep[];
  currentStepIndex: number;
  timeElapsedInStep: number;
  isPlaying: boolean;
  tasks: Task[];
  habits?: Habit[];
  
  onTogglePlay: () => void;
  onStepComplete: () => void;
  onStepsReorder: (steps: RoutineStep[]) => void;
  onMinimize: () => void;
  onExit: () => void;
  onSave: () => void;
  onToggleSubtask: (routineId: string, subtaskId: string) => void;
}

export const RoutinePlayer: React.FC<RoutinePlayerProps> = ({ 
    routine, steps, currentStepIndex, timeElapsedInStep, isPlaying, tasks, habits = [],
    onTogglePlay, onStepComplete, onStepsReorder, onMinimize, onExit, onSave, onToggleSubtask 
}) => {
  
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  
  const stepDuration = currentStep.durationSeconds;
  const timeLeft = stepDuration - timeElapsedInStep;
  const isOvertime = timeLeft < 0;
  
  const progress = Math.min(100, (timeElapsedInStep / stepDuration) * 100);

  // UI State
  const [panelMode, setPanelMode] = React.useState<'steps' | 'checklist'>('steps');
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);

  // Sound Effect Logic
  React.useEffect(() => {
      // Play start sound when component mounts/routine starts for the first time
      if (currentStepIndex === 0 && timeElapsedInStep === 0 && isPlaying) {
          playSound('TIMER_START');
      }
  }, []); // Run once on mount if playing

  React.useEffect(() => {
      // Logic for Overtime and End sounds
      if (isPlaying) {
          if (timeLeft === 0) {
              playSound('TIMER_END');
          } else if (timeLeft < 0 && Math.abs(timeLeft) % 30 === 0) {
              // Beep every 30 seconds of overtime
              playSound('OVERTIME_TICK');
          }
      }
  }, [timeLeft, isPlaying]);

  const handleStepCompleteInternal = () => {
      if (currentStepIndex === steps.length - 1) {
          playSound('ROUTINE_COMPLETE');
      } else {
          // Reset timer sound might be annoying, maybe just a small click or nothing
      }
      onStepComplete();
  };

  const handleTogglePlayInternal = () => {
      if (!isPlaying) {
          playSound('TIMER_START');
      }
      onTogglePlay();
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${seconds < 0 ? '-' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData('stepIndex', index.toString());
      e.dataTransfer.setData('origin', 'list');
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleLibraryDragStart = (e: React.DragEvent, id: string, type: 'task' | 'habit') => {
      e.dataTransfer.setData('id', id);
      e.dataTransfer.setData('type', type);
      e.dataTransfer.setData('origin', 'library');
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const origin = e.dataTransfer.getData('origin');
      
      const newSteps = [...steps];

      if (origin === 'library') {
          const id = e.dataTransfer.getData('id');
          const type = e.dataTransfer.getData('type');
          
          let newStep: RoutineStep | null = null;
          
          if (type === 'task') {
              const task = tasks.find(t => t.id === id);
              if (task) {
                  newStep = {
                      id: Date.now().toString(),
                      title: task.title,
                      durationSeconds: (task.duration || 5) * 60,
                      linkedTaskId: task.id
                  };
              }
          } else if (type === 'habit') {
              const habit = habits.find(h => h.id === id);
              if (habit) {
                  const duration = habit.goal.type === 'duration' ? habit.goal.target * 60 : 300;
                   newStep = {
                      id: Date.now().toString(),
                      title: habit.title,
                      durationSeconds: duration,
                      linkedHabitId: habit.id
                  };
              }
          }

          if (newStep) {
              // Insert at index + 1 (after drop target) or at index if we want to replace/insert before
              // Standard behavior is insert AFTER if dropping on the bottom half, or BEFORE on top half.
              // For simplicity, let's insert AT the index (before the item dropped on).
              newSteps.splice(index + 1, 0, newStep);
              onStepsReorder(newSteps);
          }

      } else {
          // Reordering existing steps
          const fromIndexStr = e.dataTransfer.getData('stepIndex');
          if (!fromIndexStr) return;
          
          const fromIndex = parseInt(fromIndexStr, 10);
          const toIndex = index;
          if (fromIndex === toIndex) return;

          const [movedStep] = newSteps.splice(fromIndex, 1);
          newSteps.splice(toIndex, 0, movedStep);
          onStepsReorder(newSteps);
      }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col animate-fade-in overflow-hidden h-dvh font-sans">
      
      {/* Top Bar */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-zinc-950 z-20">
         <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                className={`p-2 rounded-lg transition-all md:hidden ${isLibraryOpen ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
             >
                 <PanelLeft size={20} />
             </button>
             <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-sm font-bold tracking-widest uppercase text-zinc-400">Focus Session</span>
             </div>
         </div>
         <div className="flex gap-2">
            <button onClick={onMinimize} className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium" title="Minimize">
                <ArrowDown size={16} /> <span className="hidden md:inline">Minimize</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-2"></div>
            <button onClick={onSave} className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium">
                <PauseCircle size={16} /> Save & Quit
            </button>
            <button onClick={onExit} className="flex items-center gap-2 text-zinc-400 hover:text-red-400 px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium">
                <X size={16} /> Cancel
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Library Sidebar (Slide-over) */}
          <div className={`absolute top-0 bottom-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 z-40 transform transition-transform duration-300 ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Library</h3>
                  <button onClick={() => setIsLibraryOpen(false)} className="lg:hidden text-zinc-500 hover:text-white"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  <div>
                      <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Tasks</h4>
                      <div className="space-y-2">
                          {tasks.filter(t => !t.isCompleted).map(task => (
                              <div 
                                  key={task.id} 
                                  draggable 
                                  onDragStart={(e) => handleLibraryDragStart(e, task.id, 'task')}
                                  className="bg-zinc-800 p-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 cursor-grab active:cursor-grabbing border-l-2 border-transparent hover:border-blue-500 transition-all"
                              >
                                  <div className="truncate font-medium">{task.title}</div>
                                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Clock size={10} /> {task.duration || 30}m</div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div>
                      <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Habits</h4>
                      <div className="space-y-2">
                           {habits.map(habit => (
                              <div 
                                  key={habit.id} 
                                  draggable 
                                  onDragStart={(e) => handleLibraryDragStart(e, habit.id, 'habit')}
                                  className="bg-zinc-800 p-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 cursor-grab active:cursor-grabbing border-l-2 border-transparent hover:border-green-500 transition-all"
                              >
                                  <div className="truncate font-medium">{habit.title}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* Main Focus Area (Center) */}
          <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar bg-zinc-950">
             <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[500px]">
                
                <div className="text-center mb-8 max-w-2xl animate-fade-in-up">
                    <h2 className="text-zinc-500 font-bold mb-3 uppercase tracking-widest text-xs">{routine.title}</h2>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">{currentStep.title}</h1>
                </div>

                {/* Timer Circle */}
                <div className="relative w-[300px] h-[300px] md:w-[380px] md:h-[380px] flex items-center justify-center mb-10 group">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                        {/* Background Circle */}
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800/50" />
                        {/* Progress Circle */}
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 45}%`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`} 
                            className={`transition-all duration-1000 ease-linear ${isOvertime ? 'text-red-500' : 'text-white'}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                        <span className={`text-6xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums ${isOvertime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </span>
                        {isOvertime && <span className="text-red-500 text-xs font-bold uppercase tracking-widest mt-2 px-2 py-0.5 rounded bg-red-500/10">Overtime</span>}
                    </div>
                    
                    {/* Glow Effect */}
                     <div className={`absolute inset-0 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${isOvertime ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 z-20">
                    <button 
                        onClick={handleTogglePlayInternal}
                        className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg border border-zinc-700"
                        title={isPlaying ? "Pause" : "Resume"}
                    >
                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>

                    <button 
                        onClick={handleStepCompleteInternal}
                        className="h-16 px-10 rounded-full bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95 font-bold text-lg flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    >
                        <Check size={28} strokeWidth={3} />
                        {currentStepIndex === steps.length - 1 ? 'Finish' : 'Done'}
                    </button>
                </div>

             </div>
          </div>

          {/* Side Panel (Right) */}
          <div className="w-80 md:w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 hidden md:flex shadow-2xl z-30">
             {/* Tabs */}
             <div className="flex p-1 m-4 bg-zinc-900 rounded-xl border border-zinc-800">
                {routine.subtasks && routine.subtasks.length > 0 && (
                    <button 
                        onClick={() => setPanelMode('checklist')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${panelMode === 'checklist' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <CheckSquare size={14} /> Checklist
                    </button>
                )}
                <button 
                    onClick={() => setPanelMode('steps')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${panelMode === 'steps' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Layers size={14} /> Sequence
                </button>
             </div>

             <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {panelMode === 'checklist' && routine.subtasks && (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">
                            <span>Tasks</span>
                            <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">{routine.subtasks.filter(s => s.isCompleted).length}/{routine.subtasks.length}</span>
                        </div>
                        {routine.subtasks.map(sub => (
                            <button 
                                key={sub.id} 
                                onClick={() => onToggleSubtask(routine.id, sub.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all group ${sub.isCompleted ? 'bg-zinc-900/30 border-transparent opacity-50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${sub.isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600 group-hover:border-white text-transparent'}`}>
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className={`text-sm leading-snug transition-colors ${sub.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                                    {sub.title}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {panelMode === 'steps' && (
                     <div className="space-y-4 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-800 z-0"></div>

                        {/* Steps List */}
                        <div className="space-y-6 relative z-10">
                            {steps.map((step, idx) => {
                                const isCompleted = idx < currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                const linkedTask = step.linkedTaskId ? tasks.find(t => t.id === step.linkedTaskId) : null;
                                
                                return (
                                    <div 
                                        key={step.id} 
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        className={`relative pl-10 transition-all duration-300
                                            ${dragOverIndex === idx ? 'pt-8' : ''}
                                            ${isCompleted ? 'opacity-50' : 'opacity-100'}
                                        `}
                                    >
                                        {/* Drop Indicator */}
                                        {dragOverIndex === idx && (
                                            <div className="absolute top-0 left-10 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                        )}

                                        {/* Timeline Dot */}
                                        <div className={`absolute left-2.5 top-3 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10
                                            ${isCurrent ? 'bg-white border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 
                                              isCompleted ? 'bg-zinc-950 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}
                                        `}>
                                            {isCompleted && <div className="w-full h-full flex items-center justify-center"><Check size={8} className="text-zinc-500" /></div>}
                                        </div>

                                        {/* Card */}
                                        <div className={`
                                            p-3 rounded-xl border transition-all duration-200 group flex flex-col gap-2
                                            ${isCurrent ? 'bg-zinc-800 border-zinc-600 shadow-lg ring-1 ring-zinc-500/50' : 
                                              isCompleted ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing'}
                                        `}>
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {isCurrent && <span className="text-[10px] font-bold bg-white text-black px-1.5 rounded uppercase tracking-wider">Now</span>}
                                                        {step.linkedHabitId && <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 rounded uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10} /> Habit</span>}
                                                        {step.linkedTaskId && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 rounded uppercase tracking-wider flex items-center gap-1"><List size={10} /> Task</span>}
                                                    </div>
                                                    <p className={`text-sm font-medium leading-tight ${isCurrent ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                                        {step.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 font-mono">
                                                        <Clock size={12} />
                                                        <span>{Math.ceil(step.durationSeconds / 60)} min</span>
                                                    </div>
                                                </div>
                                                
                                                {!isCurrent && !isCompleted && (
                                                    <div className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded cursor-grab">
                                                        <GripVertical size={16} />
                                                    </div>
                                                )}
                                                {isCurrent && (
                                                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1"></div>
                                                )}
                                            </div>

                                            {linkedTask && linkedTask.subtasks && linkedTask.subtasks.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-zinc-800/50 space-y-1">
                                                     {linkedTask.subtasks.map(sub => (
                                                         <div 
                                                            key={sub.id} 
                                                            className="flex items-center gap-2 text-xs pl-2 border-l border-zinc-800 ml-1 py-1 hover:bg-zinc-800/50 rounded-r-md cursor-pointer transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleSubtask(`task-${linkedTask.id}`, sub.id); 
                                                            }}
                                                         >
                                                             <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                                                                 {sub.isCompleted && <Check size={10} className="text-black" />}
                                                             </div>
                                                             <span className={`${sub.isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>{sub.title}</span>
                                                         </div>
                                                     ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                         <div className="pl-10 pt-4 opacity-30 flex items-center gap-2">
                             <div className="w-2 h-2 bg-zinc-700 rounded-full ml-[1px]"></div>
                             <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Finish</span>
                         </div>
                     </div>
                )}
             </div>
          </div>
      </div>

      <div className="md:hidden border-t border-zinc-800 bg-zinc-900 p-4 safe-bottom">
         <div className="flex justify-between items-center text-sm text-zinc-400 mb-2">
            <span className="flex items-center gap-2"><ArrowDown size={14}/> Next: <span className="text-white font-medium">{nextStep ? nextStep.title : 'Finish'}</span></span>
            <button onClick={() => setPanelMode(panelMode === 'steps' ? 'checklist' : 'steps')} className="text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 px-3 py-1.5 rounded-lg">
                {panelMode === 'steps' ? 'Checklist' : 'Sequence'}
            </button>
         </div>
      </div>

    </div>
  );
};

export const MiniPlayer: React.FC<{
    routine: Routine;
    currentStep: RoutineStep;
    timeElapsed: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onExpand: () => void;
    timeLeft: number;
    isOvertime: boolean;
}> = ({ routine, currentStep, timeElapsed, isPlaying, onTogglePlay, onNext, onExpand, timeLeft, isOvertime }) => {
    
    const formatTime = (seconds: number) => {
        const absSeconds = Math.abs(seconds);
        const m = Math.floor(absSeconds / 60);
        const s = absSeconds % 60;
        return `${seconds < 0 ? '-' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Progress calculation for the circular ring
    const progress = Math.min(100, (timeElapsed / currentStep.durationSeconds) * 100);
    const radius = 14; // Small radius for icon
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="bg-zinc-900 text-white p-3 rounded-2xl border border-zinc-800 flex flex-col gap-3 w-full animate-in slide-in-from-left-4 fade-in duration-300">
             
             {/* Top Row: Progress Icon, Title, Controls */}
             <div className="flex items-center justify-between gap-2">
                {/* Icon - Fixed Size */}
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r={radius} stroke="#3f3f46" strokeWidth="3" fill="transparent" />
                        <circle cx="18" cy="18" r={radius} stroke={isOvertime ? '#ef4444' : '#10b981'} strokeWidth="3" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-linear"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                        {isPlaying ? <Clock size={10} className={isOvertime ? "text-red-500 animate-pulse" : ""} /> : <Pause size={10} />}
                    </div>
                </div>
                
                {/* Text Container - Flex Grow with min-w-0 for truncation */}
                <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                    <h4 className="font-bold text-xs truncate text-zinc-100 leading-tight">{currentStep.title}</h4>
                    <span className="text-[9px] text-zinc-500 font-medium truncate uppercase tracking-wide">{routine.title}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={onTogglePlay} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
                    <button onClick={onNext} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <SkipForward size={14} />
                    </button>
                    <button onClick={onExpand} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Expand">
                        <Maximize2 size={14} />
                    </button>
                </div>
             </div>

             {/* Bottom Row: Large Timer Box */}
             <div className={`bg-black rounded-xl py-1.5 px-4 text-center border border-zinc-800/50 ${isOvertime ? 'border-red-900/30 bg-red-950/10' : ''}`}>
                 <span className={`text-2xl font-mono font-bold tracking-tight tabular-nums leading-none ${isOvertime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                     {formatTime(timeLeft)}
                 </span>
             </div>
        </div>
    );
};
