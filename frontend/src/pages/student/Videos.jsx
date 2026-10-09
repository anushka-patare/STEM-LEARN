import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { videoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FiVideo,
  FiPlay,
  FiClock,
  FiBookOpen,
  FiSearch,
  FiCheckCircle,
  FiX,
  FiLayers,
  FiFolder,
  FiChevronRight,
  FiAward,
  FiArrowRight,
  FiTv,
  FiHelpCircle,
  FiExternalLink
} from 'react-icons/fi';

export default function StudentVideos() {
  const { user } = useAuth();
  const studentGrade = user?.grade ? String(user.grade).replace('Grade', '').trim() : '7';

  const [hierarchy, setHierarchy] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Active playing video modal
  const [activeVideo, setActiveVideo] = useState(null);

  // Watched videos tracking stored in localStorage
  const [watchedVideos, setWatchedVideos] = useState(() => {
    try {
      const saved = localStorage.getItem(`stem_watched_videos_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatched = (videoId) => {
    let updated;
    if (watchedVideos.includes(videoId)) {
      updated = watchedVideos.filter((id) => id !== videoId);
      toast('Lesson unmarked', { icon: '↩️' });
    } else {
      updated = [...watchedVideos, videoId];
      toast.success('Great job! Lesson marked as completed 🎉');
    }
    setWatchedVideos(updated);
    try {
      localStorage.setItem(`stem_watched_videos_${user?.id || 'guest'}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      const [hierRes, vidsRes] = await Promise.all([
        videoService.getHierarchy({ grade: selectedGrade !== 'all' ? selectedGrade : undefined }).catch(e => ({ data: { success: false } })),
        videoService.getAll({ grade: selectedGrade !== 'all' ? selectedGrade : undefined }).catch(e => ({ data: { success: false } }))
      ]);

      if (hierRes.data?.success) {
        const data = hierRes.data.data || [];
        setHierarchy(data);
        if (!selectedSubjectId && data.length > 0) {
          setSelectedSubjectId(data[0]._id);
          if (data[0].categories?.length > 0) {
            setSelectedCategoryId(data[0].categories[0]._id);
            if (data[0].categories[0].chapters?.length > 0) {
              setSelectedChapterId(data[0].categories[0].chapters[0]._id);
            }
          }
        }
      }

      if (vidsRes.data?.success) {
        setAllVideos(vidsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load video lectures', err);
      toast.error('Could not load video lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, [selectedGrade]);

  // Current selections
  const currentSubject = hierarchy.find((s) => s._id === selectedSubjectId) || hierarchy[0];
  const currentCategory = currentSubject?.categories?.find((c) => c._id === selectedCategoryId) || currentSubject?.categories?.[0];
  const currentChapter = currentCategory?.chapters?.find((ch) => ch._id === selectedChapterId) || currentCategory?.chapters?.[0];

  // Search filtered videos across all subjects
  const searchResults = searchTerm.trim()
    ? allVideos.filter((v) => {
        const term = searchTerm.toLowerCase();
        return (
          v.title?.toLowerCase().includes(term) ||
          v.description?.toLowerCase().includes(term) ||
          v.chapter_name?.toLowerCase().includes(term) ||
          v.category_name?.toLowerCase().includes(term) ||
          v.subject_name?.toLowerCase().includes(term)
        );
      })
    : null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-blue-200 border border-white/20">
            <FiTv className="w-3.5 h-3.5" />
            <span>STEM Multimedia Learning Room</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Curriculum Video Lessons
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Watch concept-rich YouTube video lectures organized by <strong>Subject → Category → Chapter</strong>. 
            Build visual intuition before attempting your competitive or squad quizzes!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 font-bold">
              <FiCheckCircle className="text-emerald-400 w-4 h-4" />
              <span>{watchedVideos.length} Completed</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 font-bold">
              <FiVideo className="text-amber-300 w-4 h-4" />
              <span>{allVideos.length} Available Lessons</span>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ─── Search & Grade Filter Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search lessons by topic (e.g., Newton's laws, Circuits, Cells, Python)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/60"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 whitespace-nowrap">Filter Grade:</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Grades</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
          </select>
        </div>
      </div>

      {/* ─── SEARCH RESULTS VIEW (IF SEARCHING) ─── */}
      {searchResults !== null ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Search Results ({searchResults.length} videos found)
            </h3>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Clear Search & Browse by Hierarchy
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 space-y-3">
              <FiTv className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No video lessons found matching "{searchTerm}"</p>
              <p className="text-xs text-slate-500">Try searching another keyword or browse the STEM subjects below.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((vid) => {
                const isWatched = watchedVideos.includes(vid._id);
                return (
                  <div
                    key={vid._id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div
                      className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                      onClick={() => setActiveVideo(vid)}
                    >
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <FiPlay className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                      {vid.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FiClock className="w-2.5 h-2.5" />
                          <span>{vid.duration}</span>
                        </span>
                      )}
                      {isWatched && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <FiCheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                          <span>{vid.subject_name}</span>
                          <span>·</span>
                          <span>{vid.chapter_name}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                          {vid.title}
                        </h4>
                        {vid.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleWatched(vid._id)}
                          className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isWatched ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          <span>{isWatched ? 'Completed' : 'Mark Done'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveVideo(vid)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>Watch Lesson</span>
                          <FiArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── HIERARCHICAL DRILL-DOWN: SUBJECT → CATEGORY → CHAPTER ─── */
        <div className="space-y-6">
          {/* STEP 1: CHOOSE STEM SUBJECT */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FiLayers className="text-blue-600" />
                <span>Step 1: Choose STEM Subject</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Click a subject to explore its video curriculum</span>
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{sub.icon || '🔬'}</span>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base tracking-tight">{sub.name}</h4>
                        <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {sub.video_count} Video Lessons
                        </p>
                      </div>
                    </div>
                    <FiChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CATEGORIES UNDER SELECTED SUBJECT */}
          {currentSubject && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Step 2: Categories in <span className="text-blue-600">{currentSubject.name}</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {currentSubject.categories?.length || 0} Specializations
                </span>
              </div>

              {(!currentSubject.categories || currentSubject.categories.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No categories found under {currentSubject.name}.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {currentSubject.categories.map((cat) => {
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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

          {/* STEP 3: CHAPTERS & VIDEO CARDS */}
          {currentCategory && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
                    <span>{currentSubject.name}</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span>{currentCategory.name}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <FiBookOpen className="text-blue-600" />
                    <span>Step 3: Chapter Lessons & Lectures</span>
                  </h3>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {currentCategory.chapters?.length || 0} Chapters in this category
                </div>
              </div>

              {/* Chapter Tabs */}
              {(!currentCategory.chapters || currentCategory.chapters.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  No chapters found under {currentCategory.name}.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {currentCategory.chapters.map((ch) => {
                      const isSelected = selectedChapterId === ch._id;
                      return (
                        <button
                          key={ch._id}
                          type="button"
                          onClick={() => setSelectedChapterId(ch._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{ch.name}</span>
                          <span className="text-[10px] text-slate-400">G{ch.grade}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            ch.video_count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {ch.video_count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Chapter Content */}
                  {currentChapter && (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-blue-50/40 p-4 rounded-2xl border border-slate-200/60">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {currentChapter.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Grade {currentChapter.grade} Curriculum · {currentChapter.videos?.length || 0} Video Lessons Available
                          </p>
                        </div>

                        <Link
                          to={`/student/quizzes?chapter_id=${currentChapter._id}`}
                          className="px-3.5 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start shadow-2xs"
                        >
                          <FiAward className="w-3.5 h-3.5" />
                          <span>Practice Chapter Quizzes</span>
                        </Link>
                      </div>

                      {/* Video Cards Grid */}
                      {(!currentChapter.videos || currentChapter.videos.length === 0) ? (
                        <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <FiTv className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            No video lessons uploaded for this chapter yet.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Your faculty instructor will link multimedia lectures soon.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {currentChapter.videos.map((vid) => {
                            const isWatched = watchedVideos.includes(vid._id);
                            return (
                              <div
                                key={vid._id}
                                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden group hover:shadow-lg transition-all flex flex-col justify-between"
                              >
                                {/* Thumbnail */}
                                <div
                                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                                  onClick={() => setActiveVideo(vid)}
                                >
                                  <img
                                    src={vid.thumbnail_url}
                                    alt={vid.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                      <FiPlay className="w-5 h-5 ml-0.5 fill-white" />
                                    </div>
                                  </div>
                                  {vid.duration && (
                                    <span className="absolute bottom-2.5 right-2.5 bg-black/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                                      <FiClock className="w-2.5 h-2.5" />
                                      <span>{vid.duration}</span>
                                    </span>
                                  )}
                                  {isWatched && (
                                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                      <FiCheckCircle className="w-3 h-3" />
                                      <span>Watched</span>
                                    </span>
                                  )}
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                  <div>
                                    <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1.5">
                                      <span>{vid.subject_name}</span>
                                      <span>·</span>
                                      <span>Grade {vid.grade}</span>
                                    </div>
                                    <h5 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug">
                                      {vid.title}
                                    </h5>
                                    {vid.description && (
                                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                                        {vid.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => toggleWatched(vid._id)}
                                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                        isWatched ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <FiCheckCircle className="w-4 h-4" />
                                      <span>{isWatched ? 'Completed' : 'Mark Done'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActiveVideo(vid)}
                                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20 group-hover:scale-102"
                                    >
                                      <FiPlay className="w-3.5 h-3.5 fill-white" />
                                      <span>Watch Now</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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

      {/* ─── THEATER EMBEDDED VIDEO MODAL ─── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-scale-in text-white my-8">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90">
              <div className="flex items-center gap-3 truncate pr-4">
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                  <FiPlay className="w-5 h-5 fill-white" />
                </div>
                <div className="truncate">
                  <h4 className="font-black text-sm sm:text-base text-white truncate">
                    {activeVideo.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{activeVideo.subject_name}</span>
                    <span>→</span>
                    <span>{activeVideo.category_name}</span>
                    <span>→</span>
                    <span className="text-blue-400 font-bold">{activeVideo.chapter_name}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Iframe (16:9 ratio) */}
            <div className="aspect-video w-full bg-black relative">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtube_video_id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer & Actions */}
            <div className="p-5 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold">Instructor: {activeVideo.created_by_name || 'Faculty Mentor'}</span>
                {activeVideo.description && (
                  <p className="text-xs text-slate-300 max-w-xl">
                    {activeVideo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWatched(activeVideo._id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    watchedVideos.includes(activeVideo._id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  <span>
                    {watchedVideos.includes(activeVideo._id) ? 'Lesson Completed' : 'Mark as Completed'}
                  </span>
                </button>

                <a
                  href={activeVideo.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Open in YouTube</span>
                  <FiExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
