import { z } from 'zod';
import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowIframeActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({
      url: z.string(),
    }),
  });

