import React from 'react';

export const SpreadsheetViewerModule: React.FC = () => {
    return (
        <div className="h-full bg-white flex items-center justify-center">
            <div className="text-center text-green-700">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-xl font-bold">Spreadsheet Viewer</h2>
                <p className="text-gray-500">Select a spreadsheet from File Explorer.</p>
            </div>
        </div>
    );
};
