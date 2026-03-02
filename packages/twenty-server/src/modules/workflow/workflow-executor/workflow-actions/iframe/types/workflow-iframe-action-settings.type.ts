import { type BaseWorkflowActionSettings } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-settings.type';

export type WorkflowIframeActionSettings = BaseWorkflowActionSettings & {
  input: {
    url: string;
  };
};

