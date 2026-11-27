import FormField from '~/pages/admin/scholarships/components/formField';
import { COVERAGE_OPTIONS, DEGREE_OPTIONS } from '~/pages/admin/scholarships/constants';

const WIDE = 'sm:col-span-2';

export default function ScholarshipFormFields({ form, set }) {
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key, e.target.value) });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Tên học bổng *" className={WIDE}>
        <input required {...bind('title')} className="input" placeholder="Tên học bổng" />
      </FormField>
      <FormField label="Tổ chức cấp *">
        <input required {...bind('provider')} className="input" placeholder="Tên tổ chức" />
      </FormField>
      <FormField label="Quốc gia *">
        <input required {...bind('country')} className="input" placeholder="UK, USA..." />
      </FormField>
      <FormField label="Bậc học">
        <select {...bind('degree')} className="input">
          <option value="">Chọn bậc học</option>
          {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </FormField>
      <FormField label="Ngôn ngữ">
        <input {...bind('language')} className="input" placeholder="English, Korean..." />
      </FormField>
      <FormField label="Hình thức">
        <select {...bind('coverage')} className="input">
          <option value="">Chọn hình thức</option>
          {COVERAGE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </FormField>
      <FormField label="Giá trị (USD)">
        <input type="number" min="0" {...bind('amount')} className="input" placeholder="10000" />
      </FormField>
      <FormField label="Hạn nộp">
        <input type="date" {...bind('deadline')} className="input" />
      </FormField>
      <FormField label="Mô tả" className={WIDE}>
        <textarea rows={3} {...bind('description')} className="input resize-none" placeholder="Mô tả học bổng..." />
      </FormField>
      <FormField label="Yêu cầu" className={WIDE}>
        <textarea rows={3} {...bind('requirements')} className="input resize-none" placeholder="GPA tối thiểu, IELTS..." />
      </FormField>
    </div>
  );
}
