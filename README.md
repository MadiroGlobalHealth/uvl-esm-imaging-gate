# @jnsereko/esm-imaging-gate-app

Refuses imaging **results entry** until the order's payment is confirmed.
UVL-EMR issue [#322](https://github.com/MadiroGlobalHealth/UVL-EMR/issues/322).

## Why this module exists

At Mugamba an imaging exam must be paid for before it is performed. That control
was only ever half-built:

| | |
|---|---|
| `eip-odoo-openmrs` | maintains a FHIR **Task** per radiology ServiceRequest — `accepted` once Odoo confirms a paid invoice **on that order's own visit** |
| `eip-openmrs-orthanc` | **honours it** — no unpaid scan reaches the modality worklist |
| **OpenMRS** | **ignored it entirely** — a technician could open an unpaid order, enter a report, and the order reached `COMPLETED` |

Measured on UAT 2026-09-22: `ORD-11168` ("RX01 - Radiographie thoracique")
completed with a stored report while the visit's only sale order was still
`draft` and no payment existed anywhere.

## Why it is not a fork of esm-laboratory-app

The results button is a *named extension* in a slot, so it can be replaced from
configuration. Forking an upstream app to change one button would mean carrying
that fork forever.

```json
"extensionSlots": {
  "inprogress-tests-actions-slot": {
    "remove": ["add-lab-request-results-action"],
    "add": ["uvl-gated-add-results-action"]
  }
}
```

## Three decisions worth knowing

**It gates imaging only.** That slot carries lab orders too. Anything outside
`radiologyConceptUuids` passes through completely ungated — lab is not
payment-gated at Mugamba, and blocking it here would be a new outage, not a fix.
Whether lab *should* be gated is a separate question for the product owner.

**It reads the Task, not Odoo.** The same signal the Orthanc bridge already
trusts. Two implementations of "is this paid" is precisely how the original
defect happened, where one paid invoice authorised every imaging order for every
patient.

**Fail-closed on unpaid, fail-open on unreadable.** A Task that says `requested`
or `rejected` always blocks. A Task that cannot be *read* — bridge down, network
failure — allows entry by default, because an unreadable Task is not evidence of
non-payment, the modality gate already prevents an unpaid exam being *performed*,
and this gate governs **reporting work that physically happened**. Blocking there
would stop a technician recording a legitimate exam whenever the bridge is down.
Anything that slips through is reported by the unpaid-imaging audit in
`eip-odoo-openmrs`. Set `blockWhenPaymentStatusUnknown: true` to invert that.

**A missing Task is treated as unpaid, not unknown** — the bridge creates one as
soon as it sees the order, so its absence means the order never went through
payment checking.

## Known limits

- **Frontend only.** A direct REST call can still save results. The durable fix
  is server-side; this addresses the realistic failure, which is staff completing
  unpaid work by mistake.
- **The concept list is duplicated** across this module, `eip-odoo-openmrs` and
  (differently) the Orthanc bridge. See UVL-EMR #304 — 13 ultrasound, CT and echo
  concepts are in no gate at all. One shared server-side definition is the fix.
