import { useState, useRef } from 'react';
import { cn } from '../../utils/helpers';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

const FileUpload = ({
  accept = '.pdf,.doc,.docx,.txt',
  maxSize = 5 * 1024 * 1024, // 5MB
  onFileSelect,
  onRemove,
  files = [],
  label,
  description,
  error,
  className,
  multiple = false,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSelectFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSelectFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const validateAndSelectFiles = (fileList) => {
    const validFiles = [];
    const errors = [];

    fileList.forEach((file) => {
      // Check file type
      const allowedTypes = accept.split(',').map(type => type.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = allowedTypes.some(type =>
        type === fileExtension || type === file.type
      );

      if (!isValidType) {
        errors.push(`${file.name}: Loại file không được hỗ trợ. Chỉ chấp nhận ${accept}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File quá lớn. Kích thước tối đa ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      // Show first error
      if (onFileSelect) onFileSelect(null, errors[0]);
    } else if (validFiles.length > 0) {
      if (multiple) {
        if (onFileSelect) onFileSelect(validFiles);
      } else {
        if (onFileSelect) onFileSelect(validFiles[0]);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="input-label">
          {label}
          {description && <span className="text-caption text-gray-500 ml-2">({description})</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-danger-500 bg-danger-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            'w-8 h-8',
            isDragOver ? 'text-primary-500' : 'text-gray-400'
          )} />
          <div>
            <p className="text-body font-medium text-gray-900">
              {isDragOver ? 'Thả file vào đây' : 'Kéo thả file hoặc click để chọn'}
            </p>
            <p className="text-caption text-gray-500 mt-1">
              {accept.replace(/\./g, '').toUpperCase()} • Tối đa {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-danger-600 text-body-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.name || file.file_name)}
                <div>
                  <p className="text-body-sm font-medium text-gray-900">
                    {file.name || file.file_name}
                  </p>
                  <p className="text-caption text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                {onRemove && (
                  <button
                    onClick={() => onRemove(file.id || index)}
                    className="text-danger-500 hover:text-danger-700 p-1"
                    title="Xóa file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;