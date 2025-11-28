import * as React from "react";
import { Note, NoteItem, Dump } from "../types";
import {
  Pin,
  Trash2,
  Plus,
  X,
  Palette,
  StickyNote,
  CheckSquare,
  Image as ImageIcon,
  Search,
  Archive,
  RefreshCcw,
} from "lucide-react";

interface NotesModuleProps {
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  convertingDump?: Dump | null;
  onClearConvertingDump?: () => void;
  onConvertComplete?: () => void; // Added prop
  onArchiveNote: (id: string) => void;
  onUnarchiveNote: (id: string) => void;
  onReorder?: (notes: Note[]) => void;
}

const COLORS = [
  "#ffffff",
  "#fecaca",
  "#fed7aa",
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
  "#e5e7eb",
];

// --- Reusable Components ---

export const NoteEditorModal: React.FC<{
  initialNote?: Partial<Note>;
  onSave: (data: Partial<Note>) => void;
  onClose: () => void;
  titleLabel?: string;
}> = ({ initialNote, onSave, onClose, titleLabel }) => {
  const [title, setTitle] = React.useState(initialNote?.title || "");
  const [content, setContent] = React.useState(initialNote?.content || "");
  const [listItems, setListItems] = React.useState<NoteItem[]>(
    initialNote?.items || []
  );
  const [listItemInput, setListItemInput] = React.useState("");
  const [images, setImages] = React.useState<string[]>(
    initialNote?.images || []
  );
  const [selectedColor, setSelectedColor] = React.useState(
    initialNote?.color || COLORS[0]
  );
  const [isPinned, setIsPinned] = React.useState(
    initialNote?.isPinned || false
  );

  const [showChecklist, setShowChecklist] = React.useState(
    !!(initialNote?.items && initialNote.items.length > 0)
  );
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (
      !title.trim() &&
      !content.trim() &&
      listItems.length === 0 &&
      images.length === 0
    ) {
      onClose();
      return;
    }
    const noteData: Partial<Note> = {
      title,
      content,
      items: listItems.length > 0 ? listItems : undefined,
      images: images.length > 0 ? images : undefined,
      type: listItems.length > 0 ? "mixed" : "text",
      isPinned,
      color: selectedColor,
    };
    onSave(noteData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          setImages((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const addListItem = () => {
    if (!listItemInput.trim()) return;
    setListItems([
      ...listItems,
      {
        id: Date.now().toString() + Math.random(),
        text: listItemInput,
        isDone: false,
      },
    ]);
    setListItemInput("");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300"
        style={{
          backgroundColor:
            selectedColor !== "#ffffff" ? selectedColor : "white",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-black/5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {titleLabel || (initialNote?.id ? "Edit Note" : "New Note")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-full transition-colors ${
                isPinned
                  ? "bg-black text-white"
                  : "hover:bg-black/5 text-gray-500"
              }`}
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin size={18} fill={isPinned ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black hover:bg-black/5 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-4">
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img
                    src={img}
                    className="w-full h-full object-cover rounded-xl border border-black/5"
                    alt="note attachment"
                  />
                  <button
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing..."
            className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none resize-none min-h-[120px] leading-relaxed"
          />
          {(showChecklist || listItems.length > 0) && (
            <div className="space-y-2 border-t border-black/5 pt-4">
              {listItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() =>
                      setListItems(
                        listItems.map((i, k) =>
                          k === idx ? { ...i, isDone: !i.isDone } : i
                        )
                      )
                    }
                    className={item.isDone ? "text-gray-400" : "text-gray-800"}
                  >
                    {item.isDone ? (
                      <CheckSquare size={18} />
                    ) : (
                      <div className="w-4 h-4 border border-gray-400 rounded-sm hover:border-black" />
                    )}
                  </button>
                  <input
                    value={item.text}
                    onChange={(e) =>
                      setListItems(
                        listItems.map((i, k) =>
                          k === idx ? { ...i, text: e.target.value } : i
                        )
                      )
                    }
                    className={`flex-1 bg-transparent focus:outline-none ${
                      item.isDone
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  />
                  <button
                    onClick={() =>
                      setListItems(listItems.filter((_, k) => k !== idx))
                    }
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <Plus size={16} />
                <input
                  value={listItemInput}
                  onChange={(e) => setListItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && listItemInput.trim())
                      addListItem();
                  }}
                  placeholder="Add list item"
                  className="flex-1 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-black/5 flex justify-between items-center bg-black/5">
          <div className="flex gap-1 relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 text-gray-600 hover:bg-black/10 rounded-full transition-colors"
              title="Background Color"
            >
              <Palette size={18} />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 w-max">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${
                      selectedColor === c ? "ring-2 ring-black" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:bg-black/10 rounded-full transition-colors"
              title="Add Image"
            >
              <ImageIcon size={18} />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </button>
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className={`p-2 rounded-full transition-colors ${
                showChecklist
                  ? "bg-black/10 text-gray-900"
                  : "text-gray-600 hover:bg-black/10"
              }`}
              title="Toggle Checklist"
            >
              <CheckSquare size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors shadow-lg"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NoteCard: React.FC<{
  note: Note;
  onClick: () => void;
  onPin: (e: React.MouseEvent, note: Note) => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleItem: (noteId: string, itemId: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}> = ({
  note,
  onClick,
  onPin,
  onDelete,
  onToggleItem,
  onArchive,
  onUnarchive,
}) => {
  return (
    <div
      onClick={onClick}
      className="h-full min-h-[160px] rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col"
      style={{ backgroundColor: note.color }}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 pr-6">
            {note.title || "Untitled"}
          </h3>
          <button
            onClick={(e) => onPin(e, note)}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${
              note.isPinned
                ? "bg-black text-white"
                : "text-gray-300 hover:text-black hover:bg-black/5"
            }`}
          >
            <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {note.images && note.images.length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden h-32 w-full">
              <img
                src={note.images[0]}
                alt="Note attachment"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {note.type === "list" || (note.items && note.items.length > 0) ? (
            <div className="space-y-1">
              {note.items?.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleItem(note.id, item.id);
                    }}
                    className={`shrink-0 ${
                      item.isDone ? "text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {item.isDone ? (
                      <CheckSquare size={14} />
                    ) : (
                      <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm" />
                    )}
                  </button>
                  <span
                    className={`truncate ${
                      item.isDone ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {note.items && note.items.length > 4 && (
                <span className="text-xs text-gray-400 italic">
                  +{note.items.length - 4} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 line-clamp-6 whitespace-pre-wrap">
              {note.content}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
          <span className="text-[10px] text-gray-400 font-medium">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex gap-1">
            {onArchive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(note.id);
                }}
                className="p-1.5 hover:bg-black/5 rounded text-gray-500 hover:text-black transition-colors"
                title="Archive"
              >
                <Archive size={14} />
              </button>
            ) : (
              onUnarchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnarchive(note.id);
                  }}
                  className="p-1.5 hover:bg-black/5 rounded text-gray-500 hover:text-black transition-colors"
                  title="Unarchive"
                >
                  <RefreshCcw size={14} />
                </button>
              )
            )}
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotesModule: React.FC<NotesModuleProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  convertingDump,
  onClearConvertingDump,
  onArchiveNote,
  onUnarchiveNote,
  onReorder,
  onConvertComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const activeNotes = notes.filter((n) => !n.deletedAt && !n.archivedAt);
  const archivedNotes = notes.filter((n) => !n.deletedAt && n.archivedAt);

  const currentViewNotes = showArchived ? archivedNotes : activeNotes;

  const filteredNotes = React.useMemo(() => {
    return currentViewNotes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.items?.some((i) =>
            i.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
      .sort(
        (a, b) =>
          (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) ||
          b.updatedAt - a.updatedAt
      );
  }, [currentViewNotes, searchQuery]);

  React.useEffect(() => {
    if (convertingDump) {
      setIsModalOpen(true);
      setEditingNoteId(null);
    }
  }, [convertingDump]);

  const handleSaveNote = (noteData: Partial<Note>) => {
    if (editingNoteId) {
      const existing = notes.find((n) => n.id === editingNoteId);
      if (existing)
        onUpdateNote({ ...existing, ...noteData, updatedAt: Date.now() });
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: [],
        images: [],
        type: "text",
        isPinned: false,
        color: "#ffffff",
        title: "",
        content: "",
        ...noteData,
      };
      onAddNote(newNote);
    }

    // Trigger brain dump deletion if applicable
    if (convertingDump && onConvertComplete) {
      onConvertComplete();
    }

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNoteId(null);
    if (onClearConvertingDump) onClearConvertingDump();
  };

  const handleToggleItem = (noteId: string, itemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note && note.items) {
      const newItems = note.items.map((i) =>
        i.id === itemId ? { ...i, isDone: !i.isDone } : i
      );
      onUpdateNote({ ...note, items: newItems, updatedAt: Date.now() });
    }
  };

  const handlePin = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    onUpdateNote({ ...note, isPinned: !note.isPinned });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteNote(id);
  };

  const initialNoteForModal = React.useMemo(() => {
    if (convertingDump) {
      return {
        title: convertingDump.title,
        content: convertingDump.description,
      };
    }
    if (editingNoteId) {
      return notes.find((n) => n.id === editingNoteId);
    }
    return undefined;
  }, [convertingDump, editingNoteId, notes]);

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24 bg-white flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 mb-6 gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <StickyNote className="text-black" size={32} /> Notes
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
              placeholder="Search notes..."
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
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
            onClick={() => {
              setEditingNoteId(null);
              setIsModalOpen(true);
            }}
            className="bg-black text-white px-3 md:px-5 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />{" "}
            <span className="hidden md:inline">New Note</span>
          </button>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-10">
        {filteredNotes.map((note) => (
          <div key={note.id} className="break-inside-avoid">
            <NoteCard
              note={note}
              onClick={() => {
                setEditingNoteId(note.id);
                setIsModalOpen(true);
              }}
              onPin={handlePin}
              onDelete={(e) => handleDelete(e, note.id)}
              onToggleItem={handleToggleItem}
              onArchive={showArchived ? undefined : onArchiveNote}
              onUnarchive={showArchived ? onUnarchiveNote : undefined}
            />
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center">
          <StickyNote size={48} className="mb-4 opacity-20" />
          <p>No notes found.</p>
        </div>
      )}

      {isModalOpen && (
        <NoteEditorModal
          initialNote={initialNoteForModal}
          onSave={handleSaveNote}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
