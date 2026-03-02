import { Module } from '@nestjs/common';

import { IframeWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/iframe/iframe.workflow-action';

@Module({
  providers: [IframeWorkflowAction],
  exports: [IframeWorkflowAction],
})
export class IframeActionModule {}

