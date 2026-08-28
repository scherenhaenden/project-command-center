import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the command center home', async () => {
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Home',
    );
    expect(component.activeProjects().length).toBeGreaterThan(0);
  });

  it('creates and persists a project through Quick Add', () => {
    const count = component.projects().length;
    component.openQuickAdd('Project');
    component.draftTitle = 'New local project';
    component.draftText = 'Work';
    component.saveQuickAdd();
    expect(component.projects()).toHaveLength(count + 1);
    expect(component.projects().some((project) => project.name === 'New local project')).toBe(true);
    expect(localStorage.getItem(component.key)).toContain('New local project');
  });

  it('completes a task and saves the workflow update', () => {
    const task = component.openTasks()[0];
    component.toggleTask(task);
    expect(component.tasks().find((item) => item.id === task.id)?.status).toBe('Done');
    expect(localStorage.getItem(component.key)).toContain('Completed task');
  });
});
