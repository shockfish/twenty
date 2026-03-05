import {
  type WorkflowAction,
  WorkflowActionType,
  type WorkflowSignatureAction,
} from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';

export const isWorkflowSignatureAction = (
  action: WorkflowAction,
): action is WorkflowSignatureAction =>
  action.type === WorkflowActionType.SHOW_SIGNATURE;

