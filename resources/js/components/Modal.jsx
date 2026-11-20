import { FiX } from 'react-icons/fi';

export default function Modal({ title, onClose, wide = false, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:pt-16" onClick={onClose}>
            <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-3xl'} rounded-xl bg-white p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <FiX className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
