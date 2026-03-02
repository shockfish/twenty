import {
  type WorkflowAction,
  WorkflowActionType,
  type WorkflowIframeAction,
} from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';

export const isWorkflowIframeAction = (
  action: WorkflowAction,
): action is WorkflowIframeAction =>
  action.type === WorkflowActionType.SHOW_IFRAME;

