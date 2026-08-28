import { Component, HostListener, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Activity,
  AddType,
  Base,
  Health,
  Milestone,
  Note,
  Priority,
  Project,
  Risk,
  Store,
  Task,
  TaskStatus,
  View,
} from './core/models/domain.models';
const now = () => new Date().toISOString(),
  uid = () => crypto.randomUUID(),
  entity = <T extends object>(x: T): T & Base => ({
    ...x,
    id: uid(),
    createdAt: now(),
    updatedAt: now(),
  });
@Component({
  selector: 'app-root',
  imports: [FormsModule, DatePipe],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly key = 'project-command-center:v1';
  readonly currentView = signal<View>('Home');
  readonly selectedProjectId = signal<string | null>(null);
  readonly detailTab = signal('Overview');
  readonly dark = signal(true);
  readonly compact = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly searchOpen = signal(false);
  readonly quickAddOpen = signal(false);
  readonly drawerOpen = signal(false);
  readonly areaFilter = signal('All');
  readonly healthFilter = signal('All');
  readonly sortBy = signal<'Priority' | 'Health' | 'Deadline' | 'Updated' | 'Progress'>('Priority');
  readonly searchQuery = signal('');
  readonly taskBoard = signal(false);
  readonly draftType = signal<AddType>('Task');
  draftTitle = '';
  draftProjectId = '';
  draftPriority: Priority = 'Medium';
  draftDueDate = '';
  draftText = '';
  readonly formError = signal('');
  readonly editingTaskId = signal<string | null>(null);
  readonly store = signal<Store>(this.load());
  readonly navItems: { v: View; i: string }[] = [
    { v: 'Home', i: '⌂' },
    { v: 'Today', i: '◷' },
    { v: 'Projects', i: '▦' },
    { v: 'Portfolio', i: '▤' },
    { v: 'Timeline', i: '⌁' },
    { v: 'Tasks', i: '✓' },
    { v: 'Milestones', i: '⚑' },
    { v: 'Risks', i: '△' },
    { v: 'Archive', i: '⌫' },
  ];
  readonly areas = ['Work', 'University', 'Software', 'AI', 'Photography', 'Finance', 'Personal'];
  readonly projects = computed(() => this.store().projects);
  readonly activeProjects = computed(() =>
    this.projects().filter((p) => !p.archived && p.health !== 'Paused' && p.health !== 'Completed'),
  );
  readonly attention = computed(() =>
    this.activeProjects().filter((p) =>
      ['Blocked', 'At risk', 'Needs attention'].includes(p.health),
    ),
  );
  readonly selectedProject = computed(
    () => this.projects().find((p) => p.id === this.selectedProjectId()) ?? null,
  );
  readonly tasks = computed(() => this.store().tasks);
  readonly milestones = computed(() => this.store().milestones);
  readonly risks = computed(() => this.store().risks);
  readonly notes = computed(() => this.store().notes);
  readonly decisions = computed(() => this.store().decisions);
  readonly activities = computed(() => this.store().activities);
  readonly projectTasks = computed(() =>
    this.tasks().filter((t) => t.projectId === this.selectedProjectId()),
  );
  readonly projectMilestones = computed(() =>
    this.milestones().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly projectRisks = computed(() =>
    this.risks().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly projectActivities = computed(() =>
    this.activities().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly projectNotes = computed(() =>
    this.notes().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly projectDecisions = computed(() =>
    this.decisions().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly projectWeekItems = computed(() =>
    this.weekItems().filter((x) => x.projectId === this.selectedProjectId()),
  );
  readonly openTasks = computed(() => this.tasks().filter((t) => t.status !== 'Done'));
  readonly criticalTasks = computed(() =>
    this.openTasks().filter((t) => t.priority === 'Critical' || t.priority === 'High'),
  );
  readonly archivedProjects = computed(() => this.projects().filter((p) => p.archived));
  readonly blockedCount = computed(
    () => this.activeProjects().filter((p) => p.health === 'Blocked').length,
  );
  readonly upcomingCount = computed(
    () => this.milestones().filter((m) => m.status !== 'Completed').length,
  );
  readonly filteredProjects = computed(() => {
    let r = this.activeProjects();
    if (this.areaFilter() !== 'All') r = r.filter((p) => p.area === this.areaFilter());
    if (this.healthFilter() !== 'All') r = r.filter((p) => p.health === this.healthFilter());
    const rank: { [k: string]: number } = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...r].sort((a, b) =>
      this.sortBy() === 'Priority'
        ? rank[b.priority] - rank[a.priority]
        : this.sortBy() === 'Progress'
          ? b.progress - a.progress
          : this.sortBy() === 'Deadline'
            ? a.targetDate.localeCompare(b.targetDate)
            : this.sortBy() === 'Updated'
              ? b.updatedAt.localeCompare(a.updatedAt)
              : a.health.localeCompare(b.health),
    );
  });
  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return [
      {
        group: 'Projects',
        items: this.projects()
          .filter((p) => p.name.toLowerCase().includes(q))
          .map((p) => ({ id: p.id, label: p.name, kind: 'project', projectId: p.id })),
      },
      {
        group: 'Tasks',
        items: this.tasks()
          .filter((t) => t.title.toLowerCase().includes(q))
          .map((t) => ({ id: t.id, label: t.title, kind: 'task', projectId: t.projectId })),
      },
      {
        group: 'Milestones',
        items: this.milestones()
          .filter((m) => m.title.toLowerCase().includes(q))
          .map((m) => ({ id: m.id, label: m.title, kind: 'milestone', projectId: m.projectId })),
      },
      {
        group: 'Notes',
        items: this.notes()
          .filter((n) => n.content.toLowerCase().includes(q))
          .map((n) => ({ id: n.id, label: n.content, kind: 'note', projectId: n.projectId })),
      },
    ].filter((x) => x.items.length);
  });
  readonly weekItems = computed(() =>
    [
      ...this.milestones().map((m) => ({
        title: m.title,
        date: m.dueDate,
        type: 'Milestone',
        projectId: m.projectId,
      })),
      ...this.openTasks()
        .filter((t) => t.dueDate)
        .map((t) => ({ title: t.title, date: t.dueDate, type: 'Task', projectId: t.projectId })),
    ].sort((a, b) => a.date.localeCompare(b.date)),
  );
  constructor() {
    this.dark.set(this.store().preferences.dark);
    this.compact.set(this.store().preferences.compact);
  }
  @HostListener('document:keydown', ['$event']) keys(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.searchOpen.set(true);
    }
    if (e.key === 'Escape') this.closeOverlays();
  }
  setView(v: View) {
    this.currentView.set(v);
    this.selectedProjectId.set(null);
    this.detailTab.set('Overview');
  }
  openProject(id: string, tab = 'Overview') {
    this.selectedProjectId.set(id);
    this.currentView.set('Projects');
    this.detailTab.set(tab);
    this.searchOpen.set(false);
  }
  healthClass(x: string) {
    return x.toLowerCase().replaceAll(' ', '-');
  }
  progressWidth(p: { progress: number }) {
    return `${p.progress}%`;
  }
  variance(p: Project) {
    return p.progress - p.expected;
  }
  projectName(id: string) {
    return this.projects().find((p) => p.id === id)?.name ?? 'Unknown project';
  }
  riskScore(r: Risk) {
    const x = { Low: 1, Medium: 2, High: 3 };
    return x[r.probability] * x[r.impact];
  }
  tasksForStatus(s: TaskStatus) {
    return this.openTasks().filter((t) => t.status === s);
  }
  dependenciesForProject() {
    const ids = new Set(this.projectTasks().map((t) => t.id));
    return this.store().dependencies.filter((d) => ids.has(d.fromId) || ids.has(d.toId));
  }
  setArea(a: string) {
    this.areaFilter.set(a);
    this.setView('Portfolio');
  }
  toggleDark() {
    this.dark.update((v) => !v);
    this.pref();
  }
  toggleCompact() {
    this.compact.update((v) => !v);
    this.pref();
  }
  closeOverlays() {
    this.quickAddOpen.set(false);
    this.searchOpen.set(false);
    this.drawerOpen.set(false);
    this.formError.set('');
  }
  openQuickAdd(t: AddType = 'Task', p = '') {
    this.draftType.set(t);
    this.draftProjectId =
      p || this.selectedProjectId() || this.projects().find((x) => !x.archived)?.id || '';
    this.draftTitle = '';
    this.draftText = '';
    this.draftDueDate = '';
    this.draftPriority = 'Medium';
    this.formError.set('');
    this.quickAddOpen.set(true);
  }
  saveQuickAdd() {
    const title = this.draftTitle.trim(),
      type = this.draftType();
    if (!title) {
      this.formError.set('A title is required.');
      return;
    }
    if (type !== 'Project' && !this.draftProjectId) {
      this.formError.set('Choose a project first.');
      return;
    }
    if (type === 'Project') {
      const p = entity({
        name: title,
        area: this.draftText || 'Personal',
        health: 'Healthy' as Health,
        priority: this.draftPriority,
        progress: 0,
        expected: 0,
        targetDate: this.draftDueDate || '—',
        summary: 'No executive summary yet.',
        nextAction: 'Define the first action',
      });
      this.mutate((s) => ({
        ...s,
        projects: [...s.projects, p],
        activities: [this.activity(p.id, `Created project ${title}`), ...s.activities],
      }));
      this.openProject(p.id);
    } else if (type === 'Task' || type === 'Subproject') {
      const t = entity({
        projectId: this.draftProjectId,
        title,
        status: 'Planned' as TaskStatus,
        priority: this.draftPriority,
        dueDate: this.draftDueDate,
        progress: 0,
        description: this.draftText,
        kind: type === 'Task' ? ('task' as const) : ('subproject' as const),
      });
      this.mutate((s) => ({
        ...s,
        tasks: [...s.tasks, t],
        activities: [
          this.activity(t.projectId, `Added ${type.toLowerCase()} ${title}`),
          ...s.activities,
        ],
      }));
      this.recalculate(t.projectId);
    } else if (type === 'Milestone') {
      const m = entity({
        projectId: this.draftProjectId,
        title,
        dueDate: this.draftDueDate || '—',
        progress: 0,
        requirements: 0,
        status: 'Healthy' as Health,
        blocker: '',
      });
      this.mutate((s) => ({
        ...s,
        milestones: [...s.milestones, m],
        activities: [this.activity(m.projectId, `Created milestone ${title}`), ...s.activities],
      }));
    } else if (type === 'Risk') {
      const r = entity({
        projectId: this.draftProjectId,
        title,
        probability: 'Medium' as const,
        impact: this.draftPriority === 'Critical' ? ('High' as const) : ('Medium' as const),
        mitigation: this.draftText || 'Mitigation not defined',
        status: 'Open' as const,
      });
      this.mutate((s) => ({
        ...s,
        risks: [...s.risks, r],
        activities: [this.activity(r.projectId, `Logged risk ${title}`), ...s.activities],
      }));
      this.setProjectHealth(r.projectId, 'Needs attention');
    } else if (type === 'Note') {
      const n = entity({ projectId: this.draftProjectId, content: title });
      this.mutate((s) => ({
        ...s,
        notes: [...s.notes, n],
        activities: [this.activity(n.projectId, 'Added a project note'), ...s.activities],
      }));
    } else {
      const d = entity({
        projectId: this.draftProjectId,
        title,
        context: this.draftText || 'Context not recorded',
        reason: 'Reason to be recorded',
        alternatives: '—',
      });
      this.mutate((s) => ({
        ...s,
        decisions: [...s.decisions, d],
        activities: [this.activity(d.projectId, `Logged decision ${title}`), ...s.activities],
      }));
    }
    this.quickAddOpen.set(false);
  }
  toggleTask(t: Task) {
    this.updateTask(t.id, {
      status: t.status === 'Done' ? 'Planned' : 'Done',
      progress: t.status === 'Done' ? 0 : 100,
    });
  }
  updateTask(id: string, patch: Partial<Task>) {
    const t = this.tasks().find((x) => x.id === id);
    if (!t) return;
    const u = { ...t, ...patch, updatedAt: now() };
    this.mutate((s) => ({
      ...s,
      tasks: s.tasks.map((x) => (x.id === id ? u : x)),
      activities: [
        this.activity(
          t.projectId,
          `${u.status === 'Done' ? 'Completed' : 'Updated'} task ${t.title}`,
        ),
        ...s.activities,
      ],
    }));
    this.recalculate(t.projectId);
  }
  openTask(id: string) {
    this.editingTaskId.set(id);
    this.drawerOpen.set(true);
  }
  readonly editingTask = computed(
    () => this.tasks().find((t) => t.id === this.editingTaskId()) ?? null,
  );
  deleteTask(id: string) {
    const t = this.tasks().find((x) => x.id === id);
    if (!t) return;
    this.mutate((s) => ({
      ...s,
      tasks: s.tasks.filter((x) => x.id !== id),
      activities: [this.activity(t.projectId, `Deleted task ${t.title}`), ...s.activities],
    }));
    this.recalculate(t.projectId);
    this.drawerOpen.set(false);
  }
  archiveProject(p: Project) {
    this.mutate((s) => ({
      ...s,
      projects: s.projects.map((x) =>
        x.id === p.id ? { ...p, archived: !p.archived, updatedAt: now() } : x,
      ),
      activities: [
        this.activity(p.id, p.archived ? 'Restored project' : 'Archived project'),
        ...s.activities,
      ],
    }));
    this.selectedProjectId.set(null);
    this.setView(p.archived ? 'Projects' : 'Archive');
  }
  setProjectHealth(id: string, h: Health) {
    this.mutate((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, health: h, updatedAt: now() } : p)),
    }));
  }
  setMilestoneStatus(m: Milestone, status: Health) {
    this.mutate((s) => ({
      ...s,
      milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, status, updatedAt: now() } : x)),
      activities: [this.activity(m.projectId, `Updated milestone ${m.title}`), ...s.activities],
    }));
  }
  mitigateRisk(r: Risk) {
    this.mutate((s) => ({
      ...s,
      risks: s.risks.map((x) =>
        x.id === r.id ? { ...x, status: 'Mitigated', updatedAt: now() } : x,
      ),
      activities: [this.activity(r.projectId, `Mitigated risk ${r.title}`), ...s.activities],
    }));
  }
  addDependency() {
    const t = this.projectTasks();
    if (
      t.length < 2 ||
      this.store().dependencies.some((d) => d.fromId === t[0].id && d.toId === t[1].id)
    )
      return;
    const d = entity({ fromId: t[0].id, toId: t[1].id });
    this.mutate((s) => ({
      ...s,
      dependencies: [...s.dependencies, d],
      activities: [
        this.activity(t[0].projectId, `Linked ${t[0].title} to ${t[1].title}`),
        ...s.activities,
      ],
    }));
  }
  activity(projectId: string, message: string): Activity {
    return entity({ projectId, message });
  }
  private recalculate(pid: string) {
    const p = this.projects().find((x) => x.id === pid),
      t = this.tasks().filter((x) => x.projectId === pid && x.kind === 'task');
    if (!p || !t.length) return;
    const progress = Math.round(t.reduce((a, x) => a + x.progress, 0) / t.length),
      health = t.some((x) => x.status === 'Blocked')
        ? 'Blocked'
        : progress < p.expected - 12
          ? 'At risk'
          : p.health === 'Blocked'
            ? 'Needs attention'
            : p.health;
    this.mutate((s) => ({
      ...s,
      projects: s.projects.map((x) =>
        x.id === pid ? { ...x, progress, health, updatedAt: now() } : x,
      ),
    }));
  }
  private mutate(fn: (s: Store) => Store) {
    const s = fn(this.store());
    this.store.set(s);
    localStorage.setItem(this.key, JSON.stringify(s));
  }
  private pref() {
    this.mutate((s) => ({ ...s, preferences: { dark: this.dark(), compact: this.compact() } }));
  }
  private load(): Store {
    try {
      const x = localStorage.getItem(this.key);
      if (x) {
        const s = JSON.parse(x) as Store;
        if (s.version === 1) return s;
      }
    } catch {}
    return this.seed();
  }
  private seed(): Store {
    const p = (
      name: string,
      area: string,
      health: Health,
      priority: Priority,
      progress: number,
      expected: number,
      targetDate: string,
      summary: string,
      nextAction: string,
    ) =>
      entity({ name, area, health, priority, progress, expected, targetDate, summary, nextAction });
    const a = p(
        'Atlas CRM',
        'Software',
        'Healthy',
        'High',
        72,
        68,
        '2026-09-18',
        'The customer data migration is stable. The reporting workflow is the remaining release focus.',
        'Finish report mapping validation',
      ),
      b = p(
        'Northstar Platform',
        'AI',
        'Blocked',
        'Critical',
        76,
        79,
        '2026-09-12',
        'Core platform services are operational. Capacity scheduling is delaying the deployment pipeline.',
        'Resolve capacity scheduling dependency',
      ),
      c = p(
        'Research Briefing',
        'University',
        'At risk',
        'High',
        62,
        74,
        '2026-09-06',
        'Research is complete; final methodology and conclusion slides remain.',
        'Complete methodology slides',
      ),
      d = p(
        'Budget Insights',
        'Finance',
        'Needs attention',
        'Medium',
        48,
        51,
        '2026-09-20',
        'Data import rules need validation before monthly close.',
        'Validate monthly import rules',
      ),
      e = p(
        'Media Library',
        'Photography',
        'Paused',
        'Low',
        44,
        44,
        '—',
        'Archive cleanup is paused awaiting duplicate-detection review.',
        'Review duplicate-detection output',
      );
    const t = (
      projectId: string,
      title: string,
      status: TaskStatus,
      priority: Priority,
      dueDate: string,
      progress: number,
      kind: 'task' | 'subproject' = 'task',
    ) => entity({ projectId, title, status, priority, dueDate, progress, description: '', kind });
    const t1 = t(b.id, 'Finish API migration validation', 'In progress', 'High', '2026-09-03', 76),
      t2 = t(b.id, 'Capacity scheduling approval', 'Blocked', 'Critical', '2026-09-04', 40),
      t3 = t(c.id, 'Complete methodology slides', 'Planned', 'High', '2026-09-06', 45),
      t4 = t(a.id, 'Finish gallery matching pipeline', 'In progress', 'High', '2026-09-12', 72),
      t5 = t(b.id, 'Backend', 'Done', 'Medium', '2026-08-30', 100, 'subproject'),
      t6 = t(b.id, 'Frontend', 'In progress', 'High', '2026-09-06', 63, 'subproject'),
      t7 = t(b.id, 'Infrastructure', 'Done', 'High', '2026-09-02', 92, 'subproject'),
      t8 = t(b.id, 'Documentation', 'Planned', 'Medium', '2026-09-10', 38, 'subproject');
    const m = (
      projectId: string,
      title: string,
      dueDate: string,
      progress: number,
      requirements: number,
      status: Health,
      blocker: string,
    ) => entity({ projectId, title, dueDate, progress, requirements, status, blocker });
    const m1 = m(
        b.id,
        'Inference node deployment',
        '2026-09-12',
        76,
        3,
        'At risk',
        'Capacity scheduling approval',
      ),
      m2 = m(a.id, 'Reporting Release', '2026-09-18', 72, 2, 'Healthy', ''),
      m3 = m(c.id, 'Final presentation', '2026-09-06', 62, 4, 'At risk', 'Methodology review');
    const r = entity({
      projectId: b.id,
      title: 'Production deployment instability',
      probability: 'Medium' as const,
      impact: 'High' as const,
      mitigation: 'Staged production rollout',
      status: 'Open' as const,
    });
    return {
      version: 1,
      projects: [a, b, c, d, e],
      tasks: [t1, t2, t3, t4, t5, t6, t7, t8],
      milestones: [m1, m2, m3],
      risks: [r],
      notes: [],
      decisions: [],
      dependencies: [entity({ fromId: t2.id, toId: t1.id })],
      activities: [
        this.activity(b.id, 'Capacity scheduling marked as blocked'),
        this.activity(b.id, 'Completed CI integration'),
        this.activity(a.id, 'Project health changed to Healthy'),
      ],
      preferences: { dark: true, compact: false },
    };
  }
}
