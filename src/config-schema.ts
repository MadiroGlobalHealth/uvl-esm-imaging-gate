import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  radiologyConceptUuids: {
    _type: Type.Array,
    _elements: { _type: Type.UUID },
    _description:
      'Concepts whose orders require a confirmed payment before results may be entered. ' +
      'Anything not listed here is passed straight through ungated -- lab tests in ' +
      'particular, which are not payment-gated at Mugamba. Keep in step with ' +
      'RadiologyConcepts in eip-odoo-openmrs and the Orthanc bridge (see UVL-EMR #304).',
    _default: [
      'e3dea2c8-62c6-4487-bdaa-1d009642f7ad', // RX01 - Chest X-ray
      '82e7d36c-078d-40c6-9854-92b376099307', // RX02 - Abdominal X-ray
      '701257a2-885e-4249-8319-d9597d2970af', // RX03 - Bone X-ray
      'b25dcc00-800f-48ac-b31a-f1e9cc53d787', // RX04 - Intravenous urography
      '81e0643c-a871-475e-8bd5-93945da8877d', // RX05 - Salpingo-urethrogram
      '1a5e3d73-f897-47ed-840b-d4537b7cc586', // RX06 - Barium enema
      '0a5ba175-fb7e-4d66-aa6a-ba058f3468c1', // RX07 - CT scan
      'd0b5d4a0-1001-0000-0000-000000000001',
      'd0b5d4a0-1002-0000-0000-000000000001',
      'd0b5d4a0-1003-0000-0000-000000000001',
      'd0b5d4a0-1004-0000-0000-000000000001',
      'd0b5d4a0-1005-0000-0000-000000000001',
      'd0b5d4a0-1006-0000-0000-000000000001',
      'd0b5d4a0-1007-0000-0000-000000000001',
      'd0b5d4a0-1008-0000-0000-000000000001',
    ],
  },
  blockWhenPaymentStatusUnknown: {
    _type: Type.Boolean,
    _default: false,
    _description:
      'What to do when the payment Task cannot be READ at all -- the EIP bridge down, a network ' +
      'failure. Default false: allow entry, and let the unpaid-imaging audit in eip-odoo-openmrs ' +
      'report anything that slips through. An unreadable Task is not evidence of non-payment, and ' +
      'the modality worklist already refuses to let an unpaid exam be performed, so this gate ' +
      'governs REPORTING work that has physically happened. Blocking on it would stop a technician ' +
      'recording a legitimate exam whenever the bridge is down. Set true only if you would rather ' +
      'halt imaging reporting than risk an unbilled exam. A Task that reads clearly as unpaid ' +
      'ALWAYS blocks, whatever this is set to.',
  },
};

export type Config = {
  radiologyConceptUuids: Array<string>;
  blockWhenPaymentStatusUnknown: boolean;
};
