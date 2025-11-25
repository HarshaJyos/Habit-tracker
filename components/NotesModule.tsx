

import * as React from 'react';
import { Note, NoteItem, Dump } from '../types';
import { Pin, Trash2, Plus, X, Palette, StickyNote, CheckSquare, AlignLeft, Image as ImageIcon, Search, Edit2, Archive, RefreshCcw } from 'lucide-react';

interface NotesModuleProps {
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  convertingDump?: Dump | null;
  onClearConvertingDump?: () => void;
  onArchiveNote: (id: string) => void;
  onUnarchiveNote: (id: string) => void;
  onReorder?: (notes: Note[]) => void;
}

const COLORS = [
  '#ffffff', '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', 
  '#bfdbfe', '#ddd6fe', '#fbcfe8', '#e5e7eb',
];

// --- Reusable Components ---

export const NoteEditorModal: React.FC<{
    initialNote?: Partial<Note>;
    onSave: (data: Partial<Note>) => void;
    onClose: () => void;
    titleLabel?: string;
}> = ({ initialNote, onSave, onClose, titleLabel }) => {
    const [title, setTitle] = React.useState(initialNote?.title || '');
    const [content, setContent] = React.useState(initialNote?.content || '');
    const [listItems, setListItems] = React.useState<NoteItem[]>(initialNote?.items || []);
    const [listItemInput, setListItemInput] = React.useState('');
    const [images, setImages] = React.useState<string[]>(initialNote?.images || []);
    const [selectedColor, setSelectedColor] = React.useState(initialNote?.color || COLORS[0]);
    const [isPinned, setIsPinned] = React.useState(initialNote?.isPinned || false);
    
    const [showChecklist, setShowChecklist] = React.useState(!!(initialNote?.items && initialNote.items.length > 0));
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (!title.trim() && !content.trim() && listItems.length === 0 && images.length === 0) {
            onClose();
            return;
        }
        const noteData: Partial<Note> = {
            title, 
            content, 
            items: listItems.length > 0 ? listItems : undefined,
            images: images.length > 0 ? images : undefined,
            type: listItems.length > 0 ? 'mixed' : 'text',
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
                reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const addListItem = () => {
        if (!listItemInput.trim()) return;
        setListItems([...listItems, { id: Date.now().toString() + Math.random(), text: listItemInput, isDone: false }]);
        setListItemInput('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300" style={{ backgroundColor: selectedColor !== '#ffffff' ? selectedColor : 'white' }} onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 flex justify-between items-center border-b border-black/5">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{titleLabel || (initialNote?.id ? 'Edit Note' : 'New Note')}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsPinned(!isPinned)} className={`p-2 rounded-full transition-colors ${isPinned ? 'bg-black text-white' : 'hover:bg-black/5 text-gray-500'}`} title={isPinned ? 'Unpin' : 'Pin'}>
                            <Pin size={18} fill={isPinned ? "currentColor" : "none"} />
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-black hover:bg-black/5 p-1 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-4">
                    {images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square">
                                    <img src={img} className="w-full h-full object-cover rounded-xl border border-black/5" />
                                    <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none" />
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start typing..." className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none resize-none min-h-[120px] leading-relaxed" />
                    {(showChecklist || listItems.length > 0) && (
                        <div className="space-y-2 border-t border-black/5 pt-4">
                             {listItems.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-3 group">
                                     <button onClick={() => setListItems(listItems.map((i, k) => k === idx ? { ...i, isDone: !i.isDone } : i))} className={item.isDone ? 'text-gray-400' : 'text-gray-800'}>{item.isDone ? <CheckSquare size={18} /> : <div className="w-4 h-4 border border-gray-400 rounded-sm hover:border-black" />}</button>
                                     <input value={item.text} onChange={(e) => setListItems(listItems.map((i, k) => k === idx ? { ...i, text: e.target.value } : i))} className={`flex-1 bg-transparent focus:outline-none ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`} />
                                     <button onClick={() => setListItems(listItems.filter((_, k) => k !== idx))} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                </div>
                             ))}
                             <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                 <Plus size={16} />
                                 <input value={listItemInput} onChange={(e) => setListItemInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && listItemInput.trim()) addListItem(); }} placeholder="Add list item" className="flex-1 bg-transparent focus:outline-none" />
                             </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-black/5 flex justify-between items-center bg-black/5">
                    <div className="flex gap-1 relative">
                        <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 text-gray-600 hover:bg-black/10 rounded-full transition-colors" title="Background Color"><Palette size={18} /></button>
                        {showColorPicker && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 w-max">
                                {COLORS.map(c => ( <button key={c} onClick={() => { setSelectedColor(c); setShowColorPicker(false); }} className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${selectedColor === c ? 'ring-2 ring-black' : ''}`} style={{ backgroundColor: c }} /> ))}
                            </div>
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-black/10 rounded-full transition-colors" title="Add Image"><ImageIcon size={18} /><input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} /></button>
                        <button onClick={() => setShowChecklist(!showChecklist)} className={`p-2 rounded-full transition-colors ${showChecklist ? 'bg-black/10 text-gray-900' : 'text-gray-600 hover:bg-black/10'}`} title="Toggle Checklist"><CheckSquare size={18} /></button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors shadow-lg">Save Note</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const NoteCard: React.FC<{ 
    note: Note; onClick: () => void; onPin: (e: React.MouseEvent, note: Note) => void; 
    onDelete: (e: React.MouseEvent) => void; onToggleItem: (noteId: string, itemId: string) => void;
    onArchive?: (id: string) => void; onUnarchive?: (id: string) => void;
}> = ({ note, onClick, onPin, onDelete, onToggleItem, onArchive, onUnarchive }) => {
    return (
        <div onClick={onClick} className="h-full rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col" style={{ backgroundColor: note.color !== '#ffffff' ? note.color : 'white' }}>
            {note.images && note.images.length > 0 && (
                <div className={`w-full overflow-hidden shrink-0 ${note.images.length === 1 ? 'aspect-video' : 'grid grid-cols-2 aspect-video'}`}>
                    {note.images.slice(0, 4).map((img, i) => ( <img key={i} src={img} className="w-full h-full object-cover border-b border-black/5" /> ))}
                </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                    {note.title && <h4 className="font-bold text-gray-900 leading-tight text-lg">{note.title}</h4>}
                    <button onClick={(e) => onPin(e, note)} className={`p-1.5 rounded-full hover:bg-black/10 shrink-0 transition-opacity ${note.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}><Pin size={16} fill={note.isPinned ? "currentColor" : "none"} /></button>
                </div>
                {note.content && <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-[12] mb-2">{note.content}</p>}
                {note.items && note.items.length > 0 && (
                    <div className={`space-y-1.5 ${note.content ? 'mt-4' : ''}`}>
                        {note.items.slice(0, 5).map(item => (
                            <div key={item.id} className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => onToggleItem(note.id, item.id)} className={`mt-0.5 ${item.isDone ? 'text-gray-400' : 'text-gray-800'}`}>{item.isDone ? <CheckSquare size={16} /> : <div className="w-4 h-4 border border-gray-400 rounded-sm hover:border-black" />}</button>
                                <span className={`text-sm leading-tight ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</span>
                            </div>
                        ))}
                        {note.items.length > 5 && <div className="text-xs text-gray-400 pl-6 font-medium">+{note.items.length - 5} more items</div>}
                    </div>
                )}
                {!note.title && !note.content && (!note.items || note.items.length === 0) && (
                    <p className="text-gray-400 text-sm italic">Empty note</p>
                )}
            </div>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                 {onArchive && (
                    <button onClick={(e) => { e.stopPropagation(); onArchive(note.id); }} className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-lg transition-colors shadow-sm bg-white/50 backdrop-blur-sm" title="Archive"><Archive size={16} /></button>
                 )}
                 {onUnarchive && (
                    <button onClick={(e) => { e.stopPropagation(); onUnarchive(note.id); }} className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-lg transition-colors shadow-sm bg-white/50 backdrop-blur-sm" title="Restore"><RefreshCcw size={16} /></button>
                 )}
                <button type="button" onClick={onDelete} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition-colors shadow-sm bg-white/50 backdrop-blur-sm"><Trash2 size={16} /></button>
            </div>
        </div>
    );
};

// --- Main Module ---

export const NotesModule: React.FC<NotesModuleProps> = ({ 
    notes, onAddNote, onUpdateNote, onDeleteNote, convertingDump, onClearConvertingDump, onArchiveNote, onUnarchiveNote, onReorder
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  
  const [draggedNoteId, setDraggedNoteId] = React.useState<string | null>(null);

  // Conversion Logic
  const [initialDumpData, setInitialDumpData] = React.useState<Partial<Note> | undefined>(undefined);

  const activeNotes = notes.filter(n => !n.deletedAt && !n.archivedAt);
  const archivedNotes = notes.filter(n => !n.deletedAt && n.archivedAt);
  const currentViewNotes = showArchived ? archivedNotes : activeNotes;

  const filteredNotes = currentViewNotes.filter(n => {
      const match = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(match) || n.content.toLowerCase().includes(match);
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  React.useEffect(() => {
    if (convertingDump) {
      setInitialDumpData({
          title: convertingDump.title,
          content: convertingDump.description,
          color: COLORS[0],
          isPinned: false
      });
      setIsModalOpen(true);
    }
  }, [convertingDump]);

  const handleSaveNote = (data: Partial<Note>) => {
      if (editingNoteId) {
          const existing = notes.find(n => n.id === editingNoteId);
          if (existing) onUpdateNote({ ...existing, ...data, updatedAt: Date.now() });
      } else {
          const newNote: Note = { id: Date.now().toString(), createdAt: Date.now(), updatedAt: Date.now(), items: [], images: [], type: 'text', isPinned: false, color: '#ffffff', title: '', content: '', ...data };
          onAddNote(newNote);
      }
      setInitialDumpData(undefined);
      setEditingNoteId(null);
      setIsModalOpen(false);
      if (onClearConvertingDump) onClearConvertingDump();
  };

  const openModal = (note?: Note) => {
      if (note) {
          setEditingNoteId(note.id);
          setInitialDumpData(note);
      } else {
          setEditingNoteId(null);
          setInitialDumpData(undefined);
      }
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingNoteId(null);
      setInitialDumpData(undefined);
      if (onClearConvertingDump) onClearConvertingDump();
  };

  const togglePin = (e: React.MouseEvent, note: Note) => { e.stopPropagation(); onUpdateNote({ ...note, isPinned: !note.isPinned }); };
  const toggleCardItem = (noteId: string, itemId: string) => {
    const note = notes.find(n => n.id === noteId);
    if(note && note.items) onUpdateNote({ ...note, items: note.items.map(i => i.id === itemId ? { ...i, isDone: !i.isDone } : i) });
  };
  
  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedNoteId(id);
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedNoteId || draggedNoteId === targetId || !onReorder) return;
      
      const allNotes = [...notes];
      const fromIndex = allNotes.findIndex(r => r.id === draggedNoteId);
      const toIndex = allNotes.findIndex(r => r.id === targetId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
          const [moved] = allNotes.splice(fromIndex, 1);
          allNotes.splice(toIndex, 0, moved);
          onReorder(allNotes);
      }
      setDraggedNoteId(null);
  };

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto custom-scrollbar pb-24">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Notes</h2>
                {showArchived && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">Archived View</span>}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className={`p-2 rounded-xl transition-all ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title={showArchived ? "View Active" : "View Archive"}
                >
                    <Archive size={18} />
                </button>
                <button onClick={() => openModal()} className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-gray-200 text-sm whitespace-nowrap">
                    <Plus size={18} /> New Note
                </button>
            </div>
        </div>

        <div className="space-y-8">
            {pinnedNotes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                        <Pin size={12} fill="currentColor" /> Pinned
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pinnedNotes.map(note => (
                            <div key={note.id} draggable={!showArchived} onDragStart={(e) => handleDragStart(e, note.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, note.id)}>
                                <NoteCard 
                                    note={note} onClick={() => openModal(note)} 
                                    onPin={togglePin} onDelete={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} 
                                    onToggleItem={toggleCardItem}
                                    onArchive={showArchived ? undefined : onArchiveNote}
                                    onUnarchive={showArchived ? onUnarchiveNote : undefined}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="space-y-3">
                 {pinnedNotes.length > 0 && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Others</h3>}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {otherNotes.map(note => (
                        <div key={note.id} draggable={!showArchived} onDragStart={(e) => handleDragStart(e, note.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, note.id)}>
                            <NoteCard 
                                note={note} onClick={() => openModal(note)} 
                                onPin={togglePin} onDelete={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} 
                                onToggleItem={toggleCardItem}
                                onArchive={showArchived ? undefined : onArchiveNote}
                                onUnarchive={showArchived ? onUnarchiveNote : undefined}
                            />
                        </div>
                    ))}
                 </div>
            </div>
            {filteredNotes.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <StickyNote size={24} />
                    </div>
                    <p className="text-gray-400 font-medium">No {showArchived ? 'archived' : ''} notes found.</p>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
          <NoteEditorModal 
            initialNote={initialDumpData}
            onSave={handleSaveNote}
            onClose={closeModal}
          />
      )}
    </div>
  );
};
