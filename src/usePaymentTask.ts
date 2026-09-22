import useSWR from 'swr';
import { fhirBaseUrl, openmrsFetch } from '@openmrs/esm-framework';

export type PaymentState = 'paid' | 'unpaid' | 'unknown' | 'loading';

interface TaskBundle {
  entry?: Array<{ resource?: { status?: string; basedOn?: Array<{ reference?: string }> } }>;
}

/**
 * The payment state of one order, read from the FHIR Task the Odoo bridge maintains.
 *
 * This is the SAME signal the Orthanc bridge already trusts to decide whether a scan may reach the
 * modality. Reading it here rather than querying Odoo directly is deliberate: two implementations of
 * "is this paid" is how the original defect happened, where one paid invoice authorised every
 * imaging order for every patient.
 *
 * The `based-on` filter is applied AGAIN on the client. OpenMRS silently ignores search parameters
 * its FHIR module does not support, so a filter that looks applied can quietly degrade to "return
 * everything" -- exactly the failure behind the original bypass. If the server ignored it, the
 * client-side check still keeps a Task belonging to another order from answering for this one.
 */
export function usePaymentTask(orderUuid: string, enabled: boolean): PaymentState {
  const url = `${fhirBaseUrl}/Task?based-on=ServiceRequest/${orderUuid}`;
  const { data, error, isLoading } = useSWR<{ data: TaskBundle }>(
    enabled && orderUuid ? url : null,
    openmrsFetch,
  );

  if (!enabled) return 'paid'; // not gated: nothing to check
  if (isLoading) return 'loading';
  if (error) return 'unknown';

  const entries = data?.data?.entry ?? [];
  const mine = entries.filter((e) =>
    (e.resource?.basedOn ?? []).some((b) => b.reference?.endsWith(`ServiceRequest/${orderUuid}`)),
  );

  // No Task at all is NOT "unknown": the bridge creates one as soon as it sees the order, so its
  // absence means the order has not been through payment checking. Treated as unpaid.
  if (mine.length === 0) return 'unpaid';
  return mine.some((e) => e.resource?.status === 'accepted') ? 'paid' : 'unpaid';
}
