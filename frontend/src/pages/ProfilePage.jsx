import { useState } from 'react';
import { useProfile, useUpdateProfile, useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useProfile';
import { DEGREES, DOCUMENT_TYPES, COMMON_MAJORS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select, PageHeader } from '../components/ui';
import { Upload, FileText, Trash2 } from 'lucide-react';

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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const type = e.target.dataset.type;
    uploadDoc.mutate({ file, type });
    e.target.value = '';
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
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => (
            <div key={docType.value} className="flex items-center justify-between p-4 bg-gray-50 rounded-card">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div><p className="font-medium text-gray-900">{docType.label}</p><p className="text-caption text-gray-500">PDF, DOC, DOCX — tối đa 10MB</p></div>
              </div>
              <div className="flex items-center gap-3">
                {documents?.data?.filter((d) => d.type === docType.value).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-button border">
                    <span className="text-body-sm text-gray-600 max-w-[150px] truncate">{d.file_name}</span>
                    <button onClick={() => deleteDoc.mutate(d.id)} className="text-danger-500 hover:text-danger-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <label className="cursor-pointer"><input type="file" className="hidden" accept=".pdf,.doc,.docx" data-type={docType.value} onChange={handleUpload} /><span className="btn-primary btn-sm"><Upload className="w-4 h-4" />Upload</span></label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
