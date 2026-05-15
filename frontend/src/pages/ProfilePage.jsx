import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile, useUpdateProfile, useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useProfile';
import { DEGREES, DOCUMENT_TYPES, COMMON_MAJORS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUpload from '../components/ui/FileUpload';
import AnimatedPage from '../components/ui/AnimatedPage';
import { Button, Input, Select, PageHeader, EmptyState } from '../components/ui';
import { Upload, FileText, Trash2, Plus, Eye, Download } from 'lucide-react';
import { AuroraBackground } from '../components/landing/AuroraBackground';

const ProfilePage = () => {
  const { data, isLoading } = useProfile();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const updateProfile = useUpdateProfile();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  if (isLoading) return <LoadingSpinner />;

  const profile = data?.data;

  const validateGPA = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return 'GPA phải là số';
    if (num < 0 || num > 4) return 'GPA phải từ 0 đến 4.0';
    return '';
  };

  const handleFieldChange = (fieldName, value) => {
    setForm({ ...form, [fieldName]: value });
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (form.gpa !== undefined && form.gpa !== '') {
      const gpaError = validateGPA(form.gpa);
      if (gpaError) newErrors.gpa = gpaError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateProfile.mutate(form);
  };

  const handleUpload = async (file, error) => {
    if (error) return;
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    let docType = 'other';

    if (['pdf'].includes(fileExt)) {
      const fileName = file.name.toLowerCase();
      if (fileName.includes('cv') || fileName.includes('resume')) {
        docType = 'cv';
      } else if (fileName.includes('sop') || fileName.includes('statement')) {
        docType = 'sop';
      } else {
        docType = 'cv';
      }
    } else if (['doc', 'docx'].includes(fileExt)) {
      docType = 'cv';
    } else if (['txt'].includes(fileExt)) {
      docType = 'sop';
    }

    uploadDoc.mutate({ file, type: docType });
  };

  const handleViewDocument = (document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleDownloadDocument = (document) => {
    if (document.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.file_name;
      link.click();
    }
  };

  if (!profile) return <div className="p-8 text-center text-body text-gray-600 dark:text-gray-400">Vui lòng đăng nhập để xem profile</div>;

  return (
    <AnimatedPage className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-24">
      <AuroraBackground />

      <div className="container-narrow relative z-10 py-8">
        <PageHeader
          title="Hồ sơ cá nhân"
          className="text-gray-900 dark:text-white"
        />

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-card p-6 sm:p-8 mb-8 space-y-5 shadow-sm dark:shadow-none">
          <h2 className="text-heading-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3">Thông tin cá nhân</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <Input
              label="GPA (thang 4.0)"
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={form.gpa ?? profile.gpa ?? ''}
              onChange={(e) => handleFieldChange('gpa', e.target.value)}
              placeholder="3.5"
              error={errors.gpa}
            />
            <Input
              label="Trình độ tiếng Anh"
              type="text"
              value={form.english_level ?? profile.english_level ?? ''}
              onChange={(e) => handleFieldChange('english_level', e.target.value)}
              placeholder="IELTS 7.0"
            />
            <Input
              label="Quốc gia muốn đến"
              type="text"
              value={form.target_country ?? profile.target_country ?? ''}
              onChange={(e) => handleFieldChange('target_country', e.target.value)}
              placeholder="UK, USA, Australia..."
            />
            <Select
              label="Bậc học mong muốn"
              options={DEGREES}
              placeholder="Chọn bậc học"
              value={form.target_degree ?? profile.target_degree ?? ''}
              onChange={(value) => handleFieldChange('target_degree', value)}
            />
            <div className="md:col-span-2">
              <Input
                label="Ngành học mong muốn"
                type="text"
                value={form.target_major ?? profile.target_major ?? ''}
                onChange={(e) => handleFieldChange('target_major', e.target.value)}
                placeholder="Computer Science"
                list="majors"
              />
              <datalist id="majors">{COMMON_MAJORS.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Giới thiệu bản thân</label>
              <textarea
                rows={4}
                value={form.bio ?? profile.bio ?? ''}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-input px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                placeholder="Viết vài dòng về bản thân, mục tiêu du học..."
              />
            </div>
          </div>
          <Button type="submit" isLoading={updateProfile.isPending}>Lưu thay đổi</Button>
        </form>

        {/* Documents */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-card p-6 sm:p-8 shadow-sm dark:shadow-none">
          <h2 className="text-heading-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-6">Tài liệu của tôi</h2>

          {/* Upload Area */}
          <div className="mb-6">
            <FileUpload
              label="Upload tài liệu mới"
              description="Kéo thả file hoặc click để chọn"
              accept=".pdf,.doc,.docx,.txt"
              maxSize={5 * 1024 * 1024}
              onFileSelect={(file, error) => handleUpload(file, error)}
              disabled={uploadDoc.isPending}
            />
          </div>

          {/* Document List */}
          {docsLoading ? (
            <LoadingSpinner />
          ) : !documents?.data || documents.data.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Chưa tải lên tài liệu nào"
              description="Tải lên CV, SOP, thư giới thiệu để chuẩn bị hồ sơ ứng tuyển của bạn."
            />
          ) : (
            <div className="space-y-4">
              {DOCUMENT_TYPES.map((docType) => {
                const docs = documents?.data?.filter((d) => d.type === docType.value) || [];
                return (
                  <div key={docType.value} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">{docType.label}</h3>
                      <span className="text-caption text-gray-400 dark:text-white/50">{docs.length} file</span>
                    </div>

                    {docs.length > 0 ? (
                      <div className="space-y-2">
                        {docs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                              <div>
                                <p className="text-body-sm font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                                <p className="text-caption text-gray-400 dark:text-white/40">
                                  {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 p-1 transition-colors"
                                title="Xem tài liệu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 p-1 transition-colors"
                                title="Tải xuống"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteDoc.mutate(doc.id)}
                                className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 p-1 transition-colors"
                                title="Xóa tài liệu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-gray-400 dark:text-white/40 italic">Chưa có tài liệu nào</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ProfilePage;
