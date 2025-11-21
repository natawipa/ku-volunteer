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
    width?: string | number;
    dataTestId?: string;
}

const ModalContext = createContext<{
    show: (config: ModalConfig) => void;
    hide: () => void;
} | null>(null);

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
        setTimeout(() => {
            setConfig({ text: '', needDecision: false });
        }, 300);
    };

    return (
        <ModalContext.Provider value={{ show, hide }}>
            {children}
            {isOpen && config.text && <ModalContent {...config} onClose={hide} />}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    
    if (!context) {
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

function ModalContent({ 
    needDecision, 
    text, 
    onConfirm, 
    onCancel, 
    time = 4000, 
    icon,
    onClose,
    width,
    dataTestId
}: ModalConfig & { onClose: () => void }) {
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

    if (!needDecision) {
        return (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-9999 animate-slideDown">
                <div 
                    className="bg-[#E8F5E9] rounded-lg shadow-lg px-6 py-4 border border-[#A5D6A7] relative flex items-center justify-between gap-4" 
                    style={{ minWidth: width }}
                    data-testid={dataTestId}
                >
                    <p className="text-gray-900 font-medium text-sm sm:text-base flex-1 break-words">{text}</p>
                    <button
                        onClick={handleClose}
                        className="text-gray-700 hover:text-gray-900 transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div 
                className="bg-[#D4E7D7] rounded-3xl shadow-2xl px-6 sm:px-10 py-8 sm:py-10 relative w-full max-w-md sm:max-w-lg"
            >
                <div className="flex justify-center mb-4">
                    {icon === "trash" && (
                        <div className="bg-[#c6dcc8] rounded-full p-3 sm:p-4">
                            <Trash2 size={32} className="sm:w-9 sm:h-9 text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                    {icon === "usercheck" && (
                        <div className="bg-[#c6dcc8] rounded-full p-3 sm:p-4">
                            <UserRoundCheck size={32} className="sm:w-9 sm:h-9 text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                    {icon === "x" && (
                        <div className="bg-[#c6dcc8] rounded-full p-3 sm:p-4">
                            <X size={32} className="sm:w-9 sm:h-9 text-[#2D5016]" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                <p className="text-gray-900 font-medium text-base sm:text-xl text-center mb-6 sm:mb-4 mt-4 leading-relaxed px-2">
                    {text}
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-10">
                    <button
                        className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 rounded-2xl font-medium hover:bg-gray-100 transition-colors border border-gray-200 text-base order-2 sm:order-1"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="w-full sm:w-auto px-6 py-3 bg-[#2D5016] text-white rounded-2xl font-medium hover:bg-[#1f3a0f] transition-colors text-base order-1 sm:order-2"
                        onClick={handleConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Modal(props: ModalConfig) {
    return <ModalContent {...props} onClose={() => {}} />;
}