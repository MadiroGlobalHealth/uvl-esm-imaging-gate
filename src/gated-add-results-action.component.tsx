import React from 'react';
import { Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useSWRConfig } from 'swr';
import { AddIcon, launchWorkspace2, restBaseUrl, useConfig } from '@openmrs/esm-framework';
import { type Order } from '@openmrs/esm-framework';
import { type Config } from './config-schema';
import { usePaymentTask } from './usePaymentTask';

interface Props {
  order: Order;
}

/**
 * Replaces the laboratory app's "Add lab results" button for imaging orders only.
 *
 * Registered into the same `inprogress-tests-actions-slot`; the upstream extension is removed for
 * this distro in the site frontend config. Doing it this way, rather than forking
 * esm-laboratory-app, keeps us off a fork of an upstream app for the sake of one button.
 *
 * IMPORTANT: that slot carries LAB orders too. Anything not in radiologyConceptUuids is passed
 * through completely ungated -- lab is not payment-gated at Mugamba, and blocking it here would be
 * a new outage rather than a fix.
 */
const GatedAddResultsAction: React.FC<Props> = ({ order }) => {
  const { t } = useTranslation();
  const config = useConfig<Config>();
  const { mutate } = useSWRConfig();

  const conceptUuid = (order as any)?.concept?.uuid ?? (order as any)?.concept;
  const isImaging = config.radiologyConceptUuids.includes(conceptUuid);
  const payment = usePaymentTask(order?.uuid, isImaging);

  const invalidateLabOrders = () => {
    mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/order?orderTypes=`));
  };

  const launch = () => {
    launchWorkspace2(
      'lab-app-test-results-form-workspace',
      {
        patient: order.patient,
        order,
        invalidateLabOrders,
        labOrderWorkspaceName: 'lab-app-test-results-add-lab-order-workspace',
      },
      {
        patient: order.patient,
        patientUuid: order.patient.uuid,
        encounterUuid: order.encounter?.uuid ?? '',
        visitContext: order.encounter?.visit ?? null,
      },
    );
  };

  const blocked =
    payment === 'unpaid' || (payment === 'unknown' && config.blockWhenPaymentStatusUnknown);

  // Disabled with the reason on it, never hidden. A button that vanishes reads as broken software
  // and becomes a support call; one that says why tells the technician where to send the patient.
  const label = blocked
    ? t('paymentNotConfirmed', 'Paiement non confirmé')
    : t('addResults', 'Saisir les résultats');

  const why = blocked
    ? payment === 'unpaid'
      ? t(
          'paymentNotConfirmedHelp',
          "Cet examen n'a pas encore été payé. Le patient doit régler à la Caisse avant la saisie des résultats.",
        )
      : t('paymentUnverifiable', "Le statut de paiement n'a pas pu être vérifié.")
    : undefined;

  return (
    <Button
      kind="primary"
      size="sm"
      disabled={blocked || payment === 'loading'}
      title={why}
      renderIcon={() => <AddIcon />}
      iconDescription={label}
      onClick={blocked ? undefined : launch}
    >
      {payment === 'loading' ? t('checkingPayment', 'Vérification du paiement…') : label}
    </Button>
  );
};

export default GatedAddResultsAction;
