import { type BaseWorkflowActionSettings } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-settings.type';

export type WorkflowPdfGeneratorRow = {
  id: string;
  label: string;
  value: string;
};

export type WorkflowPdfGeneratorActionSettings = BaseWorkflowActionSettings & {
  input: {
    title?: string;
    rows: WorkflowPdfGeneratorRow[];
  };
};

