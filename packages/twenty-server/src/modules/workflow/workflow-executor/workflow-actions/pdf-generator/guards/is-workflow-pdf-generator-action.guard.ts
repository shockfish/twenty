import { type WorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';
import { WorkflowActionType } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-type.enum';

export const isWorkflowPdfGeneratorAction = (
  action: WorkflowAction,
): action is Extract<WorkflowAction, { type: WorkflowActionType.GENERATE_PDF }> =>
  action.type === WorkflowActionType.GENERATE_PDF;

