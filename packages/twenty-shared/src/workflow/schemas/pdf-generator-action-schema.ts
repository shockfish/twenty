import { z } from 'zod';
import { baseWorkflowActionSchema } from './base-workflow-action-schema';
import { workflowPdfGeneratorActionSettingsSchema } from './pdf-generator-action-settings-schema';

export const workflowPdfGeneratorActionSchema = baseWorkflowActionSchema.extend(
  {
    type: z.literal('GENERATE_PDF'),
    settings: workflowPdfGeneratorActionSettingsSchema,
  },
);

