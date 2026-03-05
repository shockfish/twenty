import { z } from 'zod';
import { FieldMetadataType } from '../../types/FieldMetadataType';
import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowIframeOutputFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.union([
    z.literal(FieldMetadataType.TEXT),
    z.literal(FieldMetadataType.NUMBER),
  ]),
});

export type WorkflowIframeOutputField = z.infer<
  typeof workflowIframeOutputFieldSchema
>;

export const workflowIframeActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({
      url: z.string(),
    }),
    outputFields: z.array(workflowIframeOutputFieldSchema).optional(),
  });

