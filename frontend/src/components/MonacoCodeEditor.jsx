import { useEffect, useEffectEvent, useRef, useState } from 'react';

const MONACO_LOADER_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js';

const languageMap = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

const MonacoCodeEditor = ({ value, language, onChange, height = 320 }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const handleChange = useEffectEvent((nextValue) => {
    onChange(nextValue);
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await loadScript(MONACO_LOADER_URL);
        if (!window.require || cancelled) {
          setFallback(true);
          return;
        }

        window.require.config({
          paths: {
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs',
          },
        });

        window.require(['vs/editor/editor.main'], () => {
          if (cancelled || !containerRef.current) {
            return;
          }

          editorRef.current = window.monaco.editor.create(containerRef.current, {
            value,
            language: languageMap[language] || 'python',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            theme: 'vs',
            scrollBeyondLastLine: false,
            lineNumbersMinChars: 3,
          });

          editorRef.current.onDidChangeModelContent(() => {
            handleChange(editorRef.current.getValue());
          });
        });
      } catch {
        setFallback(true);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [language, value]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current && window.monaco) {
      window.monaco.editor.setModelLanguage(
        editorRef.current.getModel(),
        languageMap[language] || 'python'
      );
    }
  }, [language]);

  if (fallback) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm"
        style={{ minHeight: height }}
      />
    );
  }

  return <div ref={containerRef} className="w-full overflow-hidden rounded-2xl border border-slate-200" style={{ height }} />;
};

export default MonacoCodeEditor;
