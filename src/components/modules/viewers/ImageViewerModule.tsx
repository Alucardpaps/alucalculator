import React from 'react';

export const ImageViewerModule: React.FC = () => {
    return (
        <div className="h-full bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4">🖼️</div>
                <h2 className="text-xl font-bold">Image Viewer</h2>
                <p className="text-gray-400">Select an image from File Explorer to view.</p>
            </div>
        </div>
    );
};
