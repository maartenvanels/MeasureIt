'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { Annotation } from '@/types/measurement';
import { ColorPicker } from '@/components/sidebar/ColorPicker';
import { Code, Eye, Bold, Italic, Heading2, Link, Sigma } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function AnnotationEditorDialog() {
  const annotationEditorOpen = useUIStore((s) => s.annotationEditorOpen);
  const pendingAnnotationPosition = useUIStore((s) => s.pendingAnnotationPosition);
  const editingAnnotationId = useUIStore((s) => s.editingAnnotationId);
  const closeAnnotationEditor = useUIStore((s) => s.closeAnnotationEditor);

  const addAnnotation = useMeasurementStore((s) => s.addAnnotation);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);
  const measurements = useMeasurementStore((s) => s.measurements);

  const [content, setContent] = useState('');
  const [editorMode, setEditorMode] = useState<'raw' | 'preview'>('raw');
  const [color, setColor] = useState('#a855f7');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when dialog opens
  useEffect(() => {
    if (!annotationEditorOpen) return;

    if (editingAnnotationId) {
      const existing = measurements.find(
        (m): m is Annotation => m.id === editingAnnotationId && m.type === 'annotation'
      );
      if (existing) {
        setContent(existing.content);
        setColor(existing.color ?? '#a855f7');
      }
    } else if (pendingAnnotationPosition) {
      setContent('');
      setColor('#a855f7');
    }

    setEditorMode('raw');
  }, [annotationEditorOpen, editingAnnotationId, pendingAnnotationPosition, measurements]);

  const insertAtCursor = (before: string, after: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const insertion = before + (selected || 'text') + after;
    const newContent = content.slice(0, start) + insertion + content.slice(end);
    setContent(newContent);
    // Restore cursor position after React render
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + before.length + (selected || 'text').length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const handleSave = () => {
    if (editingAnnotationId) {
      updateMeasurement(editingAnnotationId, { content, color });
    } else if (pendingAnnotationPosition) {
      addAnnotation({
        id: crypto.randomUUID(),
        type: 'annotation',
        position: pendingAnnotationPosition,
        content,
        color,
        createdAt: Date.now(),
      });
    }
    closeAnnotationEditor();
  };

  return (
    <Dialog open={annotationEditorOpen} onOpenChange={(open) => { if (!open) closeAnnotationEditor(); }}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800">
        {/* Header with title and toggle */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-zinc-100">
            {editingAnnotationId ? 'Edit Annotation' : 'New Annotation'}
          </DialogTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditorMode('raw')}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                editorMode === 'raw'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              Raw
            </button>
            <button
              onClick={() => setEditorMode('preview')}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                editorMode === 'preview'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
        </DialogHeader>

        {/* Mini toolbar (only in raw mode) */}
        {editorMode === 'raw' && (
          <div className="flex items-center gap-1 border-b border-zinc-800 pb-2">
            <button
              onClick={() => insertAtCursor('**', '**')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertAtCursor('*', '*')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertAtCursor('## ', '')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Heading"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertAtCursor('$', '$')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Inline math"
            >
              <Sigma className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertAtCursor('\n$$\n', '\n$$\n')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Block math"
            >
              $$
            </button>
            <button
              onClick={() => insertAtCursor('[', '](url)')}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Link"
            >
              <Link className="h-4 w-4" />
            </button>

            <div className="ml-auto flex items-center gap-2">
              <ColorPicker color={color} onChange={setColor} />
            </div>
          </div>
        )}

        {/* Main content area */}
        {editorMode === 'raw' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[200px] bg-zinc-900 text-zinc-200 font-mono text-sm p-3 rounded border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-600"
            placeholder="Write markdown here... supports **bold**, *italic*, $LaTeX$, and more."
          />
        ) : (
          <div className="annotation-content prose prose-invert prose-sm max-w-none p-4 min-h-[200px] bg-zinc-900 rounded border border-zinc-800">
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {content || '*No content yet*'}
            </Markdown>
          </div>
        )}

        {/* Footer buttons */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <button
            onClick={closeAnnotationEditor}
            className="px-3 py-1.5 text-sm rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
