import * as React from "react";
import {
  Task,
  Routine,
  JournalEntry,
  Note,
  Dump,
  Project,
  Habit,
} from "../types";
import {
  Trash2,
  RotateCcw,
  CheckSquare,
  PlayCircle,
  BookOpen,
  StickyNote,
  Brain,
  Briefcase,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface RestoreModuleProps {
  tasks: Task[];
  routines: Routine[];
  journalEntries: JournalEntry[];
  notes: Note[];
  dumps?: Dump[];
  projects?: Project[];
  habits?: Habit[];
  onRestore: (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => void;
  onDeleteForever: (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => void;
  onExport?: () => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset?: () => void;
}

type TabType =
  | "all"
  | "task"
  | "routine"
  | "habit"
  | "journal"
  | "note"
  | "dump"
  | "project";

export const RestoreModule: React.FC<RestoreModuleProps> = ({
  tasks,
  routines,
  journalEntries,
  notes,
  dumps = [],
  projects = [],
  habits = [],
  onRestore,
  onDeleteForever,
  onExport,
  onImport,
  onReset,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>("all");

  // Collect all deleted items
  const deletedTasks = tasks.filter((t) => t.deletedAt);
  const deletedRoutines = routines.filter((r) => r.deletedAt);
  const deletedJournal = journalEntries.filter((j) => j.deletedAt);
  const deletedNotes = notes.filter((n) => n.deletedAt);
  const deletedDumps = dumps.filter((d) => d.deletedAt);
  const deletedProjects = projects.filter((p) => p.deletedAt);
  const deletedHabits = habits.filter((h) => h.deletedAt);

  const getItems = () => {
    const allItems = [
      ...deletedTasks.map((i) => ({
        ...i,
        content: i.description || "",
        type: "task" as const,
      })),
      ...deletedRoutines.map((i) => ({
        ...i,
        content: `${i.steps.length} steps`,
        type: "routine" as const,
      })),
      ...deletedJournal.map((i) => ({
        ...i,
        content: i.content,
        type: "journal" as const,
      })),
      ...deletedNotes.map((i) => ({
        ...i,
        content: i.content || (i.items ? `${i.items.length} items` : ""),
        type: "note" as const,
      })),
      ...deletedDumps.map((i) => ({
        ...i,
        content: i.description,
        type: "dump" as const,
      })),
      ...deletedProjects.map((i) => ({
        ...i,
        content: i.description,
        type: "project" as const,
      })),
      ...deletedHabits.map((i) => ({
        ...i,
        content: i.description || `${i.frequency.type} goal`,
        type: "habit" as const,
      })),
    ];

    if (activeTab === "all")
      return allItems.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    return allItems
      .filter((i) => i.type === activeTab)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  };

  const items = getItems();

  const getIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare size={16} />;
      case "routine":
        return <PlayCircle size={16} />;
      case "journal":
        return <BookOpen size={16} />;
      case "note":
        return <StickyNote size={16} />;
      case "dump":
        return <Brain size={16} />;
      case "project":
        return <Briefcase size={16} />;
      case "habit":
        return <CheckCircle size={16} />;
      default:
        return <Trash2 size={16} />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "task":
        return "Task";
      case "routine":
        return "Routine";
      case "journal":
        return "Log";
      case "note":
        return "Note";
      case "dump":
        return "Idea";
      case "project":
        return "Project";
      case "habit":
        return "Habit";
      default:
        return "Item";
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar pb-24 bg-gray-50/50">
      {/* Header & Data Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 mb-6 gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Trash2 className="text-black" size={28} /> Trash & Data
          </h2>
          <p className="text-gray-500 mt-1 text-sm hidden md:block">
            Restore deleted items or manage your data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="bg-white border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
              title="Export Data"
            >
              <Download size={18} />{" "}
              <span className="hidden md:inline">Export</span>
            </button>
          )}
          {onImport && (
            <label
              className="bg-white border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Import Data"
            >
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
              <Upload size={18} />{" "}
              <span className="hidden md:inline">Import</span>
            </label>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
              title="Reset App"
            >
              <AlertTriangle size={18} />{" "}
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-4 shrink-0">
        {(
          [
            "all",
            "task",
            "routine",
            "habit",
            "project",
            "note",
            "journal",
            "dump",
          ] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-black text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-all group"
          >
            <div
              className={`p-3 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-black transition-colors`}
            >
              {getIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {getLabel(item.type)}
                </span>
                <span className="text-[10px] text-gray-400">
                  Deleted {new Date(item.deletedAt!).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 truncate">
                {item.title || "Untitled"}
              </h3>
              {item.content && (
                <p className="text-xs text-gray-500 truncate opacity-70">
                  {item.content}
                </p>
              )}
            </div>

            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRestore(item.id, item.type)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold text-xs transition-colors"
                title="Restore"
              >
                <RotateCcw size={14} />{" "}
                <span className="hidden md:inline">Restore</span>
              </button>
              <button
                onClick={() => onDeleteForever(item.id, item.type)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors"
                title="Delete Forever"
              >
                <Trash2 size={14} />{" "}
                <span className="hidden md:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <Trash2 size={40} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Trash is empty.</p>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 justify-center">
        <Info size={12} />
        <span>
          Items in trash are not permanently deleted until you choose to do so.
        </span>
      </div>
    </div>
  );
};
