import { useCommandMenuHistory } from '@/command-menu/hooks/useCommandMenuHistory';
import { useWorkflowRun } from '@/workflow/hooks/useWorkflowRun';
import { useWorkflowRunIdOrThrow } from '@/workflow/hooks/useWorkflowRunIdOrThrow';
import { type WorkflowPdfGeneratorAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { useSubmitFormStep } from '@/workflow/workflow-steps/workflow-actions/form-action/hooks/useSubmitFormStep';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import { useEffect, useRef, useState } from 'react';
import { resolveInput } from 'twenty-shared/utils';
import { getWorkflowRunContext } from 'twenty-shared/workflow';

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
  },
  table: {
    width: '100%',
  },
  row: {
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  rowEven: {
    backgroundColor: '#f9fafb',
  },
  labelCell: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    padding: 8,
    width: '40%',
  },
  valueCell: {
    fontSize: 11,
    padding: 8,
    width: '60%',
  },
});

// resolveInput may return any type (object, number, null…); stringify safely for PDF rendering
const formatResolvedValue = (value: unknown): string => {
  if (value == null || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

type PdfDocumentProps = {
  title?: string;
  rows: Array<{ id: string; label: string; value: unknown }>;
};

const PdfVariablesDocument = ({ title, rows }: PdfDocumentProps) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {title ? <Text style={pdfStyles.title}>{formatResolvedValue(title)}</Text> : null}
      <View style={pdfStyles.table}>
        {rows.map((row, index) => (
          <View
            key={row.id}
            style={[pdfStyles.row, index % 2 !== 0 ? pdfStyles.rowEven : {}]}
          >
            <View style={pdfStyles.labelCell}>
              <Text>{formatResolvedValue(row.label)}</Text>
            </View>
            <View style={pdfStyles.valueCell}>
              <Text>{formatResolvedValue(row.value)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const StyledStatusText = styled.p`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin: 0;
`;

export type WorkflowEditActionPdfGeneratorFillerProps = {
  action: WorkflowPdfGeneratorAction;
  actionOptions: {
    readonly: boolean;
  };
};

export const WorkflowEditActionPdfGeneratorFiller = ({
  action,
  actionOptions,
}: WorkflowEditActionPdfGeneratorFillerProps) => {
  const { t } = useLingui();
  const { submitFormStep } = useSubmitFormStep();
  const workflowRunId = useWorkflowRunIdOrThrow();
  const workflowRun = useWorkflowRun({ workflowRunId });
  const { goBackFromCommandMenu } = useCommandMenuHistory();

  const [status, setStatus] = useState<'generating' | 'submitting' | 'error'>(
    'generating',
  );
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // In readonly mode (viewing a completed run) skip generation entirely
    if (actionOptions.readonly) return;
    // Wait until the workflow run state is loaded (previous step outputs needed for variable resolution)
    const stepInfos = workflowRun?.state?.stepInfos;
    if (!stepInfos) return;

    let cancelled = false;

    const generateAndSubmit = async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('[GeneratePDF] Step 1: resolving variables', { stepInfos });

        const context = getWorkflowRunContext(stepInfos);

        // eslint-disable-next-line no-console
        console.log('[GeneratePDF] Step 2: context built', { context });

        let resolvedRows: Array<{ id: string; label: string; value: unknown }> =
          [];
        let resolvedTitle: string | undefined;

        try {
          const resolvedInput = resolveInput(
            action.settings.input,
            context,
          ) as {
            title?: unknown;
            rows: Array<{ id: string; label: string; value: unknown }>;
          };
          resolvedTitle =
            resolvedInput?.title != null
              ? formatResolvedValue(resolvedInput.title)
              : undefined;
          resolvedRows = Array.isArray(resolvedInput?.rows)
            ? resolvedInput.rows
            : action.settings.input.rows;
        } catch (resolveErr) {
          // eslint-disable-next-line no-console
          console.warn(
            '[GeneratePDF] resolveInput failed, using raw values:',
            resolveErr,
          );
          resolvedTitle = action.settings.input.title;
          resolvedRows = action.settings.input.rows;
        }

        // eslint-disable-next-line no-console
        console.log('[GeneratePDF] Step 3: rendering PDF', {
          resolvedTitle,
          resolvedRows,
        });

        const blob = await pdf(
          <PdfVariablesDocument
            title={resolvedTitle}
            rows={resolvedRows}
          />,
        ).toBlob();

        if (cancelled || hasSubmittedRef.current) return;

        // Convert to base64 data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (cancelled || hasSubmittedRef.current) return;

        hasSubmittedRef.current = true;
        setStatus('submitting');

        await submitFormStep({
          stepId: action.id,
          workflowRunId,
          response: { pdf: dataUrl },
        });

        if (!cancelled) {
          goBackFromCommandMenu();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[GeneratePDF] Failed to generate or submit PDF:', error);
        if (!cancelled) {
          setStatus('error');
        }
      }
    };

    generateAndSubmit();

    return () => {
      cancelled = true;
    };
  }, [workflowRun?.state?.stepInfos, actionOptions.readonly]); // eslint-disable-line react-hooks/exhaustive-deps

  if (actionOptions.readonly) {
    return null;
  }

  return (
    <WorkflowStepBody>
      {status === 'generating' && (
        <StyledStatusText>{t`Generating PDF…`}</StyledStatusText>
      )}
      {status === 'submitting' && (
        <StyledStatusText>{t`Attaching PDF…`}</StyledStatusText>
      )}
      {status === 'error' && (
        <StyledStatusText>{t`Failed to generate PDF`}</StyledStatusText>
      )}
    </WorkflowStepBody>
  );
};

