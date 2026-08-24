import React from 'react';

export const BrowserModule: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-2 border-b flex gap-2">
                <button className="px-2">⬅️</button>
                <button className="px-2">➡️</button>
                <input className="flex-1 border rounded px-2" value="https://google.com" readOnly />
            </div>
            <iframe src="https://www.bing.com" className="flex-1 w-full border-0" title="Browser" />
        </div>
    );
};
