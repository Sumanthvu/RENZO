import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const extractText = (node) => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
};

const GrokCodeBlock = ({ children, ...rest }) => {
  const [copied, setCopied] = useState(false);
  const codeEl = Array.isArray(children) ? children[0] : children;
  const rawClassName = codeEl?.props?.className || '';
  const language = rawClassName
    .split(' ')
    .find((item) => item.startsWith('language-'))
    ?.replace('language-', '') || '';
  const displayLang = language || 'code';
  const rawCode = extractText(codeEl?.props?.children);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d1017]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b24] border-b border-white/[0.08]">
        <span className="text-[12px] font-mono text-gray-400 select-none">{displayLang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="overflow-x-auto px-4 py-3.5">
        <pre className="m-0 text-[13.5px] leading-[1.6] font-mono whitespace-pre" {...rest}>{children}</pre>
      </div>
    </div>
  );
};

export const mdComponents = {
  pre: GrokCodeBlock,
  p: ({ children }) => <p className="my-5 leading-[1.9] text-gray-100 whitespace-pre-line">{children}</p>,
  ul: ({ children }) => <ul className="my-5 pl-6 space-y-2.5 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-5 pl-6 space-y-3 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.85]">{children}</li>,
  h1: ({ children }) => <h1 className="mt-8 mb-4 text-[24px] font-semibold text-white leading-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-7 mb-3.5 text-[21px] font-semibold text-white leading-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-3 text-[18px] font-semibold text-white leading-tight">{children}</h3>,
  blockquote: ({ children }) => <blockquote className="my-5 border-l-2 border-white/20 pl-4 text-gray-300 italic">{children}</blockquote>,
};

export const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text || '').catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-all"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};
