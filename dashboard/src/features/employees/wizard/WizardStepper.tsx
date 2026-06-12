import WizardStepper from '@/components/common/WizardStepper';

const steps = [
  { key: '1', titleKey: 'dashboard:employees.wizard.step-1.title' },
  { key: '2', titleKey: 'dashboard:employees.wizard.step-2.title' },
  { key: '3', titleKey: 'dashboard:employees.wizard.step-3.title' },
  { key: '4', titleKey: 'dashboard:employees.wizard.step-4.title' },
  { key: 'r', titleKey: 'dashboard:employees.wizard.review.title' },
] as const;

interface Props {
  current: number;
}

/**
 * Employee-wizard binding of the shared stepper — the markup moved to
 * `components/common/WizardStepper` when the document wizard (step 18)
 * became its second consumer.
 */
export default function EmployeeWizardStepper({ current }: Props) {
  return (
    <WizardStepper
      steps={steps}
      current={current}
      ariaLabelKey="dashboard:employees.wizard.stepper-label"
    />
  );
}
