import { PROFILE_FIELDS } from '../constants';

// % trường hồ sơ đã điền, làm tròn
export function getProfileCompletion(profile) {
  const completed = PROFILE_FIELDS.filter((field) => profile?.[field]).length;
  return Math.round((completed / PROFILE_FIELDS.length) * 100);
}
