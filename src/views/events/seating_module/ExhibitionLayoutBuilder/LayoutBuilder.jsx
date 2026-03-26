import React, { useMemo, useReducer, useRef, useState } from 'react';
import { Card, message, Spin } from 'antd';
import CanvasStage from './components/CanvasStage';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import {
  createElement,
  historyInitialState,
  historyReducer,
  snapToGrid,
} from './utils/layoutReducer';

import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const LayoutBuilder = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('eventId');

  const [layoutName, setLayoutName] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(false);

  const stageRef = useRef(null);
  const importRef = useRef(null);
  const panelHeight = 'calc(100vh - 96px)';

  const [state, dispatch] = useReducer(historyReducer, historyInitialState);
  const { elements, selectedIds, toolDefaults, gridEnabled, snapEnabled } = state.present;

  // Fetch layout if ID exists
  const { data: layoutData, isLoading: isFetching } = useQuery({
    queryKey: ['stall-layout', id],
    queryFn: async () => {
      const res = await api.get(`stall-layout/${id}`);
      if (res?.status === false) {
        throw new Error(Utils.getErrorMessage(res, 'Failed to fetch layout'));
      }
      return res?.data || res;
    },
    enabled: !!id,
    staleTime: 0, // Ensure we always get fresh data when switching IDs
  });

  // Handle data hydration
  React.useEffect(() => {
    if (id && layoutData) {
      if (layoutData.name) {
        setLayoutName(layoutData.name);
      }
      setApprovalRequired(!!layoutData.approval_required);
      if (layoutData.canvas) {
        const canvasData = typeof layoutData.canvas === 'string'
          ? JSON.parse(layoutData.canvas)
          : layoutData.canvas;
        dispatch({ type: 'SET_ELEMENTS', payload: canvasData });
      }
    } else if (!id) {
        // Reset state for new layout
        setLayoutName('');
        setApprovalRequired(false);
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
    }
  }, [id, layoutData]);

  // Save/Update Mutation
  const { mutate: saveLayout, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
      if (id) {
        // Update existing
        return await api.put(`stall-layout/${id}`, payload);
      } else {
        // Create/Upsert by eventId
        return await api.post(`stall-layout/${eventId}`, payload);
      }
    },
    onSuccess: (res) => {
      if (res?.status === false) {
        message.error(Utils.getErrorMessage(res, 'Failed to save layout'));
      } else {
        message.success(res?.message || 'Layout saved successfully');
      }
    },
    onError: (err) => {
      message.error(Utils.getErrorMessage(err, 'Failed to save layout'));
    }
  });

  const selectedElements = useMemo(
    () => elements.filter((item) => selectedIds.includes(item.id)),
    [elements, selectedIds]
  );

  const addShape = (type, position, options = {}) => {
    const defaults = {
      ...toolDefaults,
      entityType: options.entityType || toolDefaults.entityType,
    };
    const element = createElement(type, position, defaults, snapEnabled);
    dispatch({ type: 'ADD_ELEMENT', payload: element });
  };

  const handleSelect = (id, isShiftKey) => {
    if (!isShiftKey) {
      dispatch({ type: 'SET_SELECTED_IDS', payload: [id] });
      return;
    }

    if (selectedIds.includes(id)) {
      dispatch({
        type: 'SET_SELECTED_IDS',
        payload: selectedIds.filter((item) => item !== id),
      });
      return;
    }

    dispatch({ type: 'SET_SELECTED_IDS', payload: [...selectedIds, id] });
  };

  const updateElement = (id, updates, record = true) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: { id, updates },
      record,
    });
  };

  const updateSelected = (updates, record = true) => {
    dispatch({
      type: 'UPDATE_SELECTED_ELEMENTS',
      payload: updates,
      record,
    });
  };

  const handleElementsUpdate = (changes) => {
    changes.forEach((change, index) => {
      updateElement(change.id, change.updates, index === changes.length - 1);
    });
  };

  const handleSave = () => {
    if (!id && !eventId) {
      message.error('Missing Event ID or Layout ID');
      return;
    }

    const payload = {
      name: layoutName || `Layout for ${id || eventId}`,
      approval_required: approvalRequired,
      canvas: elements,
    };

    saveLayout(payload);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'exhibition-layout.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    importRef.current?.click();
  };

  const onImportFile = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) {
          message.error('Invalid file format');
          return;
        }
        dispatch({ type: 'SET_ELEMENTS', payload: parsed });
        message.success('Layout imported');
      } catch (error) {
        message.error('Failed to parse JSON');
      }
    };

    reader.readAsText(file);
    evt.target.value = '';
  };

  const handleExportImage = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = 'exhibition-layout.png';
    anchor.click();
  };

  React.useEffect(() => {
    const listener = (evt) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(activeTag) || document.activeElement?.isContentEditable;
      if (isTyping) return;

      if (evt.key === 'Delete') {
        dispatch({ type: 'DELETE_SELECTED' });
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'z') {
        evt.preventDefault();
        if (evt.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'y') {
        evt.preventDefault();
        dispatch({ type: 'REDO' });
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'd') {
        evt.preventDefault();
        dispatch({ type: 'DUPLICATE_SELECTED' });
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  return (
    <div className="container-fluid" style={{ padding: 12 }}>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={onImportFile}
      />

      <div className="row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div className="col-3" style={{ flex: '1 1 300px', minWidth: 260, height: panelHeight }}>
          <Sidebar
            defaults={toolDefaults}
            onDefaultChange={(payload) => dispatch({ type: 'SET_TOOL_DEFAULTS', payload })}
            onAddShape={(type, options) => addShape(type, undefined, options)}
            onAddStall={() => addShape('rect', undefined, { entityType: 'stall' })}
            onApplyToSelected={() => updateSelected(toolDefaults)}
            onDeleteSelected={() => dispatch({ type: 'DELETE_SELECTED' })}
            onDuplicateSelected={() => dispatch({ type: 'DUPLICATE_SELECTED' })}
            onBringForward={() => dispatch({ type: 'BRING_FORWARD' })}
            onSendBackward={() => dispatch({ type: 'SEND_BACKWARD' })}
            onUndo={() => dispatch({ type: 'UNDO' })}
            onRedo={() => dispatch({ type: 'REDO' })}
            onSave={handleSave}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onExportImage={handleExportImage}
            canUndo={state.past.length > 0}
            canRedo={state.future.length > 0}
            hasSelection={selectedIds.length > 0}
            loading={isSaving}
            layoutName={layoutName}
            onLayoutNameChange={setLayoutName}
            approvalRequired={approvalRequired}
            onApprovalRequiredChange={setApprovalRequired}
          />
        </div>

        <div className="col-6" style={{ flex: '2 1 650px', minWidth: 420, height: panelHeight }}>
          <Spin spinning={isFetching}>
            <Card
              title="Exhibition Layout Builder"
              size="small"
              style={{ height: '100%' }}
              bodyStyle={{ height: 'calc(100% - 48px)', overflow: 'hidden' }}
            >
              <CanvasStage
                stageRef={stageRef}
                elements={elements}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onClearSelection={() => dispatch({ type: 'CLEAR_SELECTION' })}
                onDropShape={(type, position, options) => addShape(type, position, options)}
                onElementsUpdate={handleElementsUpdate}
                snapToGrid={snapToGrid}
                snapEnabled={snapEnabled}
                gridEnabled={gridEnabled}
                onToggleGrid={(checked) => dispatch({ type: 'SET_GRID_ENABLED', payload: checked })}
                onToggleSnap={(checked) => dispatch({ type: 'SET_SNAP_ENABLED', payload: checked })}
              />
            </Card>
          </Spin>
        </div>

        <div className="col-3" style={{ flex: '1 1 300px', minWidth: 260, height: panelHeight }}>
          <PropertiesPanel
            selectedElements={selectedElements}
            onUpdateElement={updateElement}
            onUpdateSelected={updateSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default LayoutBuilder;
