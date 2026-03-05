import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WorkflowRunnerWorkspaceService } from 'src/modules/workflow/workflow-runner/workspace-services/workflow-runner.workspace-service';

// Formbricks webhook payload shape (simplified)
type FormbricksWebhookPayload = {
  event?: string;
  data?: {
    data?: Record<string, unknown>;
    hiddenFields?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  };
};

@Controller('workflow/iframe-webhook')
export class WorkflowIframeWebhookController {
  private readonly logger = new Logger(WorkflowIframeWebhookController.name);

  constructor(
    private readonly workflowRunnerWorkspaceService: WorkflowRunnerWorkspaceService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  // Endpoint to configure in Formbricks:
  //   POST https://<your-twenty-domain>/workflow/iframe-webhook/<workspaceId>
  //
  // Add hidden fields "workflowRunId" and "stepId" to your Formbricks survey,
  // then pass them via the iframe URL query params — TwentyCRM does this
  // automatically at runtime.
  @Post(':workspaceId')
  @HttpCode(200)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async handleFormbricksWebhook(
    @Param('workspaceId') workspaceId: string,
    @Body() body: FormbricksWebhookPayload,
  ): Promise<{ received: boolean }> {
    // Formbricks sends several events; only act on final submission.
    if (body?.event !== 'responseFinished') {
      return { received: true };
    }

    // Formbricks puts hidden fields inside data.data (alongside regular answers).
    // data.hiddenFields may also be present but is not always populated.
    const rawData = body.data?.data ?? {};
    const hiddenFields = body.data?.hiddenFields ?? {};

    const workflowRunId =
      rawData['workflowRunId'] ?? hiddenFields['workflowRunId'];
    const stepId = rawData['stepId'] ?? hiddenFields['stepId'];

    if (typeof workflowRunId !== 'string' || typeof stepId !== 'string') {
      this.logger.warn(
        `[IframeWebhook] Missing workflowRunId or stepId in payload for workspace ${workspaceId}`,
      );

      return { received: true };
    }

    const workspaceExists = await this.workspaceRepository.existsBy({
      id: workspaceId,
    });

    if (!workspaceExists) {
      this.logger.warn(
        `[IframeWebhook] Workspace ${workspaceId} not found`,
      );

      return { received: true };
    }

    // Build the response from form answers, excluding internal routing keys.
    const { workflowRunId: _r, stepId: _s, ...formAnswers } = rawData;
    const response: object = {
      ...formAnswers,
      ...(body.data?.variables ?? {}),
    };

    this.logger.log(
      `[IframeWebhook] Calling submitFormStep — workflowRunId=${workflowRunId} stepId=${stepId} response=${JSON.stringify(response)}`,
    );

    try {
      await this.workflowRunnerWorkspaceService.submitFormStep({
        workspaceId,
        stepId,
        workflowRunId,
        response,
      });

      this.logger.log(
        `[IframeWebhook] submitFormStep succeeded for run ${workflowRunId}`,
      );
    } catch (error) {
      // Log full error so we can diagnose — always return 200 so Formbricks does not retry.
      this.logger.error(
        `[IframeWebhook] submitFormStep FAILED for run ${workflowRunId}, step ${stepId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { received: true };
  }
}

