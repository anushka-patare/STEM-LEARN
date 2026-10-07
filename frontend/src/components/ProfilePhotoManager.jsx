import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import { toast } from 'react-hot-toast';
import Avatar from './Avatar';
import {
  FiCamera,
  FiUploadCloud,
  FiTrash2,
  FiCheck,
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiRefreshCw,
  FiAlertTriangle,
} from 'react-icons/fi';

export default function ProfilePhotoManager({ role = 'student', onPhotoUpdated }) {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const currentPhotoUrl = user?.profile_photo?.photo_url || user?.photo || '';

  const handleFileSelect = (file) => {
    if (!file) return;

    // Check size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    // Check type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP image formats are supported.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setZoom(1);
    setShowCropModal(true);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
    e.target.value = ''; // Reset input
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleSaveCropped = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      const res = await profileService.uploadPhoto(formData);
      if (res.data?.success) {
        const photoData = res.data.data;
        updateUser({
          photo: photoData.photo_url,
          profile_photo: photoData,
        });
        toast.success('Profile photo uploaded and updated successfully!');
        setShowCropModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (onPhotoUpdated) onPhotoUpdated(photoData);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo? Your avatar will revert to your initials.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await profileService.removePhoto();
      if (res.data?.success) {
        updateUser({
          photo: '',
          profile_photo: null,
        });
        toast.success('Profile photo removed successfully');
        if (onPhotoUpdated) onPhotoUpdated(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Current Avatar */}
        <div className="relative group">
          <Avatar
            src={currentPhotoUrl}
            name={user?.full_name || 'User'}
            size="2xl"
            role={role}
            className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-slate-100"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
            title="Upload photo"
          >
            <FiCamera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h3 className="text-base font-bold text-slate-900">Profile Photo</h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Upload a clear square portrait (JPG, PNG, WEBP, up to 2MB). Photos are automatically resized to 512×512 and all EXIF/GPS metadata is stripped for student privacy.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="stem-btn stem-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            >
              <FiUploadCloud className="w-4 h-4" />
              <span>{currentPhotoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
            </button>

            {currentPhotoUrl && (
              <button
                type="button"
                disabled={loading}
                onClick={handleRemovePhoto}
                className="stem-btn py-2 px-4 text-xs font-bold flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl cursor-pointer"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragleave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <p className="text-xs font-semibold text-slate-600">
          Drag & drop your new image here, or <span className="text-blue-600 underline">browse files</span>
        </p>
      </div>

      {/* ─── Square Crop & Preview Modal ─── */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Adjust & Crop Photo</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Square Preview Container */}
            <div className="relative w-64 h-64 mx-auto overflow-hidden rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  style={{ transform: `scale(${zoom})` }}
                  className="w-full h-full object-cover transition-transform duration-100"
                />
              )}
              {/* Circular Overlay Guideline */}
              <div className="absolute inset-0 rounded-2xl border-2 border-white/60 pointer-events-none shadow-inner" />
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center justify-center gap-3 px-4">
              <FiZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <FiZoomIn className="w-4 h-4 text-slate-400" />
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="stem-btn py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveCropped}
                className="stem-btn stem-btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Save & Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
