import { useEffect, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import SearchInput from '~/components/scholarship-filter/search-input';
import FilterPanel from '~/components/scholarship-filter/filter-panel';
import { useCountries } from '~/hooks/useScholarship';
import { useScholarshipFilters } from '~/hooks/useScholarshipFilters';
import { COUNTRY_LABELS, labelOf } from '~/lib/scholarship';
import { filterClosed, filterOpened, selectIsFilterOpen } from '~/store/slices/uiSlice';

export { default as ActiveFilters } from '~/components/scholarship-filter/active-filters';

// Thanh tìm kiếm duy nhất của hệ thống (đặt trên header) + bảng bộ lọc xổ xuống.
// - Bấm vào ô tìm kiếm → mở bảng bộ lọc; bình thường bảng bị ẩn (display: none)
// - Esc, bấm ra ngoài hoặc chuyển trang → đóng
// - Nhấn Enter hoặc "Tìm học bổng" → áp dụng từ khóa + bộ lọc, chuyển sang trang Tìm học bổng
export default function ScholarshipFilter() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsFilterOpen);
  const { pathname, search } = useLocation();
  const { filters, apply } = useScholarshipFilters();
  const { data: countriesResp } = useCountries();
  const countryOptions = (countriesResp?.data ?? []).map((c) => ({ value: c, label: labelOf(COUNTRY_LABELS, c) }));

  const [draft, setDraft] = useState(filters);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const panelId = useId();

  // Đồng bộ ô tìm kiếm + bộ lọc nháp theo URL (F5, bấm quay lại, bỏ nhãn lọc…)
  useEffect(() => setDraft(filters), [filters]);

  // Chuyển trang thì đóng bảng
  useEffect(() => {
    dispatch(filterClosed());
  }, [pathname, search, dispatch]);

  // Nơi khác (VD nút "Bộ lọc" trên trang) mở bảng thì đưa con trỏ vào ô tìm kiếm
  useEffect(() => {
    if (isOpen && document.activeElement !== inputRef.current) inputRef.current?.focus();
  }, [isOpen]);

  // Bấm ra ngoài hoặc nhấn Esc thì đóng
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) dispatch(filterClosed());
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch(filterClosed());
        inputRef.current?.blur();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, dispatch]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    apply(draft);
    dispatch(filterClosed());
    inputRef.current?.blur();
  };
  // Đặt lại chỉ xóa bộ lọc, giữ từ khóa đang gõ
  const handleReset = () => setDraft({ search: draft.search });

  return (
    <form ref={rootRef} role="search" onSubmit={handleSubmit} className="relative w-full">
      <SearchInput
        ref={inputRef}
        value={draft.search ?? ''}
        onChange={(value) => setField('search', value)}
        onFocus={() => !isOpen && dispatch(filterOpened())}
        isOpen={isOpen}
        controlsId={panelId}
      />
      <FilterPanel
        id={panelId}
        isOpen={isOpen}
        draft={draft}
        countryOptions={countryOptions}
        onFieldChange={setField}
        onReset={handleReset}
      />
    </form>
  );
}
