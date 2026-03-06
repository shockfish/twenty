import { useMutation } from '@apollo/client';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { getObjectTypename } from '@/object-record/cache/utils/getObjectTypename';
import { useFindOneRecordQuery } from '@/object-record/hooks/useFindOneRecordQuery';
import { SUBMIT_FORM_STEP } from '@/workflow/workflow-steps/workflow-actions/form-action/graphql/mutations/submitFormStep';
import { isDefined } from 'twenty-shared/utils';
import {
  type SubmitFormStepInput,
  type SubmitFormStepMutation,
  type SubmitFormStepMutationVariables,
} from '~/generated/graphql';

const WORKFLOW_RUN_TERMINAL_STATUSES = ['COMPLETED', 'FAILED'];
const WORKFLOW_RUN_POLL_INTERVAL_MS = 1000;
const WORKFLOW_RUN_MAX_POLL_ATTEMPTS = 30;

export const useSubmitFormStep = () => {
  // apolloCoreClient connects to /graphql and holds all workspace record data.
  // useApolloClient() connects to /metadata and must NOT be used for workspace evictions.
  const apolloCoreClient = useApolloCoreClient();

  const [mutate] = useMutation<
    SubmitFormStepMutation,
    SubmitFormStepMutationVariables
  >(SUBMIT_FORM_STEP, {
    client: apolloCoreClient,
  });

  const { findOneRecordQuery: findOneWorkflowRunQuery } = useFindOneRecordQuery(
    {
      objectNameSingular: CoreObjectNameSingular.WorkflowRun,
      recordGqlFields: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    },
  );

  const { findOneRecordQuery: findOneWorkflowRunWithStateQuery } =
    useFindOneRecordQuery({
      objectNameSingular: CoreObjectNameSingular.WorkflowRun,
      recordGqlFields: {
        id: true,
        status: true,
        state: true,
      },
    });

  const evictRecordAfterWorkflowCompletion = (workflowRunId: string) => {
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await apolloCoreClient.query({
          query: findOneWorkflowRunWithStateQuery,
          variables: { objectRecordId: workflowRunId },
          fetchPolicy: 'network-only',
        });

        const workflowRun = result.data?.workflowRun;
        const status = workflowRun?.status;

        if (
          isDefined(status) &&
          WORKFLOW_RUN_TERMINAL_STATUSES.includes(status)
        ) {
          const triggerResult = workflowRun?.state?.stepInfos?.trigger?.result;
          const availability =
            workflowRun?.state?.flow?.trigger?.settings?.availability;

          const recordId = triggerResult?.id;
          const objectNameSingular = availability?.objectNameSingular;

          if (isDefined(recordId) && isDefined(objectNameSingular)) {
            const cacheId = apolloCoreClient.cache.identify({
              __typename: getObjectTypename(objectNameSingular),
              id: recordId,
            });

            if (isDefined(cacheId)) {
              apolloCoreClient.cache.evict({ id: cacheId });
              apolloCoreClient.cache.gc();
            }
          }

          return;
        }
      } catch {
        // Ignore polling errors silently
      }

      attempts++;
      if (attempts < WORKFLOW_RUN_MAX_POLL_ATTEMPTS) {
        setTimeout(poll, WORKFLOW_RUN_POLL_INTERVAL_MS);
      }
    };

    setTimeout(poll, WORKFLOW_RUN_POLL_INTERVAL_MS);
  };

  const submitFormStep = async (input: SubmitFormStepInput) => {
    const result = await mutate({
      variables: { input },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: findOneWorkflowRunQuery,
          variables: {
            objectRecordId: input.workflowRunId,
          },
        },
      ],
    });
    const isSuccess = result?.data?.submitFormStep;

    if (isSuccess === true) {
      evictRecordAfterWorkflowCompletion(input.workflowRunId);
    }

    return isSuccess;
  };

  return { submitFormStep };
};
