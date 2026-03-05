import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type WorkflowIframeAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { FieldMetadataType } from 'twenty-shared/types';
import { type WorkflowIframeOutputField } from 'twenty-shared/workflow';
import { IconCopy, IconPlus, IconTrash } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { v4 } from 'uuid';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const StyledWebhookSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledWebhookLabel = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  text-transform: uppercase;
`;

const StyledWebhookUrlRow = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.background.transparent.lighter};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) =>
    theme.spacing(2)};
`;

const StyledWebhookUrl = styled.span`
  color: ${({ theme }) => theme.font.color.secondary};
  font-family: ${({ theme }) => theme.code.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledOutputFieldsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledOutputFieldRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledFieldInputWrapper = styled.div`
  flex: 1;
`;

type WorkflowEditActionIframeProps = {
  action: WorkflowIframeAction;
  actionOptions:
    | {
        readonly: true;
      }
    | {
        readonly?: false;
        onActionUpdate: (action: WorkflowIframeAction) => void;
      };
};

export const WorkflowEditActionIframe = ({
  action,
  actionOptions,
}: WorkflowEditActionIframeProps) => {
  const { t: tMacro } = useLingui();
  const { copyToClipboard } = useCopyToClipboard();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const webhookUrl = `${REACT_APP_SERVER_BASE_URL}/workflow/iframe-webhook/${currentWorkspace?.id ?? ''}`;

  const [url, setUrl] = useState(action.settings.input.url);
  const [outputFields, setOutputFields] = useState<WorkflowIframeOutputField[]>(
    action.settings.outputFields ?? [],
  );

  const saveAction = useDebouncedCallback(
    async (newUrl: string, newFields: WorkflowIframeOutputField[]) => {
      if (actionOptions.readonly === true) {
        return;
      }

      actionOptions.onActionUpdate({
        ...action,
        settings: {
          ...action.settings,
          input: { url: newUrl },
          outputFields: newFields,
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

  const handleUrlChange = (newUrl: string | null) => {
    if (actionOptions.readonly === true) {
      return;
    }

    const value = newUrl ?? '';
    setUrl(value);
    saveAction(value, outputFields);
  };

  const handleAddField = () => {
    if (actionOptions.readonly === true) {
      return;
    }

    const newFields: WorkflowIframeOutputField[] = [
      ...outputFields,
      { id: v4(), name: '', label: '', type: FieldMetadataType.TEXT },
    ];
    setOutputFields(newFields);
    saveAction(url, newFields);
  };

  const handleFieldNameChange = (id: string, newName: string) => {
    if (actionOptions.readonly === true) {
      return;
    }

    const newFields = outputFields.map((f) =>
      f.id === id ? { ...f, name: newName, label: newName } : f,
    );
    setOutputFields(newFields);
    saveAction(url, newFields);
  };

  const handleRemoveField = (id: string) => {
    if (actionOptions.readonly === true) {
      return;
    }

    const newFields = outputFields.filter((f) => f.id !== id);
    setOutputFields(newFields);
    saveAction(url, newFields);
  };

  return (
    <>
      <WorkflowStepBody>
        <FormTextFieldInput
          label={t`Iframe URL`}
          defaultValue={url}
          onChange={handleUrlChange}
          readonly={actionOptions.readonly}
          VariablePicker={WorkflowVariablePicker}
          placeholder={t`https://example.com/form`}
        />

        <StyledWebhookSection>
          <StyledWebhookLabel>{t`Formbricks Webhook URL`}</StyledWebhookLabel>
          <StyledWebhookUrlRow>
            <StyledWebhookUrl title={webhookUrl}>{webhookUrl}</StyledWebhookUrl>
            <Button
              Icon={IconCopy}
              size="small"
              variant="tertiary"
              ariaLabel={tMacro`Copy webhook URL`}
              onClick={() =>
                copyToClipboard(webhookUrl, tMacro`Webhook URL copied`)
              }
            />
          </StyledWebhookUrlRow>
        </StyledWebhookSection>

        <StyledOutputFieldsSection>
          <StyledWebhookLabel>{t`Output Fields`}</StyledWebhookLabel>
          {outputFields.map((field) => (
            <StyledOutputFieldRow key={field.id}>
              <StyledFieldInputWrapper>
                <FormTextFieldInput
                  label={t`Field Name`}
                  defaultValue={field.name}
                  placeholder={t`e.g. email`}
                  readonly={actionOptions.readonly}
                  onChange={(value) =>
                    handleFieldNameChange(field.id, value ?? '')
                  }
                />
              </StyledFieldInputWrapper>
              {!actionOptions.readonly && (
                <Button
                  Icon={IconTrash}
                  size="small"
                  variant="tertiary"
                  ariaLabel={tMacro`Remove field`}
                  onClick={() => handleRemoveField(field.id)}
                />
              )}
            </StyledOutputFieldRow>
          ))}
          {!actionOptions.readonly && (
            <Button
              Icon={IconPlus}
              title={t`Add Field`}
              size="small"
              variant="secondary"
              onClick={handleAddField}
            />
          )}
        </StyledOutputFieldsSection>
      </WorkflowStepBody>

      {!actionOptions.readonly && <WorkflowStepFooter stepId={action.id} />}
    </>
  );
};

