import { useQuery } from '@tanstack/react-query';
import { scholarshipService } from '~/services/scholarship.service';

// Danh sách chỉ có vài cột: form sửa cần bản đầy đủ. Không giữ cache để mở lại là thấy dữ liệu mới nhất
export function useScholarshipDetail(idOrSlug) {
  return useQuery({
    queryKey: ['scholarship', idOrSlug, 'adminEdit'],
    queryFn: () => scholarshipService.getById(idOrSlug).then((res) => res.data.data),
    staleTime: 0,
    gcTime: 0,
  });
}
