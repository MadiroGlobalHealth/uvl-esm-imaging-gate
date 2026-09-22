import { getAsyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

const moduleName = '@uvl/esm-imaging-gate-app';
const options = { featureName: 'uvl-imaging-gate', moduleName };

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const gatedAddResultsAction = getAsyncLifecycle(
  () => import('./gated-add-results-action.component'),
  options,
);
