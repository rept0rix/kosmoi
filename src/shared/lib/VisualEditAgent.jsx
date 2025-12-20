import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge'

import VisualEditorUI from '@/components/admin/VisualEditorUI';
import { VisualEditService } from '@/services/admin/VisualEditService';

export default function VisualEditAgent() {
	// this functions job is to receive first a message from the parent window, to set or unset visual edits mode. 
	// once in visual edits mode, every hover over an elelmnt that has linenumbers should show an overlay, when clicked - it should stick the overlay and send a message to the parent window with the selected element
	// then, the parent window will have an editor, allow for changes to the tailwind css classes of the selected element, and send the updated css classes back to the iframe. 
	// the iframe will then update the css classes of the selected element.

	const location = useLocation();

	const layoutPresets = {
		// ... (keep existing presets)
		'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
		'grid-3': 'grid grid-cols-1 md:grid-cols-3 gap-4',
		'grid-4': 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4',
		'flex-row': 'flex flex-row items-center gap-4',
		'flex-col': 'flex flex-col gap-4',
		'card-container': 'p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800',
		'hero-section': 'py-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950',
		'dashboard-shell': 'flex h-screen bg-gray-50 dark:bg-slate-950',
		'sidebar-layout': 'w-64 border-r bg-white dark:bg-slate-900 dark:border-slate-800',
		'feature-section': 'py-16 px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center',
		'pricing-table': 'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto'
	};

	// State and refs
	// ... (keep existing refs)
	const [isVisualEditMode, setIsVisualEditMode] = useState(false);
	const isVisualEditModeRef = useRef(false);
	const [isPopoverDragging, setIsPopoverDragging] = useState(false);
	const isPopoverDraggingRef = useRef(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const isDropdownOpenRef = useRef(false);
	const hoverOverlaysRef = useRef([]); // Multiple overlays for hover
	const selectedOverlaysRef = useRef([]); // Multiple overlays for selection
	const currentHighlightedElementsRef = useRef([]); // Multiple elements for hover
	const selectedElementIdRef = useRef(null); // Store the visual selector ID

	// Hydration Logic
	useEffect(() => {
		const loadEdits = async () => {
			// Avoid loading on admin pages or if we are in an iframe (if applicable)
			// For now, load everywhere
			try {
				const edits = await VisualEditService.fetchEditsForPage(location.pathname);
				if (edits && edits.length > 0) {
					console.log(`[VisualEditAgent] Hydrating ${edits.length} edits for ${location.pathname}`);
					edits.forEach(edit => {
						if (edit.edit_type === 'content') {
							updateElementContent(edit.selector_id, edit.value.text);
						} else if (edit.edit_type === 'style') {
							updateElementClasses(edit.selector_id, edit.value.classes, true); // replace=true to override
						}
					});
				}
			} catch (error) {
				console.warn('[VisualEditAgent] Failed to load edits (Table might not exist yet):', error);
			}
		};

		// Small delay to ensure DOM is ready
		const timer = setTimeout(loadEdits, 100);
		return () => clearTimeout(timer);
	}, [location.pathname]);


	// Create overlay element
	// ... (keep existing createOverlay)

	// ... (keep existing positionOverlay, findElementsById, clearHoverOverlays, handleMouseOver, etc.)
	// ... (skip lines to handleSave)



	// ... (rest of code)


	// Create overlay element
	const createOverlay = (isSelected = false) => {
		const overlay = document.createElement('div');
		overlay.style.position = 'absolute';
		overlay.style.pointerEvents = 'none';
		overlay.style.transition = 'all 0.1s ease-in-out';
		overlay.style.zIndex = '9999';

		// Use different styles for hover vs selected
		if (isSelected) {
			overlay.style.border = '2px solid #2563EB';
		} else {
			overlay.style.border = '2px solid #95a5fc';
			overlay.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
		}

		return overlay;
	};

	// Position overlay relative to element
	const positionOverlay = (overlay, element, isSelected = false) => {
		if (!element || !isVisualEditModeRef.current) return;

		// Force layout recalculation
		void element.offsetWidth;

		const rect = element.getBoundingClientRect();
		overlay.style.top = `${rect.top + window.scrollY}px`;
		overlay.style.left = `${rect.left + window.scrollX}px`; // weird bug with the offset
		overlay.style.width = `${rect.width}px`;
		overlay.style.height = `${rect.height}px`;

		// Check if label already exists in overlay
		let label = overlay.querySelector('div');

		if (!label) {
			// Create new label if it doesn't exist
			label = document.createElement('div');
			label.textContent = element.tagName.toLowerCase();
			label.style.position = 'absolute';
			label.style.top = '-27px';
			label.style.left = '-2px';
			label.style.padding = '2px 8px';
			label.style.fontSize = '11px';
			label.style.fontWeight = isSelected ? '500' : '400';
			label.style.color = isSelected ? '#ffffff' : '#526cff';
			label.style.backgroundColor = isSelected ? '#526cff' : '#DBEAFE';
			label.style.borderRadius = '3px';
			label.style.boxShadow = isSelected ? 'none' : 'none';
			label.style.minWidth = '24px';
			label.style.textAlign = 'center';
			overlay.appendChild(label);
		}
		// If label exists, we preserve its existing styling (don't recreate or modify)
	};

	// Find elements by ID - first try data-source-location, fallback to data-visual-selector-id
	const findElementsById = (id, _useSourceLocation) => {
		if (!id) return [];
		const sourceElements = Array.from(document.querySelectorAll(`[data-source-location="${id}"]`));
		if (sourceElements.length > 0) {
			return sourceElements;
		}
		return Array.from(document.querySelectorAll(`[data-visual-selector-id="${id}"]`));
	};

	// Clear hover overlays
	const clearHoverOverlays = () => {
		hoverOverlaysRef.current.forEach(overlay => {
			if (overlay && overlay.parentNode) {
				overlay.remove();
			}
		});
		hoverOverlaysRef.current = [];
		currentHighlightedElementsRef.current = [];
	};

	// Handle mouse over event
	const handleMouseOver = (e) => {
		if (!isVisualEditModeRef.current || isPopoverDraggingRef.current) return;

		// Prevent hover effects when a dropdown is open
		if (isDropdownOpenRef.current) {
			clearHoverOverlays();
			return;
		}

		// Prevent hover effects on SVG path elements
		if (e.target.tagName.toLowerCase() === 'path') {
			clearHoverOverlays();
			return;
		}

		// Support both data-source-location and data-visual-selector-id
		const element = e.target.closest('[data-source-location], [data-visual-selector-id]');
		if (!element) {
			clearHoverOverlays();
			return;
		}

		// Prefer data-source-location, fallback to data-visual-selector-id  
		const selectorId = element.dataset.sourceLocation || element.dataset.visualSelectorId;
		const useSourceLocation = !!element.dataset.sourceLocation;

		// Skip if this element is already selected
		if (selectedElementIdRef.current === selectorId) {
			clearHoverOverlays();
			return;
		}

		// Find all elements with the same ID
		const elements = findElementsById(selectorId, useSourceLocation);

		// Clear previous hover overlays
		clearHoverOverlays();

		// Create overlays for all matching elements
		elements.forEach(el => {
			const overlay = createOverlay(false);
			document.body.appendChild(overlay);
			hoverOverlaysRef.current.push(overlay);
			positionOverlay(overlay, el);
		});

		currentHighlightedElementsRef.current = elements;
	};

	// Handle mouse out event
	const handleMouseOut = () => {
		if (isPopoverDraggingRef.current) return;
		clearHoverOverlays();
	};

	const [selectedElementData, setSelectedElementData] = useState(null);

	// Handle element click
	const handleElementClick = (e) => {
		if (!isVisualEditModeRef.current) return;

		// Close dropdowns when clicking anywhere in iframe if a dropdown is open
		if (isDropdownOpenRef.current) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			// Send message to parent to close all dropdowns
			window.parent.postMessage({
				type: 'close-dropdowns'
			}, '*');
			return;
		}

		// Prevent clicking on SVG path elements
		if (e.target.tagName.toLowerCase() === 'path') {
			return;
		}

		// Prevent default behavior immediately when in visual edit mode
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		// Support both data-source-location and data-visual-selector-id
		const element = e.target.closest('[data-source-location], [data-visual-selector-id]');
		if (!element) {
			return;
		}

		// Prefer data-source-location, fallback to data-visual-selector-id
		const visualSelectorId = element.dataset.sourceLocation || element.dataset.visualSelectorId;
		const useSourceLocation = !!element.dataset.sourceLocation;

		// Clear any existing selected overlays
		selectedOverlaysRef.current.forEach(overlay => {
			if (overlay && overlay.parentNode) {
				overlay.remove();
			}
		});
		selectedOverlaysRef.current = [];

		// Find all elements with the same ID
		const elements = findElementsById(visualSelectorId, useSourceLocation);

		// Create selected overlays for all matching elements
		elements.forEach(el => {
			const overlay = createOverlay(true);
			document.body.appendChild(overlay);
			selectedOverlaysRef.current.push(overlay);
			positionOverlay(overlay, el, true);
		});

		selectedElementIdRef.current = visualSelectorId;

		// Clear hover overlays
		clearHoverOverlays();

		// Calculate element position for popover positioning
		const rect = element.getBoundingClientRect();
		const elementPosition = {
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
			centerX: rect.left + rect.width / 2,
			centerY: rect.top + rect.height / 2
		};

		const elementInfo = {
			tagName: element.tagName,
			classes: element.className?.baseVal || element.className || '',
			visualSelectorId: visualSelectorId,
			content: element.innerText,
			attributes: {
				src: element.src || '',
				alt: element.alt || '',
				href: element.getAttribute('href') || '' // getAttribute to avoid full URL if relative
			},
			dataSourceLocation: element.dataset.sourceLocation,
			isDynamicContent: element.dataset.dynamicContent === 'true',
			linenumber: element.dataset.linenumber, // Keep for backward compatibility
			filename: element.dataset.filename, // Keep for backward compatibility
			position: elementPosition // Add position data for popover
		};

		// Update Local UI State
		setSelectedElementData(elementInfo);

		// Send message to parent window with element info including position
		window.parent.postMessage({
			type: 'element-selected',
			...elementInfo
		}, '*');
	};

	const historyRef = useRef([]);
	const redoStackRef = useRef([]);

	const handleLocalUpdate = (updatedData, type) => {
		// Capture state for Undo before applying changes
		const currentData = selectedElementData;
		if (currentData) {
			historyRef.current.push({
				data: currentData, // Store the entire object for simplicity
				type: type
			});
			// Clear redo stack on new change
			redoStackRef.current = [];
		}

		// Optimistically update the DOM
		if (type === 'content') {
			updateElementContent(updatedData.visualSelectorId, updatedData.content);
		} else if (type === 'classes') {
			updateElementClasses(updatedData.visualSelectorId, updatedData.classes);
		} else if (type === 'attributes') {
			updateElementAttributes(updatedData.visualSelectorId, updatedData.attributes);
		}

		// Update local state to match
		setSelectedElementData(updatedData);
	};

	const handleUndo = () => {
		if (historyRef.current.length === 0) return;

		const previousState = historyRef.current.pop();
		// Push current state to redo
		if (selectedElementData) {
			redoStackRef.current.push({
				data: selectedElementData,
				type: previousState.type
			});
		}

		// Apply previous state
		const restoredData = previousState.data;
		if (previousState.type === 'content') {
			updateElementContent(restoredData.visualSelectorId, restoredData.content);
		} else if (previousState.type === 'classes') {
			updateElementClasses(restoredData.visualSelectorId, restoredData.classes, true); // replace=true
		} else if (previousState.type === 'attributes') {
			updateElementAttributes(restoredData.visualSelectorId, restoredData.attributes);
		}

		setSelectedElementData(restoredData);
	};

	const handleRedo = () => {
		if (redoStackRef.current.length === 0) return;

		const nextState = redoStackRef.current.pop();
		// Push current state to history
		if (selectedElementData) {
			historyRef.current.push({
				data: selectedElementData,
				type: nextState.type
			});
		}

		// Apply next state
		const restoredData = nextState.data;
		if (nextState.type === 'content') {
			updateElementContent(restoredData.visualSelectorId, restoredData.content);
		} else if (nextState.type === 'classes') {
			updateElementClasses(restoredData.visualSelectorId, restoredData.classes, true);
		} else if (nextState.type === 'attributes') {
			updateElementAttributes(restoredData.visualSelectorId, restoredData.attributes);
		}

		setSelectedElementData(restoredData);
	};



	// Unselect the current element
	const unselectElement = () => {
		// Clear selected overlays
		selectedOverlaysRef.current.forEach(overlay => {
			if (overlay && overlay.parentNode) {
				overlay.remove();
			}
		});
		selectedOverlaysRef.current = [];
		selectedElementIdRef.current = null;
		setSelectedElementData(null);
	};

	const handleSave = async () => {
		// Send save request to parent/backend
		console.log("Saving changes for:", selectedElementData);

		// Save using Service
		try {
			if (selectedElementData.content) {
				await VisualEditService.saveEdit({
					page_path: location.pathname,
					selector_id: selectedElementData.visualSelectorId,
					edit_type: 'content',
					value: { text: selectedElementData.content }
				});
			}

			if (selectedElementData.classes) {
				await VisualEditService.saveEdit({
					page_path: location.pathname,
					selector_id: selectedElementData.visualSelectorId,
					edit_type: 'style',
					value: { classes: selectedElementData.classes }
				});
			}

			if (selectedElementData.attributes && (selectedElementData.tagName === 'IMG' || selectedElementData.tagName === 'A')) {
				// Save attributes as 'attributes' type or specific types?
				// Let's use 'attributes' type for flexibility or map to specific ones.
				// The schema supports 'image' type, let's stick to generic 'attributes' or use 'image' / 'link' mapping if we strictly followed schema CHECK constraint.
				// Schema check constraint was: CHECK (edit_type IN ('content', 'style', 'image', 'component'))
				// So for IMG we use 'image'. For Link... we didn't add 'link'.
				// We should probably update the schema later or just piggyback on 'image' or allow 'style' to carry attributes? 
				// Wait, 'image' allows src/alt. What about 'link'?
				// I will add a 'link' type to the Service call, but if the DB constraint fails, I'll need to update DB.
				// Actually I control the service, I can save it as 'image' (for images) and maybe 'content' for links? No that's confusing.
				// Let's assume I can add 'link' or just use 'component' generic type.
				// Let's try 'component' for now since it is validated.

				let editType = 'component';
				if (selectedElementData.tagName === 'IMG') editType = 'image';

				await VisualEditService.saveEdit({
					page_path: location.pathname,
					selector_id: selectedElementData.visualSelectorId,
					edit_type: editType,
					value: selectedElementData.attributes
				});
			}

			console.log("Changes saved to Supabase!");
			// Toast or notification could go here
		} catch (error) {
			console.error("Failed to save changes:", error);
			// Fallback for demo: log to console
		}
	}

	// ... (existing useEffects)

	// Handle window resize (existing)

	// ...

	// Render the UI if we have a selected element
	if (selectedElementData && isVisualEditMode) {
		return (
			<div className="font-sans">
				<VisualEditorUI
					selectedElement={selectedElementData}
					onUpdate={handleLocalUpdate}
					onClose={unselectElement}
					onSave={handleSave}
					onUndo={handleUndo}
					onRedo={handleRedo}
					canUndo={historyRef.current.length > 0}
					canRedo={redoStackRef.current.length > 0}
				/>
			</div>
		)
	}



	// Update element classes by visual selector ID
	const updateElementClasses = (visualSelectorId, classes, replace = false) => {
		// Find all elements with the same visual selector ID
		const elements = findElementsById(visualSelectorId);

		if (elements.length === 0) {
			return;
		}

		// Update classes for all matching elements
		elements.forEach(element => {
			if (replace) {
				// For reverts, replace classes completely
				element.className = classes;
			} else {
				// For normal updates, merge with existing classes
				const currentClass = element.getAttribute('class') || '';
				element.className = twMerge(currentClass, classes);
			}
		});

		// Use a small delay to allow the browser to recalculate layout before repositioning
		setTimeout(() => {
			// Reposition selected overlays
			if (selectedElementIdRef.current === visualSelectorId) {
				selectedOverlaysRef.current.forEach((overlay, index) => {
					if (index < elements.length) {
						positionOverlay(overlay, elements[index]);
					}
				});
			}

			// Reposition hover overlays if needed
			if (currentHighlightedElementsRef.current.length > 0) {
				const hoveredId = currentHighlightedElementsRef.current[0]?.dataset?.visualSelectorId;
				if (hoveredId === visualSelectorId) {
					hoverOverlaysRef.current.forEach((overlay, index) => {
						if (index < currentHighlightedElementsRef.current.length) {
							positionOverlay(overlay, currentHighlightedElementsRef.current[index]);
						}
					});
				}
			}
		}, 50); // Small delay to ensure the browser has time to recalculate layout
	};

	// Update element content by visual selector ID
	const updateElementContent = (visualSelectorId, content) => {
		// Find all elements with the same visual selector ID
		const elements = findElementsById(visualSelectorId);

		if (elements.length === 0) {
			return;
		}

		// Update content for all matching elements
		elements.forEach((element) => {
			element.textContent = content;
		});

		// Use a small delay to allow the browser to recalculate layout before repositioning
		setTimeout(() => {
			// Reposition selected overlays
			if (selectedElementIdRef.current === visualSelectorId) {
				selectedOverlaysRef.current.forEach((overlay, index) => {
					if (index < elements.length) {
						positionOverlay(overlay, elements[index]);
					}
				});
			}
		}, 50); // Small delay to ensure the browser has time to recalculate layout
	};

	// Update element attributes by visual selector ID
	const updateElementAttributes = (visualSelectorId, attributes) => {
		const elements = findElementsById(visualSelectorId);
		if (elements.length === 0) return;

		elements.forEach(element => {
			if (attributes.src !== undefined && element.tagName === 'IMG') {
				element.setAttribute('src', attributes.src);
			}
			if (attributes.alt !== undefined && element.tagName === 'IMG') {
				element.setAttribute('alt', attributes.alt);
			}
			if (attributes.href !== undefined && element.tagName === 'A') {
				element.setAttribute('href', attributes.href);
			}
		});

		// Reposition could be needed if image size changes
		setTimeout(() => {
			// force update layout
			const event = new Event('resize');
			window.dispatchEvent(event);
		}, 100);
	};

	// Toggle visual edit mode
	const toggleVisualEditMode = (isEnabled) => {
		setIsVisualEditMode(isEnabled);
		isVisualEditModeRef.current = isEnabled;

		if (!isEnabled) {
			// Clear hover overlays
			clearHoverOverlays();

			// Clear selected overlays
			selectedOverlaysRef.current.forEach(overlay => {
				if (overlay && overlay.parentNode) {
					overlay.remove();
				}
			});
			selectedOverlaysRef.current = [];

			currentHighlightedElementsRef.current = [];
			selectedElementIdRef.current = null;
			document.body.style.cursor = 'default';

			// Remove event listeners
			document.removeEventListener('mouseover', handleMouseOver);
			document.removeEventListener('mouseout', handleMouseOut);
			document.removeEventListener('click', handleElementClick, true);
		} else {
			// Set cursor and add event listeners
			document.body.style.cursor = 'crosshair';
			document.addEventListener('mouseover', handleMouseOver);
			document.addEventListener('mouseout', handleMouseOut);
			document.addEventListener('click', handleElementClick, true); // Use capture mode
		}
	};

	// Listen for messages from parent window
	useEffect(() => {
		// Add IDs to elements that don't have them but have linenumbers
		const elementsWithLineNumber = Array.from(document.querySelectorAll('[data-linenumber]:not([data-visual-selector-id])'));
		elementsWithLineNumber.forEach((el, index) => {
			const filename = el.getAttribute('data-filename');
			const linenumber = el.getAttribute('data-linenumber');
			const id = `visual-id-${filename}-${linenumber}-${index}`;
			el.setAttribute('data-visual-selector-id', id);
		});

		// Handle scroll events to update popover position
		const handleScroll = () => {
			if (selectedElementIdRef.current) {
				// Find the element using the stored ID
				const elements = findElementsById(selectedElementIdRef.current);
				if (elements.length > 0) {
					const element = elements[0];
					const rect = element.getBoundingClientRect();

					// Check if element is in viewport
					const viewportHeight = window.innerHeight;
					const viewportWidth = window.innerWidth;
					const isInViewport = (
						rect.top < viewportHeight &&
						rect.bottom > 0 &&
						rect.left < viewportWidth &&
						rect.right > 0
					);

					const elementPosition = {
						top: rect.top,
						left: rect.left,
						right: rect.right,
						bottom: rect.bottom,
						width: rect.width,
						height: rect.height,
						centerX: rect.left + rect.width / 2,
						centerY: rect.top + rect.height / 2
					};

					window.parent.postMessage({
						type: 'element-position-update',
						position: elementPosition,
						isInViewport: isInViewport,
						visualSelectorId: selectedElementIdRef.current
					}, '*');
				}
			}
		};

		const handleMessage = (event) => {
			// Check origin if desired
			//if (event.origin !== 'parent-origin') return;

			const message = event.data;

			switch (message.type) {
				case 'toggle-visual-edit-mode':
					toggleVisualEditMode(message.data.enabled);
					break;

				case 'update-classes':
					if (message.data && message.data.classes !== undefined) {
						// Update with the visual selector ID
						// Pass replace flag if provided (used for reverts)
						updateElementClasses(
							message.data.visualSelectorId,
							message.data.classes,
							message.data.replace || false
						);
					} else {
						console.warn('[Agent] Invalid update-classes message:', message);
					}
					break;

				case 'unselect-element':
					unselectElement();
					break;

				case 'refresh-page':
					window.location.reload();
					break;

				case 'update-content':
					if (message.data && message.data.content !== undefined) {
						updateElementContent(
							message.data.visualSelectorId,
							message.data.content
						);
					} else {
						console.warn('[Agent] Invalid update-content message:', message);
					}
					break;

				case 'request-element-position':
					// Send current position of selected element for popover repositioning
					if (selectedElementIdRef.current) {
						// Find the element using the stored ID
						const elements = findElementsById(selectedElementIdRef.current);
						if (elements.length > 0) {
							const element = elements[0];
							const rect = element.getBoundingClientRect();

							// Check if element is in viewport
							const viewportHeight = window.innerHeight;
							const viewportWidth = window.innerWidth;
							const isInViewport = (
								rect.top < viewportHeight &&
								rect.bottom > 0 &&
								rect.left < viewportWidth &&
								rect.right > 0
							);

							const elementPosition = {
								top: rect.top,
								left: rect.left,
								right: rect.right,
								bottom: rect.bottom,
								width: rect.width,
								height: rect.height,
								centerX: rect.left + rect.width / 2,
								centerY: rect.top + rect.height / 2
							};

							window.parent.postMessage({
								type: 'element-position-update',
								position: elementPosition,
								isInViewport: isInViewport,
								visualSelectorId: selectedElementIdRef.current
							}, '*');
						}
					}
					break;

				case 'popover-drag-state':
					// Handle popover drag state to prevent mouseover conflicts
					if (message.data && message.data.isDragging !== undefined) {
						setIsPopoverDragging(message.data.isDragging);
						isPopoverDraggingRef.current = message.data.isDragging;

						// Clear hover overlays when dragging starts
						if (message.data.isDragging) {
							clearHoverOverlays();
						}
					}
					break;

				case 'dropdown-state':
					// Handle dropdown open/close state
					if (message.data && message.data.isOpen !== undefined) {
						setIsDropdownOpen(message.data.isOpen);
						isDropdownOpenRef.current = message.data.isOpen;

						// Clear hover overlays when dropdown opens
						if (message.data.isOpen) {
							clearHoverOverlays();
						}
					}
					break;

				case 'layout-generation':
					if (message.data && message.data.visualSelectorId) {
						const targetId = message.data.visualSelectorId;
						const layoutType = message.data.layoutType;

						// Get classes from preset or use raw classes if provided
						const layoutClasses = layoutPresets[layoutType] || message.data.classes || '';

						if (layoutClasses) {
							updateElementClasses(targetId, layoutClasses, false); // merge classes
						}
					}
					break;

				default:
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
		document.addEventListener('scroll', handleScroll, true); // Also listen on document

		// Send ready message to parent
		window.parent.postMessage({ type: 'visual-edit-agent-ready' }, '*');

		return () => {
			window.removeEventListener('message', handleMessage);
			window.removeEventListener('scroll', handleScroll, true);
			document.removeEventListener('scroll', handleScroll, true);
			document.removeEventListener('mouseover', handleMouseOver);
			document.removeEventListener('mouseout', handleMouseOut);
			document.removeEventListener('click', handleElementClick, true);

			// Clean up all overlays
			clearHoverOverlays();

			selectedOverlaysRef.current.forEach(overlay => {
				if (overlay && overlay.parentNode) {
					overlay.remove();
				}
			});
		};
	}, []);

	// Keep the refs in sync with state changes
	useEffect(() => {
		isVisualEditModeRef.current = isVisualEditMode;
	}, [isVisualEditMode]);

	useEffect(() => {
		isPopoverDraggingRef.current = isPopoverDragging;
	}, [isPopoverDragging]);

	useEffect(() => {
		isDropdownOpenRef.current = isDropdownOpen;
	}, [isDropdownOpen]);

	// Handle window resize and scroll to reposition overlays
	useEffect(() => {
		const handleResize = () => {
			// Reposition selected overlays
			if (selectedElementIdRef.current) {
				const elements = findElementsById(selectedElementIdRef.current);
				selectedOverlaysRef.current.forEach((overlay, index) => {
					if (index < elements.length) {
						positionOverlay(overlay, elements[index]);
					}
				});
			}

			// Reposition hover overlays
			if (currentHighlightedElementsRef.current.length > 0) {
				hoverOverlaysRef.current.forEach((overlay, index) => {
					if (index < currentHighlightedElementsRef.current.length) {
						positionOverlay(overlay, currentHighlightedElementsRef.current[index]);
					}
				});
			}
		};

		// Debounce helper
		let timeoutId = null;
		const debouncedHandleResize = () => {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				handleResize();
				timeoutId = null;
			}, 100);
		};

		// Create a mutation observer to detect changes in the DOM
		const mutationObserver = new MutationObserver((mutations) => {
			// Check if mutations affect layout (style, class, or structure)
			const isLayoutMutation = mutations.some(mutation =>
				mutation.type === 'childList' ||
				(mutation.type === 'attributes' &&
					['style', 'class', 'width', 'height'].includes(mutation.attributeName))
			);

			if (isLayoutMutation) {
				debouncedHandleResize();
			}
		});

		// Start observing
		mutationObserver.observe(document.body, {
			attributes: true,
			childList: true,
			subtree: true,
			attributeFilter: ['style', 'class', 'width', 'height']
		});

		window.addEventListener('resize', handleResize);
		window.addEventListener('scroll', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleResize);
			mutationObserver.disconnect();
		};
	}, []);

	// Render the UI if we have a selected element
	if (selectedElementData && isVisualEditMode) {
		return (
			<div className="font-sans">
				<VisualEditorUI
					selectedElement={selectedElementData}
					onUpdate={handleLocalUpdate}
					onClose={unselectElement}
					onSave={handleSave}
					onUndo={() => { }}
					onRedo={() => { }}
					canUndo={false}
					canRedo={false}
				/>
			</div>
		)
	}

	return null;
}