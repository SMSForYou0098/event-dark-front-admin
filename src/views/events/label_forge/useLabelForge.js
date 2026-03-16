// Custom hook for Label Forge state management

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { 
    PRESETS, 
    INITIAL_ELEMENTS, 
    DEMO_TEMPLATE, 
    MOCK_DATA,
    SNAP_GRID_SIZE
} from './constants';
import { loadSavedState, saveState, generateId, downloadFile } from './utils';
import { generatePrinterCode } from './codeGenerators';

/**
 * Custom hook for managing Label Forge state
 */
export const useLabelForge = () => {
    // Load initial state from localStorage
    const savedState = loadSavedState();

    // Label size state
    const [labelSize, setLabelSize] = useState(() => 
        savedState?.labelSize || PRESETS[0]
    );

    // Elements state with undo/redo history
    const [elements, setElements] = useState(() => 
        savedState?.elements || INITIAL_ELEMENTS
    );
    const [history, setHistory] = useState([elements]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Selection state
    const [selectedIds, setSelectedIds] = useState([]);

    // UI state
    const [printerLang, setPrinterLang] = useState('TSPL');
    const [showGrid, setShowGrid] = useState(true);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState('editor');
    const [gridSize, setGridSize] = useState(SNAP_GRID_SIZE);
    const [activeSidebarTab, setActiveSidebarTab] = useState('create');

    // Custom variables
    const [customVariables, setCustomVariables] = useState(() => 
        savedState?.customVariables || {}
    );
    const [isVarModalOpen, setIsVarModalOpen] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const [newVarValue, setNewVarValue] = useState('');

    // Code generation modal
    const [generatedCode, setGeneratedCode] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Context menu
    const [contextMenu, setContextMenu] = useState(null);

    // Confirmation modal
    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // View transform (pan & zoom)
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [marquee, setMarquee] = useState(null);

    // Refs
    const panStart = useRef({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const elementDimensions = useRef({});
    const containerRef = useRef(null);
    const mainRef = useRef(null);

    // Computed values
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const primarySelection = selectedElements.length > 0 
        ? selectedElements[selectedElements.length - 1] 
        : null;
    const allVariables = useMemo(() => ({ ...MOCK_DATA, ...customVariables }), [customVariables]);

    // Persistence effect
    useEffect(() => {
        const state = {
            labelSize,
            elements,
            customVariables,
            printerLang,
            gridSize
        };
        saveState(state);
    }, [labelSize, elements, customVariables, printerLang, gridSize]);

    // Commit current elements to history for undo/redo
    const commitToHistory = useCallback((newElements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Undo action
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    }, [history, historyIndex]);

    // Redo action
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    }, [history, historyIndex]);

    // Reset canvas
    const handleReset = () => {
        setConfirmationState({
            isOpen: true,
            title: 'Reset Canvas',
            message: 'Are you sure you want to clear the entire canvas? This cannot be undone.',
            onConfirm: () => {
                setElements([]);
                commitToHistory([]);
                setSelectedIds([]);
                setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: null });
                message.success('Canvas cleared');
            }
        });
    };

    // Load demo template
    const handleLoadDemo = () => {
        setConfirmationState({
            isOpen: true,
            title: 'Load Demo Template',
            message: 'This will replace your current design with the demo template. Are you sure?',
            onConfirm: () => {
                setLabelSize(DEMO_TEMPLATE.labelSize);
                setElements(DEMO_TEMPLATE.elements);
                commitToHistory(DEMO_TEMPLATE.elements);
                setSelectedIds([]);
                setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: null });
                message.success('Demo template loaded');
            }
        });
    };

    // Export template
    const handleExportTemplate = () => {
        const data = {
            labelSize,
            elements,
            version: '1.0',
            timestamp: new Date().toISOString()
        };
        downloadFile(
            JSON.stringify(data, null, 2),
            `label-template-${Date.now()}.json`
        );
        message.success('Template exported');
    };

    // Import template
    const handleImportTemplate = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.labelSize && data.elements) {
                    setLabelSize(data.labelSize);
                    setElements(data.elements);
                    commitToHistory(data.elements);
                    setSelectedIds([]);
                    message.success('Template imported successfully');
                } else {
                    message.error('Invalid template file format');
                }
            } catch (err) {
                message.error('Error parsing JSON file');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Add custom variable
    const handleAddCustomVar = () => {
        if (newVarName && newVarValue) {
            const formattedName = `{${newVarName.replace(/[{}]/g, '')}}`;
            setCustomVariables(prev => ({ ...prev, [formattedName]: newVarValue }));
            setNewVarName('');
            setNewVarValue('');
            setIsVarModalOpen(false);
            message.success('Variable added');
        } else {
            message.warning('Please enter both name and value');
        }
    };

    // Measure element dimensions
    const handleMeasure = useCallback((id, dims) => {
        elementDimensions.current[id] = dims;
    }, []);

    // Handle element selection
    const handleSelect = useCallback((id, isMulti) => {
        setSelectedIds(prev => {
            if (isMulti) {
                return prev.includes(id) 
                    ? prev.filter(pid => pid !== id) 
                    : [...prev, id];
            }
            return [id];
        });
    }, []);

    // Move element layer
    const handleMoveLayer = (id, direction) => {
        const index = elements.findIndex(el => el.id === id);
        if (index === -1) return;

        let newElements = [...elements];
        const item = newElements.splice(index, 1)[0];

        if (direction === 'front') newElements.push(item);
        else if (direction === 'back') newElements.unshift(item);
        else if (direction === 'up' && index < elements.length - 1) newElements.splice(index + 1, 0, item);
        else if (direction === 'down' && index > 0) newElements.splice(index - 1, 0, item);
        else return;

        setElements(newElements);
        commitToHistory(newElements);
    };

    // Duplicate selected elements
    const handleDuplicate = () => {
        const newElements = selectedElements.map(el => ({
            ...el,
            id: generateId(),
            x: el.x + 5,
            y: el.y + 5
        }));
        const nextElements = [...elements, ...newElements];
        setElements(nextElements);
        commitToHistory(nextElements);
        setSelectedIds(newElements.map(el => el.id));
    };

    // Add new element
    const addElement = (type, initialProps = {}) => {
        const newId = generateId();
        let newEl = { id: newId, type, x: 5, y: 5, ...initialProps };

        if (type === 'text') {
            newEl = {
                content: 'New Text',
                fontSize: 12,
                fontWeight: 'normal',
                fontFamily: 'Arial, sans-serif',
                ...newEl
            };
        } else if (type === 'qrcode') {
            newEl = {
                width: 15,
                height: 15,
                content: '123456',
                showBorder: true,
                padding: 1,
                ...newEl
            };
        } else if (type === 'barcode') {
            newEl = { width: 30, height: 8, content: '123456', ...newEl };
        } else if (type === 'box') {
            newEl = { width: 20, height: 20, strokeWidth: 0.5, ...newEl };
        }

        const newElements = [...elements, newEl];
        setElements(newElements);
        commitToHistory(newElements);
        setSelectedIds([newId]);
        if (activeTab === 'preview') setActiveTab('editor');
    };

    // Update element properties
    const updateElement = useCallback((id, updates, isDrag) => {
        setElements(prev => {
            return prev.map(el => {
                if (el.id === id) return { ...el, ...updates };
                if (isDrag && selectedIds.includes(id) && selectedIds.includes(el.id)) {
                    const originEl = prev.find(e => e.id === id);
                    const dx = updates.x - originEl.x;
                    const dy = updates.y - originEl.y;
                    return { ...el, x: el.x + dx, y: el.y + dy };
                }
                return el;
            });
        });
    }, [selectedIds]);

    // Handle interaction end (commit to history)
    const handleInteractionEnd = useCallback(() => {
        commitToHistory(elements);
    }, [elements, commitToHistory]);

    // Delete selected elements
    const deleteElement = useCallback(() => {
        if (selectedIds.length > 0) {
            const newElements = elements.filter(el => !selectedIds.includes(el.id));
            setElements(newElements);
            commitToHistory(newElements);
            setSelectedIds([]);
        }
    }, [selectedIds, elements, commitToHistory]);

    // Handle alignment
    const handleAlign = (alignment) => {
        if (selectedIds.length === 0) return;

        let newElements = [...elements];
        const group = elements.filter(el => selectedIds.includes(el.id));

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        group.forEach(el => {
            const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
            const w = dim.width;
            const h = dim.height;
            if (el.x < minX) minX = el.x;
            if (el.x + w > maxX) maxX = el.x + w;
            if (el.y < minY) minY = el.y;
            if (el.y + h > maxY) maxY = el.y + h;
        });

        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        if (selectedIds.length === 1) {
            const el = group[0];
            const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
            let updates = {};

            switch (alignment) {
                case 'left': updates.x = 0; break;
                case 'center': updates.x = (labelSize.width - dim.width) / 2; break;
                case 'right': updates.x = labelSize.width - dim.width; break;
                case 'top': updates.y = 0; break;
                case 'middle': updates.y = (labelSize.height - dim.height) / 2; break;
                case 'bottom': updates.y = labelSize.height - dim.height; break;
                default: break;
            }
            newElements = elements.map(e => e.id === el.id ? { ...e, ...updates } : e);
        } else {
            if (['distribute-h', 'distribute-v'].includes(alignment)) {
                const sortedGroup = [...group].sort((a, b) => 
                    alignment === 'distribute-h' ? a.x - b.x : a.y - b.y
                );
                if (sortedGroup.length > 2) {
                    const first = sortedGroup[0];
                    const last = sortedGroup[sortedGroup.length - 1];
                    const span = alignment === 'distribute-h' ? (last.x - first.x) : (last.y - first.y);
                    const step = span / (sortedGroup.length - 1);

                    newElements = elements.map(el => {
                        if (!selectedIds.includes(el.id)) return el;
                        const idx = sortedGroup.findIndex(x => x.id === el.id);
                        if (idx === 0 || idx === sortedGroup.length - 1) return el;

                        if (alignment === 'distribute-h') return { ...el, x: first.x + (step * idx) };
                        else return { ...el, y: first.y + (step * idx) };
                    });
                }
            } else {
                newElements = elements.map(el => {
                    if (!selectedIds.includes(el.id)) return el;
                    const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
                    const w = dim.width;
                    const h = dim.height;
                    let newX = el.x;
                    let newY = el.y;

                    switch (alignment) {
                        case 'left': newX = minX; break;
                        case 'center': newX = centerX - (w / 2); break;
                        case 'right': newX = maxX - w; break;
                        case 'top': newY = minY; break;
                        case 'middle': newY = centerY - (h / 2); break;
                        case 'bottom': newY = maxY - h; break;
                        default: break;
                    }
                    return { ...el, x: newX, y: newY };
                });
            }
        }

        setElements(newElements);
        commitToHistory(newElements);
    };

    // Center view
    const centerView = () => setViewTransform({ x: 0, y: 0, scale: 1 });

    // Generate printer code
    const handleGenerateCode = useCallback(() => {
        const code = generatePrinterCode(printerLang, labelSize, elements, allVariables, showComments);
        setGeneratedCode(code);
        setShowCodeModal(true);
    }, [printerLang, labelSize, elements, allVariables, showComments]);

    // Copy code to clipboard
    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(generatedCode).then(() => {
            message.success('Code copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = generatedCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            message.success('Code copied to clipboard');
        });
    };

    // Regenerate code when showComments changes
    useEffect(() => {
        if (showCodeModal) {
            handleGenerateCode();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showComments, showCodeModal]);

    return {
        // State
        labelSize,
        setLabelSize,
        elements,
        setElements,
        selectedIds,
        setSelectedIds,
        printerLang,
        setPrinterLang,
        showGrid,
        setShowGrid,
        snapEnabled,
        setSnapEnabled,
        activeTab,
        setActiveTab,
        gridSize,
        setGridSize,
        activeSidebarTab,
        setActiveSidebarTab,
        customVariables,
        setCustomVariables,
        isVarModalOpen,
        setIsVarModalOpen,
        newVarName,
        setNewVarName,
        newVarValue,
        setNewVarValue,
        generatedCode,
        showCodeModal,
        setShowCodeModal,
        showComments,
        setShowComments,
        contextMenu,
        setContextMenu,
        confirmationState,
        setConfirmationState,
        viewTransform,
        setViewTransform,
        isPanning,
        setIsPanning,
        marquee,
        setMarquee,

        // Refs
        panStart,
        fileInputRef,
        elementDimensions,
        containerRef,
        mainRef,

        // Computed
        selectedElements,
        primarySelection,
        allVariables,
        historyIndex,
        historyLength: history.length,

        // Actions
        undo,
        redo,
        handleReset,
        handleLoadDemo,
        handleExportTemplate,
        handleImportTemplate,
        handleAddCustomVar,
        handleMeasure,
        handleSelect,
        handleMoveLayer,
        handleDuplicate,
        addElement,
        updateElement,
        handleInteractionEnd,
        deleteElement,
        handleAlign,
        centerView,
        handleGenerateCode,
        copyCodeToClipboard,
        commitToHistory,
    };
};

export default useLabelForge;
