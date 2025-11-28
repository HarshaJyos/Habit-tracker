import * as React from "react";
import {
  Task,
  Priority,
  Subtask,
  Dump,
  Project,
  RecurrenceConfig,
  Reminder,
} from "../types";
import {
  Plus,
  Trash2,
  Play,
  CheckSquare,
  Calendar,
  Clock,
  List,
  X,
  Palette,
  Archive,
  Briefcase,
  CalendarClock,
  Search,
  ListTodo,
  ArrowUpAZ,
  ArrowDown01,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

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
  onConvertComplete?: () => void;
  onArchiveTask: (id: string) => void;
  onUnarchiveTask: (id: string) => void;
  autoTrigger?: boolean;
  onAutoTriggerHandled?: () => void;
}

type GroupingMode = "date" | "priority" | "project";
type SortMode = "time" | "priority" | "alpha";
type ViewMode = "list" | "board";

const TASK_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#111827",
];

export const TaskModule: React.FC<TaskModuleProps> = ({
  tasks,
  projects = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStartTask,
  onToggleTask,
  convertingDump,
  onClearConvertingDump,
  onConvertComplete,
  onArchiveTask,
  onUnarchiveTask,
  autoTrigger,
  onAutoTriggerHandled,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);

  // View State
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [grouping, setGrouping] = React.useState<GroupingMode>("date");
  const [sortBy, setSortBy] = React.useState<SortMode>("time");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({});

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("Medium");
  const [category, setCategory] = React.useState("Personal");
  const [duration, setDuration] = React.useState("30");
  const [projectId, setProjectId] = React.useState<string>("");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState(TASK_COLORS[5]);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [scheduledTime, setScheduledTime] = React.useState("");

  // Recurrence State
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurrenceType, setRecurrenceType] = React.useState<
    "daily" | "weekly" | "monthly" | "specific_days"
  >("daily");
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceInstances, setRecurrenceInstances] = React.useState(5);
  const [recurrenceDays, setRecurrenceDays] = React.useState<number[]>([]);

  // Reminder State
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [newReminderOffset, setNewReminderOffset] = React.useState(15);

  // Filter Tasks
  const activeTasks = tasks.filter((t) => !t.deletedAt && !t.archivedAt);
  const archivedTasks = tasks.filter((t) => !t.deletedAt && t.archivedAt);

  let visibleTasks: Task[] = [];
  if (showArchived) {
    visibleTasks = archivedTasks;
  } else if (showCompleted) {
    visibleTasks = activeTasks.filter((t) => t.isCompleted);
  } else {
    visibleTasks = activeTasks.filter((t) => !t.isCompleted);
  }

  const availableProjects = projects.filter(
    (p) => !p.deletedAt && !p.archivedAt
  );

  // --- Initialization Effects ---
  React.useEffect(() => {
    if (convertingDump) {
      setTitle(convertingDump.title);
      setDescription(convertingDump.description);
      setEditingTaskId(null);
      setPriority("Medium");
      setCategory("Personal");
      setDuration("30");
      setProjectId("");
      setSubtasks([]);
      setSelectedColor(TASK_COLORS[5]);
      setScheduledDate("");
      setScheduledTime("");
      setIsModalOpen(true);
    }
  }, [convertingDump]);

  React.useEffect(() => {
    if (autoTrigger) {
      openModal();
      if (onAutoTriggerHandled) onAutoTriggerHandled();
    }
  }, [autoTrigger, onAutoTriggerHandled]);

  // --- Form Handlers ---
  const openModal = (task?: Task, defaultDate?: string) => {
    if (task) {
      setEditingTaskId(task.id);
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setCategory(task.category);
      setDuration(task.duration?.toString() || "30");
      setProjectId(task.projectId || "");
      setSubtasks(task.subtasks || []);
      setSelectedColor(task.color || TASK_COLORS[5]);
      if (task.startTime) {
        const d = new Date(task.startTime);
        setScheduledDate(d.toISOString().split("T")[0]);
        setScheduledTime(
          d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        );
      } else {
        setScheduledDate("");
        setScheduledTime("");
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
      if (defaultDate) setScheduledDate(defaultDate);
      setSelectedColor(
        TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]
      );
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    if (onClearConvertingDump) onClearConvertingDump();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setCategory("Personal");
    setDuration("30");
    setSubtasks([]);
    setSubtaskInput("");
    setShowColorPicker(false);
    setProjectId("");
    setScheduledDate("");
    setScheduledTime("");
    setIsRecurring(false);
    setRecurrenceType("daily");
    setRecurrenceInterval(1);
    setRecurrenceInstances(5);
    setRecurrenceDays([]);
    setReminders([]);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    let startTime: number | undefined = undefined;
    if (scheduledDate) {
      const d = new Date(scheduledDate);
      if (scheduledTime) {
        const [h, m] = scheduledTime.split(":").map(Number);
        d.setHours(h, m);
      } else {
        d.setHours(9, 0);
      }
      startTime = d.getTime();
    }

    const recurrence: RecurrenceConfig | undefined = isRecurring
      ? {
          type: recurrenceType,
          interval: recurrenceInterval,
          daysOfWeek:
            recurrenceType === "specific_days" ? recurrenceDays : undefined,
          instancesToGenerate: recurrenceInstances,
        }
      : undefined;

    const taskData: Partial<Task> = {
      title,
      description,
      priority,
      category,
      duration: parseInt(duration) || 30,
      projectId: projectId || undefined,
      subtasks,
      color: selectedColor,
      startTime,
      recurrence,
      reminders,
    };

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) onUpdateTask({ ...existing, ...taskData });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        isCompleted: false,
        createdAt: Date.now(),
        color: selectedColor,
        title,
        priority,
        category,
        description,
        duration: parseInt(duration) || 30,
        subtasks,
        projectId: projectId || undefined,
        startTime,
        recurrence,
        reminders,
      };
      onAddTask(newTask);
    }

    // Auto-delete brain dump after conversion
    if (convertingDump && onConvertComplete) {
      onConvertComplete();
    }

    setIsModalOpen(false);
    resetForm();
  };

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: Date.now().toString() + Math.random(),
        title: subtaskInput,
        isCompleted: false,
      },
    ]);
    setSubtaskInput("");
  };

  const toggleSubtask = (id: string) =>
    setSubtasks(
      subtasks.map((s) =>
        s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
      )
    );
  const removeSubtask = (id: string) =>
    setSubtasks(subtasks.filter((s) => s.id !== id));
  const addReminder = () =>
    setReminders([
      ...reminders,
      {
        id: Date.now().toString(),
        timeOffset: newReminderOffset,
        type: "notification",
      },
    ]);
  const removeReminder = (id: string) =>
    setReminders(reminders.filter((r) => r.id !== id));

  // --- Grouping Logic ---

  const getTaskDateCategory = (timestamp?: number) => {
    if (!timestamp) return "no_date";
    const date = new Date(timestamp);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const nextWeekStart = new Date(todayStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const tDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (tDate < todayStart) return "overdue";
    if (tDate.getTime() === todayStart.getTime()) return "today";
    if (tDate.getTime() === tomorrowStart.getTime()) return "tomorrow";
    if (tDate < nextWeekStart) return "upcoming";
    return "later";
  };

  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const filtered = visibleTasks.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initialize groups
    if (grouping === "date") {
      groups["overdue"] = [];
      groups["today"] = [];
      groups["tomorrow"] = [];
      groups["upcoming"] = [];
      groups["later"] = [];
      groups["no_date"] = [];
    } else if (grouping === "priority") {
      groups["High"] = [];
      groups["Medium"] = [];
      groups["Low"] = [];
    } else if (grouping === "project") {
      projects.forEach((p) => (groups[p.id] = []));
      groups["no_project"] = [];
    }

    // Distribute
    filtered.forEach((task) => {
      let key = "";
      if (grouping === "date") key = getTaskDateCategory(task.startTime);
      else if (grouping === "priority") key = task.priority;
      else if (grouping === "project") key = task.projectId || "no_project";

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    // Sort within groups
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (sortBy === "priority") {
          const pMap = { High: 3, Medium: 2, Low: 1 };
          return pMap[b.priority] - pMap[a.priority];
        } else if (sortBy === "time") {
          return (
            (a.startTime || 9999999999999) - (b.startTime || 9999999999999)
          );
        } else {
          return a.title.localeCompare(b.title);
        }
      });
    });

    return groups;
  }, [visibleTasks, searchQuery, grouping, sortBy, projects]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getGroupTitle = (key: string) => {
    switch (key) {
      case "overdue":
        return showCompleted ? "Past Due" : "Overdue Tasks";
      case "today":
        return "Due Today";
      case "tomorrow":
        return "Due Tomorrow";
      case "upcoming":
        return "Upcoming (Next 7 Days)";
      case "later":
        return "Later";
      case "no_date":
        return "No Scheduled Date";
      case "no_project":
        return "No Project";
      default:
        const proj = projects.find((p) => p.id === key);
        return proj ? proj.title : key;
    }
  };

  // Helper to ensure Overdue is always first, then Today, etc.
  const getSortedGroupKeys = () => {
    const keys = Object.keys(groupedTasks).filter(
      (k) =>
        groupedTasks[k].length > 0 ||
        ["overdue", "today", "tomorrow"].includes(k)
    );
    if (grouping === "date") {
      const order = [
        "overdue",
        "today",
        "tomorrow",
        "upcoming",
        "later",
        "no_date",
      ];
      return keys.sort((a, b) => {
        const ixA = order.indexOf(a);
        const ixB = order.indexOf(b);
        if (ixA !== -1 && ixB !== -1) return ixA - ixB;
        if (ixA !== -1) return -1;
        if (ixB !== -1) return 1;
        return 0;
      });
    }
    return keys;
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const isCompleted = task.isCompleted;
    const project = projects.find((p) => p.id === task.projectId);
    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    const subtaskDone = task.subtasks
      ? task.subtasks.filter((s) => s.isCompleted).length
      : 0;
    const isOverdue =
      task.startTime && task.startTime < Date.now() && !isCompleted;

    return (
      <div
        onClick={() => openModal(task)}
        className={`group bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 relative ${
          isCompleted
            ? "opacity-80 bg-gray-50 border-gray-200"
            : "hover:border-black/20 border-gray-200"
        } ${isOverdue && !isCompleted ? "border-red-200 bg-red-50/20" : ""}`}
      >
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
          style={{ backgroundColor: task.color || "#000" }}
        ></div>

        <div className="flex items-start gap-3 pl-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask && onToggleTask(task.id);
            }}
            className={`mt-1 shrink-0 transition-all ${
              isCompleted ? "text-green-500" : "text-gray-300 hover:text-black"
            }`}
          >
            {isCompleted ? (
              <CheckSquare size={20} />
            ) : (
              <div className="w-5 h-5 border-2 border-current rounded-md"></div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4
                className={`text-sm md:text-base font-bold text-gray-900 leading-snug ${
                  isCompleted ? "line-through text-gray-500" : ""
                }`}
              >
                {task.title}
              </h4>
              <div className="flex gap-1">
                {!isCompleted && onStartTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTask(task);
                    }}
                    className="p-1.5 bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
                    title="Start Focus"
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Task"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.startTime && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    isOverdue
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isOverdue && <AlertCircle size={10} />}
                  <Calendar size={10} />
                  {new Date(task.startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {new Date(task.startTime).getHours() !== 9 && (
                    <span className="opacity-75">
                      {" "}
                      {new Date(task.startTime).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  task.priority === "High"
                    ? "text-red-600 bg-red-50"
                    : task.priority === "Medium"
                    ? "text-orange-600 bg-orange-50"
                    : "text-blue-600 bg-blue-50"
                }`}
              >
                {task.priority}
              </span>
              {project && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 flex items-center gap-1 max-w-[100px] truncate">
                  <Briefcase size={10} /> {project.title}
                </span>
              )}
              {subtaskCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex items-center gap-1">
                  <ListTodo size={10} /> {subtaskDone}/{subtaskCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const activeKeys = getSortedGroupKeys();

    if (viewMode === "board") {
      return (
        <div className="flex h-full overflow-x-auto snap-x snap-mandatory p-4 md:p-6 gap-4 items-start">
          {activeKeys.map((key) => (
            <div
              key={key}
              className="flex-shrink-0 w-[85vw] md:w-80 snap-center flex flex-col h-full max-h-full bg-gray-50 rounded-2xl border border-gray-200"
            >
              <div
                className={`p-3 border-b border-gray-200 flex justify-between items-center rounded-t-2xl sticky top-0 z-10 ${
                  key === "overdue" ? "bg-red-50" : "bg-white"
                }`}
              >
                <h3
                  className={`font-bold text-sm uppercase tracking-wide ${
                    key === "overdue" ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {getGroupTitle(key)}
                </h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    key === "overdue"
                      ? "bg-red-200 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {groupedTasks[key].length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {groupedTasks[key].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {!showCompleted && !showArchived && (
                  <button
                    onClick={() =>
                      openModal(
                        undefined,
                        key === "tomorrow"
                          ? new Date(Date.now() + 86400000)
                              .toISOString()
                              .split("T")[0]
                          : key === "today"
                          ? new Date().toISOString().split("T")[0]
                          : undefined
                      )
                    }
                    className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-black hover:border-black hover:bg-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // List View
      return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-24">
            {activeKeys.map((key) => {
              const isExpanded = expandedGroups[key] !== false; // Default true
              const isOverdueGroup = key === "overdue";
              const count = groupedTasks[key].length;

              if (
                count === 0 &&
                !["overdue", "today", "tomorrow"].includes(key)
              )
                return null;

              return (
                <div key={key} className="animate-fade-in">
                  <button
                    onClick={() => toggleGroup(key)}
                    className={`flex items-center gap-2 w-full mb-3 group ${
                      isOverdueGroup && count > 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-md transition-colors ${
                        isExpanded
                          ? isOverdueGroup && count > 0
                            ? "bg-red-100 text-red-600"
                            : "bg-black text-white"
                          : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </div>
                    <h3 className="font-bold uppercase tracking-wider text-sm">
                      {getGroupTitle(key)}
                    </h3>
                    <div
                      className={`h-px flex-1 ml-2 ${
                        isOverdueGroup && count > 0
                          ? "bg-red-100"
                          : "bg-gray-200"
                      }`}
                    ></div>
                    <span
                      className={`text-xs font-bold ${
                        isOverdueGroup && count > 0
                          ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-full"
                          : "text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className={`space-y-3 pl-2 md:pl-4 border-l-2 ${
                        isOverdueGroup && count > 0
                          ? "border-red-100"
                          : "border-gray-100"
                      }`}
                    >
                      {groupedTasks[key].map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}

                      {groupedTasks[key].length === 0 && (
                        <div className="py-2 text-xs text-gray-400 italic pl-2">
                          No tasks in this section.
                        </div>
                      )}

                      {!showCompleted && !showArchived && (
                        <button
                          onClick={() =>
                            openModal(
                              undefined,
                              key === "tomorrow"
                                ? new Date(Date.now() + 86400000)
                                    .toISOString()
                                    .split("T")[0]
                                : key === "today"
                                ? new Date().toISOString().split("T")[0]
                                : undefined
                            )
                          }
                          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Plus size={14} /> Add Task to {getGroupTitle(key)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {activeKeys.length === 0 && (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <ListTodo size={48} className="mb-4 opacity-20" />
                <p>
                  {showCompleted
                    ? "No completed tasks found."
                    : "No active tasks found."}
                </p>
                {!showCompleted && !showArchived && (
                  <button
                    onClick={() => openModal()}
                    className="mt-4 text-black font-bold border-b border-black"
                  >
                    Create one
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Smart Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 border-b border-gray-200 bg-white z-20 shrink-0 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <ListTodo size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                Tasks
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {showCompleted
                  ? "Showing completed"
                  : showArchived
                  ? "Showing archived"
                  : `${
                      activeTasks.filter((t) => !t.isCompleted).length
                    } pending tasks`}
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="bg-black text-white w-10 h-10 md:w-auto md:px-4 md:py-2.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={20} />{" "}
            <span className="hidden md:inline">New Task</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Controls Scroll Container */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {/* View Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "board"
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Board View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>

            {/* Grouping */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase px-2 hidden md:inline">
                Group
              </span>
              {(["date", "priority", "project"] as GroupingMode[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrouping(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    grouping === g
                      ? "bg-white shadow-sm text-black border border-gray-100"
                      : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase px-2 hidden md:inline">
                Sort
              </span>
              <button
                onClick={() => setSortBy("time")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === "time"
                    ? "bg-white shadow-sm text-black border border-gray-100"
                    : "text-gray-500 hover:text-black"
                }`}
                title="Time"
              >
                <Clock size={14} />
              </button>
              <button
                onClick={() => setSortBy("priority")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === "priority"
                    ? "bg-white shadow-sm text-black border border-gray-100"
                    : "text-gray-500 hover:text-black"
                }`}
                title="Priority"
              >
                <ArrowUpAZ size={14} />
              </button>
              <button
                onClick={() => setSortBy("alpha")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === "alpha"
                    ? "bg-white shadow-sm text-black border border-gray-100"
                    : "text-gray-500 hover:text-black"
                }`}
                title="A-Z"
              >
                <ArrowDown01 size={14} />
              </button>
            </div>

            <button
              onClick={() => {
                setShowCompleted(!showCompleted);
                if (!showCompleted) setShowArchived(false);
              }}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ml-auto ${
                showCompleted
                  ? "bg-green-50 border-green-200 text-green-600"
                  : "border-gray-200 text-gray-400 hover:text-black hover:border-gray-300"
              }`}
              title={showCompleted ? "Hide Completed" : "Show Completed"}
            >
              <CheckSquare size={18} />
            </button>

            <button
              onClick={() => {
                setShowArchived(!showArchived);
                if (!showArchived) setShowCompleted(false);
              }}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                showArchived
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "border-gray-200 text-gray-400 hover:text-black hover:border-gray-300"
              }`}
              title={showArchived ? "Hide Archived" : "Show Archived"}
            >
              <Archive size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-white relative">
        {renderContent()}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTaskId ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Title"
                  className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 border-none p-0 focus:ring-0 focus:outline-none"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Priority
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                          priority === p
                            ? "bg-white text-black shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  >
                    <option value="">No Project</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                    placeholder="e.g. Work"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                  <CalendarClock size={16} /> Schedule
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Subtasks
                  </label>
                  <span className="text-xs text-gray-400">
                    {subtasks.filter((s) => s.isCompleted).length}/
                    {subtasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleSubtask(sub.id)}
                        className={
                          sub.isCompleted ? "text-gray-400" : "text-gray-800"
                        }
                      >
                        {sub.isCompleted ? (
                          <CheckSquare size={16} />
                        ) : (
                          <div className="w-4 h-4 border border-gray-400 rounded-sm" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          sub.isCompleted
                            ? "line-through text-gray-400"
                            : "text-gray-700"
                        }`}
                      >
                        {sub.title}
                      </span>
                      <button
                        onClick={() => removeSubtask(sub.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-black transition-colors">
                    <Plus size={16} className="text-gray-400" />
                    <input
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                      placeholder="Add step..."
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
              <div className="flex gap-2 relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Palette size={18} className="text-gray-600" />
                </button>
                {showColorPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 w-max">
                    {TASK_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedColor(c);
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${
                          selectedColor === c
                            ? "ring-2 ring-offset-2 ring-black scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
                <div
                  className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                ></div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 shadow-lg transition-all"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
