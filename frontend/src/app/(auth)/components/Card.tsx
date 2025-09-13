'use client';

import React from 'react';

export interface CardProps {
    title: string;
    children: React.ReactNode; }

const Card: React.FC<CardProps> = ({ title, children }) => {
    return (
        // Card box
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="flex flex-col items-center  mb-8">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute mt-11 w-35 h-35 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat bg-center z-10"></div>
                </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">{title}</h1>
            {children}
        </div>
    );
}

export default Card;