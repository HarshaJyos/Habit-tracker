import * as React from "react";
import { ViewState } from "../types";
import {
  LayoutDashboard,
  ListTodo,
  PlayCircle,
  BookOpen,
  Calendar as CalendarIcon,
  StickyNote,
  Trash2,
  Brain,
  Briefcase,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  miniPlayer?: React.ReactNode;
  uiScale: number;
  onScaleChange: (scale: number) => void;
}

// Icon Mapping for all views
const VIEW_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  dump: Brain,
  trash: Trash2,
  calendar: CalendarIcon,
  tasks: ListTodo,
  projects: Briefcase,
  habits: CheckCircle,
  routines: PlayCircle,
  notes: StickyNote,
  journal: BookOpen,
  settings: LayoutDashboard, // Fallback
  activity: LayoutDashboard, // Fallback
};

// Mobile Navigation Stacks
const MOBILE_NAV_GROUPS = [
  { id: "dash_group", views: ["dashboard"] as ViewState[] },
  { id: "capture_group", views: ["dump", "trash"] as ViewState[] },
  { id: "plan_group", views: ["calendar", "tasks", "projects"] as ViewState[] },
  { id: "habit_group", views: ["habits", "routines"] as ViewState[] },
  { id: "record_group", views: ["notes", "journal"] as ViewState[] },
];

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onViewChange,
  miniPlayer,
  uiScale,
  onScaleChange,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "dump", label: "Brain Dump", icon: Brain },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "habits", label: "Habits", icon: CheckCircle },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "routines", label: "Routines", icon: PlayCircle },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  // Views that should take up 100% width/height without padding
  const isFullWidthView =
    currentView === "calendar" ||
    currentView === "notes" ||
    currentView === "projects" ||
    currentView === "habits" ||
    currentView === "dump" ||
    currentView === "tasks";

  const handleZoom = (direction: "in" | "out") => {
    const step = 0.1;
    const newScale = direction === "in" ? uiScale + step : uiScale - step;
    onScaleChange(
      Math.max(0.5, Math.min(1.5, parseFloat(newScale.toFixed(1))))
    );
  };

  const resetZoom = () => onScaleChange(1);

  // Mobile Nav Logic
  const handleMobileNavClick = (views: ViewState[]) => {
    if (views.includes(currentView)) {
      // Cycle to next view in stack
      const currentIndex = views.indexOf(currentView);
      const nextIndex = (currentIndex + 1) % views.length;
      onViewChange(views[nextIndex]);
    } else {
      // Activate first view in stack
      onViewChange(views[0]);
    }
  };

  return (
    // Apply Zoom to the wrapper. We must compensate height/width to prevent clipping when zoomed in.
    <div
      className="fixed inset-0 bg-gray-50 text-gray-900 font-sans overflow-hidden flex transition-all duration-200 ease-out"
      style={{
        zoom: uiScale,
        height: `calc(100dvh / ${uiScale})`,
        width: `calc(100vw / ${uiScale})`,
      }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 shadow-[2px_0_24px_-12px_rgba(0,0,0,0.05)] z-[70] relative shrink-0 h-full">
        <div className="flex items-center gap-3 mb-8 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="font-bold text-white">L</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            LifeFlow
          </h1>
        </div>

        {/* Mini Player Section (if active) */}
        {miniPlayer && (
          <div className="mb-6 animate-fade-in-down shrink-0">{miniPlayer}</div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 min-h-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? "bg-gray-100 text-black font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                size={20}
                strokeWidth={currentView === item.id ? 2.5 : 2}
              />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Zoom Controls - Counter Scaled to maintain size. Hidden in Focus Mode. */}
        {currentView !== "routine-player" && (
          <div
            className="mt-auto pt-6 border-t border-gray-100 shrink-0"
            style={{ zoom: 1 / uiScale }}
          >
            <div className="bg-gray-50 rounded-xl p-1.5 flex items-center justify-between shadow-sm border border-gray-200">
              <button
                onClick={() => handleZoom("out")}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-black transition-all"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <span
                className="text-xs font-bold text-gray-500 tabular-nums cursor-pointer select-none"
                onDoubleClick={resetZoom}
                title="Double click to reset"
              >
                {Math.round(uiScale * 100)}%
              </span>
              <button
                onClick={() => handleZoom("in")}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-black transition-all"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50">
        {/* Conditional container: Full width/height for certain modules, padded scrollable for others */}
        <div
          className={`flex-1 flex flex-col h-full ${
            isFullWidthView
              ? "overflow-hidden p-0"
              : "overflow-y-auto p-4 md:p-6 pb-24 md:pb-12 custom-scrollbar"
          }`}
        >
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-[70] h-16 shrink-0">
        {miniPlayer && (
          <div className="absolute bottom-full left-0 right-0 p-2 bg-gradient-to-t from-white to-transparent pointer-events-none">
            <div className="pointer-events-auto">{miniPlayer}</div>
          </div>
        )}
        <div className="flex justify-around items-center h-full px-2 relative">
          {MOBILE_NAV_GROUPS.map((group) => {
            const isActive = group.views.includes(currentView);

            // If active, show the icon of the current view.
            // If inactive, show the icon of the FIRST view in the stack.
            const viewToRender = isActive ? currentView : group.views[0];
            const IconComponent = VIEW_ICONS[viewToRender] || LayoutDashboard;

            return (
              <button
                key={group.id}
                onClick={() => handleMobileNavClick(group.views)}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
              >
                <IconComponent size={24} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
