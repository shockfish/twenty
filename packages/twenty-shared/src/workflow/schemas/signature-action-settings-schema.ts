import { z } from 'zod';
import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowSignatureActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({}),
  });

