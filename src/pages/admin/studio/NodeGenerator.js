/**
 * Converts AI-generated UI components into ReactFlow nodes.
 */
export const NodeGenerator = {
    /**
     * @param {Array} components - JSON components from Gemini
     * @param {Object} canvasDimensions - { width, height } of the target area (approx)
     * @returns {Array} - ReactFlow nodes
     */
    generateNodes(components, canvasDimensions = { width: 1024, height: 768 }) {
        if (!Array.isArray(components)) return [];

        return components.map((comp, index) => {
            const id = `gen-${Date.now()}-${index}`;

            // Calculate position based on percentage if provided, or default
            let x = 0;
            let y = 0;

            if (comp.position) {
                x = (comp.position.x / 100) * canvasDimensions.width;
                y = (comp.position.y / 100) * canvasDimensions.height;
            }

            // Map types
            if (comp.type === 'text' || comp.type === 'label') {
                return {
                    id,
                    type: 'text',
                    position: { x, y },
                    data: {
                        text: comp.label || 'Text',
                        fontSize: comp.style?.fontSize || '16px',
                        color: comp.style?.color || '#000000'
                    }
                };
            }

            if (comp.type === 'button') {
                return {
                    id,
                    type: 'shape',
                    position: { x, y },
                    data: {
                        type: 'rectangle',
                        label: comp.label || 'Button',
                        width: 120, // Default button width
                        height: 40,
                        backgroundColor: comp.style?.backgroundColor || '#3b82f6', // Blue default
                        color: '#ffffff',
                        borderRadius: '6px'
                    }
                };
            }

            if (comp.type === 'input') {
                return {
                    id,
                    type: 'shape',
                    position: { x, y },
                    data: {
                        type: 'rectangle',
                        label: comp.label || 'Input',
                        width: 200,
                        height: 40,
                        backgroundColor: '#ffffff',
                        borderColor: '#cccccc',
                        borderWidth: '1px',
                        borderRadius: '4px',
                        color: '#999999'
                    }
                };
            }

            if (comp.type === 'card' || comp.type === 'container') {
                return {
                    id,
                    type: 'shape',
                    position: { x, y },
                    data: {
                        type: 'rectangle',
                        label: '',
                        width: comp.style?.width ? parseInt(comp.style.width) : 300,
                        height: comp.style?.height ? parseInt(comp.style.height) : 200,
                        backgroundColor: comp.style?.backgroundColor || '#ffffff',
                        borderColor: '#e2e8f0',
                        borderWidth: '1px',
                        shadow: 'sm'
                    },
                    style: { zIndex: -1 } // Put containers in back
                };
            }

            // Default fallback
            return {
                id,
                type: 'shape',
                position: { x, y },
                data: {
                    type: 'rectangle',
                    label: comp.label || comp.type,
                    width: 100,
                    height: 100,
                    backgroundColor: '#eeeeee'
                }
            };
        });
    }
};
