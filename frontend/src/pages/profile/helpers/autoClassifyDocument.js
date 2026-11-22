// Tự động phân loại tài liệu (pdf, doc, docx, txt) thành cv, sop hoặc other
export function autoClassifyDocument(file) {
  const name = typeof file === 'string' ? file : file?.name || '';
  const fileExt = name.split('.').pop().toLowerCase();
  const fileName = name.toLowerCase();

  if (fileExt === 'pdf') {
    if (fileName.includes('cv') || fileName.includes('resume')) return 'cv';
    if (fileName.includes('sop') || fileName.includes('statement')) return 'sop';
    return 'cv';
  }
  if (fileExt === 'doc' || fileExt === 'docx') return 'cv';
  if (fileExt === 'txt') return 'sop';
  return 'other';
}
