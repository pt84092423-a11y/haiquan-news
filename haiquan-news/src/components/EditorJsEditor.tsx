import React, { useEffect, useRef, useState, useCallback } from 'react';
import { blocksToHtml, htmlToBlocks } from '@/lib/editorUtils';

// ─── Gemini API ────────────────────────────────────────────────────────────
const GEMINI_KEY = 'AIzaSyD-jzH0ckOGlbBtanqrl75fOUpcmWp0Ih0';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

async function callGemini(promptText: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Script loader (sequential) ────────────────────────────────────────────
const CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.28.2/dist/editorjs.umd.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.1/dist/header.umd.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/nested-list@1.4.2/dist/nested-list.umd.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/checklist@1.6.0/dist/checklist.umd.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/table@2.3.0/dist/table.umd.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/marker@1.4.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@1.5.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/underline@1.1.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/code@2.9.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/quote@2.6.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.4.0/dist/bundle.js',
  'https://cdn.jsdelivr.net/npm/@editorjs/embed@2.7.4/dist/bundle.js',
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.defer = false; s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}

let scriptsLoaded = false;
let scriptsLoading: Promise<void> | null = null;

function loadAllEditorJs(): Promise<void> {
  if (scriptsLoaded) return Promise.resolve();
  if (scriptsLoading) return scriptsLoading;
  scriptsLoading = (async () => {
    for (const src of CDN_SCRIPTS) await loadScript(src);
    scriptsLoaded = true;
  })();
  return scriptsLoading;
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface EditorJsEditorProps {
  initialContent?: string;
  onContentChange: (html: string) => void;
}

type AiTab = 'A' | 'B' | 'C';

// ─── Component ──────────────────────────────────────────────────────────────
export default function EditorJsEditor({ initialContent, onContentChange }: EditorJsEditorProps) {
  const editorRef = useRef<any>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiTab, setAiTab] = useState<AiTab>('A');
  const [aiLoading, setAiLoading] = useState(false);

  const [topicInput, setTopicInput] = useState('');
  const [outlineResult, setOutlineResult] = useState('');

  const [commentText] = useState('Bài viết rất hay, nhưng ứng dụng thực tế thế nào?');
  const [replyOutput, setReplyOutput] = useState('');

  const [buddyResult, setBuddyResult] = useState('');
  const [buddyAction, setBuddyAction] = useState('');

  const updateStats = useCallback((blocks: any[]) => {
    const text = blocks.map((b: any) => {
      if (b.type === 'paragraph' || b.type === 'header') return (b.data.text || '').replace(/<[^>]+>/g, '');
      if (b.type === 'list') return (b.data.items || []).map((i: any) => typeof i === 'string' ? i : (i.content || '')).join(' ');
      if (b.type === 'code') return b.data.code || '';
      return '';
    }).join(' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadingTime(Math.max(1, Math.round(words / 200)));
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    loadAllEditorJs().then(() => {
      const EJS = (window as any).EditorJS;
      if (!EJS || !holderRef.current) return;

      const holderId = `ejs-holder-${Date.now()}`;
      holderRef.current.id = holderId;

      const W = window as any;
      const tools: Record<string, any> = {
        header: { class: W.Header, shortcut: 'CMD+SHIFT+H', config: { levels: [1, 2, 3, 4], defaultLevel: 2, placeholder: 'Tiêu đề...' } },
        list: { class: W.NestedList, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
        checklist: { class: W.Checklist, inlineToolbar: true },
        table: { class: W.Table, inlineToolbar: true, config: { rows: 2, cols: 3, withHeadings: true } },
        quote: { class: W.Quote, inlineToolbar: true, config: { quotePlaceholder: 'Trích dẫn...', captionPlaceholder: 'Tác giả' } },
        code: { class: W.CodeTool, config: { placeholder: 'Nhập code tại đây...' } },
        delimiter: { class: W.Delimiter },
        embed: { class: W.Embed, config: { services: { youtube: true, vimeo: true, twitter: true, instagram: true, facebook: true } } },
        marker: { class: W.Marker, shortcut: 'CMD+SHIFT+M' },
        inlineCode: { class: W.InlineCode, shortcut: 'CMD+SHIFT+C' },
        underline: { class: W.Underline, shortcut: 'CMD+U' },
      };
      Object.keys(tools).forEach(k => { if (!tools[k].class) delete tools[k]; });

      const initialData = initialContent ? { blocks: htmlToBlocks(initialContent) } : undefined;

      const editor = new EJS({
        holder: holderId,
        autofocus: false,
        placeholder: '✏️ Bắt đầu soạn thảo... Nhấn Tab để chọn khối nội dung',
        tools,
        data: initialData,
        onChange: async () => {
          try {
            const saved = await editor.save();
            updateStats(saved.blocks);
            onContentChange(blocksToHtml(saved.blocks));
          } catch { /* ignore */ }
        },
        i18n: {
          messages: {
            ui: {
              blockTunes: { toggler: { 'Click to tune': 'Tùy chỉnh', 'or drag to move': 'hoặc kéo để di chuyển' } },
              inlineToolbar: { converter: { 'Convert to': 'Chuyển sang' } },
              toolbar: { toolbox: { Add: 'Thêm' } },
            },
            toolNames: {
              Text: 'Đoạn văn', Heading: 'Tiêu đề', List: 'Danh sách', Checklist: 'Danh sách kiểm',
              Quote: 'Trích dẫn', Code: 'Code', Delimiter: 'Phân cách', Table: 'Bảng',
              Link: 'Liên kết', Marker: 'Đánh dấu', Bold: 'Đậm', Italic: 'Nghiêng',
              InlineCode: 'Code nội dòng', Underline: 'Gạch chân',
            },
            blockTunes: {
              delete: { Delete: 'Xóa' },
              moveUp: { 'Move up': 'Lên trên' },
              moveDown: { 'Move down': 'Xuống dưới' },
            },
          },
        },
      });

      editorRef.current = editor;
      setReady(true);
    }).catch(err => setLoadError(`Không tải được Editor.js: ${err.message}`));

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      initRef.current = false;
    };
  }, []);

  const handleGenerateOutline = async () => {
    if (!topicInput.trim()) return;
    setAiLoading(true); setOutlineResult('');
    try {
      const prompt = `Bạn là chuyên gia báo chí quân sự và an ninh quốc phòng Việt Nam. Hãy tạo một dàn bài chi tiết cho bài báo với chủ đề: "${topicInput}". Viết bằng tiếng Việt, phong cách nghiêm túc, chuyên nghiệp. Trả về dàn bài dưới dạng văn bản có cấu trúc với các mục I. II. III. và 1. 2. 3. rõ ràng.`;
      const result = await callGemini(prompt);
      if (editorRef.current) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const t = line.trim();
          if (/^[IVX]+\./.test(t) || /^#{1,3}\s/.test(t)) {
            await editorRef.current.blocks.insert('header', { text: t.replace(/^#+\s*/, ''), level: 2 });
          } else if (/^\d+\./.test(t) || /^[a-z]\)/.test(t)) {
            await editorRef.current.blocks.insert('header', { text: t, level: 3 });
          } else if (t) {
            await editorRef.current.blocks.insert('paragraph', { text: t });
          }
        }
        const saved = await editorRef.current.save();
        updateStats(saved.blocks);
        onContentChange(blocksToHtml(saved.blocks));
      }
      setOutlineResult('✅ Đã chèn dàn bài vào editor!');
    } catch (err: any) {
      setOutlineResult(`❌ Lỗi: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    setAiLoading(true); setReplyOutput('');
    try {
      let ctx = '';
      if (editorRef.current) {
        const saved = await editorRef.current.save();
        ctx = blocksToHtml(saved.blocks).replace(/<[^>]+>/g, '').slice(0, 1500);
      }
      const prompt = `Bạn là biên tập viên Báo Hải Quân Việt Nam. Với ngữ cảnh bài báo:\n"${ctx || '[Bài viết chưa có nội dung]'}"\n\nHãy soạn một câu trả lời lịch sự, chuyên nghiệp và có tính thông tin cho bình luận của độc giả:\n"${commentText}"\n\nYêu cầu: Viết bằng tiếng Việt, ngắn gọn (2-4 câu), thân thiện, thể hiện sự cảm ơn và cung cấp thông tin hữu ích. Chỉ trả về văn bản câu trả lời, không có giải thích thêm.`;
      const result = await callGemini(prompt);
      setReplyOutput(result.replace(/<(?!br)[^>]+>/gi, '').trim());
    } catch (err: any) {
      setReplyOutput(`Lỗi: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTextBuddy = async (action: 'next' | 'fix' | 'humor') => {
    const selected = window.getSelection()?.toString() || '';
    if (!selected.trim()) { alert('Hãy bôi đen (chọn) một đoạn văn trong editor trước!'); return; }
    setAiLoading(true); setBuddyResult(''); setBuddyAction(action);
    try {
      const prompts: Record<string, string> = {
        next: `Hãy viết đoạn văn tiếp theo cho đoạn này, giữ phong cách và chủ đề (tiếng Việt):\n"${selected}"\n\nChỉ trả về đoạn văn mới, không có giải thích.`,
        fix: `Sửa lỗi ngữ pháp, chính tả và cải thiện văn phong cho đoạn sau (tiếng Việt, phong cách báo chí):\n"${selected}"\n\nChỉ trả về văn bản đã chỉnh sửa, không có giải thích hay so sánh.`,
        humor: `Viết lại đoạn sau với giọng văn hài hước, nhẹ nhàng nhưng vẫn giữ thông tin cốt lõi (tiếng Việt):\n"${selected}"\n\nChỉ trả về đoạn văn đã viết lại, không có giải thích.`,
      };
      const result = await callGemini(prompts[action]);
      setBuddyResult(result.replace(/<(?!br|p|b|i|strong|em|u)[^>]+>/gi, '').trim());
    } catch (err: any) {
      setBuddyResult(`Lỗi: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const insertBuddyResult = async () => {
    if (!buddyResult || !editorRef.current) return;
    await editorRef.current.blocks.insert('paragraph', { text: buddyResult });
    const saved = await editorRef.current.save();
    onContentChange(blocksToHtml(saved.blocks));
    setBuddyResult('');
  };

  const tabs: { id: AiTab; label: string; emoji: string }[] = [
    { id: 'A', label: 'Dàn bài', emoji: '📝' },
    { id: 'B', label: 'Trả lời BL', emoji: '💬' },
    { id: 'C', label: 'Văn bản AI', emoji: '✨' },
  ];

  const buddyActions = [
    { key: 'next' as const, label: 'Viết đoạn tiếp theo', icon: '➕' },
    { key: 'fix' as const, label: 'Sửa lỗi & Cải thiện', icon: '🔧' },
    { key: 'humor' as const, label: 'Đổi giọng Hài hước', icon: '😄' },
  ];

  return (
    <div className="flex gap-0 relative">
      {aiLoading && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full border-4 border-[#e5e7eb] absolute" />
              <div className="w-14 h-14 rounded-full border-4 border-[#0059b2] border-t-transparent animate-spin absolute" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">✨</span>
            </div>
            <div className="text-center">
              <p className="font-black text-[15px] text-[#222]">Gemini AI đang xử lý...</p>
              <p className="text-[12px] text-gray-400 mt-1">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {loadError && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Lỗi tải Editor.js:</strong> {loadError}
          </div>
        )}
        {!ready && !loadError && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-[#0059b2] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px]">Đang tải Editor.js...</span>
          </div>
        )}
        <div
          ref={holderRef}
          className={`min-h-[480px] prose max-w-none px-4 py-2 ${!ready ? 'hidden' : ''}`}
          style={{ fontFamily: 'Roboto, sans-serif' }}
        />
        {ready && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-[#f8fbff] to-[#eef5ff] border-t border-blue-100">
            <div className="flex items-center gap-4 text-[12px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M5 8h14M5 16h4" /></svg>
                <strong className="text-[#0059b2]">{wordCount.toLocaleString()}</strong> từ
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <strong className="text-teal-600">{readingTime}</strong> phút đọc
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiPanelOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition border ${aiPanelOpen ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-[#0059b2] border-[#0059b2] hover:bg-blue-50'}`}
            >
              <span>✨</span> {aiPanelOpen ? 'Ẩn AI' : 'Mở AI Gemini'}
            </button>
          </div>
        )}
      </div>

      {aiPanelOpen && (
        <div className="w-[300px] xl:w-[340px] flex-shrink-0 border-l border-blue-100 bg-gradient-to-b from-[#f8fbff] to-white flex flex-col">
          <div className="px-4 py-3 bg-gradient-to-r from-[#01122e] to-[#0059b2] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="font-black text-[13px] leading-tight">Gemini AI Assistant</p>
                  <p className="text-white/60 text-[10px]">Powered by Google Gemini 2.5 Flash</p>
                </div>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="text-white/50 hover:text-white transition text-lg leading-none">×</button>
            </div>
            <div className="flex gap-1 mt-3">
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAiTab(t.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${aiTab === t.id ? 'bg-white text-[#0059b2]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiTab === 'A' && (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-black text-[#0059b2] uppercase mb-2">📝 Sinh Dàn Bài & Nội Dung</p>
                  <p className="text-[11px] text-gray-500 mb-3">Nhập chủ đề, Gemini sẽ tạo dàn bài chi tiết và tự động chèn vào editor.</p>
                </div>
                <textarea
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  placeholder="VD: Vai trò của Hải quân trong bảo vệ chủ quyền biển đảo Việt Nam..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-[12px] resize-none focus:outline-none focus:border-[#0059b2] bg-white"
                  rows={4}
                />
                <button
                  type="button"
                  onClick={handleGenerateOutline}
                  disabled={aiLoading || !topicInput.trim()}
                  className="w-full py-2.5 bg-[#0059b2] text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>✨</span> Tạo & Chèn Dàn Bài
                </button>
                {outlineResult && (
                  <div className={`p-3 rounded-xl text-[12px] font-bold ${outlineResult.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {outlineResult}
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Gợi ý chủ đề nhanh</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Tuần tra biển', 'Hiện đại hóa HQ', 'Diễn tập quân sự', 'Hợp tác quốc phòng'].map(s => (
                      <button key={s} type="button" onClick={() => setTopicInput(s)} className="px-2 py-1 bg-blue-50 text-[#0059b2] text-[10px] font-bold rounded-lg hover:bg-blue-100 transition border border-blue-100">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {aiTab === 'B' && (
              <div className="space-y-3">
                <p className="text-[11px] font-black text-[#0059b2] uppercase">💬 Phản hồi Bình Luận Độc Giả</p>
                <p className="text-[11px] text-gray-500">AI đọc nội dung bài viết và soạn câu trả lời chuyên nghiệp cho bình luận bên dưới.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">Đ</div>
                    <span className="text-[11px] font-bold text-gray-600">Độc giả</span>
                    <span className="text-[10px] text-gray-400 ml-auto">Mẫu bình luận</span>
                  </div>
                  <p className="text-[12px] text-gray-700 italic">"{commentText}"</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReply}
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-[#0059b2] text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>🤖</span> Tạo Câu Trả Lời
                </button>
                {replyOutput && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Câu trả lời được đề xuất:</p>
                    <textarea
                      value={replyOutput}
                      onChange={e => setReplyOutput(e.target.value)}
                      className="w-full border border-green-200 rounded-xl p-3 text-[12px] resize-none focus:outline-none focus:border-green-400 bg-green-50 text-gray-700"
                      rows={6}
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(replyOutput)}
                      className="w-full py-2 border border-green-300 text-green-700 text-[12px] font-bold rounded-xl hover:bg-green-50 transition"
                    >
                      📋 Sao chép câu trả lời
                    </button>
                  </div>
                )}
              </div>
            )}

            {aiTab === 'C' && (
              <div className="space-y-3">
                <p className="text-[11px] font-black text-[#0059b2] uppercase">✨ Trợ Lý Văn Bản Thông Minh</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-[11px] text-yellow-800">
                    <strong>Hướng dẫn:</strong> Bôi đen (chọn) một đoạn văn bất kỳ trong editor, sau đó nhấn một trong các nút bên dưới.
                  </p>
                </div>
                <div className="space-y-2">
                  {buddyActions.map(action => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => handleTextBuddy(action.key)}
                      disabled={aiLoading}
                      className={`w-full py-2.5 px-4 rounded-xl text-[13px] font-bold transition disabled:opacity-50 flex items-center gap-3 border ${
                        buddyAction === action.key && buddyResult
                          ? 'bg-[#0059b2] text-white border-[#0059b2]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#0059b2] hover:text-[#0059b2] hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-lg">{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
                {buddyResult && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Kết quả AI:</p>
                    <div className="bg-white border border-[#0059b2]/20 rounded-xl p-3 text-[12px] text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
                      {buddyResult}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={insertBuddyResult} className="flex-1 py-2 bg-[#0059b2] text-white text-[12px] font-bold rounded-xl hover:bg-blue-700 transition">
                        ➕ Chèn vào Editor
                      </button>
                      <button type="button" onClick={() => navigator.clipboard.writeText(buddyResult)} className="px-3 py-2 border border-gray-200 text-gray-600 text-[12px] font-bold rounded-xl hover:bg-gray-50 transition">
                        📋
                      </button>
                      <button type="button" onClick={() => setBuddyResult('')} className="px-3 py-2 border border-red-200 text-red-500 text-[12px] font-bold rounded-xl hover:bg-red-50 transition">
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-blue-100 px-4 py-3 bg-[#f8fbff]">
            <p className="text-[10px] text-gray-400 text-center">
              Gemini 2.5 Flash · AI có thể mắc lỗi, hãy kiểm tra lại nội dung
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
