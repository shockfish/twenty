import { type WorkflowActionType } from '@/workflow/types/Workflow';
import { FORM_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/FormAction';
import { IFRAME_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/IframeAction';

export const HUMAN_INPUT_ACTIONS: Array<{
  defaultLabel: string;
  type: Extract<WorkflowActionType, 'FORM' | 'SHOW_IFRAME'>;
  icon: string;
}> = [FORM_ACTION, IFRAME_ACTION];
