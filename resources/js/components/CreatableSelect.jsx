import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiPlus } from 'react-icons/fi';
import { api, ApiError } from '../api';
import { inputClass } from './ui';

const optionName = (option) => String(option?.name ?? '');

export const optionCode = (name, fallback = 'OPT', maxLength = 12) => {
    const clean =
        String(name)
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || fallback;

    const suffixLength = Math.min(4, Math.max(2, Math.floor(maxLength / 3)));
    const separator = maxLength >= 5 ? '-' : '';
    const slugLength = Math.max(1, maxLength - suffixLength - separator.length);
    const slug = clean.slice(0, slugLength);
    const suffix = Math.random().toString(36).slice(2, 2 + suffixLength).toUpperCase();

    return `${slug}${separator}${suffix}`.slice(0, maxLength);
};

export default function CreatableSelect({
    value,
    onChange,
    options,
    endpoint,
    canCreate = false,
    createPayload = (name) => ({ name }),
    onCreated,
    placeholder = 'Select…',
    disabled = false,
    required = false,
    invalid = false,
    className = '',
}) {
    const containerRef = useRef(null);
    const selected = options.find((option) => String(option.id) === String(value));
    const selectedName = optionName(selected);
    const [query, setQuery] = useState(selectedName);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setQuery(selectedName);
        }
    }, [selectedName, isOpen]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setQuery(selectedName);
                setError('');
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [selectedName]);

    const normalizedQuery = query.trim().toLowerCase();
    const filteredOptions = normalizedQuery
        ? options.filter((option) => optionName(option).toLowerCase().includes(normalizedQuery))
        : options;
    const exactMatch = options.find(
        (option) => optionName(option).toLowerCase() === normalizedQuery,
    );
    const showCreate = canCreate && normalizedQuery && !exactMatch;

    const choose = (option) => {
        onChange(option ? option.id : '');
        setQuery(optionName(option));
        setIsOpen(false);
        setError('');
    };

    const create = async () => {
        const name = query.trim();
        if (!name || isCreating) return;

        setIsCreating(true);
        setError('');

        try {
            const response = await api(endpoint, {
                method: 'POST',
                body: createPayload(name),
            });
            const created = response?.data;

            if (!created?.id) {
                throw new ApiError('Could not create the option.', 500);
            }

            onCreated?.(created);
            choose(created);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Could not create the option.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
            setQuery(selectedName);
            return;
        }

        if (event.key !== 'Enter') return;

        event.preventDefault();

        if (showCreate) {
            create();
        } else if (exactMatch) {
            choose(exactMatch);
        } else if (filteredOptions.length) {
            choose(filteredOptions[0]);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    className={`${inputClass} pr-9 ${invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : ''} ${disabled ? 'cursor-not-allowed bg-slate-50' : ''}`}
                    value={query}
                    placeholder={selectedName || placeholder}
                    disabled={disabled}
                    required={required}
                    onFocus={() => {
                        if (disabled) return;
                        setQuery('');
                        setIsOpen(true);
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(null)}
                        className="flex w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                    >
                        — None —
                    </button>

                    {filteredOptions.map((option) => {
                        const isSelected = String(option.id) === String(value);

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => choose(option)}
                                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}
                            >
                                <span className="truncate">{option.name}</span>
                                {isSelected && <FiCheck className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                        );
                    })}

                    {showCreate && (
                        <button
                            type="button"
                            disabled={isCreating}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={create}
                            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
                        >
                            <FiPlus className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {isCreating
                                    ? 'Creating…'
                                    : `Create “${query.trim()}”`}
                            </span>
                        </button>
                    )}

                    {!filteredOptions.length && !showCreate && (
                        <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
                    )}

                    {error && (
                        <p className="border-t border-red-100 px-3 py-2 text-xs text-red-600">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
