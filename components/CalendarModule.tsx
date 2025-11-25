
import * as React from 'react';
import { Task, Routine, FocusSession, Habit, Project, Priority } from '../types';
import { ChevronLeft, ChevronRight, Clock, X, Calendar as CalIcon, ZoomIn, ZoomOut, PlayCircle, CheckCircle2, Focus, Layers, PanelLeft, LayoutGrid, ListTodo, Book, Briefcase } from 'lucide-react';

interface CalendarModuleProps {
  tasks: Task[];
  routines?: Routine[];
  habits?: Habit[]; 
  projects?: Project[];
  focusSessions?: FocusSession[];
  onUpdateTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onScheduleRoutine?: (templateId: string, startTime: number) => void; 
  onStartRoutine?: (id: string) => void;
  onUpdateRoutine?: (routine: Routine) => void;
  onScheduleHabit?: (habitId: string, startTime: number) => void; 
  onUnschedule?: (id: string, type: 'task' | 'routine') => void;
}

type CalendarView = 'month' | 'week' | 'day';
type CalendarMode = 'scheduled' | 'focus';

const FOCUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const CalendarModule: React.FC<CalendarModuleProps> = ({ 
    tasks, routines = [], habits = [], projects = [], focusSessions = [], onUpdateTask, onStartTask, onScheduleRoutine, onStartRoutine, onUpdateRoutine, onScheduleHabit, onUnschedule
}) => {
  const [view, setView] = React.useState<CalendarView>('week');
  const [mode, setMode] = React.useState<CalendarMode>('scheduled');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Zoom / Scaling State
  const [hourHeight, setHourHeight] = React.useState(60); 

  // Resizing State
  const [resizingTaskId, setResizingTaskId] = React.useState<string | null>(null);
  const resizeRef = React.useRef<{ startY: number; startDuration: number; taskId: string } | null>(null);
  
  const ignoreClickRef = React.useRef(false);

  // Real-time state
  const [now, setNow] = React.useState(new Date());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Derived Data
  const pendingTasks = React.useMemo(() => tasks.filter(t => !t.isCompleted && !t.deletedAt && !t.startTime), [tasks]);
  const recurringRoutines = React.useMemo(() => routines.filter(r => r.type === 'repeatable' && !r.deletedAt), [routines]);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
        const d = new Date();
        const minutes = d.getHours() * 60 + d.getMinutes();
        const pxPerMin = hourHeight / 60;
        scrollContainerRef.current.scrollTop = Math.max(0, (minutes - 60) * pxPerMin);
    }
  }, [view, hourHeight]); 

  // --- Resizing Logic ---
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!resizeRef.current) return;
        
        const { startY, startDuration, taskId } = resizeRef.current;
        const deltaY = e.clientY - startY;
        const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
        const snappedDelta = Math.round(deltaMinutes / 10) * 10;
        const newDuration = Math.max(10, startDuration + snappedDelta); 

        const task = tasks.find(t => t.id === taskId);
        if (task && task.duration !== newDuration) {
            onUpdateTask({ ...task, duration: newDuration });
        }
    };

    const handleMouseUp = () => {
        if (resizingTaskId) {
            setResizingTaskId(null);
            resizeRef.current = null;
            ignoreClickRef.current = true;
            setTimeout(() => {
                ignoreClickRef.current = false;
            }, 100);
        }
    };

    if (resizingTaskId) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTaskId, hourHeight, tasks, onUpdateTask]);

  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation(); 
    setResizingTaskId(task.id);
    resizeRef.current = {
        taskId: task.id,
        startY: e.clientY,
        startDuration: task.duration || 60
    };
  };

  // --- Helpers ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDaysToRender = () => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
        const start = getStartOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return [];
  };

  const getFocusSessionColor = (index: number) => {
      const colorIndex = (index * 7) % FOCUS_COLORS.length; 
      return FOCUS_COLORS[colorIndex];
  };

  const getPriorityColor = (priority?: Priority) => {
      switch (priority) {
          case 'High': return 'bg-red-500';
          case 'Medium': return 'bg-orange-500';
          case 'Low': return 'bg-blue-500';
          default: return 'bg-gray-300';
      }
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: 'task' | 'routine' | 'habit', origin: 'grid' | 'sidebar') => {
    if (resizingTaskId || mode === 'focus') {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('origin', origin);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnDay = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (mode === 'focus') return;

    const id = e.dataTransfer.getData('id');
    const type = e.dataTransfer.getData('type');
    const origin = e.dataTransfer.getData('origin');
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const pxPerMin = hourHeight / 60;
    const totalMinutes = offsetY / pxPerMin;
    const snappedMinutes = Math.round(totalMinutes / 10) * 10;
    const hour = Math.floor(snappedMinutes / 60);
    const minute = snappedMinutes % 60;

    const newStart = new Date(targetDate);
    newStart.setHours(hour, minute, 0, 0);

    if (type === 'task') {
        const task = tasks.find(t => t.id === id);
        if (task) onUpdateTask({ ...task, startTime: newStart.getTime() });
    } else if (type === 'routine') {
        if (origin === 'sidebar' && onScheduleRoutine) {
            onScheduleRoutine(id, newStart.getTime());
        } else if (origin === 'grid' && onUpdateRoutine) {
            const routine = routines.find(r => r.id === id);
            if (routine) onUpdateRoutine({ ...routine, startTime: newStart.getTime() });
        }
    } else if (type === 'habit') {
        if (onScheduleHabit) onScheduleHabit(id, newStart.getTime());
    }
  };

  const handleDropOnMonthCell = (e: React.DragEvent, targetDate: Date) => {
      e.preventDefault();
      if (mode === 'focus') return;
      
      const id = e.dataTransfer.getData('id');
      const type = e.dataTransfer.getData('type');
      const origin = e.dataTransfer.getData('origin');
      const newStart = new Date(targetDate);
      
      if (type === 'task') {
          const task = tasks.find(t => t.id === id);
          if (task) {
              if (task.startTime) {
                  const old = new Date(task.startTime);
                  newStart.setHours(old.getHours(), old.getMinutes());
              } else {
                  newStart.setHours(9, 0, 0, 0);
              }
              onUpdateTask({ ...task, startTime: newStart.getTime() });
          }
      } else if (type === 'routine') {
          if (origin === 'sidebar' && onScheduleRoutine) {
              newStart.setHours(9, 0, 0, 0);
              onScheduleRoutine(id, newStart.getTime());
          } else {
              const routine = routines.find(r => r.id === id);
              if (routine && onUpdateRoutine) {
                  if (routine.startTime) {
                      const old = new Date(routine.startTime);
                      newStart.setHours(old.getHours(), old.getMinutes());
                  } else {
                      newStart.setHours(9, 0, 0, 0);
                  }
                  onUpdateRoutine({ ...routine, startTime: newStart.getTime() });
              }
          }
      } else if (type === 'habit') {
          if (onScheduleHabit) {
              newStart.setHours(9, 0, 0, 0);
              onScheduleHabit(id, newStart.getTime());
          }
      }
  };

  const handleDropOnLibrary = (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('id');
      const type = e.dataTransfer.getData('type') as 'task' | 'routine' | 'habit';
      if (type === 'habit') return;
      if (onUnschedule) onUnschedule(id, type);
  };

  const handleBlockClick = (e: React.MouseEvent, item: Task | Routine, type: 'task' | 'routine') => {
      e.stopPropagation();
      if (mode === 'focus') return;
      if (ignoreClickRef.current || resizingTaskId) return;
      
      if (type === 'task') onStartTask(item as Task);
      if (type === 'routine' && onStartRoutine) onStartRoutine(item.id);
  };

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOfWeek = getStartOfWeek(firstDay);
    
    const days: Date[] = [];
    let d = new Date(startOfWeek);
    for(let i=0; i<42; i++) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    
    return (
        <div className="flex flex-col flex-1 h-full bg-white overflow-hidden">
             <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(h => (
                    <div key={h} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
                ))}
             </div>
             <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
                {days.map(day => {
                    const isSameMonth = day.getMonth() === month;
                    const isToday = isSameDay(day, now);
                    const dayTasks = tasks.filter(t => t.startTime && isSameDay(new Date(t.startTime), day));
                    const dayRoutines = routines.filter(r => r.startTime && isSameDay(new Date(r.startTime), day));
                    
                    return (
                        <div 
                            key={day.toISOString()}
                            className={`border-b border-r border-gray-100 p-1 relative flex flex-col gap-1 transition-colors ${!isSameMonth ? 'bg-gray-50/30 text-gray-300' : 'bg-white hover:bg-gray-50'}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnMonthCell(e, day)}
                        >
                            <div className="flex justify-center mb-1 shrink-0">
                                <span className={`text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-red-500 text-white' : ''}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 min-h-0">
                                {dayTasks.map(task => (
                                     <div 
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id, 'task', 'grid')}
                                        onClick={(e) => handleBlockClick(e, task, 'task')}
                                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                        style={{ borderLeftColor: task.color, borderLeftWidth: '3px' }}
                                     >
                                        {task.priority && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />}
                                        <span className="truncate">{task.title}</span>
                                     </div>
                                ))}
                                {dayRoutines.map(routine => (
                                    <div
                                        key={routine.id}
                                        draggable={!routine.completedAt}
                                        onDragStart={(e) => handleDragStart(e, routine.id, 'routine', 'grid')}
                                        onClick={(e) => handleBlockClick(e, routine, 'routine')}
                                        className="text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer bg-purple-50 border-purple-100 text-purple-700"
                                        style={{ backgroundColor: routine.id.startsWith('habit-') ? routine.color + '15' : undefined }}
                                    >
                                        {routine.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
    );
  };

  const renderTimeGrid = (days: Date[]) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const pxPerMin = hourHeight / 60;
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);
    const redLineTop = currentMinutes * pxPerMin;

    return (
      <div className="flex flex-col flex-1 min-h-0 bg-white relative">
        {/* Header (Days) - sticky top */}
        <div className="flex border-b border-gray-200 bg-white z-20 shrink-0 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="w-[50px] md:w-[60px] border-r border-gray-100 shrink-0 bg-gray-50/50"></div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map(day => {
                    const isToday = isSameDay(day, now);
                    return (
                        <div key={day.toISOString()} className="py-2 md:py-3 px-1 md:px-2 text-center border-r border-gray-100 last:border-0 bg-white group">
                            <div className={`text-[10px] md:text-[11px] font-bold uppercase mb-1 ${isToday ? 'text-red-500' : 'text-gray-500'}`}>
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className={`text-lg md:text-2xl font-light w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mx-auto rounded-full transition-all ${isToday ? 'bg-red-500 text-white shadow-md' : 'text-gray-900 group-hover:bg-gray-50'}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Scrollable Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
            {(isSameDay(now, days[0]) || days.length > 1) && (
                <div className="absolute left-0 right-0 z-40 pointer-events-none flex items-center" style={{ top: `${redLineTop}px` }}>
                    <div className="w-[50px] md:w-[60px] pr-2 flex justify-end">
                        <span className="text-[9px] md:text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                            {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5 ring-2 ring-white"></div>
                    <div className="h-[2px] bg-red-500 flex-1 shadow-[0_1px_2px_rgba(239,68,68,0.3)]"></div>
                </div>
            )}

            <div className="flex" style={{ height: `${24 * hourHeight}px` }}>
                <div className="w-[50px] md:w-[60px] border-r border-gray-100 bg-white shrink-0 select-none">
                    {hours.map(hour => (
                        <div key={hour} className="relative border-b border-transparent box-border" style={{ height: `${hourHeight}px` }}>
                            <span className="absolute -top-2.5 right-1 md:right-2 text-[10px] md:text-xs text-gray-400 font-medium">
                                {hour === 0 ? '' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                    <div className="absolute inset-0 z-0 pointer-events-none flex flex-col">
                        {hours.map(h => (
                            <div key={h} className="border-b border-gray-100 w-full box-border" style={{ height: `${hourHeight}px` }}>
                                {hourHeight > 80 && <div className="w-full border-b border-gray-50 border-dashed" style={{ height: `${hourHeight/2}px`}}></div>}
                            </div>
                        ))}
                    </div>

                    {days.map(day => (
                        <div 
                            key={day.toISOString()} 
                            className="relative border-r border-gray-100 last:border-0 z-10 h-full"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnDay(e, day)}
                        >
                            {mode === 'scheduled' && (
                                <>
                                    {tasks
                                        .filter(t => t.startTime && isSameDay(new Date(t.startTime!), day))
                                        .map(task => {
                                            const date = new Date(task.startTime!);
                                            const top = (date.getHours() * 60 + date.getMinutes()) * pxPerMin;
                                            const height = (task.duration || 60) * pxPerMin;
                                            const endTime = new Date(task.startTime! + (task.duration || 60) * 60000);
                                            const subtaskTotal = task.subtasks ? task.subtasks.length : 0;
                                            const subtaskDone = task.subtasks ? task.subtasks.filter(s => s.isCompleted).length : 0;
                                            const linkedProject = task.projectId ? projects.find(p => p.id === task.projectId) : null;

                                            return (
                                                <div
                                                    key={task.id}
                                                    draggable={resizingTaskId !== task.id}
                                                    onDragStart={(e) => handleDragStart(e, task.id, 'task', 'grid')}
                                                    onClick={(e) => handleBlockClick(e, task, 'task')}
                                                    className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md md:rounded-lg px-1 md:px-2 py-1 text-xs hover:scale-[1.01] active:scale-[0.99] shadow-sm transition-all z-20 overflow-hidden flex flex-col justify-start border border-black/5 group 
                                                        ${resizingTaskId === task.id ? 'cursor-ns-resize !scale-100 z-30 shadow-xl ring-2 ring-black/20' : 'cursor-pointer'}
                                                        ${task.isCompleted ? 'opacity-75 border-dashed saturate-75' : ''}
                                                    `}
                                                    style={{ 
                                                        top: `${top}px`, 
                                                        height: `${Math.max(height, hourHeight * 0.4)}px`,
                                                        backgroundColor: task.color || '#3b82f6',
                                                        color: '#ffffff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start gap-1 mb-0.5">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            {task.priority && <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)} ring-1 ring-white/20`} title={task.priority} />}
                                                            <div className={`font-bold truncate leading-tight text-[10px] md:text-[11px] ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</div>
                                                        </div>
                                                        {task.isCompleted && <CheckCircle2 size={10} className="shrink-0" />}
                                                    </div>
                                                    
                                                    {linkedProject && (
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate max-w-full font-medium">
                                                                <Briefcase size={8} /> {linkedProject.title}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="hidden md:flex items-center gap-1 font-mono text-[10px] opacity-90 mb-0.5">
                                                        {date.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                                                    </div>
                                                    {height > 35 && (
                                                        <div className="mt-auto flex justify-between items-end opacity-95 pb-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="hidden md:block px-1 py-0.5 rounded-[4px] text-[9px] uppercase font-bold tracking-wide bg-black/20 text-white">{task.category}</span>
                                                                {subtaskTotal > 0 && <div className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-black/10"><ListTodo size={8} /> <span className="hidden md:inline">{subtaskDone}/{subtaskTotal}</span></div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!task.isCompleted && <div onMouseDown={(e) => handleResizeStart(e, task)} onClick={(e) => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/10 to-transparent"><div className="w-8 h-1 bg-white/50 rounded-full"></div></div>}
                                                </div>
                                            );
                                        })
                                    }
                                    {routines
                                        .filter(r => r.startTime && isSameDay(new Date(r.startTime!), day))
                                        .map(routine => {
                                            const date = new Date(routine.startTime!);
                                            const durationMins = Math.ceil(routine.steps.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
                                            const top = (date.getHours() * 60 + date.getMinutes()) * pxPerMin;
                                            const height = durationMins * pxPerMin;
                                            const endTime = new Date(routine.startTime! + durationMins * 60000);
                                            const isHabit = routine.id.startsWith('habit-');
                                            const typeLabel = isHabit ? 'HABIT' : 'ROUTINE';

                                            return (
                                                <div
                                                    key={routine.id}
                                                    draggable={!routine.completedAt}
                                                    onDragStart={(e) => handleDragStart(e, routine.id, 'routine', 'grid')}
                                                    onClick={(e) => handleBlockClick(e, routine, 'routine')}
                                                    className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md md:rounded-lg px-1 md:px-2 py-1 text-xs hover:scale-[1.01] active:scale-[0.99] shadow-sm transition-all z-20 overflow-hidden flex flex-col justify-start border border-black/5 cursor-pointer
                                                        ${routine.completedAt ? 'opacity-75 border-dashed saturate-75' : 'hover:brightness-95'}
                                                    `}
                                                    style={{ 
                                                        top: `${top}px`, 
                                                        height: `${Math.max(height, hourHeight * 0.4)}px`,
                                                        backgroundColor: isHabit ? routine.color : '#7c3aed', 
                                                        color: '#ffffff',
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between mb-0.5 opacity-90 text-[10px]"><div className="font-bold truncate leading-tight text-[10px] md:text-[11px] flex-1">{routine.title}</div>{routine.completedAt && <CheckCircle2 size={10} className="shrink-0 ml-1" />}</div>
                                                    <div className="hidden md:flex items-center gap-1 font-mono text-[10px] opacity-90 mb-0.5"><PlayCircle size={10} className="shrink-0" />{date.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                                    {height > 35 && (
                                                        <div className="mt-auto pb-0.5">
                                                            <span className="px-1 py-0.5 rounded-[4px] text-[8px] uppercase font-bold tracking-wide bg-black/20 text-white">
                                                                {typeLabel}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                </>
                            )}
                            
                            {mode === 'focus' && (
                                <>
                                    {focusSessions
                                        .filter(session => isSameDay(new Date(session.startTime), day))
                                        .map((session, index) => {
                                            const date = new Date(session.startTime);
                                            const durationMins = Math.max(10, session.durationSeconds / 60);
                                            const top = (date.getHours() * 60 + date.getMinutes()) * pxPerMin;
                                            const height = durationMins * pxPerMin;
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="absolute left-1 right-1 rounded-lg px-2 py-1.5 text-xs shadow-sm transition-all z-20 overflow-hidden flex flex-col justify-start border border-black/5 pointer-events-none"
                                                    style={{ top: `${top}px`, height: `${Math.max(height, hourHeight * 0.4)}px`, backgroundColor: getFocusSessionColor(index), color: '#ffffff' }}
                                                >
                                                    <div className="flex items-start justify-between mb-0.5 opacity-90 text-[10px]"><div className="font-bold truncate leading-tight text-[11px] flex-1">{session.routineTitle}</div></div>
                                                </div>
                                            );
                                        })
                                    }
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      {/* Refactored Header */}
      <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 bg-white z-20 gap-4 flex-shrink-0">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="flex bg-gray-100 rounded-lg p-1">
                  <button onClick={() => navigate('prev')} className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-black transition-colors shadow-sm hover:shadow"><ChevronLeft size={16} /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold text-gray-700 hover:text-black uppercase tracking-wider">Today</button>
                  <button onClick={() => navigate('next')} className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-black transition-colors shadow-sm hover:shadow"><ChevronRight size={16} /></button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h2>
          </div>

          {/* Center: Mode Pill */}
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
              <button 
                  onClick={() => setMode('scheduled')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'scheduled' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                  <LayoutGrid size={16} /> Plan
              </button>
              <button 
                  onClick={() => setMode('focus')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'focus' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                  <Focus size={16} /> Focus
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
              <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSidebarOpen ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnLibrary}
              >
                  <PanelLeft size={16} /> Library
              </button>
          </div>

          {/* Right: Zoom & View */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {view !== 'month' && (
                  <div className="flex items-center gap-1 text-gray-400">
                      <button onClick={() => setHourHeight(Math.max(40, hourHeight - 10))} className="p-2 hover:bg-gray-100 rounded-full hover:text-black transition-colors"><ZoomOut size={18}/></button>
                      <button onClick={() => setHourHeight(Math.min(150, hourHeight + 10))} className="p-2 hover:bg-gray-100 rounded-full hover:text-black transition-colors"><ZoomIn size={18}/></button>
                  </div>
              )}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['day', 'week', 'month'] as CalendarView[]).map(v => (
                      <button 
                          key={v} 
                          onClick={() => setView(v)}
                          className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${view === v ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                          {v}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
          {/* Sidebar Library - Refactored to relative flex item with transition */}
          <div 
              className={`border-r border-gray-200 bg-white flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isSidebarOpen ? 'w-72 opacity-100' : 'w-0 border-r-0 opacity-0'}`}
          >
               {/* Fixed width container to prevent squishing content during transition */}
               <div className="w-72 flex flex-col h-full">
                   <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                       <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Book size={16} /> Library</h3>
                       <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-200 transition-colors"><X size={16}/></button>
                   </div>
                   
                   {/* Drop Zone for Unscheduling */}
                   <div 
                       className="p-6 m-4 border-2 border-dashed border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-100 hover:border-red-300 group cursor-default"
                       onDragOver={handleDragOver}
                       onDrop={handleDropOnLibrary}
                   >
                       <div className="bg-white p-2 rounded-full shadow-sm text-red-200 group-hover:text-red-500 transition-colors"><X size={20} /></div>
                       <span>Drag here to Unschedule</span>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                       <div>
                           <div className="flex justify-between items-center mb-2 px-1">
                               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks</h4>
                               <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{pendingTasks.length}</span>
                           </div>
                           <div className="space-y-2">
                               {pendingTasks.map(task => (
                                   <div 
                                       key={task.id}
                                       draggable
                                       onDragStart={(e) => handleDragStart(e, task.id, 'task', 'sidebar')}
                                       className="bg-white border border-gray-200 p-3 rounded-xl text-sm shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing border-l-4 group hover:border-gray-300 transition-all"
                                       style={{ borderLeftColor: task.color || '#e5e7eb' }}
                                   >
                                       <div className="font-bold text-gray-800 truncate">{task.title}</div>
                                       <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium">
                                           <span className="flex items-center gap-1"><Clock size={12} /> {task.duration || 30}m</span>
                                           {task.priority && <span className="uppercase text-[9px] bg-gray-100 px-1.5 py-0.5 rounded">{task.priority}</span>}
                                       </div>
                                   </div>
                               ))}
                               {pendingTasks.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">No pending tasks.</p>}
                           </div>
                       </div>

                       <div>
                           <div className="flex justify-between items-center mb-2 px-1">
                               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Routines</h4>
                               <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{recurringRoutines.length}</span>
                           </div>
                           <div className="space-y-2">
                               {recurringRoutines.map(routine => (
                                   <div 
                                       key={routine.id}
                                       draggable
                                       onDragStart={(e) => handleDragStart(e, routine.id, 'routine', 'sidebar')}
                                       className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-sm shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all"
                                   >
                                       <div className="font-bold text-purple-900 truncate">{routine.title}</div>
                                       <div className="flex items-center gap-2 mt-2 text-xs text-purple-500 font-medium">
                                           <Layers size={12} /> {routine.steps.length} Steps
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       <div>
                           <div className="flex justify-between items-center mb-2 px-1">
                               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habits</h4>
                               <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{habits.length}</span>
                           </div>
                           <div className="space-y-2">
                               {habits.map(habit => (
                                   <div 
                                       key={habit.id}
                                       draggable
                                       onDragStart={(e) => handleDragStart(e, habit.id, 'habit', 'sidebar')}
                                       className="bg-white border border-gray-200 p-3 rounded-xl text-sm shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing flex items-center gap-3 hover:border-gray-300 transition-all"
                                   >
                                       <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: habit.color }}></div>
                                       <span className="truncate font-medium text-gray-700">{habit.title}</span>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               </div>
          </div>
          
          {/* Main Calendar Grid - Flex 1 ensures it takes remaining space and resizes */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {view === 'month' ? renderMonthGrid() : renderTimeGrid(getDaysToRender())}
          </div>
      </div>
    </div>
  );
};
