import { CmdEnterActionButton } from '@/action-menu/components/CmdEnterActionButton';
import { useCommandMenuHistory } from '@/command-menu/hooks/useCommandMenuHistory';
import { RightDrawerFooter } from '@/ui/layout/right-drawer/components/RightDrawerFooter';
import { useWorkflowRunIdOrThrow } from '@/workflow/hooks/useWorkflowRunIdOrThrow';
import { type WorkflowSignatureAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { useSubmitFormStep } from '@/workflow/workflow-steps/workflow-actions/form-action/hooks/useSubmitFormStep';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';

const StyledCanvasWrapper = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const StyledCanvas = styled.canvas`
  display: block;
  height: 200px;
  touch-action: none;
  width: 100%;
`;

const StyledClearButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.font.color.tertiary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  position: absolute;
  right: 0;
  top: 0;

  &:hover {
    color: ${({ theme }) => theme.font.color.primary};
  }
`;

export type WorkflowEditActionSignatureFillerProps = {
  action: WorkflowSignatureAction;
  actionOptions: {
    readonly: boolean;
  };
};

export const WorkflowEditActionSignatureFiller = ({
  action,
  actionOptions,
}: WorkflowEditActionSignatureFillerProps) => {
  const { t } = useLingui();
  const { submitFormStep } = useSubmitFormStep();
  const workflowRunId = useWorkflowRunIdOrThrow();
  const { goBackFromCommandMenu } = useCommandMenuHistory();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio ?? 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      signaturePadRef.current?.clear();
    };

    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgba(0, 0, 0, 0)',
    });

    resizeCanvas();

    if (actionOptions.readonly) {
      signaturePadRef.current.off();
    }

    return () => {
      signaturePadRef.current?.off();
    };
  }, [actionOptions.readonly]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const onSubmit = async () => {
    const signatureDataUrl = signaturePadRef.current?.isEmpty()
      ? null
      : (signaturePadRef.current?.toDataURL('image/png') ?? null);

    await submitFormStep({
      stepId: action.id,
      workflowRunId,
      response: { signature: signatureDataUrl },
    });

    goBackFromCommandMenu();
  };

  return (
    <>
      <WorkflowStepBody>
        <StyledCanvasWrapper>
          <StyledCanvas ref={canvasRef} />
          {!actionOptions.readonly && (
            <StyledClearButton type="button" onClick={handleClear}>
              {t`Clear`}
            </StyledClearButton>
          )}
        </StyledCanvasWrapper>
      </WorkflowStepBody>

      {!actionOptions.readonly && (
        <RightDrawerFooter
          actions={[
            <CmdEnterActionButton title={t`Done`} onClick={onSubmit} />,
          ]}
        />
      )}
    </>
  );
};

