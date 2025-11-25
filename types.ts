

export type ViewState = 'dashboard' | 'tasks' | 'routines' | 'journal' | 'routine-player' | 'calendar' | 'settings' | 'notes' | 'trash' | 'dump' | 'projects' | 'habits' | 'activity';

export type Priority = 'High' | 'Medium' | 'Low';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Reminder {
  id: string;
  timeOffset: number; // Minutes before start time (0 = at start time)
  type: 'notification' | 'alarm';
}

export interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  interval: number; // e.g., every 2 days
  daysOfWeek?: number[]; // 0-6 for specific days
  instancesToGenerate: number; // How many future tasks to create now
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: number;
  dueDate: number;
  color: string;
  status: 'active' | 'completed' | 'on-hold';
  priority: Priority; // New Field
  isPinned?: boolean; // New Field
  createdAt: number;
  deletedAt?: number;
  archivedAt?: number;
  notes?: Note[]; 
  reminders?: Reminder[];
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  category: string;
  projectId?: string; 
  createdAt: number;
  completedAt?: number; 
  startTime?: number; 
  duration?: number; 
  color?: string; 
  deletedAt?: number; 
  archivedAt?: number; 
  
  description?: string;
  subtasks?: Subtask[];

  // New Fields
  reminders?: Reminder[];
  recurrence?: RecurrenceConfig;
  seriesId?: string; // Links recurring instances
}

export interface RoutineStep {
  id: string;
  title: string;
  durationSeconds: number; 
  linkedHabitId?: string; 
  linkedTaskId?: string; 
}

export interface Routine {
  id: string;
  title: string;
  steps: RoutineStep[];
  color: string;
  type: 'once' | 'repeatable'; 
  isPinned?: boolean; // New Field
  startTime?: number; 
  completedAt?: number; 
  deletedAt?: number; 
  archivedAt?: number; 
  subtasks?: Subtask[];
  reminders?: Reminder[];
}

export interface StepLog {
    stepId: string;
    title: string;
    expectedDuration: number;
    actualDuration: number;
}

export interface PausedRoutine {
    id: string; 
    routine: Routine;
    currentStepIndex: number;
    timeElapsedInStep: number;
    stepLogs: StepLog[];
    steps: RoutineStep[]; 
    pausedAt: number;
}

export type Mood = 'awesome' | 'good' | 'neutral' | 'bad' | 'awful';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  images?: string[]; 
  image?: string; 
  cardColor?: string; 
  textColor?: string; 
  createdAt: number;
  deletedAt?: number; 
  archivedAt?: number; 
}

export interface NoteItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string; 
  type: 'text' | 'list' | 'mixed';
  items?: NoteItem[]; 
  images?: string[]; 
  isPinned: boolean;
  color: string; 
  createdAt: number;
  updatedAt: number;
  deletedAt?: number; 
  archivedAt?: number; 
}

export interface Dump {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  deletedAt?: number;
  archivedAt?: number; 
}

export interface FocusSession {
  id: string;
  routineId: string;
  routineTitle: string;
  startTime: number;
  endTime: number;
  durationSeconds: number; 
  completedSteps: number;
  totalSteps: number;
  logs?: StepLog[]; // Detailed breakdown
}

// --- Habit Types ---

export type HabitFrequencyType = 'daily' | 'weekly' | 'specific_days' | 'interval';
export type HabitGoalType = 'check' | 'quantity' | 'duration';
export type HabitType = 'simple' | 'elastic';

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; 
  interval?: number; 
  timesPerWeek?: number; 
}

export interface HabitGoal {
  type: HabitGoalType;
  target: number; 
  unit: string; 
}

export interface ElasticTier {
    label: string;
    target: number; 
}

export interface ElasticConfig {
    unit: string; 
    mini: ElasticTier;
    plus: ElasticTier;
    elite: ElasticTier;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  color: string;
  type: HabitType; 
  frequency: HabitFrequency;
  goal: HabitGoal;
  customStep?: number; 
  elasticConfig?: ElasticConfig; 
  history: Record<string, number>;
  streak: number;
  isPinned?: boolean; // New Field
  createdAt: number;
  deletedAt?: number;
  archivedAt?: number;
  reminders?: Reminder[];
}

export interface IconProps {
  className?: string;
  size?: number;
}
