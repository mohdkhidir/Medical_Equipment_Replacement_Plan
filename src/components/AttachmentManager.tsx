import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X, Download, Eye, Film, FileText, File, Paperclip, Loader } from 'lucide-react';
import type { Attachment } from '../types/equipment';
import {
  saveFile, loadFile, deleteFile,
  detectFileType, formatBytes, arrayBufferToObjectURL,
} from '../utils/attachmentStore';

interface AttachmentManagerProps {
  equipmentId: string;
  attachments: Attachment[];
  onChange: (updated: Attachment[]) => void;
  readOnly?: boolean;
}

interface PreviewState {
  attachment: Attachment;
  objectUrl: string;
}

export function AttachmentManager({ equipmentId, attachments, onChange, readOnly }: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [captions, setCaptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(attachments.map(a => [a.id, a.caption])),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image thumbnails
  useEffect(() => {
    const imageAttachments = attachments.filter(a => a.fileType === 'image');
    let cancelled = false;
    (async () => {
      const urls: Record<string, string> = {};
      for (const att of imageAttachments) {
        if (thumbUrls[att.id]) continue;
        const data = await loadFile(att.id);
        if (!cancelled && data) urls[att.id] = arrayBufferToObjectURL(data, att.mimeType);
      }
      if (!cancelled && Object.keys(urls).length > 0) {
        setThumbUrls(prev => ({ ...prev, ...urls }));
      }
    })();
    return () => { cancelled = true; };
  }, [attachments]);

  // Cleanup preview URL on close
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.objectUrl); };
  }, [preview]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const fileType = detectFileType(file.type);
      const meta: Attachment = {
        id,
        equipmentId,
        name: file.name,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        caption: '',
      };
      const data = await file.arrayBuffer();
      await saveFile(meta, data);
      newAttachments.push(meta);
    }
    onChange([...attachments, ...newAttachments]);
    setUploading(false);
  }, [attachments, equipmentId, onChange]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  async function openPreview(att: Attachment) {
    const data = await loadFile(att.id);
    if (!data) return;
    const objectUrl = arrayBufferToObjectURL(data, att.mimeType);
    setPreview({ attachment: att, objectUrl });
  }

  async function downloadFile(att: Attachment) {
    const data = await loadFile(att.id);
    if (!data) return;
    const url = arrayBufferToObjectURL(data, att.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function removeAttachment(att: Attachment) {
    await deleteFile(att.id);
    if (thumbUrls[att.id]) {
      URL.revokeObjectURL(thumbUrls[att.id]);
      setThumbUrls(prev => { const n = { ...prev }; delete n[att.id]; return n; });
    }
    onChange(attachments.filter(a => a.id !== att.id));
  }

  function saveCaption(att: Attachment, caption: string) {
    setCaptions(prev => ({ ...prev, [att.id]: caption }));
    onChange(attachments.map(a => a.id === att.id ? { ...a, caption } : a));
  }

  const images = attachments.filter(a => a.fileType === 'image');
  const videos = attachments.filter(a => a.fileType === 'video');
  const documents = attachments.filter(a => a.fileType === 'document' || a.fileType === 'other');

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {!readOnly && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={handleFiles}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-blue-600">
              <Loader className="animate-spin" size={28} />
              <span className="text-sm font-medium">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Upload size={28} />
              <div>
                <span className="text-sm font-medium text-slate-600">Click to upload</span>
                <span className="text-sm text-slate-400"> or drag & drop</span>
              </div>
              <p className="text-xs text-slate-400">Images · Videos · PDF · Word · Excel · PowerPoint · CSV</p>
            </div>
          )}
        </div>
      )}

      {attachments.length === 0 && readOnly && (
        <p className="text-sm text-slate-400 italic py-2">No attachments uploaded.</p>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Eye size={12} /> Photos ({images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map(att => (
              <div key={att.id} className="group relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                {thumbUrls[att.id] ? (
                  <img
                    src={thumbUrls[att.id]}
                    alt={att.caption || att.name}
                    className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openPreview(att)}
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-slate-200">
                    <Loader className="animate-spin text-slate-400" size={20} />
                  </div>
                )}
                <div className="p-2">
                  {readOnly ? (
                    <p className="text-xs text-slate-600 truncate">{att.caption || att.name}</p>
                  ) : (
                    <input
                      value={captions[att.id] ?? att.caption}
                      onChange={e => saveCaption(att, e.target.value)}
                      placeholder="Add caption…"
                      className="w-full text-xs border-0 border-b border-slate-200 focus:outline-none focus:border-blue-400 bg-transparent pb-0.5"
                    />
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(att.sizeBytes)}</p>
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadFile(att)}
                    className="w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center hover:bg-black/70"
                    title="Download"
                  >
                    <Download size={11} />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => removeAttachment(att)}
                      className="w-6 h-6 bg-red-500/80 text-white rounded flex items-center justify-center hover:bg-red-600"
                      title="Delete"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Film size={12} /> Videos ({videos.length})
          </h4>
          <div className="space-y-2">
            {videos.map(att => (
              <FileRow
                key={att.id}
                att={att}
                icon={<Film className="text-purple-500" size={18} />}
                onPreview={() => openPreview(att)}
                onDownload={() => downloadFile(att)}
                onDelete={readOnly ? undefined : () => removeAttachment(att)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <FileText size={12} /> Documents ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map(att => (
              <FileRow
                key={att.id}
                att={att}
                icon={<DocIcon mimeType={att.mimeType} />}
                onPreview={att.mimeType === 'application/pdf' ? () => openPreview(att) : undefined}
                onDownload={() => downloadFile(att)}
                onDelete={readOnly ? undefined : () => removeAttachment(att)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { URL.revokeObjectURL(preview.objectUrl); setPreview(null); }}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full bg-black rounded-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                onClick={() => downloadFile(preview.attachment)}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center"
                title="Download"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => { URL.revokeObjectURL(preview.objectUrl); setPreview(null); }}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {preview.attachment.fileType === 'image' && (
              <img
                src={preview.objectUrl}
                alt={preview.attachment.caption || preview.attachment.name}
                className="max-h-[85vh] max-w-full mx-auto block object-contain"
              />
            )}
            {preview.attachment.fileType === 'video' && (
              <video
                src={preview.objectUrl}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full mx-auto block"
              />
            )}
            {preview.attachment.mimeType === 'application/pdf' && (
              <iframe
                src={preview.objectUrl}
                title={preview.attachment.name}
                className="w-full h-[85vh]"
              />
            )}

            {(preview.attachment.caption || preview.attachment.name) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm font-medium">{preview.attachment.caption || preview.attachment.name}</p>
                <p className="text-white/60 text-xs">{formatBytes(preview.attachment.sizeBytes)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FileRow({ att, icon, onPreview, onDownload, onDelete }: {
  att: Attachment;
  icon: React.ReactNode;
  onPreview?: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white transition-colors group">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{att.name}</p>
        <p className="text-xs text-slate-400">{formatBytes(att.sizeBytes)} · {new Date(att.uploadedAt).toLocaleDateString()}</p>
        {att.caption && <p className="text-xs text-slate-500 italic truncate mt-0.5">"{att.caption}"</p>}
      </div>
      <div className="shrink-0 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        {onPreview && (
          <button onClick={onPreview} className="p-1.5 rounded hover:bg-blue-100 text-blue-600" title="Preview">
            <Eye size={15} />
          </button>
        )}
        <button onClick={onDownload} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Download">
          <Download size={15} />
        </button>
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete">
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function DocIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') return <FileText className="text-red-500" size={18} />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="text-blue-600" size={18} />;
  if (mimeType.includes('excel') || mimeType.includes('sheet') || mimeType === 'text/csv') return <FileText className="text-green-600" size={18} />;
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileText className="text-orange-500" size={18} />;
  return <File className="text-slate-400" size={18} />;
}
