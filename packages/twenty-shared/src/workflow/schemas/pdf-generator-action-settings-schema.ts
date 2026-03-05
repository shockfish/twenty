import { z } from 'zod';
import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowPdfGeneratorRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

export type WorkflowPdfGeneratorRow = z.infer<
  typeof workflowPdfGeneratorRowSchema
>;

export const workflowPdfGeneratorActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({
      title: z.string().optional(),
      rows: z.array(workflowPdfGeneratorRowSchema),
    }),
  });

