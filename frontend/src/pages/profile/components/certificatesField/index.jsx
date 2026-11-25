import { Button } from '~/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '~/utils/cn';
import {
  CERTIFICATE_TYPE_SUGGESTIONS,
  PROFILE_LIMITS,
  PROFILE_CONTROL_CLASS,
  PROFILE_ERROR_CONTROL_CLASS,
} from '~/pages/profile/constants';

export default function CertificatesField({ certificates = [], error, onChange, onRowBlur }) {
  const items = Array.isArray(certificates) ? certificates : [];
  const itemErrors = error?.itemErrors || [];
  const listError = error?.listError || '';
  const isMaxReached = items.length >= PROFILE_LIMITS.MAX_CERTIFICATES;

  const handleAdd = () => {
    if (isMaxReached) return;
    onChange([...items, { type: '', score: '', level: '' }]);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, key, value) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  return (
    <section aria-labelledby="profile-certs-heading" className="space-y-3 border-t border-line-soft pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 id="profile-certs-heading" className="text-block-title text-heading">
            Chứng chỉ (loại và điểm)
          </h3>
          <p className="text-xs text-fg-muted">
            IELTS bắt buộc có điểm (0–9). Chứng chỉ khác cần có điểm (0–120) hoặc mức ({items.length}/{PROFILE_LIMITS.MAX_CERTIFICATES}).
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isMaxReached}
          onClick={handleAdd}
          className="gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span>Thêm chứng chỉ</span>
        </Button>
      </div>

      <datalist id="list-certificate-types">
        {CERTIFICATE_TYPE_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {items.length === 0 ? (
        <div className="rounded-inner border border-dashed border-line bg-canvas p-3 text-xs text-fg-muted">
          Chưa có chứng chỉ nào. Nhấn &ldquo;Thêm chứng chỉ&rdquo; để bổ sung IELTS, TOEFL, JLPT, SAT...
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const rowErr = itemErrors[index] || {};
            const typeId = `cert-type-${index}`;
            const scoreId = `cert-score-${index}`;
            const levelId = `cert-level-${index}`;

            return (
              <div key={index} className="min-w-0 space-y-2 rounded-inner border border-line bg-canvas p-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-start">
                  <div className="flex min-w-0 flex-col gap-1 sm:col-span-4">
                    <label htmlFor={typeId} className="text-xs font-medium text-fg-soft">
                      Loại chứng chỉ
                    </label>
                    <input
                      id={typeId}
                      type="text"
                      list="list-certificate-types"
                      placeholder="IELTS, TOEFL, JLPT..."
                      value={item?.type ?? ''}
                      onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                      onBlur={() => onRowBlur?.(index, 'type')}
                      aria-invalid={Boolean(rowErr.type)}
                      aria-describedby={rowErr.type ? `cert-type-err-${index}` : undefined}
                      className={cn(PROFILE_CONTROL_CLASS, rowErr.type && PROFILE_ERROR_CONTROL_CLASS)}
                    />
                    {rowErr.type && (
                      <p id={`cert-type-err-${index}`} role="alert" className="text-xs text-urgent-fg">
                        {rowErr.type}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1 sm:col-span-3">
                    <label htmlFor={scoreId} className="text-xs font-medium text-fg-soft">
                      Điểm
                    </label>
                    <input
                      id={scoreId}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="7.5"
                      value={item?.score ?? ''}
                      onChange={(e) => handleItemChange(index, 'score', e.target.value)}
                      onBlur={() => onRowBlur?.(index, 'score')}
                      aria-invalid={Boolean(rowErr.score)}
                      aria-describedby={rowErr.score ? `cert-score-err-${index}` : undefined}
                      className={cn(PROFILE_CONTROL_CLASS, rowErr.score && PROFILE_ERROR_CONTROL_CLASS)}
                    />
                    {rowErr.score && (
                      <p id={`cert-score-err-${index}`} role="alert" className="text-xs text-urgent-fg">
                        {rowErr.score}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1 sm:col-span-4">
                    <label htmlFor={levelId} className="text-xs font-medium text-fg-soft">
                      Mức (tùy chọn)
                    </label>
                    <input
                      id={levelId}
                      type="text"
                      placeholder="B2, N2, HSK5..."
                      value={item?.level ?? ''}
                      onChange={(e) => handleItemChange(index, 'level', e.target.value)}
                      onBlur={() => onRowBlur?.(index, 'level')}
                      aria-invalid={Boolean(rowErr.level)}
                      aria-describedby={rowErr.level ? `cert-level-err-${index}` : undefined}
                      className={cn(PROFILE_CONTROL_CLASS, rowErr.level && PROFILE_ERROR_CONTROL_CLASS)}
                    />
                    {rowErr.level && (
                      <p id={`cert-level-err-${index}`} role="alert" className="text-xs text-urgent-fg">
                        {rowErr.level}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:col-span-1 sm:justify-end sm:pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      aria-label={`Xóa chứng chỉ ${index + 1}`}
                      className="h-nav w-full text-fg-muted hover:bg-urgent-bg hover:text-urgent-fg sm:w-9"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {rowErr.row && (
                  <p role="alert" className="text-xs text-urgent-fg">
                    {rowErr.row}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {listError && (
        <p role="alert" className="text-xs text-urgent-fg">
          {listError}
        </p>
      )}
    </section>
  );
}
