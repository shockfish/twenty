import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { type WorkflowPdfGeneratorAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { type WorkflowPdfGeneratorRow } from 'twenty-shared/workflow';
import { IconPlus, IconTrash } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { v4 } from 'uuid';

const StyledRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledRowLabel = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  text-transform: uppercase;
`;

const StyledRow = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledRowFields = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

const StyledFieldWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

type WorkflowEditActionPdfGeneratorProps = {
  action: WorkflowPdfGeneratorAction;
  actionOptions:
    | { readonly: true }
    | {
        readonly?: false;
        onActionUpdate: (action: WorkflowPdfGeneratorAction) => void;
      };
};

export const WorkflowEditActionPdfGenerator = ({
  action,
  actionOptions,
}: WorkflowEditActionPdfGeneratorProps) => {
  const { t: tMacro } = useLingui();

  const [title, setTitle] = useState(action.settings.input.title ?? '');
  const [rows, setRows] = useState<WorkflowPdfGeneratorRow[]>(
    action.settings.input.rows,
  );

  const saveAction = useDebouncedCallback(
    (newTitle: string, newRows: WorkflowPdfGeneratorRow[]) => {
      if (actionOptions.readonly === true) return;
      actionOptions.onActionUpdate({
        ...action,
        settings: {
          ...action.settings,
          input: { title: newTitle, rows: newRows },
        },
      });
    },
    1_000,
  );

  useEffect(() => {
    return () => {
      saveAction.flush();
    };
  }, [saveAction]);

  const handleTitleChange = (value: string | null) => {
    if (actionOptions.readonly === true) return;
    const newTitle = value ?? '';
    setTitle(newTitle);
    saveAction(newTitle, rows);
  };

  const handleAddRow = () => {
    if (actionOptions.readonly === true) return;
    const newRows: WorkflowPdfGeneratorRow[] = [
      ...rows,
      { id: v4(), label: '', value: '' },
    ];
    setRows(newRows);
    saveAction(title, newRows);
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    if (actionOptions.readonly === true) return;
    const newRows = rows.map((row) =>
      row.id === id ? { ...row, label: newLabel } : row,
    );
    setRows(newRows);
    saveAction(title, newRows);
  };

  const handleValueChange = (id: string, newValue: string | null) => {
    if (actionOptions.readonly === true) return;
    const newRows = rows.map((row) =>
      row.id === id ? { ...row, value: newValue ?? '' } : row,
    );
    setRows(newRows);
    saveAction(title, newRows);
  };

  const handleRemoveRow = (id: string) => {
    if (actionOptions.readonly === true) return;
    const newRows = rows.filter((row) => row.id !== id);
    setRows(newRows);
    saveAction(title, newRows);
  };

  return (
    <>
      <WorkflowStepBody>
        <FormTextFieldInput
          label={t`PDF Title`}
          defaultValue={title}
          onChange={handleTitleChange}
          readonly={actionOptions.readonly}
          placeholder={t`Document Title (optional)`}
        />

        <StyledRowContainer>
          <StyledRowLabel>{t`Variables`}</StyledRowLabel>
          {rows.map((row) => (
            <StyledRow key={row.id}>
              <StyledRowFields>
                <StyledFieldWrapper>
                  <FormTextFieldInput
                    label={t`Name`}
                    defaultValue={row.label}
                    placeholder={t`e.g. Full Name`}
                    readonly={actionOptions.readonly}
                    onChange={(value) =>
                      handleLabelChange(row.id, value ?? '')
                    }
                  />
                </StyledFieldWrapper>
                <StyledFieldWrapper>
                  <FormTextFieldInput
                    label={t`Value`}
                    defaultValue={row.value}
                    placeholder={t`Value or {{variable}}`}
                    readonly={actionOptions.readonly}
                    onChange={(value) => handleValueChange(row.id, value)}
                    VariablePicker={WorkflowVariablePicker}
                  />
                </StyledFieldWrapper>
                {!actionOptions.readonly && (
                  <Button
                    Icon={IconTrash}
                    size="small"
                    variant="tertiary"
                    ariaLabel={tMacro`Remove row`}
                    onClick={() => handleRemoveRow(row.id)}
                  />
                )}
              </StyledRowFields>
            </StyledRow>
          ))}
          {!actionOptions.readonly && (
            <Button
              Icon={IconPlus}
              title={t`Add Variable`}
              size="small"
              variant="secondary"
              onClick={handleAddRow}
            />
          )}
        </StyledRowContainer>
      </WorkflowStepBody>

      {!actionOptions.readonly && <WorkflowStepFooter stepId={action.id} />}
    </>
  );
};

