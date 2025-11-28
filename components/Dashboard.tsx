import * as React from "react";
import {
  Task,
  Routine,
  ViewState,
  Note,
  FocusSession,
  JournalEntry,
  Mood,
} from "../types";
import {
  Activity,
  Zap,
  CheckCircle2,
  Smile,
  BarChart3,
  PieChart,
  Brain,
  Plus,
  X,
} from "lucide-react";

interface DashboardProps {
  tasks: Task[];
  routines: Routine[];
  notes: Note[];
  focusSessions: FocusSession[];
  journalEntries: JournalEntry[];
  onStartRoutine: (id: string) => void;
  onViewChange: (view: ViewState) => void;
  onQuickAction: (type: "task" | "dump" | "journal" | "focus") => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TimeRange = "Day" | "Week" | "Month" | "Year";

const MOOD_VALUES: Record<Mood, number> = {
  awesome: 5,
  good: 4,
  neutral: 3,
  bad: 2,
  awful: 1,
};

const MOOD_COLORS: Record<Mood, string> = {
  awesome: "#10b981", // Emerald
  good: "#3b82f6", // Blue
  neutral: "#9ca3af", // Gray
  bad: "#f97316", // Orange
  awful: "#ef4444", // Red
};

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  routines,
  notes,
  focusSessions,
  journalEntries,
  onStartRoutine,
  onViewChange,
  onQuickAction,
  onExport,
  onImport,
}) => {
  const [range, setRange] = React.useState<TimeRange>("Week");
  const [now, setNow] = React.useState(new Date());
  const [selectedActivity, setSelectedActivity] = React.useState<{
    id: string;
    type: "task" | "session" | "journal";
    item: any;
  } | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Helpers & Data Processing (Same as before) ---
  const getRangeStart = (r: TimeRange) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    if (r === "Day") return date.getTime();
    if (r === "Week") {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
    } else if (r === "Month") {
      date.setDate(1);
    } else if (r === "Year") {
      date.setMonth(0);
      date.setDate(1);
    }
    return date.getTime();
  };

  const formatDurationShort = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m}m`;
    return `${m}m`;
  };

  const rangeStart = getRangeStart(range);
  const filteredSessions = focusSessions.filter(
    (s) => s.startTime >= rangeStart
  );

  // 1. Activity Chart Data
  const activityChartData = React.useMemo(() => {
    const buckets: { label: string; value: number; intensity: number }[] = [];
    const steps =
      range === "Day"
        ? 24
        : range === "Week"
        ? 7
        : range === "Month"
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        : 12;

    for (let i = 0; i < steps; i++) {
      let date = new Date(rangeStart);
      let label = "";

      if (range === "Day") {
        date.setHours(i);
        label =
          i % 6 === 0
            ? i === 0
              ? "12am"
              : i === 12
              ? "12pm"
              : i > 12
              ? `${i - 12}pm`
              : `${i}am`
            : "";
      } else if (range === "Week") {
        date.setDate(date.getDate() + i);
        label = date.toLocaleDateString("en-US", { weekday: "narrow" });
      } else if (range === "Month") {
        date.setDate(i + 1);
        label = (i + 1) % 5 === 0 || i === 0 ? (i + 1).toString() : "";
      } else if (range === "Year") {
        date.setMonth(i);
        label = date.toLocaleDateString("en-US", { month: "narrow" });
      }

      const periodStart = date.getTime();
      let periodEnd = 0;

      if (range === "Day") periodEnd = periodStart + 3600000;
      else if (range === "Week" || range === "Month")
        periodEnd = periodStart + 86400000;
      else
        periodEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          1
        ).getTime();

      const completedTasks = tasks.filter(
        (t) =>
          t.completedAt &&
          t.completedAt >= periodStart &&
          t.completedAt < periodEnd
      ).length;
      const sessions = focusSessions.filter(
        (s) => s.startTime >= periodStart && s.startTime < periodEnd
      ).length;
      const total = completedTasks + sessions;

      buckets.push({ label, value: total, intensity: total });
    }
    return buckets;
  }, [range, tasks, focusSessions, rangeStart]);

  const maxActivity = Math.max(...activityChartData.map((d) => d.value), 1);

  // 2. Mood Chart Data
  const moodChartData = React.useMemo(() => {
    const buckets: { label: string; value: number; color: string }[] = [];
    const steps =
      range === "Day"
        ? 24
        : range === "Week"
        ? 7
        : range === "Month"
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        : 12;

    for (let i = 0; i < steps; i++) {
      let date = new Date(rangeStart);
      let label = "";
      if (range === "Day") {
        date.setHours(i);
        label = i % 6 === 0 ? `${i}h` : "";
      } else if (range === "Week") {
        date.setDate(date.getDate() + i);
        label = date.toLocaleDateString("en-US", { weekday: "narrow" });
      } else if (range === "Month") {
        date.setDate(i + 1);
        label = (i + 1) % 5 === 0 ? (i + 1).toString() : "";
      } else {
        date.setMonth(i);
        label = date.toLocaleDateString("en-US", { month: "narrow" });
      }

      const periodStart = date.getTime();
      let periodEnd = 0;
      if (range === "Day") periodEnd = periodStart + 3600000;
      else if (range === "Week" || range === "Month")
        periodEnd = periodStart + 86400000;
      else
        periodEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          1
        ).getTime();

      const entries = journalEntries.filter(
        (j) =>
          !j.deletedAt && j.createdAt >= periodStart && j.createdAt < periodEnd
      );

      let avgMood = 0;
      let color = "#f3f4f6";

      if (entries.length > 0) {
        const sum = entries.reduce(
          (acc, curr) => acc + MOOD_VALUES[curr.mood],
          0
        );
        avgMood = sum / entries.length;
        const roundedMood = Math.round(avgMood);
        if (roundedMood >= 5) color = MOOD_COLORS.awesome;
        else if (roundedMood >= 4) color = MOOD_COLORS.good;
        else if (roundedMood >= 3) color = MOOD_COLORS.neutral;
        else if (roundedMood >= 2) color = MOOD_COLORS.bad;
        else color = MOOD_COLORS.awful;
      }
      buckets.push({ label, value: avgMood, color });
    }
    return buckets;
  }, [range, journalEntries, rangeStart]);

  // 3. Breakdown Data (Updated to Habit/Task/Routine)
  const breakdownData = React.useMemo(() => {
    const counts: Record<string, number> = {
      Habits: 0,
      Tasks: 0,
      Routines: 0,
    };
    let total = 0;

    filteredSessions.forEach((s) => {
      if (s.routineId.startsWith("habit-focus-")) {
        counts["Habits"] += s.durationSeconds;
      } else if (s.routineId.startsWith("task-")) {
        counts["Tasks"] += s.durationSeconds;
      } else {
        counts["Routines"] += s.durationSeconds;
      }
      total += s.durationSeconds;
    });

    return Object.entries(counts)
      .filter(([_, val]) => val > 0)
      .map(([label, value]) => ({
        label,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color:
          label === "Habits"
            ? "#10b981"
            : label === "Tasks"
            ? "#3b82f6"
            : "#a78bfa",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions]);

  // 4. Timeline Data - LIMITED TO 2 ITEMS
  const timelineData = React.useMemo(() => {
    const items: {
      id: string;
      type: "task" | "session" | "journal";
      timestamp: number;
      title: string;
      subtitle?: string;
      icon: any;
      color: string;
      item: any;
    }[] = [];
    tasks
      .filter((t) => t.isCompleted && t.completedAt)
      .forEach((t) => {
        items.push({
          id: t.id,
          type: "task",
          timestamp: t.completedAt!,
          title: t.title,
          subtitle: "Task Completed",
          icon: CheckCircle2,
          color: "text-blue-500 bg-blue-50",
          item: t,
        });
      });
    focusSessions.forEach((s) => {
      items.push({
        id: s.id,
        type: "session",
        timestamp: s.endTime,
        title: s.routineTitle,
        subtitle: `${formatDurationShort(s.durationSeconds)} Focus`,
        icon: Zap,
        color: "text-amber-500 bg-amber-50",
        item: s,
      });
    });
    journalEntries
      .filter((j) => !j.deletedAt)
      .forEach((j) => {
        items.push({
          id: j.id,
          type: "journal",
          timestamp: j.createdAt,
          title: j.title,
          subtitle: `Mood: ${j.mood}`,
          icon: Smile,
          color: "text-purple-500 bg-purple-50",
          item: j,
        });
      });
    // Sort by recent first, then slice to top 2
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
  }, [tasks, focusSessions, journalEntries]);

  // --- Renderers ---
  const renderBarChart = (
    data: typeof activityChartData,
    max: number,
    colorBase: string
  ) => (
    <div className="w-full h-full flex items-end justify-between gap-1 pt-6 pb-2">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col justify-end h-full group relative min-w-[4px]"
        >
          <div
            className="w-full rounded-md transition-all duration-500 hover:opacity-100 relative"
            style={{
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              backgroundColor: colorBase,
              opacity: d.value === 0 ? 0.05 : Math.max(0.3, d.value / max),
            }}
          >
            {d.value > 0 && (
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                {d.value} Activities
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMoodChart = (data: typeof moodChartData) => (
    <div className="w-full h-full flex items-end justify-between gap-1 pt-6 pb-2">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col justify-end h-full group relative min-w-[4px]"
        >
          <div
            className="w-full rounded-md transition-all duration-500 hover:brightness-90 relative"
            style={{
              height: `${d.value === 0 ? 4 : (d.value / 5) * 100}%`,
              backgroundColor: d.color,
            }}
          >
            {d.value > 0 && (
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                Score: {d.value.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full p-4 md:p-8 space-y-6 animate-fade-in pb-32 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm overflow-x-auto">
          {(["Day", "Week", "Month", "Year"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                range === r
                  ? "bg-black text-white shadow-md"
                  : "text-gray-400 hover:text-black hover:bg-gray-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onQuickAction("dump")}
          className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-100 p-4 rounded-3xl flex flex-col items-start gap-3 transition-all group active:scale-95"
        >
          <div className="bg-yellow-200 p-2.5 rounded-2xl text-yellow-700 group-hover:scale-110 transition-transform">
            <Brain size={24} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-gray-900 text-lg">
              Brain Dump
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Unload your mind
            </span>
          </div>
        </button>
        <button
          onClick={() => onQuickAction("task")}
          className="bg-blue-50 hover:bg-blue-100 border border-blue-100 p-4 rounded-3xl flex flex-col items-start gap-3 transition-all group active:scale-95"
        >
          <div className="bg-blue-200 p-2.5 rounded-2xl text-blue-700 group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-gray-900 text-lg">
              Quick Task
            </span>
            <span className="text-xs text-gray-500 font-medium">Add to-do</span>
          </div>
        </button>
        <button
          onClick={() => onQuickAction("focus")}
          className="bg-purple-50 hover:bg-purple-100 border border-purple-100 p-4 rounded-3xl flex flex-col items-start gap-3 transition-all group active:scale-95"
        >
          <div className="bg-purple-200 p-2.5 rounded-2xl text-purple-700 group-hover:scale-110 transition-transform">
            <Zap size={24} fill="currentColor" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-gray-900 text-lg">
              Focus Now
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Go to Routines
            </span>
          </div>
        </button>
        <button
          onClick={() => onQuickAction("journal")}
          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-4 rounded-3xl flex flex-col items-start gap-3 transition-all group active:scale-95"
        >
          <div className="bg-emerald-200 p-2.5 rounded-2xl text-emerald-700 group-hover:scale-110 transition-transform">
            <Smile size={24} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-gray-900 text-lg">
              Log Mood
            </span>
            <span className="text-xs text-gray-500 font-medium">Check in</span>
          </div>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-xl text-white">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Activity Level
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {activityChartData.reduce((a, b) => a + b.value, 0)}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Total Actions
              </span>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-6">
              <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
              <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
              <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            </div>
            {renderBarChart(activityChartData, maxActivity, "#000000")}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {activityChartData
              .filter(
                (_, i) => i % Math.ceil(activityChartData.length / 6) === 0
              )
              .map((d, i) => (
                <span key={i}>{d.label}</span>
              ))}
          </div>
        </div>

        {/* 2. Breakdown Panel */}
        <div className="bg-white border border-gray-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <PieChart size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Focus Breakdown</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center relative gap-6">
            {breakdownData.length === 0 ? (
              <div className="text-gray-400 text-sm font-medium italic">
                No focus data yet.
              </div>
            ) : (
              <>
                <div className="w-32 h-32 rounded-full border-[16px] border-gray-100 relative">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(${breakdownData
                        .map((d, i, arr) => {
                          const prev = arr
                            .slice(0, i)
                            .reduce((a, c) => a + c.percent, 0);
                          return `${d.color} ${prev}% ${prev + d.percent}%`;
                        })
                        .join(", ")})`,
                    }}
                  ></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">
                      DIST
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {breakdownData.map((d, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                        <span className="truncate max-w-[120px]">
                          {d.label}
                        </span>
                        <span>{Math.round(d.percent)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${d.percent}%`,
                            backgroundColor: d.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Mood Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                <Smile size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mood Trends</h3>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-6">
              {[5, 4, 3, 2, 1].map((lvl) => (
                <div
                  key={lvl}
                  className="w-full h-px bg-gray-50 border-t border-dashed border-gray-100 relative"
                >
                  <span className="absolute -left-6 -top-2 text-[9px] text-gray-300 font-bold">
                    {lvl}
                  </span>
                </div>
              ))}
            </div>
            <div className="pl-6 h-full">{renderMoodChart(moodChartData)}</div>
          </div>
          <div className="pl-6 flex justify-between mt-2 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {moodChartData
              .filter((_, i) => i % Math.ceil(moodChartData.length / 6) === 0)
              .map((d, i) => (
                <span key={i}>{d.label}</span>
              ))}
          </div>
        </div>

        {/* 4. Activity Timeline - Limited to 2 items */}
        <div className="lg:row-span-2 bg-white border border-gray-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col h-auto">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <Activity size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Activity Feed</h3>
            </div>
            <button
              onClick={() => onViewChange("activity")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative pl-4 pr-1 min-h-0">
            <div className="absolute left-[27px] top-4 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="space-y-6 pb-4">
              {timelineData.map((item, i) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() =>
                    setSelectedActivity({
                      id: item.id,
                      type: item.type,
                      item: item.item,
                    })
                  }
                  className="relative flex items-start gap-4 group min-h-[50px] w-full text-left hover:bg-gray-50/50 p-2 -ml-2 rounded-xl transition-colors"
                >
                  <div
                    className={`w-6 h-6 rounded-full border-4 border-white shrink-0 z-10 flex items-center justify-center shadow-sm relative top-1 ${item.color}`}
                  >
                    <item.icon size={12} strokeWidth={3} />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      <span className="text-[9px] opacity-50">
                        {new Date(item.timestamp).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 leading-normal truncate mb-1">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {timelineData.length === 0 && (
                <p className="text-gray-400 text-sm font-medium italic pl-10">
                  No recent activity.
                </p>
              )}
              {timelineData.length > 0 && (
                <div className="text-center text-xs text-gray-400 pt-2">
                  See {activityChartData.reduce((a, b) => a + b.value, 0) - 2}{" "}
                  more in Activity
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-16"></div>
      </div>

      {/* Activity Details Popup - Full Screen Blur Overlay */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Activity Details
              </h2>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {selectedActivity.type === "task" && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900">
                    {selectedActivity.item.title}
                  </h3>
                  <p className="text-center text-sm text-gray-500">
                    Completed on{" "}
                    {new Date(
                      selectedActivity.item.completedAt
                    ).toLocaleString()}
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category</span>
                      <span className="font-bold">
                        {selectedActivity.item.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration Est.</span>
                      <span className="font-bold">
                        {selectedActivity.item.duration}m
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Priority</span>
                      <span className="font-bold">
                        {selectedActivity.item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {selectedActivity.type === "session" && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-2">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900">
                    {selectedActivity.item.routineTitle}
                  </h3>
                  <p className="text-center text-sm text-gray-500">
                    Session ended on{" "}
                    {new Date(selectedActivity.item.endTime).toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <div className="text-xs text-gray-400 font-bold uppercase">
                        Duration
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round(selectedActivity.item.durationSeconds / 60)}
                        m
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <div className="text-xs text-gray-400 font-bold uppercase">
                        Steps
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {selectedActivity.item.completedSteps} /{" "}
                        {selectedActivity.item.totalSteps}
                      </div>
                    </div>
                  </div>
                  {selectedActivity.item.logs &&
                    selectedActivity.item.logs.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Step Breakdown
                        </h4>
                        <div className="space-y-2">
                          {selectedActivity.item.logs.map(
                            (log: any, i: number) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg"
                              >
                                <span className="truncate flex-1">
                                  {log.title}
                                </span>
                                <span className="font-mono text-gray-500">
                                  {Math.floor(log.actualDuration / 60)}m{" "}
                                  {log.actualDuration % 60}s
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
              {selectedActivity.type === "journal" && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600 mb-2">
                    <Smile size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900">
                    {selectedActivity.item.title}
                  </h3>
                  <p className="text-center text-sm text-gray-500">
                    {new Date(selectedActivity.item.createdAt).toLocaleString()}
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mt-2">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedActivity.item.content}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {selectedActivity.item.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
