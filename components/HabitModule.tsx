import * as React from "react";
import {
  Habit,
  HabitFrequencyType,
  HabitGoalType,
  HabitType,
  Reminder,
} from "../types";
import {
  Plus,
  Trash2,
  Archive,
  RefreshCcw,
  Check,
  X,
  Edit2,
  CheckCircle,
  Clock,
  Flame,
  ArrowLeft,
  BarChart2,
  Layers,
  CheckSquare,
  Droplets,
  Target,
  Trophy,
  Ban,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Minus,
  Play,
  Bell,
  Pin,
} from "lucide-react";

interface HabitModuleProps {
  habits: Habit[];
  onAddHabit: (habit: Habit) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onArchiveHabit: (id: string) => void;
  onUnarchiveHabit: (id: string) => void;
  onUpdateProgress: (id: string, date: string, value: number) => void;
  onStartFocus: (habit: Habit) => void;
  onReorder?: (habits: Habit[]) => void;
}

const COLORS = [
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Helpers ---

const getLocalDateStr = (date?: Date) => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSmartStep = (target: number) => {
  if (target <= 5) return 1;
  if (target <= 20) return 5;
  if (target <= 100) return 10;
  if (target <= 1000) return 100;
  return 250;
};

const calculateLongestStreak = (habit: Habit) => {
  const history = habit.history;
  const dates = Object.keys(history).sort();
  if (dates.length === 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    const val = history[dateStr];
    if (val === -1) {
      currentStreak = 0;
      prevDate = null;
      continue;
    }

    let isDone = false;
    if (habit.type === "elastic") isDone = val >= 1;
    else isDone = val >= habit.goal.target;

    if (isDone) {
      const currentDate = new Date(dateStr);
      if (prevDate) {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = currentDate;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
  }
  return maxStreak;
};

// --- Components ---

const ProgressRing = ({
  percentage,
  color,
  size = 32,
  strokeWidth = 3,
  children,
  emptyColor = "#f3f4f6",
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  emptyColor?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={emptyColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-current">
        {children}
      </div>
    </div>
  );
};

const YearlyHeatmap: React.FC<{ habit: Habit }> = ({ habit }) => {
  const days = React.useMemo(() => {
    const arr = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    for (let i = 0; i < 365; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Consistency Map (Last Year)
      </h3>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const dateStr = getLocalDateStr(day);
          const val = habit.history[dateStr] || 0;
          const isSkipped = val === -1;
          let bgColor = "#f3f4f6";
          let opacity = 1;
          if (isSkipped) {
            bgColor = "#fee2e2";
          } else if (val > 0) {
            if (habit.type === "elastic" && habit.elasticConfig) {
              if (val >= habit.elasticConfig.elite.target) bgColor = "#e11d48";
              else if (val >= habit.elasticConfig.plus.target)
                bgColor = "#65a30d";
              else bgColor = "#0891b2";
            } else {
              bgColor = habit.color;
              const pct = Math.min(1, val / habit.goal.target);
              opacity = Math.max(0.3, pct);
            }
          }
          const tooltip = `${day.toLocaleDateString()}: ${
            isSkipped
              ? "Skipped"
              : val > 0
              ? val +
                " " +
                (habit.type === "elastic"
                  ? habit.elasticConfig?.unit
                  : habit.goal.unit)
              : "No data"
          }`;
          return (
            <div
              key={dateStr}
              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-[2px] transition-all hover:scale-125 hover:ring-1 ring-black/20"
              style={{ backgroundColor: bgColor, opacity }}
              title={tooltip}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

const CreateHabitModal: React.FC<{
  initialHabit?: Habit;
  onClose: () => void;
  onSave: (habit: Habit) => void;
}> = ({ initialHabit, onClose, onSave }) => {
  const [title, setTitle] = React.useState(initialHabit?.title || "");
  const [description, setDescription] = React.useState(
    initialHabit?.description || ""
  );
  const [color, setColor] = React.useState(initialHabit?.color || COLORS[0]);
  const [habitType, setHabitType] = React.useState<HabitType>(
    initialHabit?.type || "simple"
  );
  const [customStep, setCustomStep] = React.useState<string>(
    initialHabit?.customStep ? initialHabit.customStep.toString() : ""
  );
  const [freqType, setFreqType] = React.useState<HabitFrequencyType>(
    initialHabit?.frequency.type || "daily"
  );
  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>(
    initialHabit?.frequency.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  );
  const [interval, setInterval] = React.useState(
    initialHabit?.frequency.interval || 2
  );
  const [timesPerWeek, setTimesPerWeek] = React.useState(
    initialHabit?.frequency.timesPerWeek || 3
  );
  const [goalType, setGoalType] = React.useState<HabitGoalType>(
    initialHabit?.goal.type || "check"
  );
  const [target, setTarget] = React.useState(initialHabit?.goal.target || 1);
  const [unit, setUnit] = React.useState(initialHabit?.goal.unit || "times");
  const [elasticUnit, setElasticUnit] = React.useState(
    initialHabit?.elasticConfig?.unit || "minutes"
  );
  const [miniTarget, setMiniTarget] = React.useState(
    initialHabit?.elasticConfig?.mini.target || 5
  );
  const [plusTarget, setPlusTarget] = React.useState(
    initialHabit?.elasticConfig?.plus.target || 15
  );
  const [eliteTarget, setEliteTarget] = React.useState(
    initialHabit?.elasticConfig?.elite.target || 30
  );

  // Reminders
  const [reminders, setReminders] = React.useState<Reminder[]>(
    initialHabit?.reminders || []
  );
  const [newReminderOffset, setNewReminderOffset] = React.useState(15);

  const addReminder = () => {
    const newRem: Reminder = {
      id: Date.now().toString(),
      timeOffset: newReminderOffset,
      type: "notification",
    };
    setReminders([...reminders, newRem]);
  };
  const removeReminder = (id: string) =>
    setReminders(reminders.filter((r) => r.id !== id));

  const handleSave = () => {
    if (!title.trim()) return;
    const newHabit: Habit = {
      id: initialHabit?.id || Date.now().toString(),
      title,
      description,
      color,
      type: habitType,
      customStep: customStep ? parseFloat(customStep) : undefined,
      frequency: {
        type: freqType,
        daysOfWeek: freqType === "specific_days" ? daysOfWeek : undefined,
        interval: freqType === "interval" ? interval : undefined,
        timesPerWeek: freqType === "weekly" ? timesPerWeek : undefined,
      },
      goal: {
        type: goalType,
        target: habitType === "simple" ? target : 1,
        unit: habitType === "simple" ? unit : elasticUnit,
      },
      elasticConfig:
        habitType === "elastic"
          ? {
              unit: elasticUnit,
              mini: { label: "Mini", target: miniTarget },
              plus: { label: "Plus", target: plusTarget },
              elite: { label: "Elite", target: eliteTarget },
            }
          : undefined,
      history: initialHabit?.history || {},
      streak: initialHabit?.streak || 0,
      createdAt: initialHabit?.createdAt || Date.now(),
      reminders,
    };
    onSave(newHabit);
  };

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day))
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    else setDaysOfWeek([...daysOfWeek, day]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800">
            {initialHabit ? "Edit Habit" : "New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Run"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Description (Optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Motivation..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      color === c
                        ? "ring-2 ring-offset-2 ring-black scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reminders Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Bell size={12} /> Reminders
              </label>
            </div>
            <div className="space-y-2">
              {reminders.map((r, idx) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200"
                >
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm font-medium flex-1">
                    {r.timeOffset === 0
                      ? "At start time"
                      : `${r.timeOffset} minutes before`}
                  </span>
                  <button
                    onClick={() => removeReminder(r.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select
                  value={newReminderOffset}
                  onChange={(e) =>
                    setNewReminderOffset(parseInt(e.target.value))
                  }
                  className="bg-white border border-gray-200 rounded-lg p-2 text-sm flex-1"
                >
                  <option value={0}>At time of event</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
                <button
                  onClick={addReminder}
                  className="px-3 py-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setHabitType("simple")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                habitType === "simple"
                  ? "border-black bg-gray-50"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">Simple</div>
              <div className="text-xs text-gray-500">
                Fixed daily target (e.g. 30 mins)
              </div>
            </button>
            <button
              onClick={() => setHabitType("elastic")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                habitType === "elastic"
                  ? "border-black bg-gray-50"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">Elastic</div>
              <div className="text-xs text-gray-500">
                Flexible tiers (Mini, Plus, Elite)
              </div>
            </button>
          </div>
          {habitType === "simple" ? (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Goal Type
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  >
                    <option value="check">Checkmark (Done/Not Done)</option>
                    <option value="quantity">
                      Quantity (e.g. Cups, Pages)
                    </option>
                    <option value="duration">Duration (Minutes)</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Target
                  </label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                    disabled={goalType === "check"}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Unit
                  </label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                    placeholder="e.g. mins"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Unit
                </label>
                <input
                  value={elasticUnit}
                  onChange={(e) => setElasticUnit(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                  placeholder="e.g. Minutes, Pushups"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">
                    Mini (Good)
                  </span>
                  <input
                    type="number"
                    value={miniTarget}
                    onChange={(e) =>
                      setMiniTarget(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white border border-cyan-200 text-cyan-700 font-bold rounded-lg px-2 py-2 text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">
                    Plus (Better)
                  </span>
                  <input
                    type="number"
                    value={plusTarget}
                    onChange={(e) =>
                      setPlusTarget(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white border border-lime-200 text-lime-700 font-bold rounded-lg px-2 py-2 text-center focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">
                    Elite (Best)
                  </span>
                  <input
                    type="number"
                    value={eliteTarget}
                    onChange={(e) =>
                      setEliteTarget(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white border border-rose-200 text-rose-700 font-bold rounded-lg px-2 py-2 text-center focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Increment Size (Optional)
            </label>
            <input
              type="number"
              value={customStep}
              onChange={(e) => setCustomStep(e.target.value)}
              placeholder={
                habitType === "simple"
                  ? `Auto: ${getSmartStep(target)}`
                  : "Auto: 1"
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-black"
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1">
              Amount to add each time you click (e.g. +250 for water).
            </p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Frequency
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {["daily", "weekly", "specific_days", "interval"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFreqType(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                    freqType === f
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
            {freqType === "specific_days" && (
              <div className="flex justify-between gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                      daysOfWeek.includes(i)
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
            {freqType === "interval" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Every</span>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center font-bold"
                />
                <span className="text-sm text-gray-600">days</span>
              </div>
            )}
            {freqType === "weekly" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timesPerWeek}
                  onChange={(e) =>
                    setTimesPerWeek(parseInt(e.target.value) || 1)
                  }
                  className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center font-bold"
                />
                <span className="text-sm text-gray-600">times per week</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 shadow-lg transition-all"
          >
            {initialHabit ? "Update Habit" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HabitModule: React.FC<HabitModuleProps> = ({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onArchiveHabit,
  onUnarchiveHabit,
  onUpdateProgress,
  onStartFocus,
  onReorder,
}) => {
  const [viewingHabitId, setViewingHabitId] = React.useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingHabit, setEditingHabit] = React.useState<Habit | undefined>(
    undefined
  );
  const [showArchived, setShowArchived] = React.useState(false);
  const [popupData, setPopupData] = React.useState<{
    habitId: string;
    date: string;
  } | null>(null);

  const [draggedHabitId, setDraggedHabitId] = React.useState<string | null>(
    null
  );

  const activeHabits = habits.filter((h) => !h.deletedAt && !h.archivedAt);
  const archivedHabits = habits.filter((h) => !h.deletedAt && h.archivedAt);
  const currentViewHabits = showArchived ? archivedHabits : activeHabits;

  // Sort pinned first
  const sortedHabits = React.useMemo(() => {
    return [...currentViewHabits].sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
    );
  }, [currentViewHabits]);

  const handleOpenPopup = (
    e: React.MouseEvent,
    habit: Habit,
    dateStr: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setPopupData({ habitId: habit.id, date: dateStr });
  };
  const closePopup = () => setPopupData(null);
  const handlePopupSave = (val: number) => {
    if (popupData) {
      onUpdateProgress(popupData.habitId, popupData.date, val);
      closePopup();
    }
  };
  const handleEditHabit = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(undefined);
  };
  const handleTogglePin = (e: React.MouseEvent, habit: Habit) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateHabit({ ...habit, isPinned: !habit.isPinned });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedHabitId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedHabitId || draggedHabitId === targetId || !onReorder) return;

    const allHabits = [...habits];
    const fromIndex = allHabits.findIndex((r) => r.id === draggedHabitId);
    const toIndex = allHabits.findIndex((r) => r.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = allHabits.splice(fromIndex, 1);
      allHabits.splice(toIndex, 0, moved);
      onReorder(allHabits);
    }
    setDraggedHabitId(null);
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-white">
      {/* Main Content Swapper */}
      {viewingHabitId && habits.find((h) => h.id === viewingHabitId) ? (
        <HabitDetailView
          habit={habits.find((h) => h.id === viewingHabitId)!}
          onBack={() => setViewingHabitId(null)}
          onUpdate={onUpdateHabit}
          onDelete={onDeleteHabit}
          onUpdateProgress={onUpdateProgress}
          onArchive={showArchived ? undefined : onArchiveHabit}
          onUnarchive={showArchived ? onUnarchiveHabit : undefined}
          onOpenPopup={handleOpenPopup}
          onEdit={(e) =>
            handleEditHabit(e, habits.find((h) => h.id === viewingHabitId)!)
          }
          onStartFocus={onStartFocus}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 px-6 py-4 gap-4 bg-white z-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <CheckCircle className="text-black" size={28} /> Habits
              </h2>
              {showArchived && (
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                  Archived View
                </span>
              )}
              {!showArchived && (
                <p className="text-gray-500 mt-1 text-sm md:text-base hidden md:block">
                  Consistency is key. Track your daily progress.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-2 rounded-xl transition-all ${
                  showArchived
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
                title={showArchived ? "View Active" : "View Archive"}
              >
                <Archive size={20} />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-black text-white px-3 md:px-5 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={18} />{" "}
                <span className="hidden md:inline">New Habit</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedHabits.map((habit) => (
                <div
                  key={habit.id}
                  draggable={!showArchived}
                  onDragStart={(e) => handleDragStart(e, habit.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, habit.id)}
                >
                  <HabitCard
                    habit={habit}
                    onClick={() => setViewingHabitId(habit.id)}
                    onInteraction={handleOpenPopup}
                    onEdit={(e) => handleEditHabit(e, habit)}
                    onStartFocus={onStartFocus}
                    onTogglePin={handleTogglePin}
                  />
                </div>
              ))}
              {sortedHabits.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                  <p>No habits found.</p>
                  {!showArchived && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 text-black font-bold hover:underline"
                    >
                      Create your first habit
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CreateHabitModal
          initialHabit={editingHabit}
          onClose={handleCloseModal}
          onSave={(habit) => {
            if (editingHabit) onUpdateHabit(habit);
            else onAddHabit(habit);
            handleCloseModal();
          }}
        />
      )}
      {popupData && (
        <HabitInteractionModal
          habit={habits.find((h) => h.id === popupData.habitId)!}
          date={popupData.date}
          onClose={closePopup}
          onSave={handlePopupSave}
        />
      )}
    </div>
  );
};

const HabitInteractionModal: React.FC<{
  habit: Habit;
  date: string;
  onClose: () => void;
  onSave: (val: number) => void;
}> = ({ habit, date, onClose, onSave }) => {
  const currentVal = habit.history[date] || 0;
  const [val, setVal] = React.useState<number>(
    currentVal === -1 ? 0 : currentVal
  );
  const [isSkipped, setIsSkipped] = React.useState(currentVal === -1);
  const step =
    habit.customStep ||
    (habit.type === "simple" ? getSmartStep(habit.goal.target) : 1);
  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const handleSave = () => {
    if (isSkipped) onSave(-1);
    else onSave(val);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{habit.title}</h3>
            <p className="text-xs text-gray-500">{displayDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center justify-center py-4 gap-4">
          <button
            onClick={() => {
              setIsSkipped(false);
              setVal(Math.max(0, val - step));
            }}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600 font-bold text-xl disabled:opacity-50"
            disabled={isSkipped || val <= 0}
          >
            <Minus size={20} />
          </button>
          <div className="text-center w-24">
            {isSkipped ? (
              <span className="text-red-500 font-bold text-xl uppercase tracking-wider">
                Skipped
              </span>
            ) : (
              <>
                <div className="text-4xl font-bold text-gray-900">{val}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">
                  {habit.type === "elastic"
                    ? habit.elasticConfig?.unit
                    : habit.goal.unit}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setIsSkipped(false);
              setVal(val + step);
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg hover:scale-110 transition-transform"
            style={{ backgroundColor: habit.color }}
          >
            <Plus size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsSkipped(!isSkipped)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
              isSkipped
                ? "bg-red-50 text-red-500 border-red-100"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isSkipped ? <RefreshCcw size={16} /> : <X size={16} />}
            {isSkipped ? "Unmark Skipped" : "Mark as Skipped"}
          </button>
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-sm font-bold bg-black text-white hover:bg-gray-800 transition-colors shadow-md"
          >
            Save Progress
          </button>
        </div>
      </div>
    </div>
  );
};

const HabitCard: React.FC<{
  habit: Habit;
  onClick: () => void;
  onInteraction: (e: React.MouseEvent, habit: Habit, dateStr: string) => void;
  onEdit: (e: React.MouseEvent) => void;
  onStartFocus: (habit: Habit) => void;
  onTogglePin: (e: React.MouseEvent, habit: Habit) => void;
}> = ({ habit, onClick, onInteraction, onEdit, onStartFocus, onTogglePin }) => {
  const days = React.useMemo(() => {
    const d = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      d.push(date);
    }
    return d;
  }, []);
  const getElasticStatus = (
    val: number,
    config: NonNullable<Habit["elasticConfig"]>
  ) => {
    if (val >= config.elite.target) return { color: "#e11d48", label: "E" };
    if (val >= config.plus.target) return { color: "#65a30d", label: "P" };
    if (val >= config.mini.target) return { color: "#0891b2", label: "M" };
    return { color: "#e5e7eb", label: "-" };
  };
  const isDurationHabit =
    habit.goal.type === "duration" ||
    (habit.type === "elastic" &&
      (habit.elasticConfig?.unit.toLowerCase().includes("min") ||
        habit.elasticConfig?.unit.toLowerCase().includes("hour")));

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative ${
        habit.isPinned
          ? "border-black ring-1 ring-black shadow-md"
          : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: habit.color }}
          >
            {habit.goal.type === "duration" ? (
              <Clock size={24} />
            ) : habit.goal.unit.toLowerCase().includes("water") ||
              habit.goal.unit.toLowerCase().includes("ml") ? (
              <Droplets size={24} />
            ) : (
              <CheckSquare size={24} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {habit.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {habit.streak > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                  <Flame size={10} fill="currentColor" /> {habit.streak}
                </span>
              )}
              {habit.frequency.type === "weekly" && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {habit.frequency.timesPerWeek}x / Week
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => onTogglePin(e, habit)}
            className={`p-2 rounded-xl transition-all ${
              habit.isPinned
                ? "text-black bg-gray-100"
                : "text-gray-300 hover:text-black opacity-0 group-hover:opacity-100"
            }`}
            title={habit.isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={16} fill={habit.isPinned ? "currentColor" : "none"} />
          </button>
          {isDurationHabit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(habit);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-black rounded-xl transition-all"
              title="Start Focus Timer"
            >
              <Play size={16} fill="currentColor" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 font-medium pl-16 -mt-2">
        <Target size={12} />{" "}
        {habit.type === "simple"
          ? `Target: ${habit.goal.target} ${habit.goal.unit}`
          : `Elastic: ${habit.elasticConfig?.mini.target} / ${habit.elasticConfig?.plus.target} / ${habit.elasticConfig?.elite.target} ${habit.elasticConfig?.unit}`}
      </div>
      {habit.description && (
        <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
          {habit.description}
        </p>
      )}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between">
          <span>Last 7 Days</span>
        </div>
        <div className="flex justify-between items-center">
          {days.map((date, i) => {
            const dateStr = getLocalDateStr(date);
            const val = habit.history[dateStr] || 0;
            const isSkipped = val === -1;
            let content = null;
            let bgStyle = { backgroundColor: "#f3f4f6" };
            if (habit.type === "elastic" && habit.elasticConfig) {
              const status = getElasticStatus(val, habit.elasticConfig);
              if (isSkipped) {
                content = (
                  <X size={14} className="text-red-500" strokeWidth={3} />
                );
                bgStyle = { backgroundColor: "#fee2e2" };
              } else if (val > 0) {
                content = (
                  <Check size={16} className="text-white" strokeWidth={4} />
                );
                bgStyle = { backgroundColor: status.color };
              }
            } else {
              const target = habit.goal.target;
              const pct = Math.min(100, (val / target) * 100);
              if (isSkipped) {
                content = (
                  <X size={14} className="text-red-500" strokeWidth={3} />
                );
                bgStyle = { backgroundColor: "#fee2e2" };
              } else if (val > 0) {
                if (pct >= 100) {
                  content = (
                    <Check size={16} className="text-white" strokeWidth={4} />
                  );
                  bgStyle = { backgroundColor: habit.color };
                } else {
                  content = (
                    <ProgressRing
                      percentage={pct}
                      size={32}
                      color={habit.color}
                      strokeWidth={4}
                    />
                  );
                  bgStyle = { backgroundColor: "transparent" };
                }
              }
            }
            const isToday = i === 6;
            return (
              <div
                key={dateStr}
                className="flex flex-col items-center gap-1.5 group/day relative"
              >
                <button
                  onClick={(e) => onInteraction(e, habit, dateStr)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative overflow-hidden`}
                  style={bgStyle}
                  title={`${date.toLocaleDateString()}: ${
                    isSkipped ? "Skipped" : val
                  }`}
                >
                  {content}
                </button>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isToday ? "text-black" : "text-gray-300"
                  }`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HabitDetailView: React.FC<{
  habit: Habit;
  onBack: () => void;
  onUpdate: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, date: string, val: number) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onOpenPopup: (e: React.MouseEvent, habit: Habit, dateStr: string) => void;
  onEdit: (e: React.MouseEvent) => void;
  onStartFocus: (habit: Habit) => void;
}> = ({
  habit,
  onBack,
  onUpdate,
  onDelete,
  onUpdateProgress,
  onArchive,
  onUnarchive,
  onOpenPopup,
  onEdit,
  onStartFocus,
}) => {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const today = new Date();
  const viewDate = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1
  );
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();
  const totalCheckins = (Object.values(habit.history) as number[]).filter(
    (v) => v > 0
  ).length;
  const skippedDays = (Object.values(habit.history) as number[]).filter(
    (v) => v === -1
  ).length;
  const longestStreak = calculateLongestStreak(habit);
  const monthKey = `${viewDate.getFullYear()}-${String(
    viewDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const monthlyCheckins = Object.keys(habit.history).filter(
    (k) => k.startsWith(monthKey) && habit.history[k] > 0
  ).length;
  const totalCompletion = (Object.values(habit.history) as number[])
    .filter((v) => v > 0)
    .reduce((acc, v) => acc + v, 0);
  const isDurationHabit =
    habit.goal.type === "duration" ||
    (habit.type === "elastic" &&
      (habit.elasticConfig?.unit.toLowerCase().includes("min") ||
        habit.elasticConfig?.unit.toLowerCase().includes("hour")));

  const getDayContent = (dateStr: string) => {
    const val = habit.history[dateStr] || 0;
    const isSkipped = val === -1;
    if (isSkipped)
      return {
        bg: "#fee2e2",
        content: <X size={16} className="text-red-500" />,
      };
    if (val === 0) return { bg: "#f9fafb", content: null };
    if (habit.type === "elastic" && habit.elasticConfig) {
      if (val >= habit.elasticConfig.elite.target)
        return {
          bg: "#e11d48",
          content: <Check size={16} className="text-white" />,
        };
      if (val >= habit.elasticConfig.plus.target)
        return {
          bg: "#65a30d",
          content: <Check size={16} className="text-white" />,
        };
      if (val >= habit.elasticConfig.mini.target)
        return {
          bg: "#0891b2",
          content: <Check size={16} className="text-white" />,
        };
      return { bg: "#f9fafb", content: null };
    } else {
      const pct = Math.min(100, (val / habit.goal.target) * 100);
      if (pct >= 100)
        return {
          bg: habit.color,
          content: <Check size={16} className="text-white" />,
        };
      return {
        bg: "transparent",
        content: (
          <ProgressRing
            percentage={pct}
            size={36}
            color={habit.color}
            strokeWidth={4}
            emptyColor="#e5e7eb"
          />
        ),
      };
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-fade-in overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          {onArchive && (
            <button
              onClick={() => {
                onArchive(habit.id);
                onBack();
              }}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-lg transition-colors"
              title="Archive"
            >
              <Archive size={18} />
            </button>
          )}
          {onUnarchive && (
            <button
              onClick={() => {
                onUnarchive(habit.id);
                onBack();
              }}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-lg transition-colors"
              title="Unarchive"
            >
              <RefreshCcw size={18} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2.5 bg-gray-100 hover:bg-black hover:text-white text-gray-900 rounded-lg transition-colors"
            title="Edit Habit"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => {
              onDelete(habit.id);
              onBack();
            }}
            className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <div className="flex items-start gap-6">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: habit.color }}
            >
              {habit.goal.type === "duration" ? (
                <Clock size={32} />
              ) : habit.goal.unit.toLowerCase().includes("water") ||
                habit.goal.unit.toLowerCase().includes("ml") ? (
                <Droplets size={32} />
              ) : (
                <CheckSquare size={32} />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                {habit.title}
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
                <Target size={16} />
                <span>
                  {habit.type === "simple"
                    ? `Daily Target: ${habit.goal.target} ${habit.goal.unit}`
                    : `Elastic Targets: ${habit.elasticConfig?.mini.target} / ${habit.elasticConfig?.plus.target} / ${habit.elasticConfig?.elite.target} ${habit.elasticConfig?.unit}`}
                </span>
              </div>
              <p className="text-gray-500 mb-4 text-sm md:text-base">
                {habit.description ||
                  "Building consistency, one day at a time."}
              </p>
            </div>
            {isDurationHabit && (
              <button
                onClick={() => onStartFocus(habit)}
                className="hidden md:flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl transition-transform hover:scale-105 font-bold"
              >
                <Play size={18} fill="currentColor" /> Start Session
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <CheckCircle2 size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">
                  This Month
                </span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {monthlyCheckins}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Layers size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">Total</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {totalCheckins}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-orange-500 mb-2">
                <Flame size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">Streak</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {habit.streak}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Trophy size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">Best</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {longestStreak}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Ban size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">Skipped</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {skippedDays}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <BarChart2 size={16} />{" "}
                <span className="text-[10px] font-bold uppercase">Vol</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {totalCompletion}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <YearlyHeatmap habit={habit} />
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Daily Volume (
                {viewDate.toLocaleDateString("en-US", { month: "short" })})
              </h3>
              <div className="h-40 md:h-48 flex items-end gap-1 md:gap-2 w-full overflow-x-auto custom-scrollbar pb-2">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(
                    viewDate.getFullYear(),
                    viewDate.getMonth(),
                    i + 1
                  );
                  const dateStr = getLocalDateStr(date);
                  const val = habit.history[dateStr] || 0;
                  const isSkipped = val === -1;
                  let height = "4px";
                  let bg = "#f3f4f6";
                  let opacity = 1;
                  if (isSkipped) {
                    height = "10px";
                    bg = "#fee2e2";
                  } else if (val > 0) {
                    if (habit.type === "elastic" && habit.elasticConfig) {
                      height =
                        val >= habit.elasticConfig.elite.target
                          ? "100%"
                          : val >= habit.elasticConfig.plus.target
                          ? "66%"
                          : "33%";
                      if (val >= habit.elasticConfig.elite.target)
                        bg = "#e11d48";
                      else if (val >= habit.elasticConfig.plus.target)
                        bg = "#65a30d";
                      else bg = "#0891b2";
                    } else {
                      const target = habit.goal.target;
                      const pct = val / target;
                      height = `${Math.min(100, Math.max(10, pct * 100))}%`;
                      bg = habit.color;
                      opacity = pct >= 1 ? 1 : 0.5;
                    }
                  }
                  return (
                    <div
                      key={i}
                      className="flex-1 min-w-[8px] flex flex-col items-center justify-end h-full group relative"
                      title={`${date.toLocaleDateString()}: ${
                        isSkipped ? "Skipped" : val
                      }`}
                    >
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{ height, backgroundColor: bg, opacity }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  {viewDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setMonthOffset(0)}
                    className="px-3 py-1 text-xs font-bold bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-6 gap-x-1 md:gap-x-4">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider"
                  >
                    {d.substr(0, 3)}
                  </div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(
                    viewDate.getFullYear(),
                    viewDate.getMonth(),
                    i + 1
                  );
                  const dateStr = getLocalDateStr(date);
                  const styles = getDayContent(dateStr);
                  const isToday = dateStr === getLocalDateStr();
                  const val = habit.history[dateStr] || 0;
                  const isSkipped = val === -1;
                  const tooltip = `${date.toLocaleDateString()}: ${
                    isSkipped ? "Skipped" : val > 0 ? val : "No Data"
                  }`;
                  return (
                    <div
                      key={dateStr}
                      className="flex flex-col items-center gap-2"
                    >
                      <button
                        onClick={(e) => onOpenPopup(e, habit, dateStr)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative ${
                          isToday ? "ring-2 ring-offset-2 ring-black" : ""
                        }`}
                        style={{ backgroundColor: styles.bg }}
                        title={tooltip}
                      >
                        {styles.content || (
                          <span
                            className={`text-xs font-medium ${
                              isToday ? "text-black font-bold" : "text-gray-400"
                            }`}
                          >
                            {i + 1}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
