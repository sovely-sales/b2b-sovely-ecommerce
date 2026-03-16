import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans selection:bg-accent/30">
            <div className="flex flex-col items-center gap-6 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
                <svg
                    width="60"
                    height="60"
                    viewBox="0 0 50 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-lg"
                >
                    <circle cx="25" cy="25" r="20" className="stroke-slate-200" strokeWidth="4" />
                    <circle
                        cx="25"
                        cy="25"
                        r="20"
                        className="stroke-accent animate-spin origin-center"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="125"
                        strokeDashoffset="100"
                    />
                </svg>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Loading Sovely...</h2>
            </div>
        </div>
    );
};

export default LoadingScreen;