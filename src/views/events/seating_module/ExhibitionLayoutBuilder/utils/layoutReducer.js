const GRID_SIZE = 20;

const snapToGrid = (value, snap) => (snap ? Math.round(value / GRID_SIZE) * GRID_SIZE : value);

const createTempId = () => `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const ENTITY_TYPES = {
  STALL: 'stall',
  WALKWAY: 'walkway',
  PARKING: 'parking',
  STAGE: 'stage',
  LABEL: 'label',
  RESTRICTED: 'restricted',
};

const BOOKABLE_BY_ENTITY = {
  [ENTITY_TYPES.STALL]: true,
  [ENTITY_TYPES.WALKWAY]: false,
  [ENTITY_TYPES.PARKING]: false,
  [ENTITY_TYPES.STAGE]: false,
  [ENTITY_TYPES.LABEL]: false,
  [ENTITY_TYPES.RESTRICTED]: false,
};

const inferEntityType = (type, preferred) => {
  if (preferred) return preferred;
  if (type === 'text') return ENTITY_TYPES.LABEL;
  return ENTITY_TYPES.STALL;
};

const normalizeStyle = (element = {}, fallback = {}) => ({
  fill: element.style?.fill ?? element.fill ?? fallback.fill ?? '#cfcfcf',
  stroke: element.style?.stroke ?? element.stroke ?? fallback.stroke ?? '#1f1f1f',
  strokeWidth: Number(element.style?.strokeWidth ?? element.strokeWidth ?? fallback.strokeWidth ?? 1),
  textColor: element.style?.textColor ?? element.textColor ?? fallback.textColor,
});

const normalizeMeta = (element = {}, entityType = ENTITY_TYPES.STALL, fallback = {}) => {
  const fallbackBookable = BOOKABLE_BY_ENTITY[entityType] ?? false;
  return {
    name: element.meta?.name ?? element.name ?? fallback.name ?? '',
    price: Number(element.meta?.price ?? element.price ?? fallback.price ?? 0),
    bookable: element.meta?.bookable ?? fallback.bookable ?? fallbackBookable,
  };
};

const normalizeElement = (element = {}) => {
  const cleanElement = { ...element };
  delete cleanElement.serverId;
  delete cleanElement.stallId;
  delete cleanElement._id;

  const id = element._id || cleanElement.id || createTempId();
  const type = element.type || 'rect';
  const entityType = inferEntityType(type, element.entityType || element.meta?.entityType);

  const normalized = {
    ...cleanElement,
    id,
    type,
    entityType,
    x: Number(element.x ?? 120),
    y: Number(element.y ?? 120),
    rotation: Number(element.rotation ?? 0),
    style: normalizeStyle(element),
    meta: normalizeMeta(element, entityType),
    display: {
      showLabel: element.display?.showLabel ?? true,
    },
  };

  if (type === 'text') {
    normalized.text = element.text || element.meta?.name || 'Label';
    normalized.fontSize = Number(element.fontSize ?? 20);
    normalized.width = Number(element.width ?? 160);
    return normalized;
  }

  if (type === 'circle') {
    normalized.radius = Number(element.radius ?? 50);
    return normalized;
  }

  if (type === 'line') {
    normalized.points = Array.isArray(element.points) ? element.points : [0, 0, 140, 0];
    return normalized;
  }

  if (type === 'polygon') {
    normalized.sides = Number(element.sides ?? 5);
    normalized.radius = Number(element.radius ?? 55);
    return normalized;
  }

  normalized.width = Number(element.width ?? (type === 'square' ? 100 : 140));
  normalized.height = Number(element.height ?? (type === 'square' ? 100 : 90));
  return normalized;
};

const mergeElementUpdates = (element, updates = {}) => {
  const next = {
    ...element,
    ...updates,
    style: {
      ...(element.style || {}),
      ...(updates.style || {}),
    },
    meta: {
      ...(element.meta || {}),
      ...(updates.meta || {}),
    },
    display: {
      ...(element.display || {}),
      ...(updates.display || {}),
    },
  };

  if (updates.entityType) {
    const fallbackBookable = BOOKABLE_BY_ENTITY[updates.entityType] ?? false;
    if (typeof updates.meta?.bookable === 'undefined') {
      next.meta.bookable = fallbackBookable;
    }
  }

  if (next.type === 'circle' && (typeof updates.width === 'number' || typeof updates.height === 'number')) {
    const diameter = Number(updates.width || updates.height || next.radius * 2);
    next.radius = Math.max(5, diameter / 2);
    delete next.width;
    delete next.height;
  }

  if (next.type === 'line' && typeof updates.width === 'number') {
    next.points = [0, 0, updates.width, 0];
    delete next.width;
    delete next.height;
  }

  return next;
};

export const createElement = (type, position = {}, defaults = {}, snap = true) => {
  const x = snapToGrid(position.x ?? 120, snap);
  const y = snapToGrid(position.y ?? 120, snap);
  const entityType = inferEntityType(type, defaults.entityType);
  const style = normalizeStyle(defaults, defaults.style || defaults);
  const meta = normalizeMeta(defaults, entityType, defaults.meta || defaults);

  const base = {
    id: createTempId(),
    type,
    entityType,
    x,
    y,
    rotation: 0,
    style,
    meta,
    display: {
      showLabel: true,
    },
  };

  if (type === 'rect') {
    return { ...base, width: 140, height: 90 };
  }

  if (type === 'square') {
    return { ...base, width: 100, height: 100 };
  }

  if (type === 'circle') {
    return { ...base, radius: 50 };
  }

  if (type === 'line') {
    return {
      ...base,
      points: [0, 0, 140, 0],
      style: {
        ...style,
        stroke: style.stroke || '#2f2f2f',
        fill: undefined,
      },
    };
  }

  if (type === 'polygon') {
    return {
      ...base,
      sides: 5,
      radius: 55,
    };
  }

  return {
    ...base,
    type: 'text',
    entityType: ENTITY_TYPES.LABEL,
    text: defaults.text || defaults.meta?.name || defaults.name || 'Label',
    fontSize: 20,
    width: 160,
  };
};

const initialPresent = {
  elements: [],
  selectedIds: [],
  toolDefaults: {
    entityType: ENTITY_TYPES.STALL,
    style: {
      fill: '#cfcfcf',
      stroke: '#1f1f1f',
      strokeWidth: 1,
    },
    meta: {
      name: '',
      price: 0,
      bookable: true,
    },
    text: 'Label',
    display: {
      showLabel: true,
    },
  },
  gridEnabled: true,
  snapEnabled: true,
};

const reorderOneStep = (elements, id, direction) => {
  const index = elements.findIndex((el) => el.id === id);
  if (index === -1) return elements;

  const targetIndex = direction === 'forward'
    ? Math.min(elements.length - 1, index + 1)
    : Math.max(0, index - 1);

  if (targetIndex === index) return elements;

  const clone = [...elements];
  const [item] = clone.splice(index, 1);
  clone.splice(targetIndex, 0, item);
  return clone;
};

const updateElementsByIds = (elements, selectedIds, updates) => (
  elements.map((element) => {
    if (!selectedIds.includes(element.id)) return element;
    return mergeElementUpdates(element, updates);
  })
);

const presentReducer = (present, action) => {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      return {
        ...present,
        elements: [...present.elements, action.payload],
        selectedIds: [action.payload.id],
      };
    }
    case 'SET_ELEMENTS': {
      return {
        ...present,
        elements: (action.payload || []).map(normalizeElement),
        selectedIds: [],
      };
    }
    case 'SET_SELECTED_IDS': {
      return {
        ...present,
        selectedIds: action.payload,
      };
    }
    case 'CLEAR_SELECTION': {
      return {
        ...present,
        selectedIds: [],
      };
    }
    case 'UPDATE_ELEMENT': {
      return {
        ...present,
        elements: present.elements.map((item) => (item.id === action.payload.id
          ? mergeElementUpdates(item, action.payload.updates)
          : item)),
      };
    }
    case 'UPDATE_SELECTED_ELEMENTS': {
      return {
        ...present,
        elements: updateElementsByIds(present.elements, present.selectedIds, action.payload),
      };
    }
    case 'DELETE_SELECTED': {
      if (!present.selectedIds.length) return present;
      return {
        ...present,
        elements: present.elements.filter((item) => !present.selectedIds.includes(item.id)),
        selectedIds: [],
      };
    }
    case 'DUPLICATE_SELECTED': {
      if (!present.selectedIds.length) return present;
      const selected = present.elements.filter((element) => present.selectedIds.includes(element.id));
      const duplicates = selected.map((element) => ({
        ...element,
        id: createTempId(),
        x: (element.x || 0) + 20,
        y: (element.y || 0) + 20,
        meta: {
          ...(element.meta || {}),
        },
        style: {
          ...(element.style || {}),
        },
      }));
      return {
        ...present,
        elements: [...present.elements, ...duplicates],
        selectedIds: duplicates.map((item) => item.id),
      };
    }
    case 'BRING_FORWARD': {
      if (present.selectedIds.length !== 1) return present;
      return {
        ...present,
        elements: reorderOneStep(present.elements, present.selectedIds[0], 'forward'),
      };
    }
    case 'SEND_BACKWARD': {
      if (present.selectedIds.length !== 1) return present;
      return {
        ...present,
        elements: reorderOneStep(present.elements, present.selectedIds[0], 'backward'),
      };
    }
    case 'SET_TOOL_DEFAULTS': {
      const next = {
        ...present.toolDefaults,
      };

      if (action.payload.entityType !== undefined) {
        next.entityType = action.payload.entityType;
      }

      if (action.payload.text !== undefined) {
        next.text = action.payload.text;
      }

      const styleUpdates = {};
      if (action.payload.style) {
        Object.assign(styleUpdates, action.payload.style);
      }
      if (action.payload.fill !== undefined) styleUpdates.fill = action.payload.fill;
      if (action.payload.stroke !== undefined) styleUpdates.stroke = action.payload.stroke;
      if (action.payload.strokeWidth !== undefined) styleUpdates.strokeWidth = action.payload.strokeWidth;
      if (action.payload.textColor !== undefined) styleUpdates.textColor = action.payload.textColor;

      const metaUpdates = {};
      if (action.payload.meta) {
        Object.assign(metaUpdates, action.payload.meta);
      }
      if (action.payload.name !== undefined) metaUpdates.name = action.payload.name;
      if (action.payload.price !== undefined) metaUpdates.price = action.payload.price;
      if (action.payload.bookable !== undefined) metaUpdates.bookable = action.payload.bookable;

      if (Object.keys(styleUpdates).length) {
        next.style = {
          ...(next.style || {}),
          ...styleUpdates,
        };
      }

      if (Object.keys(metaUpdates).length) {
        next.meta = {
          ...(next.meta || {}),
          ...metaUpdates,
        };
      }

      if (action.payload.display) {
        next.display = {
          ...(next.display || {}),
          ...action.payload.display,
        };
      }

      return {
        ...present,
        toolDefaults: next,
      };
    }
    case 'SET_GRID_ENABLED': {
      return {
        ...present,
        gridEnabled: !!action.payload,
      };
    }
    case 'SET_SNAP_ENABLED': {
      return {
        ...present,
        snapEnabled: !!action.payload,
      };
    }
    default:
      return present;
  }
};

const historyInitialState = {
  past: [],
  present: initialPresent,
  future: [],
};

const skipHistoryActions = new Set([
  'SET_SELECTED_IDS',
  'CLEAR_SELECTION',
  'SET_TOOL_DEFAULTS',
  'SET_GRID_ENABLED',
  'SET_SNAP_ENABLED',
]);

export const historyReducer = (state, action) => {
  if (action.type === 'UNDO') {
    if (!state.past.length) return state;
    const previous = state.past[state.past.length - 1];
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  if (action.type === 'REDO') {
    if (!state.future.length) return state;
    const next = state.future[0];
    return {
      past: [...state.past, state.present],
      present: next,
      future: state.future.slice(1),
    };
  }

  const updatedPresent = presentReducer(state.present, action);
  if (updatedPresent === state.present) return state;

  if (skipHistoryActions.has(action.type) || action.record === false) {
    return {
      ...state,
      present: updatedPresent,
    };
  }

  return {
    past: [...state.past, state.present],
    present: updatedPresent,
    future: [],
  };
};

export const getElementDimension = (element) => {
  if (!element) return { width: 0, height: 0 };

  if (element.type === 'circle') {
    return {
      width: (element.radius || 0) * 2,
      height: (element.radius || 0) * 2,
    };
  }

  if (element.type === 'line') {
    const width = element.points?.[2] ?? 0;
    return {
      width,
      height: 1,
    };
  }

  if (element.type === 'polygon') {
    const size = (element.radius || 0) * 2;
    return { width: size, height: size };
  }

  return {
    width: element.width || 0,
    height: element.height || 0,
  };
};

export { GRID_SIZE, historyInitialState, snapToGrid };
