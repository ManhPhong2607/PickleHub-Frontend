'use client';

import React from 'react';

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

export default function BlogContentRenderer({ content, className = '' }: BlogContentRendererProps) {
  if (!content) return null;

  // T�ch n?i dung th�nh c�c do?n/kh?i d? render chu?n x�c
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: number) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="space-y-2 my-4 pl-2">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInlineStyles = (text: string) => {
    // X? l� **bold**
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, idx) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          return (
            <a
              key={idx}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-500 underline underline-offset-4 font-semibold"
            >
              {linkMatch[1]}
            </a>
          );
        }
      }
      return part;
    });
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // D�ng tr?ng
    if (!line) {
      flushList(idx);
      return;
    }

    // 1. Ki?m tra Video (HTML <video>, URL mp4, ho?c Youtube)
    const videoTagMatch = line.match(/<video[^>]*src=["']([^"']+)["'][^>]*>/i);
    const youtubeMatch = line.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    const directVideoMatch = line.match(/^(https?:\/\/[^\s]+(?:\.mp4|\.webm|\.mov)(?:\?[^\s]*)?)$/i);

    if (videoTagMatch || directVideoMatch) {
      flushList(idx);
      const videoSrc = videoTagMatch ? videoTagMatch[1] : directVideoMatch![1];
      elements.push(
        <div key={`video-${idx}`} className="my-6 rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800 bg-black">
          <video
            controls
            src={videoSrc}
            className="w-full max-h-[520px] object-contain mx-auto"
            preload="metadata"
          >
            Tr�nh duy?t c?a b?n kh�ng h? tr? ph�t video.
          </video>
        </div>
      );
      return;
    }

    if (youtubeMatch) {
      flushList(idx);
      const videoId = youtubeMatch[1];
      elements.push(
        <div key={`yt-${idx}`} className="my-6 rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800 aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video b�i vi?t"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      );
      return;
    }

    // 2. Ki?m tra H�nh ?nh (Markdown ![alt](url) ho?c HTML <img>)
    const mdImageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    const htmlImgMatch = line.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']?([^"'>]*)["']?[^>]*>/i);

    if (mdImageMatch || htmlImgMatch) {
      flushList(idx);
      const imgSrc = mdImageMatch ? mdImageMatch[2] : htmlImgMatch![1];
      const imgAlt = mdImageMatch ? mdImageMatch[1] : (htmlImgMatch![2] || 'H�nh ?nh minh h?a');

      elements.push(
        <figure key={`img-${idx}`} className="my-6 space-y-2">
          <div className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-800">
            <img
              src={imgSrc}
              alt={imgAlt}
              className="w-full max-h-[550px] object-cover hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
          </div>
          {imgAlt && imgAlt !== 'H�nh ?nh' && (
            <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 italic">
              {imgAlt}
            </figcaption>
          )}
        </figure>
      );
      return;
    }

    // 3. Ti�u d? (Headings)
    if (line.startsWith('# ')) {
      flushList(idx);
      elements.push(
        <h1 key={`h1-${idx}`} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-8 mb-4 font-display">
          {line.slice(2)}
        </h1>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList(idx);
      elements.push(
        <h2 key={`h2-${idx}`} className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-8 mb-3 font-display flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block" />
          <span>{line.slice(3)}</span>
        </h2>
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushList(idx);
      elements.push(
        <h3 key={`h3-${idx}`} className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    // 4. Tr�ch d?n (Blockquote)
    if (line.startsWith('> ')) {
      flushList(idx);
      elements.push(
        <blockquote key={`quote-${idx}`} className="border-l-4 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 rounded-r-2xl my-4 text-slate-700 dark:text-slate-300 italic text-sm">
          {renderInlineStyles(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // 5. Danh s�ch d?u g?ch d?u d�ng (* ho?c -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
          <span className="leading-relaxed">{renderInlineStyles(line.slice(2))}</span>
        </li>
      );
      return;
    }

    // 6. �o?n van b?n th�ng thu?ng (Paragraph)
    flushList(idx);
    elements.push(
      <p key={`p-${idx}`} className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed my-3 font-normal">
        {renderInlineStyles(line)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
