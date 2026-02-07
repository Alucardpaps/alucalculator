import React from 'react';

export const MediaPlayerModule: React.FC = () => {
    return (
        <div className="h-full bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4">🎥</div>
                <h2 className="text-xl font-bold">Media Player</h2>
                <p className="text-gray-400">Select a file from File Explorer to play.</p>
            </div>
        </div>
    );
};
