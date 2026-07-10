import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { FiBold, FiItalic, FiList, FiCheckSquare } from 'react-icons/fi';

export default function RichTextEditor({ value, onChange, placeholder = 'Введите описание...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '0.25rem', padding: '0.5rem',
        borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)'
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`btn btn-sm ${editor.isActive('bold') ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '0.25rem' }}
        >
          <FiBold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`btn btn-sm ${editor.isActive('italic') ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '0.25rem' }}
        >
          <FiItalic size={16} />
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`btn btn-sm ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '0.25rem' }}
        >
          <FiList size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} style={{ padding: '0.875rem', minHeight: '150px' }} className="tiptap-editor" />
    </div>
  );
}
