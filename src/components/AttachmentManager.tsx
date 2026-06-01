import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X, Download, Eye, Film, FileText, File, Loader, Tag } from 'lucide-react';
import type { Attachment, AttachmentCategory } from '../types/equipment';
import { ATTACHMENT_CATEGORY_LABELS } from '../types/equipment';
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

const CATEGORY_OPTIONS: { value: AttachmentCategory; label: string; color: string; bg: string; border: string; radio: string }[] = [
  {
    value: 'image',
    label: 'Image',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    radio: 'accent-blue-600',
  },
  {
    value: 'supporting_document',
    label: 'Supporting Document',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
    radio: 'accent-green-600',
  },
  {
    value: 'birth_certificate',
    label: 'Birth Certificate / Equipment Accepting Form',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    radio: 'accent-amber-600',
  },
  {
    value: 'authority_registration',
    label: 'Authority Registration Certificate',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    radio: 'accent-purple-600',
  },
];

const CATEGORY_BADGE: Record<AttachmentCategory, string> = {
  image: 'bg-blue-100 text-blue-700 border border-blue-200',
  supporting_document: 'bg-green-100 text-green-700 border border-green-200',
  birth_certificate: 'bg-amber-100 text-amber-700 border border-amber-200',
  authority_registration: 'bg-purple-100 text-purple-700 border border-purple-200',
};

export function AttachmentManager({ equipmentId, attachments, onChange, readOnly }: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [captions, setCaptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(attachments.map(a => [a.id, a.caption])),
  );
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory>('image');
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
        category: selectedCategory,
      };
      const data = await file.arrayBuffer();
      await saveFile(meta, data);
      newAttachments.push(meta);
    }
    onChange([...attachments, ...newAttachments]);
    setUploading(false);
  }, [attachments, equipmentId, onChange, selectedCategory]);

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

  // Group attachments by category
  const grouped = CATEGORY_OPTIONS.map(opt => ({
    ...opt,
    items: attachments.filter(a => (a.category ?? 'image') === opt.value),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-5">
      {/* Category Selector */}
      {!readOnly && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Tag size={12} /> Select Attachment Category
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedCategory === opt.value
                    ? `${opt.bg} ${opt.border} ${opt.color} font-medium shadow-sm`
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="attachmentCategory"
                  value={opt.value}
                  checked={selectedCategory === opt.value}
                  onChange={() => setSelectedCategory(opt.value)}
                  className="shrink-0"
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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
              <p className="text-xs text-slate-400">
                Will be saved as:{' '}
                <span className={`font-medium ${CATEGORY_OPTIONS.find(o => o.value === selectedCategory)?.color}`}>
                  {ATTACHMENT_CATEGORY_LABELS[selectedCategory]}
                </span>
              </p>
              <p className="text-xs text-slate-400">Images · Videos · PDF · Word · Excel · PowerPoint · CSV</p>
            </div>
          )}
        </div>
      )}

      {attachments.length === 0 && readOnly && (
        <p className="text-sm text-slate-400 italic py-2">No attachments uploaded.</p>
      )}

      {/* Attachment List Grouped by Category */}
      {grouped.map(group => (
        <div key={group.value}>
          {/* Category Section Header */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-2 ${group.bg} ${group.border}`}>
            <Tag size={13} className={group.color} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${group.color}`}>
              {group.label}
            </span>
            <span className={`ml-auto text-xs font-medium ${group.color} opacity-70`}>
              {group.items.length} file{group.items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Items in this category */}
          <div className="space-y-2">
            {group.items.map(att => {
              if (att.fileType === 'image') {
                return (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white transition-colors group">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-14 h-14 rounded-md overflow-hidden bg-slate-200 border border-slate-200 cursor-pointer" onClick={() => openPreview(att)}>
                      {thumbUrls[att.id] ? (
                        <img src={thumbUrls[att.id]} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader className="animate-spin text-slate-400" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 truncate">{att.name}</p>
                        <CategoryBadge category={att.category} />
                      </div>
                      <p className="text-xs text-slate-400">{formatBytes(att.sizeBytes)} · {new Date(att.uploadedAt).toLocaleDateString()}</p>
                      {readOnly ? (
                        att.caption && <p className="text-xs text-slate-500 italic truncate mt-0.5">"{att.caption}"</p>
                      ) : (
                        <input
                          value={captions[att.id] ?? att.caption}
                          onChange={e => saveCaption(att, e.target.value)}
                          placeholder="Add caption…"
                          className="mt-0.5 w-full text-xs border-0 border-b border-slate-200 focus:outline-none focus:border-blue-400 bg-transparent pb-0.5"
                        />
                      )}
                    </div>
                    <div className="shrink-0 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openPreview(att)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600" title="Preview">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => downloadFile(att)} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Download">
                        <Download size={15} />
                      </button>
                      {!readOnly && (
                        <button onClick={() => removeAttachment(att)} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <FileRow
                  key={att.id}
                  att={att}
                  icon={att.fileType === 'video'
                    ? <Film className="text-purple-500" size={18} />
                    : <DocIcon mimeType={att.mimeType} />
                  }
                  onPreview={
                    att.fileType === 'video' || att.mimeType === 'application/pdf'
                      ? () => openPreview(att)
                      : undefined
                  }
                  onDownload={() => downloadFile(att)}
                  onDelete={readOnly ? undefined : () => removeAttachment(att)}
                />
              );
            })}
          </div>
        </div>
      ))}

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

            {/* Category badge in preview */}
            {preview.attachment.category && (
              <div className="absolute top-3 left-3 z-10">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${CATEGORY_BADGE[preview.attachment.category]}`}>
                  {ATTACHMENT_CATEGORY_LABELS[preview.attachment.category]}
                </span>
              </div>
            )}

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

function CategoryBadge({ category }: { category?: AttachmentCategory }) {
  if (!category) return null;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_BADGE[category]}`}>
      {ATTACHMENT_CATEGORY_LABELS[category]}
    </span>
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
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-800 truncate">{att.name}</p>
          <CategoryBadge category={att.category} />
        </div>
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
