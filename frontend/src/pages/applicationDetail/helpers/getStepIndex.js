import { STEPS } from '../constants';

export function getStepIndex(status) {
  if (status === 'accepted' || status === 'rejected') return STEPS.length - 1;
  return STEPS.findIndex((step) => step.key === status);
}
