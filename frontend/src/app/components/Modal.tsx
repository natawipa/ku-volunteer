"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { X, Trash2, UserRoundCheck } from "lucide-react";

interface ModalConfig {
    text: string;
    needDecision: boolean;
    icon?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    time?: number;
    width?: string;
}

// Context for managing modal state globally
const ModalContext = createContext<{
    show: (config: ModalConfig) => void;
    hide: () => void;
} | null>(null);

// Provider component
export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ModalConfig>({
        text: '',
        needDecision: false,
    });

    const show = (newConfig: ModalConfig) => {
        setConfig(newConfig);
        setIsOpen(true);
    };

    const hide = () => {
        setIsOpen(false);
    };

    return (
        <ModalContext.Provider value={{ show, hide }}>
            {children}
            {isOpen && <ModalContent {...config} onClose={hide} />}
        </ModalContext.Provider>
    );
}

// Hook to use modal
export function useModal() {
    const context = useContext(ModalContext);
    
    // Return no-op functions if not within provider (for backward compatibility)
    if (!context) {
        console.warn('useModal is being used outside of ModalProvider. Modal will not work.');
        return {
            showModal: (text: string) => {
                console.warn('Modal not available:', text);
            },
            hideModal: () => {
                console.warn('Modal not available');
            },
        };
    }

    return {
        showModal: (text: string, options?: Partial<ModalConfig>) => {
            context.show({
                text,
                needDecision: false,
                ...options,
            });
        },
        hideModal: context.hide,
    };
}

// modal content component
function ModalContent({ 
    needDecision, 
    text, 
    onConfirm, 
    onCancel, 
    time = 4000, 
    width = "500px", 
    icon,
    onClose 
}: ModalConfig & { onClose: () => void }) {
    // Auto-dismiss after specified time if no decision needed
    useEffect(() => {
        if (!needDecision) {
            const timer = setTimeout(() => {
                onConfirm?.();
                onClose();
            }, time);

            return () => clearTimeout(timer);
        }
    }, [needDecision, onConfirm, time, onClose]);
    
    const handleClose = () => {
        onConfirm?.();
        onClose();
    };

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    // Success/Info Modal
    if (!needDecision) {
        return (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slideDown">
                <div 
                    className="bg-[#E8F5E9] rounded-lg shadow-lg px-6 py-4 border border-[#A5D6A7] relative flex items-center justify-between gap-4" 
                    style={{ minWidth: width }}
                >
                    <p className="text-gray-900 font-medium text-base flex-1">{text}</p>
                    <button
                        onClick={handleClose}
                        className="text-gray-700 hover:text-gray-900 transition-colors flex-shrink-0"
                        aria-label="Close"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    }

    // Confirmation Modal (needs decision)
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div 
                className="bg-[#D4E7D7] rounded-3xl shadow-2xl px-10 py-10 relative" 
                style={{ width: width }}
            >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    {icon === "trash" && (
                        <div className="bg-[#c6dcc8] rounded-full p-4">
                            <Trash2 size={36} className="text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                    {icon === "usercheck" && (
                        <div className="bg-[#c6dcc8] rounded-full p-4">
                            <UserRoundCheck size={36} className="text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                    {icon === "x" && (
                        <div className="bg-[#c6dcc8] rounded-full p-4">
                            <X size={36} className="text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                <p className="text-gray-900 font-medium text-xl text-center mb-4 mt-4 leading-relaxed">
                    {text}
                </p>

                <div className="flex justify-center gap-10">
                    <button
                        className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-medium hover:bg-gray-100 transition-colors border border-gray-200 text-base"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-6 py-3 bg-[#2D5016] text-white rounded-2xl font-medium hover:bg-[#1f3a0f] transition-colors text-base"
                        onClick={handleConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

// default export for backward compatibility
export default function Modal(props: ModalConfig) {
    return <ModalContent {...props} onClose={() => {}} />;
}