import { useState } from 'react';
import { useUpdateProfile, useDocuments } from '~/hooks/useProfile';
import { Button } from '~/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '~/utils/cn';
import {
  PROFILE_SIGNAL_FIELDS,
  FUTURE_SIGNAL_FIELDS,
  FAST_FILL_SLOT,
  validateGPA,
  calculateCompletionScore,
} from '../../helper';

const controlClass =
  'h-[38px] w-full rounded-control border border-line bg-surface px-3 text-sm text-fg outline-none ' +
  'transition-[border-color,box-shadow] duration-150 placeholder:text-fg-muted ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:bg-hover disabled:cursor-not-allowed';

export default function ProfileForm({ profile = {} }) {
  const { data: documents } = useDocuments();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const currentProfile = { ...profile, ...form };
  const completion = calculateCompletionScore(currentProfile, documents);
  const completionPct = Number(completion);
  const missingLabels = completion.missingLabels || [];

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const gpaVal = form.gpa !== undefined ? form.gpa : profile.gpa;
    if (gpaVal !== undefined && gpaVal !== '') {
      const gpaErr = validateGPA(gpaVal);
      if (gpaErr) newErrors.gpa = gpaErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    updateProfile.mutate(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-tile border border-line bg-surface p-6 shadow-tile sm:p-8"
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
          <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] text-fg-muted">
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

      {/* Dynamic Fields (OCP) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROFILE_SIGNAL_FIELDS.map((field) => {
          const val = form[field.key] !== undefined ? form[field.key] : (profile[field.key] ?? '');
          const err = errors[field.key];
          const isSpan2 = field.colSpan === 2;

          return (
            <div key={field.key} className={cn('flex flex-col gap-1.5', isSpan2 && 'md:col-span-2')}>
              <label htmlFor={`field-${field.key}`} className="text-xs font-semibold text-fg-soft">
                {field.label}
              </label>

              {field.type === 'select' ? (
                <select
                  id={`field-${field.key}`}
                  value={val}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={controlClass}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={`field-${field.key}`}
                  rows={field.rows || 4}
                  value={val}
                  placeholder={field.placeholder}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={cn(controlClass, 'h-auto py-2 resize-none')}
                />
              ) : (
                <>
                  <input
                    id={`field-${field.key}`}
                    type={field.type}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    list={field.datalist ? `list-${field.key}` : undefined}
                    value={val}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={cn(controlClass, err && 'border-urgent-line focus:border-urgent-fg focus:ring-urgent-fg/20')}
                  />
                  {field.datalist && (
                    <datalist id={`list-${field.key}`}>
                      {field.datalist.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
              {err && <p className="text-xs text-urgent-fg">{err}</p>}
            </div>
          );
        })}

        {/* Future Signal Slots */}
        {FUTURE_SIGNAL_FIELDS.map((slot) => (
          <div key={slot.key} className={cn('flex flex-col gap-1.5 opacity-60', slot.colSpan === 2 && 'md:col-span-2')}>
            <div className="flex items-center justify-between">
              <label htmlFor={`slot-${slot.key}`} className="text-xs font-semibold text-fg-soft">
                {slot.label}
              </label>
              <span className="text-[10px] text-fg-muted">Sắp ra mắt</span>
            </div>
            <input
              id={`slot-${slot.key}`}
              type={slot.type}
              disabled
              placeholder={slot.placeholder}
              className={controlClass}
            />
          </div>
        ))}
      </div>

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
      </Button>
    </form>
  );
}
