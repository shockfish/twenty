import { z } from 'zod';
import { baseWorkflowActionSchema } from './base-workflow-action-schema';
import { workflowSignatureActionSettingsSchema } from './signature-action-settings-schema';

export const workflowSignatureActionSchema = baseWorkflowActionSchema.extend({
  type: z.literal('SHOW_SIGNATURE'),
  settings: workflowSignatureActionSettingsSchema,
});

