import React, { useState, useEffect, useRef } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { TaskModule } from "./components/TaskModule";
import { RoutineModule } from "./components/RoutineModule";
import { JournalModule } from "./components/JournalModule";
import { RoutinePlayer, MiniPlayer } from "./components/RoutinePlayer";
import { CalendarModule } from "./components/CalendarModule";
import { NotesModule } from "./components/NotesModule";
import { RestoreModule } from "./components/RestoreModule";
import { BrainDumpModule } from "./components/BrainDumpModule";
import { ProjectModule } from "./components/ProjectModule";
import { HabitModule } from "./components/HabitModule";
import { ActivityModule } from "./components/ActivityModule";
import {
  Task,
  Routine,
  RoutineStep,
  JournalEntry,
  ViewState,
  Note,
  FocusSession,
  Dump,
  Project,
  Habit,
  PausedRoutine,
  StepLog,
  Reminder,
} from "./types";
import { playSound } from "./utils/sounds";

const STORAGE_KEYS = {
  TASKS: "lifeflow_tasks",
  ROUTINES: "lifeflow_routines",
  JOURNAL: "lifeflow_journal",
  NOTES: "lifeflow_notes",
  SESSIONS: "lifeflow_sessions",
  DUMPS: "lifeflow_dumps",
  PROJECTS: "lifeflow_projects",
  HABITS: "lifeflow_habits",
  PAUSED: "lifeflow_paused_routines",
  UI_SCALE: "lifeflow_ui_scale",
};

const INITIAL_ROUTINES: Routine[] = [
  {
    id: "r1",
    title: "Morning Protocol",
    color: "bg-indigo-600",
    type: "repeatable",
    steps: [
      { id: "s1", title: "Drink Water", durationSeconds: 60 },
      { id: "s2", title: "Meditation", durationSeconds: 300 },
      { id: "s3", title: "Quick Stretch", durationSeconds: 180 },
    ],
  },
];

// Worker Code Inlined to prevent cross-origin issues
const TIMER_WORKER_CODE = `
let timerId = null;

self.onmessage = (e) => {
  if (e.data === 'start') {
    if (!timerId) {
      timerId = setInterval(() => {
        postMessage('tick');
      }, 1000);
    }
  } else if (e.data === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
`;

const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");

  const [tasks, setTasks] = useState<Task[]>(() =>
    loadState(STORAGE_KEYS.TASKS, [])
  );
  const [routines, setRoutines] = useState<Routine[]>(() =>
    loadState(STORAGE_KEYS.ROUTINES, INITIAL_ROUTINES)
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadState(STORAGE_KEYS.JOURNAL, [])
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    loadState(STORAGE_KEYS.NOTES, [])
  );
  const [dumps, setDumps] = useState<Dump[]>(() =>
    loadState(STORAGE_KEYS.DUMPS, [])
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadState(STORAGE_KEYS.PROJECTS, [])
  );
  const [habits, setHabits] = useState<Habit[]>(() =>
    loadState(STORAGE_KEYS.HABITS, [])
  );
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() =>
    loadState(STORAGE_KEYS.SESSIONS, [])
  );
  const [pausedRoutines, setPausedRoutines] = useState<PausedRoutine[]>(() =>
    loadState(STORAGE_KEYS.PAUSED, [])
  );

  // UI Scale State
  const [uiScale, setUiScale] = useState<number>(() =>
    loadState(STORAGE_KEYS.UI_SCALE, 1)
  );

  const [triggerTaskModal, setTriggerTaskModal] = useState(false);
  const [triggerDumpModal, setTriggerDumpModal] = useState(false);
  const [triggerJournalModal, setTriggerJournalModal] = useState(false);

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [playerState, setPlayerState] = useState({
    steps: [] as RoutineStep[],
    currentStepIndex: 0,
    timeElapsedInStep: 0,
    stepLogs: [] as StepLog[],
    isPlaying: false,
    isMinimized: false,
  });

  const [journalPrompt, setJournalPrompt] = useState<string>("");
  const [convertingDump, setConvertingDump] = useState<Dump | null>(null);

  // Web Worker Ref
  const timerWorkerRef = useRef<Worker | null>(null);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }, [routines]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries));
  }, [journalEntries]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(focusSessions));
  }, [focusSessions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DUMPS, JSON.stringify(dumps));
  }, [dumps]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAUSED, JSON.stringify(pausedRoutines));
  }, [pausedRoutines]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UI_SCALE, JSON.stringify(uiScale));
  }, [uiScale]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeRoutine) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeRoutine]);

  // --- Worker Timer Logic ---
  useEffect(() => {
    if (typeof Worker !== "undefined") {
      try {
        // Create a Blob from the inlined worker code
        const blob = new Blob([TIMER_WORKER_CODE], {
          type: "application/javascript",
        });
        const workerUrl = URL.createObjectURL(blob);

        timerWorkerRef.current = new Worker(workerUrl);

        timerWorkerRef.current.onmessage = (e) => {
          if (e.data === "tick") {
            setPlayerState((prev) => {
              if (!prev.isPlaying) return prev;
              return { ...prev, timeElapsedInStep: prev.timeElapsedInStep + 1 };
            });
          }
        };

        // Cleanup: terminate worker and revoke URL
        return () => {
          timerWorkerRef.current?.terminate();
          URL.revokeObjectURL(workerUrl);
        };
      } catch (e) {
        console.error("Failed to create worker:", e);
      }
    }
  }, []); // Run once on mount

  // Control Worker based on playing state
  useEffect(() => {
    if (activeRoutine && playerState.isPlaying) {
      timerWorkerRef.current?.postMessage("start");
    } else {
      timerWorkerRef.current?.postMessage("stop");
    }
  }, [activeRoutine, playerState.isPlaying]);

  // --- Reminder System ---
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      const checkItemReminders = (
        id: string,
        title: string,
        startTime: number,
        reminders?: Reminder[]
      ) => {
        if (reminders) {
          reminders.forEach((r) => {
            const reminderTime = startTime - r.timeOffset * 60000;
            const rDiffMs = reminderTime - now;
            if (rDiffMs <= 0 && rDiffMs > -60000) {
              playSound("REMINDER");
              if (Notification.permission === "granted") {
                new Notification(`Reminder: ${title}`, {
                  body:
                    r.timeOffset === 0
                      ? "Starting now!"
                      : `Starting in ${r.timeOffset} minutes.`,
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }
          });
        }
      };

      tasks
        .filter((t) => !t.isCompleted && !t.deletedAt && t.startTime)
        .forEach((t) =>
          checkItemReminders(t.id, t.title, t.startTime!, t.reminders)
        );
      routines
        .filter((r) => !r.completedAt && !r.deletedAt && r.startTime)
        .forEach((r) =>
          checkItemReminders(r.id, r.title, r.startTime!, r.reminders)
        );
      projects
        .filter((p) => p.status === "active" && !p.deletedAt)
        .forEach((p) =>
          checkItemReminders(p.id, p.title, p.dueDate, p.reminders)
        );
    };

    const reminderInterval = setInterval(checkReminders, 60000);
    return () => clearInterval(reminderInterval);
  }, [tasks, routines, projects]);

  // --- Sorting & Reordering Handlers ---
  const handleReorderRoutines = (newOrder: Routine[]) => setRoutines(newOrder);
  const handleReorderHabits = (newOrder: Habit[]) => setHabits(newOrder);
  const handleReorderProjects = (newOrder: Project[]) => setProjects(newOrder);
  const handleReorderNotes = (newOrder: Note[]) => setNotes(newOrder);

  // --- Recurrence Helper ---
  const generateRecurringTasks = (baseTask: Task): Task[] => {
    if (!baseTask.recurrence || !baseTask.startTime) return [baseTask];

    const config = baseTask.recurrence;
    const generatedTasks: Task[] = [baseTask];
    const seriesId = baseTask.seriesId || Date.now().toString();

    if (!baseTask.seriesId) baseTask.seriesId = seriesId;

    let lastDate = new Date(baseTask.startTime);

    for (let i = 1; i < config.instancesToGenerate; i++) {
      const nextDate = new Date(lastDate);

      if (config.type === "daily") {
        nextDate.setDate(nextDate.getDate() + config.interval);
      } else if (config.type === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7 * config.interval);
      } else if (config.type === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + config.interval);
      } else if (config.type === "specific_days" && config.daysOfWeek) {
        let found = false;
        for (let d = 1; d <= 365; d++) {
          nextDate.setDate(nextDate.getDate() + 1);
          if (config.daysOfWeek.includes(nextDate.getDay())) {
            found = true;
            break;
          }
        }
        if (!found) break;
      }

      const newTask: Task = {
        ...baseTask,
        id: `${seriesId}-${i}-${Date.now()}`,
        startTime: nextDate.getTime(),
        isCompleted: false,
        seriesId: seriesId,
        recurrence: { ...config, instancesToGenerate: 0 },
      };
      generatedTasks.push(newTask);
      lastDate = nextDate;
    }
    return generatedTasks;
  };

  const calculateHabitStreak = (
    habit: Habit,
    historyOverride?: Record<string, number>
  ): number => {
    const history = historyOverride || habit.history;
    const { frequency, goal, type } = habit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const getVal = (d: Date) => history[d.toISOString().split("T")[0]] || 0;
    const isCompleted = (val: number) => {
      if (val === -1) return false;
      if (type === "elastic") return val >= 1;
      return val >= goal.target;
    };

    const todayVal = getVal(today);
    const yesterdayVal = getVal(yesterday);
    let streak = 0;
    let checkDate: Date;

    if (isCompleted(todayVal)) {
      streak = 1;
      checkDate = yesterday;
    } else if (isCompleted(yesterdayVal)) {
      streak = 1;
      checkDate = new Date(yesterday);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return 0;
    }

    for (let i = 0; i < 365; i++) {
      const val = getVal(checkDate);
      let isScheduled = true;
      if (frequency.type === "specific_days" && frequency.daysOfWeek) {
        if (!frequency.daysOfWeek.includes(checkDate.getDay())) {
          isScheduled = false;
        }
      }
      if (val === -1) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      if (isScheduled) {
        if (isCompleted(val)) {
          streak++;
        } else {
          break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const handleQuickAction = (type: "task" | "dump" | "journal" | "focus") => {
    if (type === "task") {
      setTriggerTaskModal(true);
      setCurrentView("tasks");
    } else if (type === "dump") {
      setTriggerDumpModal(true);
      setCurrentView("dump");
    } else if (type === "journal") {
      setTriggerJournalModal(true);
      setCurrentView("journal");
    } else if (type === "focus") {
      setCurrentView("routines");
    }
  };

  const handleSoftDelete = (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => {
    const deletedAt = Date.now();
    if (type === "task")
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, deletedAt } : t))
      );
    if (type === "routine")
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, deletedAt } : r))
      );
    if (type === "journal")
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, deletedAt } : e))
      );
    if (type === "note")
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, deletedAt } : n))
      );
    if (type === "dump")
      setDumps((prev) =>
        prev.map((d) => (d.id === id ? { ...d, deletedAt } : d))
      );
    if (type === "project")
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, deletedAt } : p))
      );
    if (type === "habit")
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, deletedAt } : h))
      );
  };

  const handleArchive = (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => {
    const archivedAt = Date.now();
    if (type === "task")
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, archivedAt } : t))
      );
    if (type === "routine")
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, archivedAt } : r))
      );
    if (type === "journal")
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, archivedAt } : e))
      );
    if (type === "note")
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, archivedAt } : n))
      );
    if (type === "dump")
      setDumps((prev) =>
        prev.map((d) => (d.id === id ? { ...d, archivedAt } : d))
      );
    if (type === "project")
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, archivedAt } : p))
      );
    if (type === "habit")
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, archivedAt } : h))
      );
  };

  const handleUnarchive = (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => {
    if (type === "task")
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, archivedAt: undefined } : t))
      );
    if (type === "routine")
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, archivedAt: undefined } : r))
      );
    if (type === "journal")
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, archivedAt: undefined } : e))
      );
    if (type === "note")
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, archivedAt: undefined } : n))
      );
    if (type === "dump")
      setDumps((prev) =>
        prev.map((d) => (d.id === id ? { ...d, archivedAt: undefined } : d))
      );
    if (type === "project")
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, archivedAt: undefined } : p))
      );
    if (type === "habit")
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, archivedAt: undefined } : h))
      );
  };

  // Add these wrapper functions inside your App component (before the return)

  const handleArchiveProject = (id: string) => handleArchive(id, "project");
  const handleUnarchiveProject = (id: string) => handleUnarchive(id, "project");

  const handleArchiveTask = (id: string) => handleArchive(id, "task");
  const handleUnarchiveTask = (id: string) => handleUnarchive(id, "task");

  const handleArchiveRoutine = (id: string) => handleArchive(id, "routine");
  const handleUnarchiveRoutine = (id: string) => handleUnarchive(id, "routine");

  const handleArchiveNote = (id: string) => handleArchive(id, "note");
  const handleUnarchiveNote = (id: string) => handleUnarchive(id, "note");

  const handleArchiveDump = (id: string) => handleArchive(id, "dump");
  const handleUnarchiveDump = (id: string) => handleUnarchive(id, "dump");

  const handleArchiveHabit = (id: string) => handleArchive(id, "habit");
  const handleUnarchiveHabit = (id: string) => handleUnarchive(id, "habit");

  const handleArchiveEntry = (id: string) => handleArchive(id, "journal");
  const handleUnarchiveEntry = (id: string) => handleUnarchive(id, "journal");

  const handleRestore = (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => {
    if (type === "task")
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, deletedAt: undefined, archivedAt: undefined }
            : t
        )
      );
    if (type === "routine")
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, deletedAt: undefined, archivedAt: undefined }
            : r
        )
      );
    if (type === "journal")
      setJournalEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, deletedAt: undefined, archivedAt: undefined }
            : e
        )
      );
    if (type === "note")
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, deletedAt: undefined, archivedAt: undefined }
            : n
        )
      );
    if (type === "dump")
      setDumps((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, deletedAt: undefined, archivedAt: undefined }
            : d
        )
      );
    if (type === "project")
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, deletedAt: undefined, archivedAt: undefined }
            : p
        )
      );
    if (type === "habit")
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, deletedAt: undefined, archivedAt: undefined }
            : h
        )
      );
  };

  const handleHardDelete = (
    id: string,
    type: "task" | "routine" | "journal" | "note" | "dump" | "project" | "habit"
  ) => {
    if (type === "task") setTasks((prev) => prev.filter((t) => t.id !== id));
    if (type === "routine")
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (type === "journal")
      setJournalEntries((prev) => prev.filter((e) => e.id !== id));
    if (type === "note") setNotes((prev) => prev.filter((n) => n.id !== id));
    if (type === "dump") setDumps((prev) => prev.filter((d) => d.id !== id));
    if (type === "project") {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) =>
        prev.map((t) =>
          t.projectId === id ? { ...t, projectId: undefined } : t
        )
      );
    }
    if (type === "habit") setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  // --- Specific CUD Handlers with Recurrence ---
  const handleAddTask = (task: Task) => {
    if (task.recurrence && task.recurrence.instancesToGenerate > 1) {
      const generated = generateRecurringTasks(task);
      setTasks((prev) => [...generated.reverse(), ...prev]);
    } else {
      setTasks((prev) => [task, ...prev]);
    }
  };

  const handleUpdateTask = (task: Task) =>
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  const handleDeleteTask = (id: string) => handleSoftDelete(id, "task");

  const handleAddRoutine = (routine: Routine) =>
    setRoutines((prev) => [...prev, routine]);
  const handleUpdateRoutine = (routine: Routine) =>
    setRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)));
  const handleDeleteRoutine = (id: string) => handleSoftDelete(id, "routine");

  const handleAddJournalEntry = (entry: JournalEntry) =>
    setJournalEntries((prev) => [entry, ...prev]);
  const handleUpdateJournalEntry = (entry: JournalEntry) =>
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? entry : e))
    );
  const handleDeleteJournalEntry = (id: string) =>
    handleSoftDelete(id, "journal");

  const handleAddNote = (note: Note) => setNotes((prev) => [note, ...prev]);
  const handleUpdateNote = (note: Note) =>
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
  const handleDeleteNote = (id: string) => handleSoftDelete(id, "note");

  const handleAddDump = (dump: Dump) => setDumps((prev) => [dump, ...prev]);
  const handleDeleteDump = (id: string) => handleSoftDelete(id, "dump");

  const handleAddProject = (project: Project) =>
    setProjects((prev) => [project, ...prev]);
  const handleUpdateProject = (project: Project) =>
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
  const handleDeleteProject = (id: string) => handleSoftDelete(id, "project");

  const handleAddHabit = (habit: Habit) =>
    setHabits((prev) => [habit, ...prev]);
  const handleUpdateHabit = (habit: Habit) =>
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
  const handleDeleteHabit = (id: string) => handleSoftDelete(id, "habit");

  const handleUpdateHabitProgress = (
    habitId: string,
    date: string,
    value: number
  ) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const newHistory = { ...h.history };
          if (value === 0) delete newHistory[date];
          else newHistory[date] = value;

          const newStreak = calculateHabitStreak({ ...h, history: newHistory });
          return { ...h, history: newHistory, streak: newStreak };
        }
        return h;
      })
    );
  };

  const convertDumpToTask = (dump: Dump) => {
    setConvertingDump(dump);
    setCurrentView("tasks");
  };
  const convertDumpToNote = (dump: Dump) => {
    setConvertingDump(dump);
    setCurrentView("notes");
  };
  const convertDumpToJournal = (dump: Dump) => {
    setConvertingDump(dump);
    setCurrentView("journal");
  };
  const convertDumpToProject = (dump: Dump) => {
    setConvertingDump(dump);
    setCurrentView("projects");
  };

  const handleConvertComplete = () => {
    if (convertingDump) {
      handleDeleteDump(convertingDump.id);
      setConvertingDump(null);
    }
  };

  const startRoutine = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      setActiveRoutine(routine);
      setPlayerState({
        steps: [...routine.steps],
        currentStepIndex: 0,
        timeElapsedInStep: 0,
        stepLogs: [],
        isPlaying: true,
        isMinimized: false,
      });
      setCurrentView("routine-player");
    }
  };

  const resumePausedRoutine = (paused: PausedRoutine) => {
    setActiveRoutine(paused.routine);
    setPlayerState({
      steps: paused.steps ? paused.steps : paused.routine.steps,
      currentStepIndex: paused.currentStepIndex,
      timeElapsedInStep: paused.timeElapsedInStep,
      stepLogs: paused.stepLogs,
      isPlaying: true,
      isMinimized: false,
    });
    setPausedRoutines((prev) => prev.filter((p) => p.id !== paused.id));
    setCurrentView("routine-player");
  };

  const savePausedRoutine = () => {
    if (!activeRoutine) return;
    const paused: PausedRoutine = {
      id: Date.now().toString(),
      routine: activeRoutine,
      currentStepIndex: playerState.currentStepIndex,
      timeElapsedInStep: playerState.timeElapsedInStep,
      stepLogs: playerState.stepLogs,
      steps: playerState.steps,
      pausedAt: Date.now(),
    };
    setPausedRoutines((prev) => [paused, ...prev]);
    setActiveRoutine(null);
    setCurrentView("routines");
  };

  const scheduleRoutine = (templateId: string, startTime: number) => {
    const template = routines.find((r) => r.id === templateId);
    if (!template) return;
    const newInstance: Routine = {
      ...template,
      id: Date.now().toString(),
      type: "once",
      startTime: startTime,
      title: template.title,
    };
    setRoutines((prev) => [...prev, newInstance]);
  };

  const scheduleHabit = (habitId: string, startTime: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const duration =
      habit.goal.type === "duration" ? habit.goal.target * 60 : 900;
    const newRoutine: Routine = {
      id: `habit-${habit.id}-${Date.now()}`,
      title: habit.title,
      color: habit.color,
      type: "once",
      startTime: startTime,
      steps: [
        {
          id: Date.now().toString(),
          title: habit.title,
          durationSeconds: duration,
          linkedHabitId: habit.id,
        },
      ],
    };
    setRoutines((prev) => [...prev, newRoutine]);
  };

  const unscheduleItem = (id: string, type: "task" | "routine") => {
    if (type === "task") {
      const task = tasks.find((t) => t.id === id);
      if (task) handleUpdateTask({ ...task, startTime: undefined });
    } else {
      const routine = routines.find((r) => r.id === id);
      if (routine) handleUpdateRoutine({ ...routine, startTime: undefined });
    }
  };

  const startTaskFocus = (task: Task) => {
    const tempRoutine: Routine = {
      id: `task-${task.id}`,
      title: "Task Focus",
      color: "bg-black",
      type: "once",
      steps: [
        {
          id: task.id,
          title: task.title,
          durationSeconds: (task.duration || 30) * 60,
          linkedTaskId: task.id,
        },
      ],
      subtasks: task.subtasks,
    };
    setActiveRoutine(tempRoutine);
    setPlayerState({
      steps: [...tempRoutine.steps],
      currentStepIndex: 0,
      timeElapsedInStep: 0,
      stepLogs: [],
      isPlaying: true,
      isMinimized: false,
    });
    setCurrentView("routine-player");
  };

  const startHabitFocus = (habit: Habit) => {
    let durationSeconds = 30 * 60;
    if (habit.goal.type === "duration")
      durationSeconds = habit.goal.target * 60;
    else if (habit.type === "elastic" && habit.elasticConfig)
      durationSeconds = habit.elasticConfig.elite.target * 60;

    const tempRoutine: Routine = {
      id: `habit-focus-${habit.id}`,
      title: `${habit.title} Session`,
      color: habit.color,
      type: "once",
      steps: [
        {
          id: habit.id,
          title: habit.title,
          durationSeconds: durationSeconds,
          linkedHabitId: habit.id,
        },
      ],
    };
    setActiveRoutine(tempRoutine);
    setPlayerState({
      steps: [...tempRoutine.steps],
      currentStepIndex: 0,
      timeElapsedInStep: 0,
      stepLogs: [],
      isPlaying: true,
      isMinimized: false,
    });
    setCurrentView("routine-player");
  };

  const handleStepComplete = () => {
    if (!activeRoutine) return;
    const currentStep = playerState.steps[playerState.currentStepIndex];
    const log: StepLog = {
      stepId: currentStep.id,
      title: currentStep.title,
      expectedDuration: currentStep.durationSeconds,
      actualDuration: playerState.timeElapsedInStep,
    };
    const newLogs = [...playerState.stepLogs, log];

    if (playerState.currentStepIndex < playerState.steps.length - 1) {
      setPlayerState((prev) => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
        timeElapsedInStep: 0,
        stepLogs: newLogs,
        isPlaying: true,
      }));
    } else {
      handleRoutineFinish(activeRoutine, newLogs);
    }
  };

  const handleRoutineFinish = (routine: Routine, logs: StepLog[]) => {
    const actualDuration = logs.reduce((acc, l) => acc + l.actualDuration, 0);
    setActiveRoutine(null);

    const newSession: FocusSession = {
      id: Date.now().toString(),
      routineId: routine.id,
      routineTitle: routine.title,
      startTime: Date.now() - actualDuration * 1000,
      endTime: Date.now(),
      durationSeconds: actualDuration,
      completedSteps: logs.length,
      totalSteps: routine.steps.length,
      logs: logs, // Save detailed logs in session
    };
    setFocusSessions((prev) => [newSession, ...prev]);

    if (routine.type === "once") {
      if (routine.id.startsWith("task-")) {
        const taskId = routine.steps[0].id;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, isCompleted: true, completedAt: Date.now() }
              : t
          )
        );
      } else {
        setRoutines((prev) =>
          prev.map((r) =>
            r.id === routine.id ? { ...r, completedAt: Date.now() } : r
          )
        );
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const habitUpdates: Record<string, number> = {};

    logs.forEach((log) => {
      const originalStep =
        routine.steps.find((s) => s.id === log.stepId) ||
        playerState.steps.find((s) => s.id === log.stepId);
      if (originalStep && originalStep.linkedHabitId) {
        habitUpdates[originalStep.linkedHabitId] =
          (habitUpdates[originalStep.linkedHabitId] || 0) + log.actualDuration;
      }
    });

    if (Object.keys(habitUpdates).length > 0) {
      setHabits((prev) =>
        prev.map((habit) => {
          if (habitUpdates[habit.id]) {
            const currentVal = habit.history[todayStr] || 0;
            const safeCurrentVal = currentVal === -1 ? 0 : currentVal;
            let newValue = safeCurrentVal;
            const durationIncrement = habitUpdates[habit.id] / 60;
            if (habit.type === "elastic")
              newValue = safeCurrentVal + durationIncrement;
            else {
              if (habit.goal.type === "duration")
                newValue = safeCurrentVal + durationIncrement;
              else newValue = safeCurrentVal + 1;
            }
            const newHistory = {
              ...habit.history,
              [todayStr]: parseFloat(newValue.toFixed(2)),
            };
            const newStreak = calculateHabitStreak({
              ...habit,
              history: newHistory,
            });
            return { ...habit, history: newHistory, streak: newStreak };
          }
          return habit;
        })
      );
    }

    // Go back to Dashboard or previous view
    setCurrentView("dashboard");
  };

  const toggleTaskSubtask = (routineId: string, subtaskId: string) => {
    let taskId = "";
    if (routineId.startsWith("task-")) taskId = routineId.replace("task-", "");
    else {
      const task = tasks.find((t) =>
        t.subtasks?.some((s) => s.id === subtaskId)
      );
      if (task) taskId = task.id;
    }

    if (taskId) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId && t.subtasks) {
            const updatedSubtasks = t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
            );
            if (activeRoutine && activeRoutine.id === `task-${taskId}`)
              setActiveRoutine((prevRoutine) =>
                prevRoutine
                  ? { ...prevRoutine, subtasks: updatedSubtasks }
                  : null
              );
            return { ...t, subtasks: updatedSubtasks };
          }
          return t;
        })
      );
    }
  };

  // Handler to adjust the time of the current step
  const handleTimeAdjustment = (seconds: number) => {
    setPlayerState((prev) => {
      let newElapsed = prev.timeElapsedInStep - seconds;
      if (newElapsed < 0) newElapsed = 0;
      return { ...prev, timeElapsedInStep: newElapsed };
    });
  };

  // Handler to remove a step from the active sequence (Drag to Library)
  const handleRemoveStep = (index: number) => {
    if (playerState.steps.length <= 1) {
      setActiveRoutine(null);
      setCurrentView("dashboard");
      return;
    }

    setPlayerState((prev) => {
      const newSteps = [...prev.steps];
      newSteps.splice(index, 1);
      let newIndex = prev.currentStepIndex;
      let newElapsed = prev.timeElapsedInStep;

      if (index < prev.currentStepIndex) {
        newIndex = prev.currentStepIndex - 1;
      } else if (index === prev.currentStepIndex) {
        newElapsed = 0;
      }

      if (newIndex >= newSteps.length) {
        newIndex = newSteps.length - 1;
      }

      return {
        ...prev,
        steps: newSteps,
        currentStepIndex: newIndex,
        timeElapsedInStep: newElapsed,
      };
    });
  };

  const exitPlayer = () => {
    setActiveRoutine(null);
    setCurrentView("dashboard");
  };

  const toggleTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task) return prevTasks;
      const newStatus = !task.isCompleted;
      let updatedTask = { ...task, isCompleted: newStatus };
      if (newStatus) {
        updatedTask.completedAt = Date.now();
      } else {
        updatedTask.completedAt = undefined;
      }
      return prevTasks.map((t) => (t.id === taskId ? updatedTask : t));
    });
  };

  const handleDeleteActivity = (
    id: string,
    type: "task" | "session" | "journal"
  ) => {
    if (type === "task") toggleTask(id);
    else if (type === "session")
      setFocusSessions((prev) => prev.filter((s) => s.id !== id));
    else if (type === "journal") handleDeleteJournalEntry(id);
  };

  const handleExport = () => {
    const data = {
      tasks,
      routines,
      journalEntries,
      notes,
      focusSessions,
      dumps,
      projects,
      habits,
      pausedRoutines,
      exportedAt: new Date().toISOString(),
      version: "1.4",
      uiScale,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifeflow_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (confirm(`Import data? This will replace your current data.`)) {
          if (Array.isArray(data.tasks)) setTasks(data.tasks);
          if (Array.isArray(data.routines)) setRoutines(data.routines);
          if (Array.isArray(data.journalEntries))
            setJournalEntries(data.journalEntries);
          if (Array.isArray(data.notes)) setNotes(data.notes);
          if (Array.isArray(data.focusSessions))
            setFocusSessions(data.focusSessions);
          if (Array.isArray(data.dumps)) setDumps(data.dumps);
          if (Array.isArray(data.projects)) setProjects(data.projects);
          if (Array.isArray(data.habits)) setHabits(data.habits);
          if (Array.isArray(data.pausedRoutines))
            setPausedRoutines(data.pausedRoutines);
          if (typeof data.uiScale === "number") setUiScale(data.uiScale);
          alert("Data imported successfully!");
        }
      } catch (err) {
        alert("Failed to import. Invalid file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetApp = () => {
    if (
      confirm(
        "Are you sure you want to reset the app? This will delete ALL data permanently."
      )
    ) {
      if (confirm("This action cannot be undone. Confirm reset?")) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const activeTasks = tasks.filter((t) => !t.deletedAt);
  const activeRoutines = routines.filter((r) => !r.deletedAt);
  const activeNotes = notes.filter((n) => !n.deletedAt);
  const activeProjects = projects.filter((p) => !p.deletedAt);
  const activeHabits = habits.filter((h) => !h.deletedAt);

  const renderMiniPlayer = () => {
    if (activeRoutine && playerState.isMinimized) {
      const currentStep = playerState.steps[playerState.currentStepIndex];
      const stepDuration = currentStep.durationSeconds;
      const timeLeft = stepDuration - playerState.timeElapsedInStep;

      return (
        <MiniPlayer
          routine={activeRoutine}
          currentStep={currentStep}
          timeElapsed={playerState.timeElapsedInStep}
          isPlaying={playerState.isPlaying}
          onTogglePlay={() =>
            setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
          }
          onNext={handleStepComplete}
          onExpand={() => {
            setPlayerState((prev) => ({ ...prev, isMinimized: false }));
            setCurrentView("routine-player");
          }}
          timeLeft={timeLeft}
          isOvertime={timeLeft < 0}
        />
      );
    }
    return null;
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      miniPlayer={renderMiniPlayer()}
      uiScale={uiScale}
      onScaleChange={setUiScale}
    >
      {currentView === "routine-player" &&
        activeRoutine &&
        !playerState.isMinimized && (
          <RoutinePlayer
            routine={activeRoutine}
            steps={playerState.steps}
            currentStepIndex={playerState.currentStepIndex}
            timeElapsedInStep={playerState.timeElapsedInStep}
            isPlaying={playerState.isPlaying}
            tasks={activeTasks}
            habits={activeHabits}
            onTogglePlay={() =>
              setPlayerState((prev) => ({
                ...prev,
                isPlaying: !prev.isPlaying,
              }))
            }
            onStepComplete={handleStepComplete}
            onStepsReorder={(newSteps) =>
              setPlayerState((prev) => ({ ...prev, steps: newSteps }))
            }
            onMinimize={() => {
              setPlayerState((prev) => ({ ...prev, isMinimized: true }));
              setCurrentView("dashboard");
            }}
            onExit={exitPlayer}
            onSave={savePausedRoutine}
            onToggleSubtask={toggleTaskSubtask}
            onAdjustTime={handleTimeAdjustment}
            onStepRemove={handleRemoveStep}
          />
        )}

      {currentView === "dashboard" && (
        <Dashboard
          tasks={activeTasks}
          routines={activeRoutines}
          notes={activeNotes}
          focusSessions={focusSessions}
          journalEntries={journalEntries}
          onStartRoutine={startRoutine}
          onViewChange={setCurrentView}
          onQuickAction={handleQuickAction}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {currentView === "activity" && (
        <ActivityModule
          tasks={tasks}
          focusSessions={focusSessions}
          journalEntries={journalEntries}
          onDeleteActivity={handleDeleteActivity}
          onBack={() => setCurrentView("dashboard")}
        />
      )}
      {currentView === "calendar" && (
        <CalendarModule
          tasks={activeTasks}
          routines={activeRoutines}
          habits={activeHabits}
          projects={activeProjects}
          onUpdateTask={handleUpdateTask}
          focusSessions={focusSessions}
          onStartTask={startTaskFocus}
          onScheduleRoutine={scheduleRoutine}
          onStartRoutine={startRoutine}
          onUpdateRoutine={handleUpdateRoutine}
          onScheduleHabit={scheduleHabit}
          onUnschedule={unscheduleItem}
        />
      )}
      {currentView === "tasks" && (
        <TaskModule
          tasks={tasks}
          projects={activeProjects}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onStartTask={startTaskFocus}
          onToggleTask={toggleTask}
          convertingDump={convertingDump}
          onClearConvertingDump={() => setConvertingDump(null)}
          onConvertComplete={handleConvertComplete}
          onArchiveTask={handleArchiveTask}
          onUnarchiveTask={handleUnarchiveTask}
          autoTrigger={triggerTaskModal}
          onAutoTriggerHandled={() => setTriggerTaskModal(false)}
        />
      )}
      {currentView === "routines" && (
        <RoutineModule
          routines={routines}
          habits={activeHabits}
          pausedRoutines={pausedRoutines}
          onAddRoutine={handleAddRoutine}
          onUpdateRoutine={handleUpdateRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onStartRoutine={startRoutine}
          onResumeRoutine={resumePausedRoutine}
          onDiscardPaused={(id) =>
            setPausedRoutines((prev) => prev.filter((p) => p.id !== id))
          }
          tasks={activeTasks}
          onArchiveRoutine={handleArchiveRoutine}
          onUnarchiveRoutine={handleUnarchiveRoutine}
          onReorder={handleReorderRoutines}
        />
      )}
      {currentView === "notes" && (
        <NotesModule
          notes={notes}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          convertingDump={convertingDump}
          onClearConvertingDump={() => setConvertingDump(null)}
          onConvertComplete={handleConvertComplete}
          onArchiveNote={handleArchiveNote}
          onUnarchiveNote={handleUnarchiveNote}
          onReorder={handleReorderNotes}
        />
      )}
      {currentView === "journal" && (
        <JournalModule
          entries={journalEntries}
          onAddEntry={handleAddJournalEntry}
          onUpdateEntry={handleUpdateJournalEntry}
          onDeleteEntry={handleDeleteJournalEntry}
          clearPrompt={() => setJournalPrompt("")}
          initialContent={journalPrompt}
          convertingDump={convertingDump}
          onClearConvertingDump={() => setConvertingDump(null)}
          onConvertComplete={handleConvertComplete}
          onArchiveEntry={handleArchiveEntry}
          onUnarchiveEntry={handleUnarchiveEntry}
          autoTrigger={triggerJournalModal}
          onAutoTriggerHandled={() => setTriggerJournalModal(false)}
        />
      )}
      {currentView === "trash" && (
        <RestoreModule
          tasks={tasks}
          routines={routines}
          journalEntries={journalEntries}
          notes={notes}
          dumps={dumps}
          projects={projects}
          habits={habits}
          onRestore={handleRestore}
          onDeleteForever={handleHardDelete}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleResetApp}
        />
      )}
      {currentView === "dump" && (
        <BrainDumpModule
          dumps={dumps}
          onAddDump={handleAddDump}
          onDeleteDump={handleDeleteDump}
          onConvertToTask={convertDumpToTask}
          onConvertToNote={convertDumpToNote}
          onConvertToJournal={convertDumpToJournal}
          onConvertToProject={convertDumpToProject}
          onArchiveDump={handleArchiveDump}
          onUnarchiveDump={handleUnarchiveDump}
          autoTrigger={triggerDumpModal}
          onAutoTriggerHandled={() => setTriggerDumpModal(false)}
        />
      )}
      {currentView === "projects" && (
        <ProjectModule
          projects={projects}
          tasks={tasks}
          focusSessions={focusSessions}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          convertingDump={convertingDump}
          onClearConvertingDump={() => setConvertingDump(null)}
          onConvertComplete={handleConvertComplete}
          onArchiveProject={handleArchiveProject} // Now correct type
          onUnarchiveProject={handleUnarchiveProject} // Now correct type
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onStartTask={startTaskFocus}
          onToggleTask={toggleTask}
          onReorder={handleReorderProjects}
        />
      )}
      {currentView === "habits" && (
        <HabitModule
          habits={habits}
          onAddHabit={handleAddHabit}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onArchiveHabit={handleArchiveHabit}
          onUnarchiveHabit={handleUnarchiveHabit}
          onUpdateProgress={handleUpdateHabitProgress}
          onStartFocus={startHabitFocus}
          onReorder={handleReorderHabits}
        />
      )}
    </Layout>
  );
};

export default App;
