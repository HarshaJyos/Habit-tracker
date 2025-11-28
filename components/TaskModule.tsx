import * as React from 'react';
import { Task, Priority, Subtask, Dump, Project, RecurrenceConfig, Reminder } from '../types';
import { Plus, Trash2, Check, Play, ChevronDown, ChevronRight, CheckSquare, Calendar, Clock, Filter, List, AlignLeft, X, Save, MoreHorizontal, Palette, Archive, RefreshCcw, Briefcase, ArrowDownAZ, ArrowUpNarrowWide, Bell, Repeat, CalendarClock } from 'lucide-react';

interface TaskModuleProps {
  tasks: Task[];
  projects?: Project[]; 
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStartTask?: (task: Task) => void;
  onToggleTask?: (id: string) => void;
  convertingDump?: Dump | null;
  onClearConvertingDump?: () => void;
  onArchiveTask: (id: string) => void;
  onUnarchiveTask: (id: string) => void;
  autoTrigger?: boolean; 
  onAutoTriggerHandled?: () => void; 
}

type DurationFilter = 'all' | '15' | '30' | '60+';
type TimeFilter = 'today' | '7days' | '14days' | '30days' | 'month' | 'year' | 'all';
type SortOption = 'createdAt' | 'title' | 'startTime';

const TASK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#111827',
];

export const TaskModule: React.FC<TaskModuleProps> = ({ 
    tasks, projects = [], onAddTask, onUpdateTask, onDeleteTask, onStartTask, onToggleTask, convertingDump, onClearConvertingDump, onArchiveTask, onUnarchiveTask,
    autoTrigger, onAutoTriggerHandled
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);

  // Form State
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<Priority>('Medium');
  const [category, setCategory] = React.useState('Personal');
  const [duration, setDuration] = React.useState('30');
  const [projectId, setProjectId] = React.useState<string>(''); 
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(TASK_COLORS[5]);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [scheduledTime, setScheduledTime] = React.useState('');

  // Recurrence State
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurrenceType, setRecurrenceType] = React.useState<'daily' | 'weekly' | 'monthly' | 'specific_days'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceInstances, setRecurrenceInstances] = React.useState(5);
  const [recurrenceDays, setRecurrenceDays] = React.useState<number[]>([]); // 0-6

  // Reminder State
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [newReminderOffset, setNewReminderOffset] = React.useState(15);

  // UI State
  const [isCompletedExpanded, setIsCompletedExpanded] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);
  const [durationFilter, setDurationFilter] = React.useState<DurationFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('createdAt');
  const [dragOverColumn, setDragOverColumn] = React.useState<Priority | null>(null);
  const [completedTimeFilter, setCompletedTimeFilter] = React.useState<TimeFilter>('today');
  
  const activeTasks = tasks.filter(t => !t.deletedAt && !t.archivedAt);
  const archivedTasks = tasks.filter(t => !t.deletedAt && t.archivedAt);
  const visibleTasks = showArchived ? archivedTasks : activeTasks;
  const availableProjects = projects.filter(p => !p.deletedAt && !p.archivedAt);

  React.useEffect(() => {
    if (convertingDump) {
      setTitle(convertingDump.title);
      setDescription(convertingDump.description);
      setEditingTaskId(null);
      setPriority('Medium');
      setCategory('Personal');
      setDuration('30');
      setProjectId('');
      setSubtasks([]);
      setSelectedColor(TASK_COLORS[5]);
      setScheduledDate('');
      setScheduledTime('');
      setIsModalOpen(true);
    }
  }, [convertingDump]);

  React.useEffect(() => {
      if (autoTrigger) {
          openModal();
          if (onAutoTriggerHandled) onAutoTriggerHandled();
      }
  }, [autoTrigger, onAutoTriggerHandled]);

  const openModal = (task?: Task, targetPriority?: Priority) => {
      if (task) {
          setEditingTaskId(task.id);
          setTitle(task.title);
          setDescription(task.description || '');
          setPriority(task.priority);
          setCategory(task.category);
          setDuration(task.duration?.toString() || '30');
          setProjectId(task.projectId || '');
          setSubtasks(task.subtasks || []);
          setSelectedColor(task.color || TASK_COLORS[5]);
          if (task.startTime) {
              const d = new Date(task.startTime);
              setScheduledDate(d.toISOString().split('T')[0]);
              setScheduledTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
          } else {
              setScheduledDate('');
              setScheduledTime('');
          }
          if (task.recurrence) {
              setIsRecurring(true);
              setRecurrenceType(task.recurrence.type);
              setRecurrenceInterval(task.recurrence.interval);
              setRecurrenceInstances(task.recurrence.instancesToGenerate || 5);
              setRecurrenceDays(task.recurrence.daysOfWeek || []);
          } else {
              setIsRecurring(false);
          }
          setReminders(task.reminders || []);
      } else {
          setEditingTaskId(null);
          resetForm();
          if (targetPriority) setPriority(targetPriority);
          setSelectedColor(TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]);
      }
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      resetForm();
      if (onClearConvertingDump) onClearConvertingDump();
  };

  const resetForm = () => {
      setTitle(''); setDescription(''); setPriority('Medium'); setCategory('Personal');
      setDuration('30'); setSubtasks([]); setSubtaskInput(''); setShowColorPicker(false);
      setProjectId(''); setScheduledDate(''); setScheduledTime('');
      setIsRecurring(false); setRecurrenceType('daily'); setRecurrenceInterval(1); setRecurrenceInstances(5); setRecurrenceDays([]);
      setReminders([]);
  };

  const handleSave = () => {
      if (!title.trim()) return;
      
      let startTime: number | undefined = undefined;
      if (scheduledDate) {
          const d = new Date(scheduledDate);
          if (scheduledTime) {
              const [h, m] = scheduledTime.split(':').map(Number);
              d.setHours(h, m);
          } else {
              d.setHours(9, 0); // Default 9 AM
          }
          startTime = d.getTime();
      }

      const recurrence: RecurrenceConfig | undefined = isRecurring ? {
          type: recurrenceType,
          interval: recurrenceInterval,
          daysOfWeek: recurrenceType === 'specific_days' ? recurrenceDays : undefined,
          instancesToGenerate: recurrenceInstances
      } : undefined;

      const taskData: Partial<Task> = {
          title, description, priority, category,
          duration: parseInt(duration) || 30,
          projectId: projectId || undefined,
          subtasks, color: selectedColor,
          startTime,
          recurrence,
          reminders
      };

      if (editingTaskId) {
          const existing = tasks.find(t => t.id === editingTaskId);
          if (existing) onUpdateTask({ ...existing, ...taskData });
      } else {
          const newTask: Task = {
              id: Date.now().toString(), isCompleted: false, createdAt: Date.now(),
              color: selectedColor, title, priority, category, description,
              duration: parseInt(duration) || 30, subtasks, projectId: projectId || undefined,
              startTime, recurrence, reminders
          };
          onAddTask(newTask);
      }
      setIsModalOpen(false); resetForm();
  };

  const addSubtask = () => {
      if (!subtaskInput.trim()) return;
      setSubtasks([...subtasks, { id: Date.now().toString() + Math.random(), title: subtaskInput, isCompleted: false }]);
      setSubtaskInput('');
  };

  const removeSubtask = (id: string) => setSubtasks(subtasks.filter(s => s.id !== id));
  const toggleSubtask = (id: string) => setSubtasks(subtasks.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  const handleToggle = (id: string) => onToggleTask && onToggleTask(id);

  const handleDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('taskId', id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent, priority: Priority) => { e.preventDefault(); setDragOverColumn(priority); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e: React.DragEvent, priority: Priority) => {
      e.preventDefault(); setDragOverColumn(null);
      const id = e.dataTransfer.getData('taskId');
      const task = tasks.find(t => t.id === id);
      if(task) onUpdateTask({ ...task, priority: priority });
  };
  
  const addReminder = () => {
      const newRem: Reminder = { id: Date.now().toString(), timeOffset: newReminderOffset, type: 'notification' };
      setReminders([...reminders, newRem]);
  };
  const removeReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));

  const filteredActiveTasks = React.useMemo(() => {
      let filtered = visibleTasks.filter(t => !t.isCompleted);
      if (durationFilter === '15') filtered = filtered.filter(t => (t.duration || 30) <= 15);
      else if (durationFilter === '30') filtered = filtered.filter(t => (t.duration || 30) <= 30);
      else if (durationFilter === '60+') filtered = filtered.filter(t => (t.duration || 30) > 60);
      return filtered.sort((a, b) => {
          if (sortBy === 'title') return a.title.localeCompare(b.title);
          if (sortBy === 'startTime') {
              if (!a.startTime && !b.startTime) return 0;
              if (!a.startTime) return 1;
              if (!b.startTime) return -1;
              return a.startTime - b.startTime;
          }
          return b.createdAt - a.createdAt;
      });
  }, [visibleTasks, durationFilter, sortBy]);

  const highTasks = filteredActiveTasks.filter(t => t.priority === 'High');
  const mediumTasks = filteredActiveTasks.filter(t => t.priority === 'Medium');
  const lowTasks = filteredActiveTasks.filter(t => t.priority === 'Low');
  
  const allCompletedTasks = visibleTasks.filter(t => t.isCompleted);
  const filteredCompletedTasks = React.useMemo(() => {
    let filtered = allCompletedTasks;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (completedTimeFilter === 'today') filtered = filtered.filter(t => (t.completedAt || t.createdAt) >= todayStart);
    else if (completedTimeFilter === '7days') filtered = filtered.filter(t => (t.completedAt || t.createdAt) >= todayStart - (7*86400000));
    // Sort by recent and slice to 30
    return filtered.sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt)).slice(0, 30);
  }, [allCompletedTasks, completedTimeFilter]);

  const getCategoryColor = (cat: string) => {
    switch(cat.toLowerCase()) {
        case 'work': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'personal': return 'bg-green-100 text-green-700 border-green-200';
        case 'chores': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'health': return 'bg-red-100 text-red-700 border-red-200';
        case 'errands': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDurationText = (mins: number) => {
      const h = Math.floor(mins / 60); const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h ${m}m`; if (h > 0) return `${h}h`; return `${m}m`;
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div 
        draggable={!task.isCompleted}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => openModal(task)}
        className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all relative cursor-pointer hover:border-black/20"
        style={{ borderLeftWidth: '4px', borderLeftColor: task.color || 'transparent' }}
    >
        <div className="flex items-start gap-3">
            <button onClick={(e) => { e.stopPropagation(); handleToggle(task.id); }} className="mt-1 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                <div className="w-5 h-5 border-2 border-current rounded-md hover:bg-gray-50 flex items-center justify-center transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 leading-snug">{task.title}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${getCategoryColor(task.category)}`}>{task.category}</span>
                    {task.projectId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Briefcase size={10} /> {projects.find(p => p.id === task.projectId)?.title || 'Project'}
                        </span>
                    )}
                    {task.recurrence && <Repeat size={10} className="text-gray-400" />}
                    {task.reminders && task.reminders.length > 0 && <Bell size={10} className="text-gray-400" />}
                    {task.description && <AlignLeft size={12} className="text-gray-400" />}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                            <List size={10} /> {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs mt-2">
                     <Clock size={12} className="shrink-0" />
                     <span>{formatDurationText(task.duration || 30)}</span>
                     {task.startTime && (
                         <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <Calendar size={12} className="shrink-0 ml-1" />
                            <span>{new Date(task.startTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                         </>
                     )}
                </div>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white pl-2">
                {!showArchived ? (
                    <button onClick={(e) => { e.stopPropagation(); onArchiveTask(task.id); }} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors" title="Archive">
                        <Archive size={14} />
                    </button>
                ) : (
                    <button onClick={(e) => { e.stopPropagation(); onUnarchiveTask(task.id); }} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors" title="Restore">
                        <RefreshCcw size={14} />
                    </button>
                )}
                {onStartTask && (
                    <button onClick={(e) => { e.stopPropagation(); onStartTask(task); }} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors" title="Focus">
                        <Play size={14} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );

  const Column = ({ title, count, tasks, priority }: { title: string, count: number, tasks: Task[], priority: Priority }) => (
      <div 
        className={`flex flex-col h-full rounded-2xl transition-colors min-w-[300px] flex-1 ${dragOverColumn === priority ? 'bg-gray-50 ring-2 ring-black/5 ring-dashed' : 'bg-gray-50/50'}`}
        onDragOver={(e) => handleDragOver(e, priority)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, priority)}
      >
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-white/50 rounded-t-2xl backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${priority === 'High' ? 'bg-red-500' : priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex-1 text-left">{title}</h3>
                  <span className="text-xs text-gray-400 font-mono bg-white px-2 py-0.5 rounded-full border border-gray-100">{count}</span>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {tasks.map(t => <TaskCard key={t.id} task={t} />)}
              <button onClick={() => openModal(undefined, priority)} className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus size={16} /> Add Task
              </button>
          </div>
      </div>
  );

  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white z-20">
        <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto no-scrollbar">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h2>
            {showArchived && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Archived</span>}
             <div className="h-4 w-px bg-gray-200 mx-2 hidden md:block"></div>
             <div className="flex items-center gap-2">
                {['all', '15', '30', '60+'].map((opt) => (
                    <button key={opt} onClick={() => setDurationFilter(opt as DurationFilter)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${durationFilter === opt ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {opt === 'all' ? 'All' : opt === '60+' ? '> 1h' : `< ${opt}m`}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => setShowArchived(!showArchived)} className={`p-2 rounded-full transition-all ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`} title={showArchived ? "View Active" : "View Archive"}><Archive size={20} /></button>
            <button onClick={() => openModal()} className="bg-black hover:bg-gray-800 text-white px-3 md:px-5 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-gray-200 text-sm">
                <Plus size={16} /> <span className="hidden md:inline">New Task</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {showArchived ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-full">
                  {archivedTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  {archivedTasks.length === 0 && <p className="col-span-full text-center text-gray-400 py-12">No archived tasks.</p>}
              </div>
          ) : (
            <div className="h-full flex flex-col md:flex-row min-w-full p-4 gap-4">
                <Column title="High Priority" priority="High" count={highTasks.length} tasks={highTasks} />
                <Column title="Medium Priority" priority="Medium" count={mediumTasks.length} tasks={mediumTasks} />
                <Column title="Low Priority" priority="Low" count={lowTasks.length} tasks={lowTasks} />
            </div>
          )}
      </div>

      {/* Completed Section Footer */}
      {!showArchived && (
          <div className={`border-t border-gray-200 bg-white transition-all duration-300 ease-in-out flex flex-col ${isCompletedExpanded ? 'h-64' : 'h-12'}`}>
              <div className="px-6 h-12 flex items-center justify-between cursor-pointer hover:bg-gray-50 shrink-0" onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                      {isCompletedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span>Completed History (Last 30)</span>
                      <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs font-mono">{filteredCompletedTasks.length}</span>
                  </div>
              </div>
              {isCompletedExpanded && (
                  <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-70">
                          {filteredCompletedTasks.map(task => (
                            <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 group hover:border-gray-300 hover:opacity-100 transition-all">
                                <button onClick={() => handleToggle(task.id)} className="text-gray-400 hover:text-black"><CheckSquare size={20} /></button>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-500 line-through block truncate font-medium group-hover:text-gray-800">{task.title}</span>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400 bg-white px-1.5 rounded border border-gray-200 uppercase">{task.category}</span>
                                        {task.completedAt && <span className="text-[10px] text-gray-400">{new Date(task.completedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Modal */}
      {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors"><X size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="flex items-center gap-4">
                             <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title..." className="flex-1 text-2xl font-bold placeholder-gray-300 border-none p-0 focus:ring-0 focus:outline-none text-gray-900 bg-transparent" autoFocus />
                             <div className="relative">
                                <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform ring-2 ring-gray-100" style={{ backgroundColor: selectedColor }} />
                                {showColorPicker && (
                                    <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-100 grid grid-cols-5 gap-2 z-50 w-40">
                                        {TASK_COLORS.map(color => (
                                            <button key={color} onClick={() => { setSelectedColor(color); setShowColorPicker(false); }} className={`w-6 h-6 rounded-full hover:scale-110 transition-transform ${selectedColor === color ? 'ring-2 ring-black ring-offset-1' : ''}`} style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Recurrence & Scheduling */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                             <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Schedule</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-black" />
                                        <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-24 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-black" />
                                    </div>
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Repeat size={12}/> Repeat</label>
                                    <button onClick={() => setIsRecurring(!isRecurring)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isRecurring ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                                        {isRecurring ? 'Repeating' : 'Does not repeat'}
                                    </button>
                                </div>
                             </div>

                             {isRecurring && (
                                 <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                                     <div className="flex gap-3">
                                         <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as any)} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium">
                                             <option value="daily">Daily</option>
                                             <option value="weekly">Weekly</option>
                                             <option value="monthly">Monthly</option>
                                             <option value="specific_days">Specific Days</option>
                                         </select>
                                         {recurrenceType === 'specific_days' ? (
                                             <div className="flex flex-1 gap-1">
                                                 {['S','M','T','W','T','F','S'].map((d, i) => (
                                                     <button key={i} onClick={() => setRecurrenceDays(prev => prev.includes(i) ? prev.filter(x => x!==i) : [...prev, i])} className={`w-8 h-8 rounded text-xs font-bold ${recurrenceDays.includes(i) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>{d}</button>
                                                 ))}
                                             </div>
                                         ) : (
                                             <div className="flex items-center gap-2">
                                                 <span className="text-sm text-gray-500">Every</span>
                                                 <input type="number" min="1" value={recurrenceInterval} onChange={e => setRecurrenceInterval(parseInt(e.target.value) || 1)} className="w-12 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-center" />
                                                 <span className="text-sm text-gray-500">{recurrenceType === 'daily' ? 'days' : recurrenceType === 'weekly' ? 'weeks' : 'months'}</span>
                                             </div>
                                         )}
                                     </div>
                                     <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                         <span className="text-xs font-bold text-gray-500">Generate</span>
                                         <input type="number" min="1" max="10" value={recurrenceInstances} onChange={e => setRecurrenceInstances(parseInt(e.target.value)||1)} className="w-12 bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs text-center font-bold" />
                                         <span className="text-xs text-gray-500">instances upfront (Max 10)</span>
                                     </div>
                                 </div>
                             )}

                             {/* Reminders Section */}
                             <div>
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
                                             <option value={1440}>1 day before</option>
                                         </select>
                                         <button onClick={addReminder} className="px-3 py-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-sm font-bold transition-colors">Add</button>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {availableProjects.length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Briefcase size={12}/> Linked Project</label>
                                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-indigo-500 text-indigo-900">
                                    <option value="">No Project Linked</option>
                                    {availableProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-black">
                                    <option>Personal</option><option>Work</option><option>Chores</option><option>Errands</option><option>Health</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Duration</label>
                                <div className="relative">
                                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-black" />
                                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">MIN</span>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Priority</label>
                                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                    {(['High', 'Medium', 'Low'] as Priority[]).map(p => (
                                        <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all ${priority === p ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Description</label>
                             <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add notes, context, or links..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-black min-h-[100px] resize-none focus:bg-white transition-colors" />
                        </div>

                        <div>
                             <div className="flex justify-between items-center mb-2">
                                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtasks</label>
                                 <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">{subtasks.filter(s => s.isCompleted).length}/{subtasks.length}</span>
                             </div>
                             <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                 {subtasks.length > 0 && (
                                     <div className="divide-y divide-gray-100">
                                         {subtasks.map(sub => (
                                             <div key={sub.id} className="flex items-center gap-3 p-3 group bg-white hover:bg-gray-50 transition-colors">
                                                 <button onClick={() => toggleSubtask(sub.id)} className={sub.isCompleted ? 'text-gray-300' : 'text-gray-400 hover:text-black'}>{sub.isCompleted ? <CheckSquare size={16} /> : <div className="w-4 h-4 border border-gray-300 rounded hover:border-black" />}</button>
                                                 <input value={sub.title} onChange={(e) => setSubtasks(subtasks.map(s => s.id === sub.id ? { ...s, title: e.target.value } : s))} className={`flex-1 bg-transparent text-sm focus:outline-none ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`} />
                                                 <button onClick={() => removeSubtask(sub.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                                 <div className="flex items-center gap-2 p-3 bg-gray-50/50">
                                     <Plus size={16} className="text-gray-400" />
                                     <input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()} placeholder="Add a subtask..." className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400" />
                                     <button onClick={addSubtask} disabled={!subtaskInput.trim()} className="text-xs font-bold text-black disabled:text-gray-300 hover:bg-gray-200 px-2 py-1 rounded transition-colors">ADD</button>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-gray-200"><Save size={16} /> Save Task</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
