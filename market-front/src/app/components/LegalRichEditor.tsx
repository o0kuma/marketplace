"use client";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
};

function ToolbarButton({ onClick, active, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
        active
          ? "bg-[var(--market-accent-subtle)] text-[var(--market-accent)]"
          : "text-[var(--market-text-muted)] hover:bg-[var(--market-accent-subtle)]/50 hover:text-[var(--market-text)]"
      }`}
    >
      {children}
    </button>
  );
}

interface LegalRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function LegalRichEditor({ value, onChange, placeholder }: LegalRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "내용을 입력하세요…",
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "legal-editor-prose min-h-[280px] max-w-none px-3 py-2 text-sm text-[var(--market-text)] focus:outline-none [&_a]:text-[var(--market-accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--market-border)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--market-text-muted)] [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value || "<p></p>";
    const current = editor.getHTML();
    if (incoming === current) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-xl border border-[var(--market-border)] bg-[var(--market-surface)] animate-pulse" />
    );
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = typeof window !== "undefined" ? window.prompt("링크 URL", prev ?? "https://") : null;
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[var(--market-border)] bg-[var(--market-surface)] shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--market-border)] bg-[var(--market-bg)]/80 px-2 py-1.5">
        <ToolbarButton
          title="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          title="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          title="밑줄"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-[var(--market-border)]" aria-hidden />
        <ToolbarButton
          title="제목 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="제목 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-[var(--market-border)]" aria-hidden />
        <ToolbarButton
          title="글머리 목록"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          • 목록
        </ToolbarButton>
        <ToolbarButton
          title="번호 목록"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          1. 목록
        </ToolbarButton>
        <ToolbarButton
          title="인용"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          “ ”
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-[var(--market-border)]" aria-hidden />
        <ToolbarButton title="링크" onClick={setLink} active={editor.isActive("link")}>
          링크
        </ToolbarButton>
        <ToolbarButton
          title="구분선"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ─
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-[var(--market-border)]" aria-hidden />
        <ToolbarButton title="실행 취소" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          ↺
        </ToolbarButton>
        <ToolbarButton title="다시 실행" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          ↻
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
