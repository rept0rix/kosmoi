import React, { memo, useState } from 'react';
// @ts-ignore
import { Handle, Position, useReactFlow } from '@xyflow/react';

const TextNode = ({ id, data }) => {
    const { updateNodeData } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);

    // Use data.text directly, or fallback
    const text = data.text || 'Text Block';

    const onTextChange = (evt) => {
        updateNodeData(id, { text: evt.target.value });
    };

    return (
        <div className="min-w-[100px] min-h-[40px] relative group">
            {isEditing ? (
                <textarea
                    autoFocus
                    className="w-full h-full bg-transparent outline-none resize border border-blue-400 rounded p-1 text-sm bg-white/50 backdrop-blur"
                    value={text}
                    onChange={onTextChange}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => {
                        // Allow shift+enter for newlines, enter to submit
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setIsEditing(false);
                        }
                    }}
                    style={{ minHeight: '60px' }}
                />
            ) : (
                <div
                    onDoubleClick={() => setIsEditing(true)}
                    className="w-full h-full p-2 cursor-text hover:border hover:border-blue-200 rounded whitespace-pre-wrap text-sm"
                >
                    {text}
                </div>
            )}

            {/* Connection handles visible on hover */}
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

export default memo(TextNode);
