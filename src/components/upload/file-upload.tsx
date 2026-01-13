'use client';

import { useState, useRef, useCallback } from 'react';
import { quickValidateFile } from '@/lib/parsers/csv-parser';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  disabled,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      // Quick validation before passing to parent
      const validation = quickValidateFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Pass file to parent for full processing
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          upload-zone
          w-full
          min-h-[280px]
          flex flex-col items-center justify-center
          p-8
          cursor-pointer
          transition-all duration-150
          ${isDragging ? 'drag-over bg-white' : 'bg-transparent'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Icon */}
        <div className="mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#0A0A0A]"
          >
            <rect
              x="8"
              y="8"
              width="48"
              height="48"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M32 44V20M32 20L22 30M32 20L42 30"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Main Text */}
        <h3 className="heading-section text-2xl md:text-3xl mb-3 text-center">
          DROP YOUR BANK STATEMENT HERE
        </h3>

        {/* Divider */}
        <div className="w-32 h-[2px] bg-[#0A0A0A] mb-4" />

        {/* Supported formats */}
        <p className="text-[#525252] text-sm mb-6 text-center">
          CSV & PDF supported &bull; Max 10MB
        </p>

        {/* Browse Button */}
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          BROWSE FILES
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 border-2 border-[#DC2626] bg-[#FEF2F2]">
          <p className="text-[#DC2626] text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
