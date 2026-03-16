import { X } from 'lucide-react';

export default function ImagePreviewModal({ previewImage, setPreviewImage }) {
  if (!previewImage) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
      <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={() => setPreviewImage(null)}>
        <X size={20} />
      </button>
      <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
