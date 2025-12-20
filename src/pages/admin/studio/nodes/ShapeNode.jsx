import React, { memo } from 'react';
// @ts-ignore
import { Handle, Position, NodeResizer } from '@xyflow/react';

const ShapeNode = ({ data, selected }) => {
    const { type = 'rectangle', color = '#e2e8f0', label } = data;
    const borderRadius = type === 'circle' ? '50%' : '4px';

    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} />
            <div
                style={{
                    background: color,
                    borderRadius: borderRadius,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #94a3b8',
                }}
            >
                {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
            </div>

            {/* Handles to allow connecting to shapes */}
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400" />
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400" />
            <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-400" />
            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-gray-400" />
        </>
    );
};

export default memo(ShapeNode);
