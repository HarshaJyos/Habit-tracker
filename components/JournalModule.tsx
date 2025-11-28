import * as React from "react";
import { JournalEntry, Mood, Dump } from "../types";
import {
  Save,
  Smile,
  Frown,
  Meh,
  Annoyed,
  Laugh,
  Calendar,
  Image as ImageIcon,
  X,
  Trash2,
  Edit2,
  ArrowLeft,
  Check,
  Plus,
  PenLine,
  Archive,
  RefreshCcw,
  Search,
} from "lucide-react";

interface JournalModuleProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  initialContent?: string;
  initialTitle?: string;
  initialTags?: string[];
  clearPrompt: () => void;
  convertingDump?: Dump | null;
  onClearConvertingDump?: () => void;
  onConvertComplete?: () => void; // Added prop
  onArchiveEntry: (id: string) => void;
  onUnarchiveEntry: (id: string) => void;
  autoTrigger?: boolean;
  onAutoTriggerHandled?: () => void;
}

const MOODS: { id: Mood; icon: any; color: string; val: number }[] = [
  { id: "awesome", icon: Laugh, color: "text-emerald-500", val: 5 },
  { id: "good", icon: Smile, color: "text-blue-500", val: 4 },
  { id: "neutral", icon: Meh, color: "text-gray-400", val: 3 },
  { id: "bad", icon: Frown, color: "text-orange-500", val: 2 },
  { id: "awful", icon: Annoyed, color: "text-red-500", val: 1 },
];

export const JournalModule: React.FC<JournalModuleProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  initialContent,
  initialTitle,
  initialTags,
  clearPrompt,
  convertingDump,
  onClearConvertingDump,
  onConvertComplete,
  onArchiveEntry,
  onUnarchiveEntry,
  autoTrigger,
  onAutoTriggerHandled,
}) => {
  const [viewingEntryId, setViewingEntryId] = React.useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = React.useState<"all" | Mood>("all");
  const [showArchived, setShowArchived] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form State
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [selectedMood, setSelectedMood] = React.useState<Mood>("good");
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [entryDate, setEntryDate] = React.useState(getLocalDateStr);

  const [extractedColor, setExtractedColor] = React.useState<string>("#ffffff");
  const [contrastTextColor, setContrastTextColor] =
    React.useState<string>("#111827");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter entries based on deletion and archive status
  const activeEntries = entries.filter((e) => !e.deletedAt && !e.archivedAt);
  const archivedEntries = entries.filter((e) => !e.deletedAt && e.archivedAt);

  const currentViewEntries = showArchived ? archivedEntries : activeEntries;

  const extractColorFromImage = (imageSrc: string) => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      const finalColor = `rgb(${r}, ${g}, ${b})`;
      setExtractedColor(finalColor);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      setContrastTextColor(yiq >= 128 ? "#111827" : "#ffffff");
    };
  };

  // Handle Journal Prompt or Initial Data
  React.useEffect(() => {
    if (initialTitle || initialContent) {
      if (initialTitle) setTitle(initialTitle);
      if (initialContent) setContent(initialContent);
      setEntryDate(getLocalDateStr());
      setIsModalOpen(true);
    }
  }, [initialTitle, initialContent]);

  // Handle Brain Dump Conversion
  React.useEffect(() => {
    if (convertingDump) {
      setTitle(convertingDump.title);
      setContent(convertingDump.description);
      setEntryDate(getLocalDateStr());
      setSelectedMood("neutral");
      setSelectedImages([]);
      setIsModalOpen(true);
    }
  }, [convertingDump]);

  // Handle Auto Trigger
  React.useEffect(() => {
    if (autoTrigger) {
      handleOpenNewEntry();
      if (onAutoTriggerHandled) onAutoTriggerHandled();
    }
  }, [autoTrigger, onAutoTriggerHandled]);

  const handleOpenNewEntry = () => {
    resetForm();
    setEntryDate(getLocalDateStr());
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let processedCount = 0;

      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          newImages.push(result);
          processedCount++;

          if (processedCount === files.length) {
            const updatedList = [...selectedImages, ...newImages];
            setSelectedImages(updatedList);
            if (updatedList.length > 0) {
              extractColorFromImage(updatedList[0]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const saveNewEntry = () => {
    if (!content.trim() && !title.trim() && selectedImages.length === 0) return;

    const [y, m, d] = entryDate.split("-").map(Number);
    const selectedDateObj = new Date(y, m - 1, d);
    const now = new Date();
    if (
      now.getFullYear() === y &&
      now.getMonth() === m - 1 &&
      now.getDate() === d
    ) {
      selectedDateObj.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
    } else {
      selectedDateObj.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
    }

    const tags =
      initialTags && initialTags.length > 0 ? initialTags : ["Entry"];

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim() || "Untitled Entry",
      content,
      mood: selectedMood,
      tags: tags,
      images: selectedImages,
      cardColor: selectedImages.length > 0 ? extractedColor : "#ffffff",
      textColor: selectedImages.length > 0 ? contrastTextColor : "#111827",
      createdAt: selectedDateObj.getTime(),
    };

    onAddEntry(newEntry);

    // Trigger brain dump deletion if applicable
    if (convertingDump && onConvertComplete) {
      onConvertComplete();
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedImages([]);
    setExtractedColor("#ffffff");
    setContrastTextColor("#111827");
    clearPrompt();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    if (onClearConvertingDump) {
      onClearConvertingDump();
    }
  };

  const removeImage = (index: number) => {
    const newList = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newList);
    if (newList.length === 0) {
      setExtractedColor("#ffffff");
      setContrastTextColor("#111827");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (index === 0) {
      extractColorFromImage(newList[0]);
    }
  };

  const filteredEntries = React.useMemo(() => {
    return currentViewEntries.filter((e) => {
      // Text Search Filter
      const matchesSearch =
        searchQuery === "" ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Mood Filter
      if (activeFilter === "all") return true;
      return e.mood === activeFilter;
    });
  }, [currentViewEntries, activeFilter, searchQuery]);

  const groupedEntries = React.useMemo(() => {
    const groups: { date: string; entries: JournalEntry[] }[] = [];
    const sorted = [...filteredEntries].sort(
      (a, b) => b.createdAt - a.createdAt
    );
    sorted.forEach((entry) => {
      const d = new Date(entry.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      let g = groups.find((x) => x.date === d);
      if (!g) {
        g = { date: d, entries: [] };
        groups.push(g);
      }
      g.entries.push(entry);
    });
    return groups;
  }, [filteredEntries]);

  if (viewingEntryId) {
    const entry = entries.find((e) => e.id === viewingEntryId);
    if (entry) {
      return (
        <JournalDetailView
          entry={entry}
          onBack={() => setViewingEntryId(null)}
          onUpdate={(updated) => {
            onUpdateEntry(updated);
            setViewingEntryId(null);
          }}
          onDelete={(id) => {
            onDeleteEntry(id);
            setViewingEntryId(null);
          }}
          onArchive={showArchived ? undefined : onArchiveEntry}
          onUnarchive={showArchived ? onUnarchiveEntry : undefined}
        />
      );
    }
  }

  return (
    <div className="w-full space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Journal
          </h2>
          {showArchived && (
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
              Archived View
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`p-2 rounded-xl transition-all ${
              showArchived
                ? "bg-orange-100 text-orange-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title={showArchived ? "View Active" : "View Archive"}
          >
            <Archive size={20} />
          </button>
          <button
            onClick={handleOpenNewEntry}
            className="bg-black text-white px-3 md:px-5 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <PenLine size={18} />{" "}
            <span className="hidden md:inline">Create Log</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
            activeFilter === "all"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveFilter(m.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all border ${
              activeFilter === m.id
                ? "bg-black text-white shadow-md border-transparent"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <m.icon
              size={14}
              className={activeFilter === m.id ? "text-white" : m.color}
            />
            <span className="capitalize">{m.id}</span>
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {groupedEntries.length > 0 ? (
          groupedEntries.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {group.date}
                </span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {group.entries.map((entry) => {
                  const MoodIcon =
                    MOODS.find((m) => m.id === entry.mood)?.icon || Smile;
                  const isDarkCard = entry.textColor === "#ffffff";
                  const bgColor = entry.cardColor || "#ffffff";
                  const txtColor = entry.textColor || "#111827";

                  const displayImages =
                    entry.images && entry.images.length > 0
                      ? entry.images
                      : entry.image
                      ? [entry.image]
                      : [];
                  const coverImage = displayImages[0];
                  const primaryTag =
                    entry.tags && entry.tags.length > 0 ? entry.tags[0] : null;

                  return (
                    <div key={entry.id} className="group h-full relative">
                      <div
                        onClick={() => setViewingEntryId(entry.id)}
                        className={`h-full flex flex-col rounded-2xl shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 overflow-hidden border ${
                          isDarkCard
                            ? "border-transparent"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: bgColor, color: txtColor }}
                      >
                        {coverImage && (
                          <div className="w-full aspect-[4/3] overflow-hidden relative">
                            <img
                              src={coverImage}
                              alt="Cover"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-40"></div>
                            {displayImages.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                                +{displayImages.length - 1}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold opacity-70`}
                              >
                                {new Date(entry.createdAt).toLocaleTimeString(
                                  "en-US",
                                  { hour: "numeric", minute: "2-digit" }
                                )}
                              </span>
                              {primaryTag && (
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border opacity-70 ${
                                    isDarkCard
                                      ? "border-white/30"
                                      : "border-black/20"
                                  }`}
                                >
                                  {primaryTag}
                                </span>
                              )}
                            </div>
                            <MoodIcon size={16} className="opacity-80" />
                          </div>

                          <h4 className="text-xl font-bold leading-snug mb-2 line-clamp-2">
                            {entry.title}
                          </h4>
                          {entry.content && (
                            <p
                              className={`text-sm line-clamp-4 opacity-80 font-normal whitespace-pre-wrap flex-1`}
                            >
                              {entry.content}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showArchived
                            ? onUnarchiveEntry(entry.id)
                            : onArchiveEntry(entry.id);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        title={showArchived ? "Restore" : "Archive"}
                      >
                        {showArchived ? (
                          <RefreshCcw size={14} />
                        ) : (
                          <Archive size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32">
            <p className="text-gray-400 font-medium text-lg">
              {showArchived ? "No archived logs." : "Your timeline is empty."}
            </p>
            {!showArchived && (
              <button
                onClick={handleOpenNewEntry}
                className="mt-4 text-black font-bold hover:underline"
              >
                Write your first log
              </button>
            )}
          </div>
        )}
      </div>

      {/* Creation Modal - Optimized for Mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[85vh] md:rounded-2xl md:max-w-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {convertingDump ? "Convert to Log" : "New Entry"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Calendar size={14} />
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-transparent focus:outline-none hover:text-black cursor-pointer text-xs uppercase tracking-wide font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (e.g., Daily Reflection)"
                  className="w-full bg-transparent text-2xl md:text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none"
                  autoFocus
                />
              </div>

              {selectedImages.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {selectedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative inline-block shrink-0 group"
                    >
                      <img
                        src={img}
                        alt="Preview"
                        className="h-32 w-32 md:h-40 md:w-40 rounded-xl border border-gray-200 object-cover shadow-sm"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Capture your thoughts..."
                className="w-full flex-1 min-h-[200px] md:min-h-[250px] bg-transparent text-base md:text-lg text-gray-700 placeholder-gray-400 focus:outline-none resize-none leading-relaxed custom-scrollbar"
              />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4 shrink-0 pb-safe">
              <div className="flex gap-2 justify-between md:justify-start w-full md:w-auto">
                <div className="flex gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-2 rounded-xl transition-all ${
                        selectedMood === mood.id
                          ? "bg-black text-white shadow-md"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      <mood.icon size={20} />
                    </button>
                  ))}
                </div>
                <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-xl transition-colors"
                  title="Add Images"
                >
                  <ImageIcon size={20} />
                </button>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={closeModal}
                  className="flex-1 md:flex-none px-6 py-3 md:py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveNewEntry}
                  disabled={
                    !content.trim() &&
                    !title.trim() &&
                    selectedImages.length === 0
                  }
                  className="flex-1 md:flex-none px-6 py-3 md:py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                >
                  <Save size={18} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JournalDetailView: React.FC<{
  entry: JournalEntry;
  onBack: () => void;
  onUpdate: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}> = ({ entry, onBack, onUpdate, onDelete, onArchive, onUnarchive }) => {
  const [isEditing, setIsEditing] = React.useState(false);

  // Edit State
  const [title, setTitle] = React.useState(entry.title);
  const [content, setContent] = React.useState(entry.content);
  const [mood, setMood] = React.useState<Mood>(entry.mood);
  const initialImages =
    entry.images && entry.images.length > 0
      ? entry.images
      : entry.image
      ? [entry.image]
      : [];
  const [images, setImages] = React.useState<string[]>(initialImages);

  // Carousel State
  const [activeSlide, setActiveSlide] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({
      ...entry,
      title,
      content,
      mood,
      images: images,
      image: images.length > 0 ? images[0] : undefined,
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveSlide(index);
    }
  };

  const MoodIcon =
    MOODS.find((m) => m.id === (isEditing ? mood : entry.mood))?.icon || Smile;

  return (
    <div className="w-full bg-white min-h-full animate-fade-in pb-20">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-500 font-bold hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
              >
                <Check size={16} /> Done
              </button>
            </>
          ) : (
            <>
              {onArchive && (
                <button
                  onClick={() => {
                    onArchive(entry.id);
                    onBack();
                  }}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-lg transition-colors"
                  title="Archive"
                >
                  <Archive size={18} />
                </button>
              )}
              {onUnarchive && (
                <button
                  onClick={() => {
                    onUnarchive(entry.id);
                    onBack();
                  }}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-lg transition-colors"
                  title="Unarchive"
                >
                  <RefreshCcw size={18} />
                </button>
              )}
              <button
                onClick={() => onDelete(entry.id)}
                className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                title="Delete Entry"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-100 hover:bg-black hover:text-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Edit2 size={16} /> Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title"
              className="w-full text-4xl md:text-5xl font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
            />
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
          )}

          <div className="text-sm text-gray-500 font-medium flex items-center gap-3">
            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Calendar size={14} />
              {new Date(entry.createdAt).toLocaleString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {!isEditing && (
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                <MoodIcon
                  size={14}
                  className={MOODS.find((m) => m.id === entry.mood)?.color}
                />
                <span className="capitalize text-gray-600">{entry.mood}</span>
              </span>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {entry.tags[0]}
              </span>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 py-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`p-2 rounded-xl transition-all ${
                  mood === m.id
                    ? "bg-black text-white scale-110 shadow-md"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                <m.icon size={20} />
              </button>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img
                    src={img}
                    alt={`Uploaded ${idx}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 bg-white/90 shadow-sm p-1.5 rounded-full text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"
              >
                <Plus size={24} />
                <span className="text-xs font-bold mt-2">Add Image</span>
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileRef}
              onChange={handleImageUpload}
            />
          </div>
        )}

        {!isEditing && images.length > 0 && (
          <div className="relative group rounded-2xl overflow-hidden bg-gray-50">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="w-full flex overflow-x-auto snap-x snap-mandatory custom-scrollbar"
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-full flex-shrink-0 snap-center flex justify-center bg-gray-100/50"
                >
                  <img
                    src={img}
                    alt={`Slide ${idx}`}
                    className="h-[60vh] object-contain"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full shadow-sm transition-all ${
                      activeSlide === idx
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[50vh] resize-none bg-transparent text-lg leading-loose text-gray-800 focus:outline-none custom-scrollbar p-2"
            placeholder="Write something..."
          />
        ) : (
          <div className="text-lg leading-loose text-gray-800 whitespace-pre-wrap max-w-none prose prose-lg prose-gray">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};
