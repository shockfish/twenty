import { type WorkflowSignatureAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { t } from '@lingui/core/macro';
import styled from '@emotion/styled';

const StyledDescription = styled.p`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin: 0;
`;

type WorkflowEditActionSignatureProps = {
  action: WorkflowSignatureAction;
  actionOptions:
    | {
        readonly: true;
      }
    | {
        readonly?: false;
        onActionUpdate: (action: WorkflowSignatureAction) => void;
      };
};

export const WorkflowEditActionSignature = ({
  action,
  actionOptions,
}: WorkflowEditActionSignatureProps) => {
  return (
    <>
      <WorkflowStepBody>
        <StyledDescription>
          {t`When this step runs, a signature pad will be shown to the user. The workflow will pause until the user submits their signature.`}
        </StyledDescription>
      </WorkflowStepBody>

      {!actionOptions.readonly && <WorkflowStepFooter stepId={action.id} />}
    </>
  );
};

