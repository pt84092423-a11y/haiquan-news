import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export interface QuillEditorRef {
  getContent: () => string;
  setContent: (html: string) => void;
  insertContent: (html: string) => void;
}

interface Props {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  height?: number;
  onImageUpload?: (file: File) => Promise<string | null>;
}

const QuillEditor = forwardRef<QuillEditorRef, Props>(
  ({ value = '', onChange, placeholder = 'Bắt đầu soạn thảo nội dung bài báo...', height = 540, onImageUpload }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const suppressRef = useRef(false);

    useEffect(() => {
      if (!containerRef.current || quillRef.current) return;

      const imageHandler = onImageUpload
        ? () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.click();
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const url = await onImageUpload(file);
              if (url && quillRef.current) {
                const range = quillRef.current.getSelection();
                quillRef.current.insertEmbed(range?.index ?? quillRef.current.getLength(), 'image', url);
              }
            };
          }
        : undefined;

      const quill = new Quill(containerRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, 4, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],
              [{ align: [] }],
              ['blockquote', 'code-block'],
              ['link', 'image', 'video'],
              ['clean'],
            ],
            handlers: imageHandler ? { image: imageHandler } : {},
          },
        },
      });

      quillRef.current = quill;

      if (value) {
        suppressRef.current = true;
        quill.root.innerHTML = value;
        suppressRef.current = false;
      }

      // Set min-height on the editor content area
      const editor = containerRef.current.querySelector('.ql-editor') as HTMLElement;
      if (editor) editor.style.minHeight = `${height - 50}px`;

      quill.on('text-change', () => {
        if (suppressRef.current) return;
        onChange?.(quill.root.innerHTML);
      });

      return () => {
        quillRef.current = null;
      };
    }, []);

    // Sync external value (only used when switching from TinyMCE → Quill)
    const prevValueRef = useRef(value);
    useEffect(() => {
      if (!quillRef.current || value === prevValueRef.current) return;
      prevValueRef.current = value;
      if (quillRef.current.root.innerHTML === value) return;
      suppressRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      suppressRef.current = false;
    }, [value]);

    useImperativeHandle(ref, () => ({
      getContent: () => quillRef.current?.root.innerHTML ?? '',
      setContent: (html: string) => {
        if (!quillRef.current) return;
        suppressRef.current = true;
        quillRef.current.root.innerHTML = html;
        suppressRef.current = false;
      },
      insertContent: (html: string) => {
        if (!quillRef.current) return;
        const range = quillRef.current.getSelection();
        const index = range?.index ?? quillRef.current.getLength();
        quillRef.current.clipboard.dangerouslyPasteHTML(index, html);
      },
    }));

    return <div ref={containerRef} className="quill-haiquan-wrapper" />;
  }
);

QuillEditor.displayName = 'QuillEditor';
export default QuillEditor;
