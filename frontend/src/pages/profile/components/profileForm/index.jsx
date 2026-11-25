import { useState } from 'react';
import { useUpdateProfile, useDocuments } from '~/hooks/useProfile';
import { Button } from '~/components/ui/button';
import { Sparkles } from 'lucide-react';
import {
  CURRENT_PROFILE_FIELDS,
  TARGET_PROFILE_FIELDS,
  FAST_FILL_SLOT,
} from '~/pages/profile/constants';
import {
  calculateCompletionScore,
  validateSingleField,
  validateSingleCertificate,
  mergeCertificateRowError,
  validateProfileForm,
  buildProfilePayload,
} from '~/pages/profile/helpers';
import ProfileFieldInput from '~/pages/profile/components/profileFieldInput';
import CertificatesField from '~/pages/profile/components/certificatesField';

export default function ProfileForm({ profile = {} }) {
  const { data: documents } = useDocuments();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const currentYear = new Date().getFullYear();
  const currentProfile = { ...profile, ...form };
  const currentCertificates = Array.isArray(currentProfile.certificates) ? currentProfile.certificates : [];

  const completion = calculateCompletionScore(currentProfile, documents);
  const completionPct = Number(completion);
  const missingLabels = completion.missingLabels || [];

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleFieldBlur = (key, value) => {
    const msg = validateSingleField(key, value, currentYear);
    setErrors((prev) => ({ ...prev, [key]: msg }));
  };

  const handleCertificatesChange = (nextCerts) => {
    setForm((prev) => ({ ...prev, certificates: nextCerts }));
    if (errors.certificates) {
      setErrors((prev) => ({ ...prev, certificates: null }));
    }
  };

  const handleCertificateRowBlur = (rowIndex, fieldKey) => {
    const cert = currentCertificates[rowIndex];
    const rowErr = validateSingleCertificate(cert, { requirePresence: fieldKey !== 'type' });
    setErrors((prev) => ({
      ...prev,
      certificates: mergeCertificateRowError(prev.certificates, rowIndex, rowErr, currentCertificates.length),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: validationErrors, hasError } = validateProfileForm(currentProfile, currentYear);
    if (hasError) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    const payload = buildProfilePayload(form);
    updateProfile.mutate(payload, {
      onSuccess: () => {
        setForm({});
        setErrors({});
      },
    });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-6 rounded-tile border border-line bg-surface p-4 shadow-tile sm:p-6 lg:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h2 className="text-lg font-semibold text-heading">Thông tin cá nhân</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${FAST_FILL_SLOT.label} (${FAST_FILL_SLOT.badge})`}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5 text-brand-600" aria-hidden="true" />
          <span>{FAST_FILL_SLOT.label}</span>
          <span className="rounded bg-canvas px-1.5 py-0.5 text-micro text-fg-muted">
            {FAST_FILL_SLOT.badge}
          </span>
        </Button>
      </div>

      {/* Thanh tiến độ AI Recommend */}
      <div className="rounded-inner border border-line bg-canvas p-4">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-fg">Độ hoàn thiện cho AI Recommend</p>
          <span className="text-sm font-bold text-brand-600">{completionPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {missingLabels.length > 0 && (
          <p className="mt-2 text-xs text-fg-muted">
            Còn thiếu: {missingLabels.join(', ')}
          </p>
        )}
      </div>

      {/* Nhóm 1: Thông tin hiện tại */}
      <section aria-labelledby="profile-current-heading" className="space-y-3">
        <h3 id="profile-current-heading" className="text-block-title text-heading">
          Thông tin hiện tại
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CURRENT_PROFILE_FIELDS.map((field) => (
            <ProfileFieldInput
              key={field.key}
              field={field}
              value={form[field.key] !== undefined ? form[field.key] : (profile[field.key] ?? '')}
              error={errors[field.key]}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              currentYear={currentYear}
            />
          ))}
        </div>
      </section>

      {/* Nhóm 2: Chứng chỉ */}
      <CertificatesField
        certificates={currentCertificates}
        error={errors.certificates}
        onChange={handleCertificatesChange}
        onRowBlur={handleCertificateRowBlur}
      />

      {/* Nhóm 3: Mục tiêu du học */}
      <section aria-labelledby="profile-target-heading" className="space-y-3 border-t border-line-soft pt-5">
        <h3 id="profile-target-heading" className="text-block-title text-heading">
          Mục tiêu du học
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TARGET_PROFILE_FIELDS.map((field) => (
            <ProfileFieldInput
              key={field.key}
              field={field}
              value={form[field.key] !== undefined ? form[field.key] : (profile[field.key] ?? '')}
              error={errors[field.key]}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              currentYear={currentYear}
            />
          ))}
        </div>
      </section>

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
      </Button>
    </form>
  );
}
