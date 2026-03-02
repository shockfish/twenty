import { type WorkflowActionType } from '@/workflow/types/Workflow';

export const IFRAME_ACTION: {
  defaultLabel: string;
  type: Extract<WorkflowActionType, 'SHOW_IFRAME'>;
  icon: string;
} = {
  defaultLabel: 'Show Iframe',
  type: 'SHOW_IFRAME',
  icon: 'IconWorldWww',
};

