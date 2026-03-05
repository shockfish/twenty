import { CmdEnterActionButton } from '@/action-menu/components/CmdEnterActionButton';
import { useCommandMenuHistory } from '@/command-menu/hooks/useCommandMenuHistory';
import { RightDrawerFooter } from '@/ui/layout/right-drawer/components/RightDrawerFooter';
import { useWorkflowRunIdOrThrow } from '@/workflow/hooks/useWorkflowRunIdOrThrow';
import { type WorkflowIframeAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { useSubmitFormStep } from '@/workflow/workflow-steps/workflow-actions/form-action/hooks/useSubmitFormStep';
import { WORKFLOW_IFRAME_SUBMIT_EVENT_TYPE } from '@/workflow/workflow-steps/workflow-actions/iframe-action/constants/WorkflowIframeSubmitEventType';
import { useLingui } from '@lingui/react/macro';
import styled from '@emotion/styled';
import { useCallback, useEffect, useMemo, useRef } from 'react';

const StyledIframe = styled.iframe`
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.md};
  height: 500px;
  width: 100%;
`;

export type WorkflowEditActionIframeFillerProps = {
  action: WorkflowIframeAction;
  actionOptions: {
    readonly: boolean;
  };
};

export const WorkflowEditActionIframeFiller = ({
  action,
  actionOptions,
}: WorkflowEditActionIframeFillerProps) => {
  const { t } = useLingui();
  const { submitFormStep } = useSubmitFormStep();
  const workflowRunId = useWorkflowRunIdOrThrow();
  const { goBackFromCommandMenu } = useCommandMenuHistory();
  const hasSubmittedRef = useRef(false);

  const iframeUrl = useMemo(() => {
    const rawUrl = action.settings.input.url;

    if (!rawUrl) {
      return rawUrl;
    }

    try {
      const url = new URL(rawUrl);

      url.searchParams.set('workflowRunId', workflowRunId);
      url.searchParams.set('stepId', action.id);

      return url.toString();
    } catch {
      return rawUrl;
    }
  }, [action.id, action.settings.input.url, workflowRunId]);

  const handleSubmit = useCallback(
    async (response: object) => {
      if (hasSubmittedRef.current || actionOptions.readonly) {
        return;
      }

      hasSubmittedRef.current = true;

      await submitFormStep({
        stepId: action.id,
        workflowRunId,
        response,
      });

      goBackFromCommandMenu();
    },
    [
      action.id,
      actionOptions.readonly,
      goBackFromCommandMenu,
      submitFormStep,
      workflowRunId,
    ],
  );

  useEffect(() => {
    if (actionOptions.readonly) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== WORKFLOW_IFRAME_SUBMIT_EVENT_TYPE
      ) {
        return;
      }

      const data: object =
        event.data.data !== null &&
        typeof event.data.data === 'object' &&
        !Array.isArray(event.data.data)
          ? event.data.data
          : {};

      handleSubmit(data);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [actionOptions.readonly, handleSubmit]);

  return (
    <>
      <WorkflowStepBody>
        <StyledIframe
          src={iframeUrl}
          title={action.name}
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </WorkflowStepBody>

      {!actionOptions.readonly && (
        <RightDrawerFooter
          actions={[
            <CmdEnterActionButton
              title={t`Done`}
              onClick={() => handleSubmit({})}
            />,
          ]}
        />
      )}
    </>
  );
};

