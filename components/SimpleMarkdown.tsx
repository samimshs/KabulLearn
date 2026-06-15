import type { ReactNode } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function SimpleMarkdown({ content, style }: { content: string; style?: React.CSSProperties }) {
  const lines = content.split(/\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) return;
    const items = listItems.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>);
    blocks.push(
      listType === "ol" ? (
        <ol key={`ol-${blocks.length}`} className="list-decimal space-y-2 ps-5">{items}</ol>
      ) : (
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-2 ps-5">{items}</ul>
      )
    );
    listItems = [];
    listType = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(<h3 key={blocks.length} className="text-xl font-[800] text-[var(--ink)]">{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(<h2 key={blocks.length} className="text-2xl font-[800] text-[var(--ink)]">{renderInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push(<h1 key={blocks.length} className="text-3xl font-[800] text-[var(--ink)]">{renderInline(trimmed.slice(2))}</h1>);
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
    } else {
      flushList();
      blocks.push(<p key={blocks.length}>{renderInline(trimmed)}</p>);
    }
  }

  flushList();

  return <div className="space-y-4 text-sm font-[500] leading-7 text-[var(--muted)]" style={style}>{blocks}</div>;
}
