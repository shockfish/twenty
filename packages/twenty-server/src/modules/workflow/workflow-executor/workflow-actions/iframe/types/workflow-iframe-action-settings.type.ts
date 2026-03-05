import { type FieldMetadataType } from 'twenty-shared/types';

import { type BaseWorkflowActionSettings } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-settings.type';

export type WorkflowIframeOutputField = {
  id: string;
  name: string;
  label: string;
  type: FieldMetadataType.TEXT | FieldMetadataType.NUMBER;
};

export type WorkflowIframeActionSettings = BaseWorkflowActionSettings & {
  input: {
    url: string;
  };
  outputFields?: WorkflowIframeOutputField[];
};

