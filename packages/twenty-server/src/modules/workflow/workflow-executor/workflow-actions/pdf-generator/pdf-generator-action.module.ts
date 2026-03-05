import { Module } from '@nestjs/common';

import { PdfGeneratorWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/pdf-generator/pdf-generator.workflow-action';

@Module({
  providers: [PdfGeneratorWorkflowAction],
  exports: [PdfGeneratorWorkflowAction],
})
export class PdfGeneratorActionModule {}

