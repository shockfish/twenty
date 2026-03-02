import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { type WorkflowIframeAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

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
  const [url, setUrl] = useState(action.settings.input.url);

  const saveAction = useDebouncedCallback(async (newUrl: string) => {
    if (actionOptions.readonly === true) {
      return;
    }

    actionOptions.onActionUpdate({
      ...action,
      settings: {
        ...action.settings,
        input: { url: newUrl },
      },
    });
  }, 1_000);

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
    saveAction(value);
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
      </WorkflowStepBody>

      {!actionOptions.readonly && <WorkflowStepFooter stepId={action.id} />}
    </>
  );
};

