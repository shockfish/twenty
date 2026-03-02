import { CmdEnterActionButton } from '@/action-menu/components/CmdEnterActionButton';
import { useCommandMenuHistory } from '@/command-menu/hooks/useCommandMenuHistory';
import { RightDrawerFooter } from '@/ui/layout/right-drawer/components/RightDrawerFooter';
import { useWorkflowRunIdOrThrow } from '@/workflow/hooks/useWorkflowRunIdOrThrow';
import { type WorkflowIframeAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { useSubmitFormStep } from '@/workflow/workflow-steps/workflow-actions/form-action/hooks/useSubmitFormStep';
import { useLingui } from '@lingui/react/macro';
import styled from '@emotion/styled';

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

  const iframeUrl = action.settings.input.url;

  const onSubmit = async () => {
    await submitFormStep({
      stepId: action.id,
      workflowRunId,
      response: {},
    });

    goBackFromCommandMenu();
  };

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
              onClick={onSubmit}
            />,
          ]}
        />
      )}
    </>
  );
};

