// Form schema for the task-creation dialog (UC-07).
// Error messages are i18n keys — the dialog renders them via t().

import { z } from 'zod';

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const createTaskFormSchema = z.object({
  title: z.string().trim().min(3, 'dashboard:tasks.create.err-title'),
  description: z.string().min(1, 'dashboard:tasks.create.err-description'),
  priority: z.enum(['HIGH', 'MEDIUM', 'STANDARD']),
  assigneeUuid: z.string().min(1, 'dashboard:tasks.create.err-assignee'),
  deadline: z.string().min(1, 'dashboard:tasks.create.err-deadline'),
});

export type CreateTaskForm = z.infer<typeof createTaskFormSchema>;

export function makeCreateTaskDefaults(): CreateTaskForm {
  return {
    title: '',
    description: '',
    priority: 'STANDARD',
    assigneeUuid: '',
    deadline: '',
  };
}

// Edit schema (UC-08): assigner-only scope/deadline edit while non-terminal.
// Same shape as create minus the assignee (assignee can't be reassigned).
export const editTaskFormSchema = createTaskFormSchema.omit({ assigneeUuid: true });

export type EditTaskForm = z.infer<typeof editTaskFormSchema>;
