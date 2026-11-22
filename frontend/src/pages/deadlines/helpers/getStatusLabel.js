import { APPLICATION_STATUSES } from '~/utils/constants';

export const getStatusLabel = (status) => APPLICATION_STATUSES.find((s) => s.value === status)?.label;
