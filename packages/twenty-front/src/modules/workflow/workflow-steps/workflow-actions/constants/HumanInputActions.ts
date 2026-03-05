import { type WorkflowActionType } from '@/workflow/types/Workflow';
import { FORM_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/FormAction';
import { IFRAME_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/IframeAction';
import { PDF_GENERATOR_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/PdfGeneratorAction';
import { SIGNATURE_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/SignatureAction';

export const HUMAN_INPUT_ACTIONS: Array<{
  defaultLabel: string;
  type: Extract<
    WorkflowActionType,
    'FORM' | 'SHOW_IFRAME' | 'SHOW_SIGNATURE' | 'GENERATE_PDF'
  >;
  icon: string;
}> = [FORM_ACTION, IFRAME_ACTION, SIGNATURE_ACTION, PDF_GENERATOR_ACTION];
