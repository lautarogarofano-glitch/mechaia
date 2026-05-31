import ReactMarkdown from 'react-markdown';
import type { ComponentPropsWithoutRef } from 'react';
import { PolicyLayout, usePolicyLang } from './PolicyLayout';
import { LEGAL_DOCS, CONTRACT_LAST_UPDATED, type LegalDocKey } from '../lib/legal';

const markdownComponents = {
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-xl font-semibold text-white mt-8 mb-3" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-base font-semibold text-slate-100 mt-6 mb-2" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => <p className="leading-relaxed" {...props} />,
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc pl-6 space-y-2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal pl-6 space-y-2" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-slate-100 font-semibold" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-blue-400 hover:underline" {...props} />
  ),
  hr: () => <hr className="border-slate-800 my-8" />,
};

export function LegalDoc({ docKey }: { docKey: LegalDocKey }) {
  const [lang, toggleLang] = usePolicyLang();
  const doc = LEGAL_DOCS[docKey];

  return (
    <PolicyLayout
      title={doc.title}
      lastUpdated={CONTRACT_LAST_UPDATED}
      lang={lang}
      onToggleLang={toggleLang}
    >
      {lang === 'en' && (
        <div className="border-l-4 border-amber-500/60 bg-amber-500/10 px-5 py-4 rounded-r-lg">
          <p className="text-amber-100/90 text-sm">
            This is a legally binding contract under the laws of Argentina. The Spanish text
            below is the official and binding version.
          </p>
        </div>
      )}
      <ReactMarkdown components={markdownComponents}>{doc.body}</ReactMarkdown>
    </PolicyLayout>
  );
}
