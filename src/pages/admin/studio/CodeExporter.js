/**
 * Converts ReactFlow nodes into React code.
 */
export const CodeExporter = {
    /**
     * @param {Array} nodes - ReactFlow nodes
     * @returns {string} - Generated React Code
     */
    generateCode(nodes) {
        if (!nodes || nodes.length === 0) return "// No nodes to export";

        let jsxContent = "";

        // Sort nodes by Y position to approximate DOM order
        const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

        sortedNodes.forEach(node => {
            const { position, data, type } = node;
            const style = `left: ${parseInt(position.x)}px; top: ${parseInt(position.y)}px; position: 'absolute'`;

            if (type === 'text') {
                jsxContent += `
      <div style={{ ${style}, fontSize: '${data.fontSize}', color: '${data.color}' }}>
        ${data.text}
      </div>`;
            } else if (type === 'shape' && data.type === 'rectangle') {
                jsxContent += `
      <div style={{ 
        ${style}, 
        width: '${data.width}px', 
        height: '${data.height}px', 
        backgroundColor: '${data.backgroundColor}',
        borderRadius: '${data.borderRadius || '0px'}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '${data.color || 'inherit'}'
      }}>
        ${data.label || ''}
      </div>`;
            } else if (type === 'live-screen') {
                jsxContent += `
      <LiveScreen id="${data.screenId}" style={{ ${style} }} />`;
            }
        });

        return `import React from 'react';

export default function GeneratedComponent() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#f8fafc' }}>
      ${jsxContent}
    </div>
  );
}`;
    }
};
