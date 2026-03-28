import { useState } from 'react';
import { useProfile, useUpdateProfile, useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useProfile';
import { DEGREES, LANGUAGES, DOCUMENT_TYPES, COMMON_MAJORS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingButton from '../components/LoadingButton';
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

  if (!profile) return <div className="p-8 text-center">Vui lòng đăng nhập để xem profile</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Hồ sơ cá nhân</h1>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Thông tin cá nhân</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">GPA (thang 4.0)</label><input type="number" step="0.01" min="0" max="4" value={form.gpa ?? profile.gpa ?? ''} onChange={(e) => setForm({ ...form, gpa: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="3.5" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Trình độ tiếng Anh</label><input type="text" value={form.english_level ?? profile.english_level ?? ''} onChange={(e) => setForm({ ...form, english_level: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="IELTS 7.0" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia muốn đến</label><input type="text" value={form.target_country ?? profile.target_country ?? ''} onChange={(e) => setForm({ ...form, target_country: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="UK, USA, Australia..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Bậc học mong muốn</label><select value={form.target_degree ?? profile.target_degree ?? ''} onChange={(e) => setForm({ ...form, target_degree: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Chọn bậc học</option>{DEGREES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Ngành học mong muốn</label><input type="text" value={form.target_major ?? profile.target_major ?? ''} onChange={(e) => setForm({ ...form, target_major: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Computer Science" list="majors" /><datalist id="majors">{COMMON_MAJORS.map((m) => <option key={m} value={m} />)}</datalist></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu bản thân</label><textarea rows={4} value={form.bio ?? profile.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Viết vài dòng về bản thân, mục tiêu du học..." /></div>
        </div>
        <LoadingButton type="submit" isLoading={updateProfile.isPending} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">Lưu thay đổi</LoadingButton>
      </form>

      {/* Documents */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-6">Tài liệu của tôi</h2>
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => (
            <div key={docType.value} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div><p className="font-medium text-gray-900">{docType.label}</p><p className="text-sm text-gray-500">PDF, DOC, DOCX — tối đa 10MB</p></div>
              </div>
              <div className="flex items-center gap-3">
                {documents?.data?.filter((d) => d.type === docType.value).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
                    <span className="text-sm text-gray-600 max-w-[150px] truncate">{d.file_name}</span>
                    <button onClick={() => deleteDoc.mutate(d.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <label className="cursor-pointer"><input type="file" className="hidden" accept=".pdf,.doc,.docx" data-type={docType.value} onChange={handleUpload} /><span className="inline-flex items-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"><Upload className="w-4 h-4" />Upload</span></label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
