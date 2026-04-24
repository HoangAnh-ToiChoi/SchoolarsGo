import { useState } from 'react';
import { useProfile, useUpdateProfile, useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useProfile';
import { DEGREES, DOCUMENT_TYPES, COMMON_MAJORS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select, PageHeader, FileUpload } from '../components/ui';
import { Upload, FileText, Trash2, Eye, Download } from 'lucide-react';

const ProfilePage = () => {
  const { data, isLoading } = useProfile();
  const { data: documents } = useDocuments();
  const updateProfile = useUpdateProfile();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const [form, setForm] = useState({});

  if (isLoading) return <LoadingSpinner />;

  const profile = data?.data;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile.mutate(form);
  };

  const handleUpload = async (file, error) => {
    if (error) {
      // Error is already shown by FileUpload component via onFileSelect
      return;
    }
    if (!file) return;

    // Find the document type based on file extension or let user choose
    const fileExt = file.name.split('.').pop().toLowerCase();
    let docType = 'other';

    if (['pdf'].includes(fileExt)) {
      // For PDF files, check if it's CV or SOP based on filename or let user choose
      const fileName = file.name.toLowerCase();
      if (fileName.includes('cv') || fileName.includes('resume')) {
        docType = 'cv';
      } else if (fileName.includes('sop') || fileName.includes('statement')) {
        docType = 'sop';
      } else {
        // Default to CV for PDFs if not specified
        docType = 'cv';
      }
    } else if (['doc', 'docx'].includes(fileExt)) {
      docType = 'cv'; // Default to CV for Word docs
    } else if (['txt'].includes(fileExt)) {
      docType = 'sop'; // Default to SOP for text files
    }

    uploadDoc.mutate({ file, type: docType });
  };

  const handleViewDocument = (document) => {
    // Open document in new tab or download
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

  if (!profile) return <div className="p-8 text-center text-body text-gray-600">Vui lòng đăng nhập để xem profile</div>;

  return (
    <div className="container-narrow py-8">
      <PageHeader title="Hồ sơ cá nhân" />

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="card card-body mb-8 space-y-5">
        <h2 className="text-heading-3 text-gray-900 border-b pb-3">Thông tin cá nhân</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="GPA (thang 4.0)" type="number" step="0.01" min="0" max="4" value={form.gpa ?? profile.gpa ?? ''} onChange={(e) => setForm({ ...form, gpa: e.target.value })} placeholder="3.5" />
          <Input label="Trình độ tiếng Anh" type="text" value={form.english_level ?? profile.english_level ?? ''} onChange={(e) => setForm({ ...form, english_level: e.target.value })} placeholder="IELTS 7.0" />
          <Input label="Quốc gia muốn đến" type="text" value={form.target_country ?? profile.target_country ?? ''} onChange={(e) => setForm({ ...form, target_country: e.target.value })} placeholder="UK, USA, Australia..." />
          <Select label="Bậc học mong muốn" options={DEGREES} placeholder="Chọn bậc học" value={form.target_degree ?? profile.target_degree ?? ''} onChange={(e) => setForm({ ...form, target_degree: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Ngành học mong muốn" type="text" value={form.target_major ?? profile.target_major ?? ''} onChange={(e) => setForm({ ...form, target_major: e.target.value })} placeholder="Computer Science" list="majors" />
            <datalist id="majors">{COMMON_MAJORS.map((m) => <option key={m} value={m} />)}</datalist>
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Giới thiệu bản thân</label>
            <textarea rows={4} value={form.bio ?? profile.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" placeholder="Viết vài dòng về bản thân, mục tiêu du học..." />
          </div>
        </div>
        <Button type="submit" isLoading={updateProfile.isPending}>Lưu thay đổi</Button>
      </form>

      {/* Documents */}
      <div className="card card-body">
        <h2 className="text-heading-3 text-gray-900 border-b pb-3 mb-6">Tài liệu của tôi</h2>

        {/* Drag & Drop Upload Area */}
        <div className="mb-6">
          <FileUpload
            label="Upload tài liệu mới"
            description="Kéo thả file hoặc click để chọn"
            accept=".pdf,.doc,.docx,.txt"
            maxSize={5 * 1024 * 1024} // 5MB
            onFileSelect={(file, error) => handleUpload(file, error)}
            disabled={uploadDoc.isPending}
          />
        </div>

        {/* Document List */}
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const docs = documents?.data?.filter((d) => d.type === docType.value) || [];
            return (
              <div key={docType.value} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{docType.label}</h3>
                  <span className="text-caption text-gray-500">{docs.length} file</span>
                </div>

                {docs.length > 0 ? (
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-body-sm font-medium text-gray-900">{doc.file_name}</p>
                            <p className="text-caption text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-primary-600 hover:text-primary-800 p-1"
                            title="Xem tài liệu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-primary-600 hover:text-primary-800 p-1"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDoc.mutate(doc.id)}
                            className="text-danger-500 hover:text-danger-700 p-1"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-gray-500 italic">Chưa có tài liệu nào</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
