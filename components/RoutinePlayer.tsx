// components/RoutinePlayer.tsx
import * as React from "react";
import { Routine, RoutineStep, Task, Habit } from "../types";
import {
  Pause,
  Play,
  X,
  Check,
  Clock,
  GripVertical,
  PauseCircle,
  CheckCircle2,
  Maximize2,
  SkipForward,
  Plus,
  Minus,
  ChevronDown,
  Trash2,
  List,
  Layers,
  PlusCircle,
  Minimize2,
} from "lucide-react";
import { playSound } from "../utils/sounds";

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
  onAdjustTime?: (seconds: number) => void;
  onStepRemove?: (index: number) => void;
}

export const RoutinePlayer: React.FC<RoutinePlayerProps> = ({
  routine,
  steps,
  currentStepIndex,
  timeElapsedInStep,
  isPlaying,
  tasks,
  habits = [],
  onTogglePlay,
  onStepComplete,
  onStepsReorder,
  onMinimize,
  onExit,
  onSave,
  onToggleSubtask,
  onAdjustTime,
  onStepRemove,
}) => {
  const currentStep = steps[currentStepIndex] || {
    title: "Finished",
    durationSeconds: 0,
  };
  const stepDuration = currentStep.durationSeconds;
  const timeLeft = stepDuration - timeElapsedInStep;
  const isOvertime = timeLeft < 0;

  const progress =
    stepDuration > 0
      ? Math.min(100, (timeElapsedInStep / stepDuration) * 100)
      : 100;

  const [isMobileSequenceOpen, setIsMobileSequenceOpen] = React.useState(false);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [isRemoveZoneActive, setIsRemoveZoneActive] = React.useState(false);

  // Estimated completion time
  const [estimatedCompletionTime, setEstimatedCompletionTime] =
    React.useState("");

  React.useEffect(() => {
    const calculateEstimation = () => {
      const now = Date.now();
      let totalRemainingSeconds = Math.max(0, timeLeft);

      for (let i = currentStepIndex + 1; i < steps.length; i++) {
        totalRemainingSeconds += steps[i].durationSeconds;
      }

      const completionDate = new Date(now + totalRemainingSeconds * 1000);
      setEstimatedCompletionTime(
        completionDate.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    };

    calculateEstimation();
    const interval = setInterval(calculateEstimation, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, currentStepIndex, steps]);

  // Sound: Play start sound on first play
  React.useEffect(() => {
    if (currentStepIndex === 0 && timeElapsedInStep === 0 && isPlaying) {
      playSound("TIMER_START");
    }
  }, [currentStepIndex, timeElapsedInStep, isPlaying]);

  // Sound: Timer end and overtime
  React.useEffect(() => {
    if (isPlaying) {
      if (timeLeft === 0) {
        playSound("TIMER_END");
      } else if (timeLeft < 0 && Math.abs(timeLeft) % 30 === 0 && timeLeft !== 0) {
        playSound("OVERTIME_TICK");
      }
    }
  }, [timeLeft, isPlaying]);

  const handleStepCompleteInternal = () => {
    if (currentStepIndex >= steps.length - 1) {
      playSound("ROUTINE_COMPLETE");
    }
    onStepComplete();
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${seconds < 0 ? "-" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- Drag & Drop (unchanged) ---
  const handleDragStart = (
    e: React.DragEvent,
    index: number,
    origin: "list" | "library",
    id?: string,
    type?: string
  ) => {
    e.dataTransfer.setData("origin", origin);
    if (origin === "list") {
      e.dataTransfer.setData("stepIndex", index.toString());
    } else if (id && type) {
      e.dataTransfer.setData("id", id);
      e.dataTransfer.setData("type", type);
    }
    e.dataTransfer.effectAllowed = origin === "list" ? "move" : "copy";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleRemoveZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRemoveZoneActive(true);
  };

  const handleRemoveZoneDragLeave = () => {
    setIsRemoveZoneActive(false);
  };

  const handleRemoveDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRemoveZoneActive(false);
    const origin = e.dataTransfer.getData("origin");

    if (origin === "list") {
      const stepIndex = parseInt(e.dataTransfer.getData("stepIndex"), 10);
      if (!isNaN(stepIndex) && onStepRemove) {
        onStepRemove(stepIndex);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const origin = e.dataTransfer.getData("origin");
    const newSteps = [...steps];

    if (origin === "list") {
      const dragIndex = parseInt(e.dataTransfer.getData("stepIndex"), 10);
      if (dragIndex === dropIndex) return;

      const [removed] = newSteps.splice(dragIndex, 1);
      newSteps.splice(dropIndex, 0, removed);
      onStepsReorder(newSteps);
    } else if (origin === "library") {
      const id = e.dataTransfer.getData("id");
      const type = e.dataTransfer.getData("type");
      let newStep: RoutineStep | null = null;

      if (type === "task") {
        const task = tasks.find((t) => t.id === id);
        if (task) {
          newStep = {
            id: `${Date.now()}-${Math.random()}`,
            title: task.title,
            durationSeconds: (task.duration || 30) * 60,
            linkedTaskId: task.id,
          };
        }
      } else if (type === "habit") {
        const habit = habits.find((h) => h.id === id);
        if (habit) {
          newStep = {
            id: `${Date.now()}-${Math.random()}`,
            title: habit.title,
            durationSeconds:
              habit.goal.type === "duration" ? habit.goal.target * 60 : 300,
            linkedHabitId: habit.id,
          };
        }
      }

      if (newStep) {
        if (dropIndex >= newSteps.length) newSteps.push(newStep);
        else newSteps.splice(dropIndex + 1, 0, newStep);
        onStepsReorder(newSteps);
      }
    }
  };

  // Play button with audio unlock
  const handlePlayClick = () => {
    playSound("TIMER_START"); // Ensures unlock + immediate feedback
    onTogglePlay();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white z-[100] flex flex-col font-sans h-full w-full overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0 bg-zinc-950 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-bold tracking-widest uppercase text-zinc-300 hidden md:block">
            Focus Session
          </span>
          <span className="text-sm font-bold tracking-tight text-white md:hidden truncate max-w-[120px]">
            {currentStep.title}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onMinimize}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium"
            title="Minimize"
          >
            <Minimize2 size={18} /> <span className="hidden md:inline">Minimize</span>
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1 self-center hidden md:block"></div>
          <button
            onClick={onSave}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium"
            title="Save & Quit"
          >
            <PauseCircle size={18} /> <span className="hidden md:inline">Save & Quit</span>
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-zinc-400 hover:text-red-400 px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium"
            title="Cancel"
          >
            <X size={18} /> <span className="hidden md:inline">Cancel</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: Library & Trash */}
        <div className="hidden lg:flex flex-col w-72 border-r border-zinc-800 bg-zinc-950/50">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
              Library
            </h3>
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                isRemoveZoneActive
                  ? "border-red-500 bg-red-500/10 text-red-500"
                  : "border-zinc-800 text-zinc-600"
              }`}
              onDragOver={handleRemoveZoneDragOver}
              onDragLeave={handleRemoveZoneDragLeave}
              onDrop={handleRemoveDrop}
            >
              <Trash2 size={20} className="mx-auto mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Drag steps here to remove
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-2">
                Tasks
              </h4>
              <div className="space-y-2">
                {tasks
                  .filter((t) => !t.isCompleted)
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, -1, "library", task.id, "task")
                      }
                      className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-all"
                    >
                      <div className="truncate font-medium">{task.title}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {task.duration || 30}m
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-2">
                Habits
              </h4>
              <div className="space-y-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, -1, "library", habit.id, "habit")
                    }
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-all flex items-center gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    ></div>
                    <div className="truncate font-medium">{habit.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Focus Area */}
        <div className="flex-1 flex flex-col relative bg-zinc-950 overflow-y-auto custom-scrollbar">
          <div className="lg:hidden absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsMobileSequenceOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-full text-xs font-bold text-zinc-400"
            >
              <List size={14} /> Up Next
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[600px] lg:min-h-0 w-full max-w-md mx-auto">
            <div className="text-center mb-8 shrink-0 w-full">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                {routine.title}
              </h3>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight line-clamp-2">
                {currentStep.title}
              </h1>
            </div>

            <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 group mb-10 shrink-0">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  stroke="#18181b"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  stroke={isOvertime ? "#ef4444" : "#10b981"}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 140}
                  pathLength={100}
                  strokeDashoffset={100 - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                  style={{ strokeDasharray: "289%" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`text-6xl md:text-7xl lg:text-8xl font-mono font-bold tracking-tighter tabular-nums ${
                    isOvertime ? "text-red-500 animate-pulse" : "text-white"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
                {isOvertime && (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest mt-2 bg-red-500/10 px-2 py-1 rounded">
                    Overtime
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8 shrink-0">
              <button
                onClick={handlePlayClick}  // Now unlocks audio reliably
                className="w-14 h-14 rounded-full border-2 border-zinc-800 flex items-center justify-center text-white hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95 group"
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button
                onClick={handleStepCompleteInternal}
                className="h-16 px-12 bg-white hover:bg-zinc-200 text-black rounded-full font-bold text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                <Check size={28} strokeWidth={3} />
                Done
              </button>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onAdjustTime && onAdjustTime(-60)}
                  className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => onAdjustTime && onAdjustTime(60)}
                  className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 text-zinc-500 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Estimated Completion
              </span>
              <span className="text-xl font-medium text-zinc-300">
                {estimatedCompletionTime}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Sequence */}
        <div className="hidden lg:flex flex-col w-80 border-l border-zinc-800 bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 justify-center py-1">
              <Layers size={14} className="text-zinc-500" />
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Sequence
              </h3>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, steps.length)}
          >
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              if (isActive) {
                return (
                  <div key={step.id} className="relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-emerald-500 rounded-r-full"></div>
                    <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Now
                        </span>
                        <div className="text-emerald-500 animate-pulse">
                          <Clock size={14} />
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-lg leading-tight mb-1">
                        {step.title}
                      </h4>
                      <div className="text-xs font-mono text-zinc-400">
                        {Math.round(step.durationSeconds / 60)} min
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={step.id}
                  draggable={!isPast}
                  onDragStart={(e) => handleDragStart(e, idx, "list")}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`p-4 rounded-xl border transition-all flex items-center gap-3 group relative
                    ${isPast
                      ? "bg-transparent border-zinc-800 text-zinc-600"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                    }
                    ${dragOverIndex === idx ? "border-t-2 border-t-emerald-500 mt-2" : ""}
                  `}
                >
                  {!isPast && (
                    <div className="text-zinc-700 group-hover:text-zinc-500 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-bold truncate ${isPast ? "line-through decoration-zinc-700" : "text-zinc-300"}`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs font-mono opacity-50">
                      {Math.round(step.durationSeconds / 60)} min
                    </div>
                  </div>
                  {isPast && <CheckCircle2 size={18} className="text-zinc-700" />}
                </div>
              );
            })}

            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-4 text-center text-xs font-bold text-zinc-700 uppercase tracking-widest mt-4">
              <PlusCircle className="mx-auto mb-2 opacity-50" size={20} />
              Drag here to append
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl transition-transform duration-300 z-50 flex flex-col max-h-[80vh] ${
          isMobileSequenceOpen ? "translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "translate-y-full"
        }`}
      >
        <div
          className="p-4 border-b border-zinc-800 flex justify-between items-center"
          onClick={() => setIsMobileSequenceOpen(false)}
        >
          <h3 className="font-bold text-white ml-2">Up Next</h3>
          <button className="p-2 bg-zinc-800 rounded-full text-zinc-400">
            <ChevronDown size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {steps.map((step, idx) => {
            if (idx <= currentStepIndex) return null;
            return (
              <div
                key={step.id}
                className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex justify-between items-center"
              >
                <div className="font-bold text-zinc-200">{step.title}</div>
                <div className="text-xs font-mono text-zinc-500">
                  {Math.round(step.durationSeconds / 60)}m
                </div>
              </div>
            );
          })}
          {steps.length <= currentStepIndex + 1 && (
            <div className="text-center text-zinc-500 py-8 italic">
              No more steps
            </div>
          )}
        </div>
      </div>

      {isMobileSequenceOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileSequenceOpen(false)}
        ></div>
      )}
    </div>
  );
};

// MiniPlayer unchanged
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
}> = ({
  routine,
  currentStep,
  timeElapsed,
  isPlaying,
  onTogglePlay,
  onNext,
  onExpand,
  timeLeft,
  isOvertime,
}) => {
  const progress =
    currentStep.durationSeconds > 0
      ? (timeElapsed / currentStep.durationSeconds) * 100
      : 100;

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${seconds < 0 ? "-" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-xl flex items-center gap-3 w-full max-w-sm mx-auto backdrop-blur-md animate-fade-in-up">
      <div
        className="relative w-10 h-10 shrink-0 cursor-pointer group"
        onClick={onTogglePlay}
      >
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r="18" stroke="#333" strokeWidth="3" fill="transparent" />
          <circle
            cx="50%"
            cy="50%"
            r="18"
            stroke={isOvertime ? "#ef4444" : "#10b981"}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={
              2 * Math.PI * 18 - (Math.min(100, progress) / 100) * (2 * Math.PI * 18)
            }
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {isPlaying ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          )}
        </div>
      </div>

      <div
        className="flex-1 min-w-0 cursor-pointer flex flex-col justify-center"
        onClick={onExpand}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold truncate text-zinc-100">
            {currentStep.title}
          </h4>
          <span
            className={`text-xs font-mono font-medium ${
              isOvertime ? "text-red-400 animate-pulse" : "text-zinc-400"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 truncate">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          {routine.title}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 border-l border-zinc-800 pl-2 ml-1">
        <button
          onClick={onNext}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Next Step"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={onExpand}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Maximize"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};