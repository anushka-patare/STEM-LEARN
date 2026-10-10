import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { videoService, academicService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FiVideo,
  FiPlus,
  FiPlay,
  FiTrash2,
  FiEdit2,
  FiExternalLink,
  FiSearch,
  FiLayers,
  FiFolder,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiTv,
  FiInfo,
  FiChevronRight
} from 'react-icons/fi';

const getSubjectIcon = (sub) => {
  const iconStr = (sub?.icon || '').trim();
  const name = (sub?.name || '').toLowerCase();

  if (iconStr === 'fa-flask-vial' || iconStr.includes('flask') || name.includes('science')) {
    return '🔬';
  }
  if (iconStr === 'fa-microchip' || iconStr.includes('chip') || iconStr.includes('cpu') || name.includes('tech') || name.includes('comp')) {
    return '💻';
  }
  if (iconStr === 'fa-square-root-variable' || iconStr.includes('root') || iconStr.includes('math') || name.includes('math')) {
    return '📐';
  }
  if (iconStr.includes('book') || name.includes('english')) {
    return '📚';
  }
  if (iconStr && !iconStr.startsWith('fa-') && iconStr.length <= 4) {
    return iconStr;
  }
  return '🔬';
};

export default function TeacherVideos() {
  const { user } = useAuth();

  // Extract teacher's assigned grades
  const teacherGrades = useMemo(() => {
    const gradesSet = new Set();
    if (Array.isArray(user?.assigned_classes)) {
      user.assigned_classes.forEach((cls) => {
        if (typeof cls === 'string') {
          const match = cls.match(/\d+/);
          if (match) gradesSet.add(match[0]);
        } else if (typeof cls === 'object' && cls?.grade) {
          const match = String(cls.grade).match(/\d+/);
          if (match) gradesSet.add(match[0]);
        }
      });
    }
    if (user?.assigned_grade) {
      const match = String(user.assigned_grade).match(/\d+/);
      if (match) gradesSet.add(match[0]);
    }
    if (user?.grade) {
      const match = String(user.grade).match(/\d+/);
      if (match) gradesSet.add(match[0]);
    }
    const list = Array.from(gradesSet).sort((a, b) => Number(a) - Number(b));
    if (user?.role === 'admin' || list.length === 0) {
      return ['6', '7', '8', '9'];
    }
    return list;
  }, [user]);

  const [hierarchy, setHierarchy] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('hierarchy'); // 'hierarchy' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState(() => {
    return teacherGrades.length === 1 ? teacherGrades[0] : (teacherGrades[0] || '7');
  });

  useEffect(() => {
    if (teacherGrades.length === 1) {
      setGradeFilter(teacherGrades[0]);
    } else if (gradeFilter !== 'all' && !teacherGrades.includes(gradeFilter)) {
      setGradeFilter(teacherGrades[0] || '7');
    }
  }, [teacherGrades]);

  // Drilldown states for Subject -> Category -> Chapter
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Raw lists for dropdowns
  const [subjectsList, setSubjectsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [chaptersList, setChaptersList] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    description: '',
    subject_id: '',
    category_id: '',
    chapter_id: '',
    grade: teacherGrades[0] || '7',
    duration: '10-15 mins'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hierRes, vidsRes, subRes, catRes, chapRes] = await Promise.all([
        videoService.getHierarchy({ grade: gradeFilter !== 'all' ? gradeFilter : undefined }).catch(e => ({ data: { success: false } })),
        videoService.getAll({ grade: gradeFilter !== 'all' ? gradeFilter : undefined }).catch(e => ({ data: { success: false } })),
        academicService.getSubjects().catch(e => ({ data: { success: false } })),
        academicService.getCategories().catch(e => ({ data: { success: false } })),
        academicService.getChapters().catch(e => ({ data: { success: false } }))
      ]);

      if (hierRes.data?.success) {
        const hier = hierRes.data.data || [];
        setHierarchy(hier);
        // Default select first subject if none selected
        if (!selectedSubjectId && hier.length > 0) {
          setSelectedSubjectId(hier[0]._id);
          if (hier[0].categories?.length > 0) {
            setSelectedCategoryId(hier[0].categories[0]._id);
            if (hier[0].categories[0].chapters?.length > 0) {
              setSelectedChapterId(hier[0].categories[0].chapters[0]._id);
            }
          }
        }
      }

      if (vidsRes.data?.success) {
        setVideos(vidsRes.data.data || []);
      }

      if (subRes.data?.success) setSubjectsList(subRes.data.data || []);
      if (catRes.data?.success) setCategoriesList(catRes.data.data || []);
      if (chapRes.data?.success) {
        const rawChapters = chapRes.data.data || [];
        const filtered = rawChapters.filter(ch => teacherGrades.includes(String(ch.grade)));
        setChaptersList(filtered);
      }
    } catch (err) {
      console.error('Failed to load video lessons data', err);
      toast.error('Failed to load video lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gradeFilter]);

  // Open modal for new video or editing
  const handleOpenModal = (video = null, prefill = {}) => {
    const defaultGrade = prefill.grade || (gradeFilter !== 'all' ? gradeFilter : (teacherGrades[0] || '7'));
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title || '',
        youtube_url: video.youtube_url || '',
        description: video.description || '',
        subject_id: video.subject_id || '',
        category_id: video.category_id || '',
        chapter_id: video.chapter_id || '',
        grade: video.grade || defaultGrade,
        duration: video.duration || '10-15 mins'
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: '',
        youtube_url: '',
        description: '',
        subject_id: prefill.subject_id || selectedSubjectId || (subjectsList[0]?._id || ''),
        category_id: prefill.category_id || selectedCategoryId || '',
        chapter_id: prefill.chapter_id || selectedChapterId || '',
        grade: defaultGrade,
        duration: '10-15 mins'
      });
    }
    setModalOpen(true);
  };

  // Filter categories based on selected subject in form
  const formFilteredCategories = categoriesList.filter(
    (c) => String(c.subject_id) === String(formData.subject_id)
  );

  // Filter chapters based on selected category in form and teacher's assigned grades
  const formFilteredChapters = chaptersList.filter(
    (ch) => String(ch.category_id) === String(formData.category_id) &&
            teacherGrades.includes(String(ch.grade))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a video title');
      return;
    }
    if (!formData.youtube_url.trim()) {
      toast.error('Please enter a YouTube video URL');
      return;
    }
    if (!formData.subject_id || !formData.category_id || !formData.chapter_id) {
      toast.error('Please select Subject, Category, and Chapter to link this video');
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        const res = await videoService.update(editingVideo._id, formData);
        if (res.data?.success) {
          toast.success('Video updated successfully!');
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await videoService.create(formData);
        if (res.data?.success) {
          toast.success('YouTube Video Lesson linked successfully!');
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save video lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (videoId, title) => {
    if (!window.confirm(`Are you sure you want to delete video "${title}"?`)) {
      return;
    }
    try {
      const res = await videoService.delete(videoId);
      if (res.data?.success) {
        toast.success('Video lesson deleted');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete video');
    }
  };

  // Helper to extract YouTube ID for live preview in modal
  const extractVideoId = (url) => {
    if (!url) return null;
    const regExp = /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const liveVideoId = extractVideoId(formData.youtube_url);

  // Find currently selected items in hierarchy
  const currentSubject = hierarchy.find((s) => s._id === selectedSubjectId) || hierarchy[0];
  const currentCategory = currentSubject?.categories?.find((c) => c._id === selectedCategoryId) || currentSubject?.categories?.[0];
  const currentChapter = currentCategory?.chapters?.find((ch) => ch._id === selectedChapterId) || currentCategory?.chapters?.[0];

  const filteredAllVideos = videos.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.title?.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term) ||
      v.chapter_name?.toLowerCase().includes(term) ||
      v.category_name?.toLowerCase().includes(term) ||
      v.subject_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <FiTv className="w-4 h-4" />
            <span>Curriculum Multimedia Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Video Lessons & Lectures</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Link YouTube educational lectures organized by <strong>Subject → Category → Chapter</strong>. 
            Students can access these structured videos in their learning portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reload Videos"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="stem-btn bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <FiPlus className="w-4 h-4" />
            <span>Link YouTube Video</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Banner & View Toggle ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
            <FiVideo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Video Lessons</span>
            <h3 className="text-2xl font-black text-slate-900">{videos.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects Covered</span>
            <h3 className="text-2xl font-black text-slate-900">{hierarchy.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chapters With Videos</span>
            <h3 className="text-2xl font-black text-slate-900">
              {hierarchy.reduce((acc, s) => acc + (s.categories?.reduce((cAcc, cat) => cAcc + (cat.chapters?.filter(ch => ch.video_count > 0).length || 0), 0) || 0), 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* ─── Filter & View Tabs ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('hierarchy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'hierarchy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Subject → Category → Chapter View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Videos Table ({videos.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Grade Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <span>Grade:</span>
            {teacherGrades.length === 1 ? (
              <span className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                Grade {teacherGrades[0]} (Assigned)
              </span>
            ) : (
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none cursor-pointer"
              >
                <option value="all">All Assigned ({teacherGrades.map(g => `G${g}`).join(', ')})</option>
                {teacherGrades.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            )}
          </div>

          {activeView === 'all' && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── VIEW 1: SUBJECT → CATEGORY → CHAPTER DRILLDOWN ─── */}
      {activeView === 'hierarchy' && (
        <div className="space-y-6">
          {/* 1. Subjects Selection Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Step 1: Select STEM Subject
              </span>
              <span className="text-[11px] text-slate-600 font-bold">
                {hierarchy.length} Subjects Available
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hierarchy.map((sub) => {
                const isSelected = selectedSubjectId === sub._id;
                return (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId(sub._id);
                      if (sub.categories?.length > 0) {
                        setSelectedCategoryId(sub.categories[0]._id);
                        if (sub.categories[0].chapters?.length > 0) {
                          setSelectedChapterId(sub.categories[0].chapters[0]._id);
                        } else {
                          setSelectedChapterId(null);
                        }
                      } else {
                        setSelectedCategoryId(null);
                        setSelectedChapterId(null);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {getSubjectIcon(sub)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm tracking-tight truncate">{sub.name}</h4>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100 font-semibold' : 'text-slate-600 font-bold'}`}>
                          {sub.category_count} categories · {sub.video_count} videos
                        </p>
                      </div>
                    </div>
                    <FiChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Categories Selection Row */}
          {currentSubject && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Step 2: Categories in <span className="text-blue-600">{currentSubject.name}</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-600 font-bold">
                  {currentSubject.categories?.length || 0} Categories
                </span>
              </div>

              {currentSubject.categories?.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-semibold">
                  No categories found under {currentSubject.name}.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {currentSubject.categories?.map((cat) => {
                    const isSelected = selectedCategoryId === cat._id;
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat._id);
                          if (cat.chapters?.length > 0) {
                            setSelectedChapterId(cat.chapters[0]._id);
                          } else {
                            setSelectedChapterId(null);
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FiFolder className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {cat.video_count} videos
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Chapters & Attached Videos Section */}
          {currentCategory && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-bold mb-1">
                    <span>{currentSubject.name}</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span>{currentCategory.name}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <FiBookOpen className="text-blue-600" />
                    <span>Step 3: Chapters & Video Lessons</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModal(null, {
                    subject_id: currentSubject._id,
                    category_id: currentCategory._id,
                    chapter_id: selectedChapterId
                  })}
                  className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs self-start"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>+ Link Video Here</span>
                </button>
              </div>

              {/* Chapters Pills */}
              {currentCategory.chapters?.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs font-semibold bg-slate-50 rounded-2xl">
                  No chapters found under {currentCategory.name}.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Chapter Selector Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {currentCategory.chapters?.map((ch) => {
                      const isSelected = selectedChapterId === ch._id;
                      return (
                        <button
                          key={ch._id}
                          type="button"
                          onClick={() => setSelectedChapterId(ch._id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{ch.name}</span>
                          <span className="text-[10px] text-slate-600 font-bold">G{ch.grade}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            ch.video_count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ch.video_count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Chapter Details & Videos Grid */}
                  {currentChapter && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{currentChapter.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Grade {currentChapter.grade} · {currentChapter.videos?.length || 0} YouTube videos linked
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenModal(null, {
                            subject_id: currentSubject._id,
                            category_id: currentCategory._id,
                            chapter_id: currentChapter._id,
                            grade: currentChapter.grade
                          })}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Add Video to this Chapter</span>
                        </button>
                      </div>

                      {/* Video Cards Grid */}
                      {(!currentChapter.videos || currentChapter.videos.length === 0) ? (
                        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <FiTv className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">No video lessons linked to this chapter yet.</p>
                          <p className="text-[11px] text-slate-600 font-bold">
                            Click "+ Link Video" above to paste a YouTube lesson URL for students.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {currentChapter.videos.map((vid) => (
                            <div
                              key={vid._id}
                              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden group hover:shadow-md transition-all flex flex-col"
                            >
                              {/* Thumbnail with overlay play */}
                              <div
                                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                                onClick={() => setPreviewVideo(vid)}
                              >
                                {vid.thumbnail_url ? (
                                  <img
                                    src={vid.thumbnail_url}
                                    alt={vid.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <FiVideo className="w-8 h-8" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="w-11 h-11 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <FiPlay className="w-5 h-5 ml-0.5 fill-white" />
                                  </div>
                                </div>
                                {vid.duration && (
                                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <FiClock className="w-2.5 h-2.5" />
                                    <span>{vid.duration}</span>
                                  </span>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                                    {vid.title}
                                  </h5>
                                  {vid.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                                      {vid.description}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-600 font-semibold truncate max-w-[120px]">
                                    By: {vid.created_by_name || 'Teacher'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewVideo(vid)}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Preview Video"
                                    >
                                      <FiPlay className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenModal(vid)}
                                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Edit Video"
                                    >
                                      <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(vid._id, vid.title)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Video"
                                    >
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 2: ALL VIDEOS TABLE / FLAT GRID ─── */}
      {activeView === 'all' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              All Uploaded Video Lessons ({filteredAllVideos.length})
            </h3>
            <span className="text-xs text-slate-600 font-bold">Showing complete database repository</span>
          </div>

          {filteredAllVideos.length === 0 ? (
            <div className="p-12 text-center text-slate-600 text-xs font-semibold">
              No videos matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Video Lesson</th>
                    <th className="py-3 px-4">Subject & Category</th>
                    <th className="py-3 px-4">Chapter</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAllVideos.map((vid) => (
                    <tr key={vid._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-16 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative cursor-pointer group"
                            onClick={() => setPreviewVideo(vid)}
                          >
                            <img
                              src={vid.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiPlay className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{vid.title}</div>
                            <button
                              type="button"
                              onClick={() => setPreviewVideo(vid)}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Play Video</span>
                              <FiPlay className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{vid.subject_name}</span>
                        <div className="text-[10px] text-slate-600 font-bold">{vid.category_name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {vid.chapter_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          Grade {vid.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {vid.duration || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(vid)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <FiPlay className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(vid)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(vid._id, vid.title)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ADD / EDIT VIDEO MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiVideo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingVideo ? 'Edit Video Lesson' : 'Link YouTube Video Lesson'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect an educational YouTube video to the STEM curriculum tree
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Hierarchy Selection Group (Subject -> Category -> Chapter) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Curriculum Mapping Hierarchy
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Subject */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => {
                        const newSubId = e.target.value;
                        const firstCat = categoriesList.find((c) => String(c.subject_id) === String(newSubId));
                        setFormData((prev) => ({
                          ...prev,
                          subject_id: newSubId,
                          category_id: firstCat ? firstCat._id : '',
                          chapter_id: ''
                        }));
                      }}
                      className="stem-input text-xs font-semibold"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjectsList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const firstChap = chaptersList.find((ch) => String(ch.category_id) === String(newCatId));
                        setFormData((prev) => ({
                          ...prev,
                          category_id: newCatId,
                          chapter_id: firstChap ? firstChap._id : ''
                        }));
                      }}
                      className="stem-input text-xs font-semibold"
                      required
                      disabled={!formData.subject_id}
                    >
                      <option value="">Select Category</option>
                      {formFilteredCategories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Chapter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Chapter <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.chapter_id}
                      onChange={(e) => {
                        const newChId = e.target.value;
                        const matched = chaptersList.find((ch) => ch._id === newChId);
                        setFormData((prev) => ({
                          ...prev,
                          chapter_id: newChId,
                          grade: matched?.grade ? String(matched.grade) : prev.grade
                        }));
                      }}
                      className="stem-input text-xs font-semibold"
                      required
                      disabled={!formData.category_id}
                    >
                      <option value="">Select Chapter</option>
                      {formFilteredChapters.map((ch) => (
                        <option key={ch._id} value={ch._id}>
                          {ch.name} (Grade {ch.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Video Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Video Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Newton's 1st Law Explained with Real Animations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="stem-input text-xs sm:text-sm font-semibold"
                  required
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  YouTube Video Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="stem-input text-xs font-mono"
                  required
                />
              </div>

              {/* Live Thumbnail Preview */}
              {liveVideoId && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={`https://img.youtube.com/vi/${liveVideoId}/hqdefault.jpg`}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px]">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>Valid YouTube Video ID: {liveVideoId}</span>
                    </span>
                    <p className="text-slate-500 mt-0.5">Thumbnail generated automatically</p>
                  </div>
                </div>
              )}

              {/* Grade & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="stem-input text-xs font-bold"
                  >
                    {teacherGrades.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 mins"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="stem-input text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Summarize key learning objectives or takeaways from this video lecture..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="stem-input text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="stem-btn bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingVideo ? 'Update Video' : 'Link Video Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── THEATER YOUTUBE PREVIEW MODAL ─── */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-scale-in text-white">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 truncate pr-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                  <FiPlay className="w-4 h-4 fill-white" />
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-sm text-white truncate">{previewVideo.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {previewVideo.subject_name} · {previewVideo.category_name} · {previewVideo.chapter_name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Responsive 16:9 Iframe */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewVideo.youtube_video_id}?autoplay=1&rel=0`}
                title={previewVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {previewVideo.description && (
              <div className="p-4 bg-slate-900/90 text-xs text-slate-300 border-t border-slate-800">
                <p>{previewVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
