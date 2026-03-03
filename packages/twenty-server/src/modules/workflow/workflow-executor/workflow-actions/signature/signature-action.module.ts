import { Module } from '@nestjs/common';

import { SignatureWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/signature/signature.workflow-action';

@Module({
  providers: [SignatureWorkflowAction],
  exports: [SignatureWorkflowAction],
})
export class SignatureActionModule {}

