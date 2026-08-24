'use client';

import React, { memo, useState } from 'react';
import BaseNode from '../BaseNode';
import { Bot, Send, Image as ImageIcon } from 'lucide-react';

export default memo(({ id, data }: any) => {
    const [input, setInput] = useState('');

    return (
        <BaseNode id={id} data={{ title: "AI CO-PILOT (BYOK)", ...data }}>
            <div className="h-[250px] flex flex-col gap-2">
                {/* Chat Area */}
                <div className="flex-1 bg-[#111] rounded border border-[#333] p-2 overflow-y-auto text-[10px] space-y-2">
                    <div className="bg-[#252526] p-2 rounded-lg rounded-tl-none max-w-[90%] self-start text-gray-300">
                        Hello. I am your engineering assistant. Upload a technical drawing or ask about material properties.
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                    <button className="p-2 bg-[#252526] hover:bg-[#333] rounded text-gray-400">
                        <ImageIcon size={14} />
                    </button>
                    <input
                        className="flex-1 bg-[#111] border border-[#333] rounded px-2 py-1 text-xs outline-none focus:border-accent text-white"
                        placeholder="Ask about torque specs..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button className="p-2 bg-accent/20 hover:bg-accent/30 text-accent rounded">
                        <Send size={14} />
                    </button>
                </div>

                <div className="text-[8px] text-gray-600 text-center">
                    Running on Local Key (OpenAI/Gemini) • No Server Cost
                </div>
            </div>
        </BaseNode>
    );
});
