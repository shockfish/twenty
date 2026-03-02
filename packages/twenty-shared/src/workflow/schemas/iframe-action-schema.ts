import { z } from 'zod';
import { baseWorkflowActionSchema } from './base-workflow-action-schema';
import { workflowIframeActionSettingsSchema } from './iframe-action-settings-schema';

export const workflowIframeActionSchema = baseWorkflowActionSchema.extend({
  type: z.literal('SHOW_IFRAME'),
  settings: workflowIframeActionSettingsSchema,
});

