import React from 'react';

export const PDFViewerModule: React.FC = () => {
    return (
        <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <h2 className="text-xl font-bold text-gray-700">PDF Viewer</h2>
                <p>Select a PDF from File Explorer to view.</p>
            </div>
        </div>
    );
};
