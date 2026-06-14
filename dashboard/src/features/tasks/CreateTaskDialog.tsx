import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import Combobox, { type ComboboxOption } from '@/components/common/Combobox';
import MetaFileField, { type FileMetaInput } from '@/components/common/MetaFileField';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActingContext } from '@/lib/acting';
import {
  createTask,
  listAssignments,
  listEmployees,
  listUnits,
} from '@/lib/mock-backend';
import type { Employee } from '@/types/domain';

import {
  createTaskFormSchema,
  makeCreateTaskDefaults,
  todayIso,
  type CreateTaskForm,
} from './task.schema';
import { toastTaskError } from './taskErrors';

const FORM_ID = 'create-task-form';

const PRIORITIES = ['HIGH', 'MEDIUM', 'STANDARD'] as const;

interface AssigneeOption extends ComboboxOption {
  status: Employee['status'];
}

export interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acting: ActingContext;
  onCreated: () => void;
}

export default function CreateTaskDialog({
  open,
  onOpenChange,
  acting,
  onCreated,
}: CreateTaskDialogProps) {
  const { t } = useTranslation(['dashboard', 'common']);

  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [attachedFile, setAttachedFile] = useState<FileMetaInput | null>(null);
  const [fileErrorKey, setFileErrorKey] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [pastDeadlineConfirmed, setPastDeadlineConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: makeCreateTaskDefaults(),
  });

  // Fresh form per open — prevents stale state from previous opens.
  useEffect(() => {
    if (open) {
      reset(makeCreateTaskDefaults());
      setAttachedFile(null);
      setFileErrorKey(undefined);
      setBusy(false);
      setPastDeadlineConfirmed(false);
    }
  }, [open, reset]);

  // Load in-scope assignee options whenever the dialog opens or acting changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const [units, employees, assignments] = await Promise.all([
        listUnits(),
        listEmployees(),
        listAssignments(),
      ]);
      if (cancelled) return;

      // Build a unit path map for subtree membership test.
      const unitPath = new Map(units.map((u) => [u.uuid, u.path]));

      // Collect paths of all units the acting employee heads.
      const headedPaths = acting.headedUnitUuids
        .map((uuid) => unitPath.get(uuid))
        .filter((p): p is string => Boolean(p));

      if (headedPaths.length === 0) {
        setAssigneeOptions([]);
        return;
      }

      const inSubtree = (unitUuid: string) => {
        const path = unitPath.get(unitUuid);
        if (!path) return false;
        return headedPaths.some((headPath) => path.startsWith(headPath));
      };

      // Only consider employees with an open primary assignment whose unit is
      // within the assigner's subtree. Also exclude the acting employee (no
      // self-assign). No status filter — ON_LEAVE employees are still offered
      // but will trigger a warning (UC-07 A3).
      const eligibleUuids = new Set(
        assignments
          .filter((a) => a.isPrimary && !a.endDate && inSubtree(a.unitUuid))
          .map((a) => a.employeeUuid),
      );

      const options: AssigneeOption[] = employees
        .filter(
          (e) =>
            e.uuid !== acting.employee.uuid &&
            e.status !== 'TERMINATED' &&
            e.status !== 'DRAFT' &&
            eligibleUuids.has(e.uuid),
        )
        .map((e) => {
          // Find the primary assignment's unit for sublabel.
          const primary = assignments.find(
            (a) => a.employeeUuid === e.uuid && a.isPrimary && !a.endDate,
          );
          const unitName = primary ? (units.find((u) => u.uuid === primary.unitUuid)?.nameUz ?? '') : '';
          return {
            value: e.uuid,
            label: e.fullNameGenerated,
            sublabel: unitName,
            status: e.status,
          };
        });

      setAssigneeOptions(options);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, acting.employee.uuid, acting.headedUnitUuids]);

  const assigneeUuid = watch('assigneeUuid');
  const deadline = watch('deadline');
  const priority = watch('priority');

  const selectedAssignee = assigneeOptions.find((o) => o.value === assigneeUuid);
  const assigneeOnLeave = selectedAssignee?.status === 'ON_LEAVE';

  const deadlineIsPast = Boolean(deadline && deadline < todayIso());

  async function onValid(values: CreateTaskForm) {
    // UC-07 A2: warn before submitting a past deadline.
    if (deadlineIsPast && !pastDeadlineConfirmed) {
      setPastDeadlineConfirmed(true);
      return;
    }

    try {
      setBusy(true);
      const task = await createTask(
        {
          title: values.title.trim(),
          description: values.description.trim(),
          priority: values.priority,
          assigneeUuid: values.assigneeUuid,
          deadline: values.deadline,
          attachedFile: attachedFile
            ? { ...attachedFile, uploadedAt: new Date().toISOString() }
            : undefined,
        },
        acting.employee.uuid,
      );
      toast.success(t('dashboard:tasks.create.success', { number: task.number }));
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toastTaskError(t, err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('dashboard:tasks.create.title')}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy}>
            {t('dashboard:tasks.create.cta-submit')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="task-title">
            {t('dashboard:tasks.create.label-title')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="task-title"
            {...register('title')}
            placeholder={t('dashboard:tasks.create.label-title')}
          />
          {errors.title?.message && (
            <p className="text-xs text-destructive">{t(errors.title.message)}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="task-description">
            {t('dashboard:tasks.create.label-description')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="task-description"
            rows={3}
            {...register('description')}
            placeholder={t('dashboard:tasks.create.label-description')}
          />
          {errors.description?.message && (
            <p className="text-xs text-destructive">{t(errors.description.message)}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Priority */}
          <div className="space-y-2">
            <Label>
              {t('dashboard:tasks.create.label-priority')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setValue('priority', v as CreateTaskForm['priority'], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`dashboard:tasks.priority.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="task-deadline">
              {t('dashboard:tasks.create.label-deadline')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-deadline"
              type="date"
              min={todayIso()}
              {...register('deadline')}
            />
            {errors.deadline?.message && (
              <p className="text-xs text-destructive">{t(errors.deadline.message)}</p>
            )}
            {/* UC-07 A2: past-deadline confirmation prompt */}
            {deadlineIsPast && pastDeadlineConfirmed && (
              <p className="text-xs text-amber-600">
                {t('dashboard:tasks.create.past-deadline-confirm')}
              </p>
            )}
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-2">
          <Label>
            {t('dashboard:tasks.create.label-assignee')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Combobox
            options={assigneeOptions}
            value={assigneeUuid || null}
            onChange={(v) => setValue('assigneeUuid', v, { shouldValidate: true })}
            placeholder={t('dashboard:tasks.create.label-assignee')}
            emptyMessage={t('dashboard:tasks.create.assignee-empty')}
          />
          {errors.assigneeUuid?.message && (
            <p className="text-xs text-destructive">{t(errors.assigneeUuid.message)}</p>
          )}
          {/* UC-07 A3: on-leave warning — shown but submit is still allowed */}
          {assigneeOnLeave && selectedAssignee && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {t('dashboard:tasks.create.on-leave-warning', {
                  name: selectedAssignee.label,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Optional file attachment — reuses MetaFileField (same primitive as SubmitDeliverableDialog) */}
        <MetaFileField
          id="task-attachment"
          labelKey="dashboard:tasks.create.label-attachment"
          hintKey="dashboard:tasks.create.file-hint"
          value={attachedFile}
          onChange={setAttachedFile}
          onError={(key) => setFileErrorKey(key)}
          errorKey={fileErrorKey}
          required={false}
        />
      </form>
    </ResponsiveDialog>
  );
}
