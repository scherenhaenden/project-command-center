export type View =
  | 'Home'
  | 'Today'
  | 'Projects'
  | 'Portfolio'
  | 'Timeline'
  | 'Tasks'
  | 'Milestones'
  | 'Risks'
  | 'Archive';
export type Health = 'Healthy' | 'Needs attention' | 'At risk' | 'Blocked' | 'Paused' | 'Completed';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus =
  'Backlog' | 'Planned' | 'In progress' | 'Waiting' | 'Blocked' | 'Review' | 'Done';
export type AddType =
  'Project' | 'Subproject' | 'Task' | 'Milestone' | 'Risk' | 'Note' | 'Decision';

export interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface Project extends Base {
  name: string;
  area: string;
  health: Health;
  priority: Priority;
  progress: number;
  expected: number;
  targetDate: string;
  summary: string;
  nextAction: string;
  archived?: boolean;
}
export interface Task extends Base {
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  progress: number;
  description: string;
  kind: 'task' | 'subproject';
}
export interface Milestone extends Base {
  projectId: string;
  title: string;
  dueDate: string;
  progress: number;
  requirements: number;
  status: Health;
  blocker: string;
}
export interface Risk extends Base {
  projectId: string;
  title: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
  status: 'Open' | 'Mitigated';
}
export interface Note extends Base {
  projectId: string;
  content: string;
}
export interface Decision extends Base {
  projectId: string;
  title: string;
  context: string;
  reason: string;
  alternatives: string;
}
export interface Activity extends Base {
  projectId: string;
  message: string;
}
export interface Dependency extends Base {
  fromId: string;
  toId: string;
}
export interface Store {
  version: 1;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  risks: Risk[];
  notes: Note[];
  decisions: Decision[];
  activities: Activity[];
  dependencies: Dependency[];
  preferences: { dark: boolean; compact: boolean };
}
