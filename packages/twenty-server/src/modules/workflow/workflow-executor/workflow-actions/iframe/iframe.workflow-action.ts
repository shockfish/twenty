import { Injectable } from '@nestjs/common';

import { type WorkflowAction } from 'src/modules/workflow/workflow-executor/interfaces/workflow-action.interface';

import {
  WorkflowStepExecutorException,
  WorkflowStepExecutorExceptionCode,
} from 'src/modules/workflow/workflow-executor/exceptions/workflow-step-executor.exception';
import { type WorkflowActionInput } from 'src/modules/workflow/workflow-executor/types/workflow-action-input';
import { type WorkflowActionOutput } from 'src/modules/workflow/workflow-executor/types/workflow-action-output.type';
import { findStepOrThrow } from 'src/modules/workflow/workflow-executor/utils/find-step-or-throw.util';
import { isWorkflowIframeAction } from 'src/modules/workflow/workflow-executor/workflow-actions/iframe/guards/is-workflow-iframe-action.guard';

@Injectable()
export class IframeWorkflowAction implements WorkflowAction {
  async execute({
    currentStepId,
    steps,
  }: WorkflowActionInput): Promise<WorkflowActionOutput> {
    const step = findStepOrThrow({
      stepId: currentStepId,
      steps,
    });

    if (!isWorkflowIframeAction(step)) {
      throw new WorkflowStepExecutorException(
        'Step is not an iframe action',
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }

    // Workflow pauses here and waits for user to complete the iframe interaction
    return {
      pendingEvent: true,
    };
  }
}

