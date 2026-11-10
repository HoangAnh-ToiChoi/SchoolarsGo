import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '~/services/profile.service';
import { documentService } from '~/services/document.service';
import toast from 'react-hot-toast';

export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile().then((res) => res.data),
    ...options,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(['profile'], response.data);
      toast.success('Cập nhật profile thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });
};

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getAll().then((res) => res.data),
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, type }) => {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);
      return documentService.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Đã tải tệp lên');
    },
    onError: (error) => {
      toast.error(error.message || 'Tải tệp thất bại');
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => documentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Xóa document thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa thất bại');
    },
  });
};
