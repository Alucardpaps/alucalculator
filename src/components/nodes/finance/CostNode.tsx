'use client';

import React, { memo } from 'react';
import BaseNode from '../BaseNode';

export default memo(({ id, data }: any) => {
    return (
        <BaseNode id={id} data={{ title: "COST ESTIMATOR", ...data }}>
            <div className="flex flex-col gap-3">
                <div className="text-gray-400 italic text-[10px]">
                    Waiting for mass input...
                </div>
                {/* In a real implementation, this would read from the 'data.inputs' prop populated by the graph engine */}
                <div className="flex justify-between items-center py-2 border-t border-[#333]">
                    <span>Total Cost</span>
                    <span className="text-lg font-bold text-green-400">$0.00</span>
                </div>
            </div>
        </BaseNode>
    );
});
