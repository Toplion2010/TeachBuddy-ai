'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiUpload, HiDocumentText, HiX, HiSparkles } from 'react-icons/hi';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.txt';

export default function UploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (selectedFile: File) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|docx?|txt)$/i)) {
      toast.error('Please upload a PDF, Word, or text file');
      return;
    }
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    try {
      setAnalysisStep('Uploading file...');

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAnalysisStep('Analyzing content with AI...');

      // Simulate a brief delay to show the analysis message
      await new Promise(resolve => setTimeout(resolve, 500));

      if (data.test) {
        toast.success('Material uploaded and test generated!');
        router.push(`/teacher/tests/${data.test.id}`);
      } else {
        toast.success('Material uploaded successfully!');
        if (data.warning) {
          toast.error(data.warning);
        }
        router.push('/teacher/materials');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setAnalysisStep('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* File Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/5'
            : file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-gray-800 hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <HiDocumentText className="w-8 h-8 text-green-400" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-text-secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-4 p-1 rounded-lg hover:bg-white/10"
            >
              <HiX className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        ) : (
          <div>
            <HiUpload className="w-10 h-10 text-text-secondary mx-auto mb-3" />
            <p className="font-medium mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-text-secondary">
              Supports PDF, Word (.docx), and Text (.txt) files
            </p>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="e.g., Chapter 5: Photosynthesis"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea-field"
          placeholder="Brief description of the material..."
          rows={3}
        />
      </div>

      {/* AI Analysis Progress */}
      {uploading && analysisStep && (
        <div className="card p-4 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <HiSparkles className="w-6 h-6 text-primary animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <HiSparkles className="w-6 h-6 text-primary opacity-30" />
              </div>
            </div>
            <div>
              <p className="font-medium text-primary">AI Processing</p>
              <p className="text-sm text-text-secondary">{analysisStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || !title || uploading}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {uploading ? 'Uploading & Processing...' : 'Upload Material'}
      </button>
    </form>
  );
}
