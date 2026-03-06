import { triggerUpdateRecordOptimisticEffect } from '@/apollo/optimistic-effect/utils/triggerUpdateRecordOptimisticEffect';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getObjectTypename } from '@/object-record/cache/utils/getObjectTypename';
import { getRecordFromCache } from '@/object-record/cache/utils/getRecordFromCache';
import { getRecordNodeFromRecord } from '@/object-record/cache/utils/getRecordNodeFromRecord';
import { updateRecordFromCache } from '@/object-record/cache/utils/updateRecordFromCache';
import { generateDepthRecordGqlFieldsFromRecord } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromRecord';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useRefetchAggregateQueriesForObjectMetadataItem } from '@/object-record/hooks/useRefetchAggregateQueriesForObjectMetadataItem';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { computeOptimisticRecordFromInput } from '@/object-record/utils/computeOptimisticRecordFromInput';
import { useCallback } from 'react';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';
import {
  DatabaseEventAction,
  FieldMetadataType,
  type ObjectRecordEvent,
} from '~/generated-metadata/graphql';

export const useTriggerOptimisticEffectFromSseUpdateEvents = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { refetchAggregateQueriesForObjectMetadataItem } =
    useRefetchAggregateQueriesForObjectMetadataItem();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const triggerOptimisticEffectFromSseUpdateEvents = useCallback(
    ({
      objectRecordEvents,
      objectMetadataItem,
    }: {
      objectRecordEvents: ObjectRecordEvent[];
      objectMetadataItem: ObjectMetadataItem;
    }) => {
      const updateEvents = objectRecordEvents.filter((objectRecordEvent) => {
        return objectRecordEvent.action === DatabaseEventAction.UPDATED;
      });

      for (const updateEvent of updateEvents) {
        const updatedRecord = updateEvent.properties.after;

        if (!isDefined(updatedRecord)) {
          continue;
        }

        const computedOptimisticRecord = {
          ...computeOptimisticRecordFromInput({
            cache: apolloCoreClient.cache,
            objectMetadataItem,
            objectMetadataItems,
            recordInput: updatedRecord,
            objectPermissionsByObjectMetadataId,
            currentWorkspaceMember: null,
          }),
          id: updatedRecord.id,
          __typename: getObjectTypename(objectMetadataItem.nameSingular),
        };

        const recordGqlFields = generateDepthRecordGqlFieldsFromRecord({
          objectMetadataItem,
          objectMetadataItems,
          record: computedOptimisticRecord,
          depth: 0,
        });

        const cachedRecord = getRecordFromCache({
          cache: apolloCoreClient.cache,
          objectMetadataItem,
          objectMetadataItems,
          recordId: updatedRecord.id,
          recordGqlFields,
          objectPermissionsByObjectMetadataId,
        });

        const cachedRecordWithConnection = getRecordNodeFromRecord({
          record: cachedRecord,
          objectMetadataItem,
          objectMetadataItems,
          recordGqlFields,
          computeReferences: false,
        });

        if (
          !isDefined(cachedRecord) ||
          !isDefined(cachedRecordWithConnection)
        ) {
          continue;
        }

        // SSE events carry raw DB data for FILES fields: { fileId, label, extension }
        // but omit the computed `url` (signed URL). Apollo cache writes fail when the
        // cache fragment expects `url` but the incoming data doesn't have it.
        // Fix: copy `url` values from the already-cached FILES items (by fileId) into
        // the optimistic record so the cache write succeeds. New files (not yet cached)
        // get url: null, which is valid since the field is nullable in GraphQL.
        const cachedRecordAsMap = cachedRecord as Record<string, unknown>;
        const optimisticRecordAsMap = computedOptimisticRecord as Record<
          string,
          unknown
        >;

        for (const field of objectMetadataItem.fields) {
          if (field.type !== FieldMetadataType.FILES) {
            continue;
          }

          const optimisticFiles = optimisticRecordAsMap[field.name];

          if (!Array.isArray(optimisticFiles)) {
            continue;
          }

          const cachedFiles = cachedRecordAsMap[field.name];
          const cachedUrlByFileId = new Map<string, string | null>();

          if (Array.isArray(cachedFiles)) {
            for (const cachedFile of cachedFiles) {
              if (isDefined(cachedFile?.fileId)) {
                cachedUrlByFileId.set(
                  cachedFile.fileId,
                  cachedFile.url ?? null,
                );
              }
            }
          }

          optimisticRecordAsMap[field.name] = optimisticFiles.map(
            (file: { fileId?: string; [key: string]: unknown }) => ({
              ...file,
              url: cachedUrlByFileId.get(file.fileId ?? '') ?? null,
            }),
          );
        }

        upsertRecordsInStore({ partialRecords: [computedOptimisticRecord] });

        updateRecordFromCache({
          objectMetadataItems,
          objectMetadataItem,
          cache: apolloCoreClient.cache,
          record: computedOptimisticRecord,
          recordGqlFields,
          objectPermissionsByObjectMetadataId,
        });

        const computedOptimisticRecordWithConnection = getRecordNodeFromRecord({
          record: computedOptimisticRecord,
          objectMetadataItem,
          objectMetadataItems,
          recordGqlFields,
        });

        if (!isDefined(computedOptimisticRecordWithConnection)) {
          continue;
        }

        triggerUpdateRecordOptimisticEffect({
          cache: apolloCoreClient.cache,
          objectMetadataItem,
          currentRecord: cachedRecordWithConnection,
          updatedRecord: computedOptimisticRecordWithConnection,
          objectMetadataItems,
          objectPermissionsByObjectMetadataId,
          upsertRecordsInStore,
        });
      }

      if (isNonEmptyArray(updateEvents)) {
        refetchAggregateQueriesForObjectMetadataItem({
          objectMetadataItem,
        });
      }

      return isNonEmptyArray(updateEvents);
    },
    [
      apolloCoreClient.cache,
      objectMetadataItems,
      objectPermissionsByObjectMetadataId,
      refetchAggregateQueriesForObjectMetadataItem,
      upsertRecordsInStore,
    ],
  );

  return {
    triggerOptimisticEffectFromSseUpdateEvents,
  };
};
