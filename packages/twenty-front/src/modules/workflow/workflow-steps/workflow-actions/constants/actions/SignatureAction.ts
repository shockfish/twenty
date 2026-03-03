import { type WorkflowActionType } from '@/workflow/types/Workflow';

export const SIGNATURE_ACTION: {
  defaultLabel: string;
  type: Extract<WorkflowActionType, 'SHOW_SIGNATURE'>;
  icon: string;
} = {
  defaultLabel: 'Collect Signature',
  type: 'SHOW_SIGNATURE',
  icon: 'IconSignature',
};

