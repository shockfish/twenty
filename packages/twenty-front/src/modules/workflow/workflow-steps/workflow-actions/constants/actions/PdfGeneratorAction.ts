import { type WorkflowActionType } from '@/workflow/types/Workflow';

export const PDF_GENERATOR_ACTION: {
  defaultLabel: string;
  type: Extract<WorkflowActionType, 'GENERATE_PDF'>;
  icon: string;
} = {
  defaultLabel: 'Generate PDF',
  type: 'GENERATE_PDF',
  icon: 'IconFileTypePdf',
};

