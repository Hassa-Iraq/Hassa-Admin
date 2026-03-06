'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function PhoneCodeSelect({
  name,
  value,
  options,
  onChange,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(
    () => options.find((item) => item.value === value) || options[0],
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    const scored = options
      .map((option) => {
        const searchable = `${option.code} ${option.value}`.toLowerCase();
        if (!searchable.includes(q)) return null;
        const score = searchable.startsWith(q) ? 0 : 1;
        return { option, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.option.value.localeCompare(b.option.value));

    return scored.map((item) => item.option);
  }, [options, query]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const timeoutId = setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [open]);

  const handlePick = (nextValue) => {
    onChange?.({ target: { name, value: nextValue } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-1 rounded-l-lg border border-r-0 border-gray-200 bg-[#F9FAFB] px-1.5 py-2 text-[11px] text-gray-700"
      >
        <span className="flex items-center gap-1 whitespace-nowrap">
          <img
            src={selected.flagUrl}
            alt={selected.code}
            className="h-3 w-4 rounded-[2px] object-cover"
          />
          <span>{selected.code}</span>
          <span>{selected.value}</span>
        </span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-1.5">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code..."
              className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-auto">
            {filteredOptions.length === 0 && (
              <p className="px-2 py-2 text-[11px] text-gray-500">No code found</p>
            )}
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePick(option.value)}
                className={`flex w-full items-center gap-1.5 whitespace-nowrap px-2 py-2 text-left text-[11px] hover:bg-purple-50 ${
                  option.value === value ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                }`}
              >
                <img
                  src={option.flagUrl}
                  alt={option.code}
                  className="h-3 w-4 rounded-[2px] object-cover"
                />
                <span>{option.code}</span>
                <span>{option.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
