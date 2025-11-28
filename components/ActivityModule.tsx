import * as React from "react";
import { Task, FocusSession, JournalEntry } from "../types";
import {
  Activity,
  CheckCircle2,
  Zap,
  Smile,
  Trash2,
  Filter,
  ArrowLeft,
  X,
} from "lucide-react";

interface ActivityModuleProps {
  tasks: Task[];
  focusSessions: FocusSession[];
  journalEntries: JournalEntry[];
  onDeleteActivity: (id: string, type: "task" | "session" | "journal") => void;
  onBack: () => void;
}

type FilterType = "all" | "task" | "session" | "journal";
type TimeRange = "day" | "week" | "month" | "all";

export const ActivityModule: React.FC<ActivityModuleProps> = ({
  tasks,
  focusSessions,
  journalEntries,
  onDeleteActivity,
  onBack,
}) => {
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [range, setRange] = React.useState<TimeRange>("week");
  const [selectedActivity, setSelectedActivity] = React.useState<{
    id: string;
    type: "task" | "session" | "journal";
    item: any;
  } | null>(null);

  const getRangeStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (range === "day") return now.getTime();
    if (range === "week") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.getTime();
    }
    if (range === "month") {
      const d = new Date(now);
      d.setDate(1);
      return d.getTime();
    }
    return 0;
  };

  const filteredItems = React.useMemo(() => {
    const start = getRangeStart();
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

    if (filter === "all" || filter === "task") {
      tasks
        .filter((t) => t.isCompleted && t.completedAt && t.completedAt >= start)
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
    }

    if (filter === "all" || filter === "session") {
      focusSessions
        .filter((s) => s.startTime >= start)
        .forEach((s) => {
          const duration = Math.round(s.durationSeconds / 60);
          items.push({
            id: s.id,
            type: "session",
            timestamp: s.endTime,
            title: s.routineTitle,
            subtitle: `${duration}m Focus Session`,
            icon: Zap,
            color: "text-amber-500 bg-amber-50",
            item: s,
          });
        });
    }

    if (filter === "all" || filter === "journal") {
      journalEntries
        .filter((j) => !j.deletedAt && j.createdAt >= start)
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
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks, focusSessions, journalEntries, filter, range]);

  return (
    <div className="w-full h-full flex flex-col bg-white animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-emerald-500" /> Activity History
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(["all", "task", "session", "journal"] as FilterType[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${
                    filter === f
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              )
            )}
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(["day", "week", "month", "all"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${
                  range === r
                    ? "bg-white shadow-sm text-black"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-gray-50/50">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() =>
                setSelectedActivity({
                  id: item.id,
                  type: item.type,
                  item: item.item,
                })
              }
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer hover:border-gray-300"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}
              >
                <item.icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-900 truncate">
                  {item.title}
                </h4>
                {item.subtitle && (
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteActivity(item.id, item.type);
                }}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Record"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Filter size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">
                No records found for this filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Popup - Full Screen Blur Overlay */}
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
