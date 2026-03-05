// Message type sent by the iframe to submit form data back to TwentyCRM workflow.
// Usage from within the iframe:
//   window.parent.postMessage(
//     { type: WORKFLOW_IFRAME_SUBMIT_EVENT_TYPE, data: { field: 'value' } },
//     '*',
//   );
export const WORKFLOW_IFRAME_SUBMIT_EVENT_TYPE =
  'TWENTY_WORKFLOW_IFRAME_SUBMIT';

