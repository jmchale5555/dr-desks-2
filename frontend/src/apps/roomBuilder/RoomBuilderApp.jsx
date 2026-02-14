import { useEffect, useMemo, useState } from 'react';
import { roomService } from '../../services/roomService';
import { roomLayoutService } from '../../services/roomLayoutService';
import ToolPanel from './components/ToolPanel';
import CanvasStage from './components/CanvasStage';
import PropertiesPanel from './components/PropertiesPanel';

function createNewObject(tool, index) {
  const id = `${tool}_${Date.now()}_${index}`;
  return {
    id,
    type: tool === 'select' ? 'rectangle' : tool,
    x: 100,
    y: 100,
    width: 80,
    height: 50,
    rotation: 0,
    locked: false,
    meta: { label: `Object ${index + 1}` },
  };
}

function duplicateObject(source, index) {
  return {
    ...source,
    id: `${source.type}_${Date.now()}_${index}`,
    x: Number(source.x || 0) + 20,
    y: Number(source.y || 0) + 20,
    meta: {
      ...(source.meta || {}),
      label: source.meta?.label ? `${source.meta.label} Copy` : `Object ${index + 1}`,
    },
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const MIN_OBJECT_SIZE = 20;

export default function RoomBuilderApp() {
  const HISTORY_LIMIT = 50;
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedTool, setSelectedTool] = useState('select');
  const [layout, setLayout] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await roomService.getAllRooms();
        setRooms(data);
        if (data.length > 0) {
          setSelectedRoomId(String(data[0].id));
        }
      } catch (err) {
        setError(err.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setLayout(null);
      return;
    }

    const loadLayout = async () => {
      setError(null);
      try {
        const data = await roomLayoutService.getRoomLayout(selectedRoomId);
        setLayout(data);
        setHistory({ past: [], future: [] });
        setSelectedObjectId(null);
      } catch (err) {
        setError(err.message || 'Failed to load room layout');
      }
    };

    loadLayout();
  }, [selectedRoomId]);

  const selectedObject = useMemo(() => {
    const objects = layout?.layout_json?.objects || [];
    return objects.find((item) => item.id === selectedObjectId) || null;
  }, [layout, selectedObjectId]);

  const setLayoutWithHistory = (updater) => {
    setLayout((prevLayout) => {
      const nextLayout = typeof updater === 'function' ? updater(prevLayout) : updater;

      if (!prevLayout || !nextLayout || nextLayout === prevLayout) {
        return nextLayout;
      }

      setHistory((prevHistory) => ({
        past: [...prevHistory.past, prevLayout].slice(-HISTORY_LIMIT),
        future: [],
      }));

      return nextLayout;
    });
  };

  const handleUndo = () => {
    if (!layout || history.past.length === 0) return;

    const previousLayout = history.past[history.past.length - 1];
    setHistory((prevHistory) => ({
      past: prevHistory.past.slice(0, -1),
      future: [layout, ...prevHistory.future].slice(0, HISTORY_LIMIT),
    }));
    setLayout(previousLayout);
  };

  const handleRedo = () => {
    if (!layout || history.future.length === 0) return;

    const nextLayout = history.future[0];
    setHistory((prevHistory) => ({
      past: [...prevHistory.past, layout].slice(-HISTORY_LIMIT),
      future: prevHistory.future.slice(1),
    }));
    setLayout(nextLayout);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      const isTypingTarget = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || event.target?.isContentEditable;
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      const isMod = event.ctrlKey || event.metaKey;
      const nudgeStep = event.shiftKey ? 10 : 1;

      if (!isMod && key === 'arrowup') {
        event.preventDefault();
        handleNudgeSelected(0, -nudgeStep);
        return;
      }

      if (!isMod && key === 'arrowdown') {
        event.preventDefault();
        handleNudgeSelected(0, nudgeStep);
        return;
      }

      if (!isMod && key === 'arrowleft') {
        event.preventDefault();
        handleNudgeSelected(-nudgeStep, 0);
        return;
      }

      if (!isMod && key === 'arrowright') {
        event.preventDefault();
        handleNudgeSelected(nudgeStep, 0);
        return;
      }

      if (!isMod && (key === 'delete' || key === 'backspace')) {
        event.preventDefault();
        handleDeleteSelected();
        return;
      }

      if (!isMod) return;

      if (key === 'd') {
        event.preventDefault();
        handleDuplicateSelected();
        return;
      }

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [layout, history, selectedObjectId]);

  const updateObjectById = (objectId, changes) => {
    if (!objectId || !layout) return;

    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: prevLayout.layout_json.objects.map((item) =>
            item.id === objectId
              ? {
                  ...item,
                  ...changes,
                }
              : item
          ),
        },
      };
    });
  };

  const updateSelectedObject = (changes) => {
    updateObjectById(selectedObjectId, changes);
  };

  const handleDeleteSelected = () => {
    if (!layout || !selectedObjectId) return;

    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: prevLayout.layout_json.objects.filter((item) => item.id !== selectedObjectId),
        },
      };
    });
    setSelectedObjectId(null);
  };

  const handleDuplicateSelected = () => {
    if (!layout || !selectedObjectId) return;

    const source = layout.layout_json.objects.find((item) => item.id === selectedObjectId);
    if (!source) return;

    const nextObject = duplicateObject(source, layout.layout_json.objects.length);
    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: [...prevLayout.layout_json.objects, nextObject],
        },
      };
    });
    setSelectedObjectId(nextObject.id);
  };

  const handleNudgeSelected = (dx, dy) => {
    if (!layout || !selectedObjectId) return;

    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      const maxWidth = prevLayout.canvas_width || 800;
      const maxHeight = prevLayout.canvas_height || 800;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: prevLayout.layout_json.objects.map((item) => {
            if (item.id !== selectedObjectId) return item;

            const width = Number(item.width || 0);
            const height = Number(item.height || 0);

            return {
              ...item,
              x: clamp(Number(item.x || 0) + dx, 0, Math.max(maxWidth - width, 0)),
              y: clamp(Number(item.y || 0) + dy, 0, Math.max(maxHeight - height, 0)),
            };
          }),
        },
      };
    });
  };

  const handleScaleSelected = (deltaPercent) => {
    if (!layout || !selectedObjectId) return;

    const factor = (100 + deltaPercent) / 100;
    if (factor <= 0) return;

    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      const maxWidth = prevLayout.canvas_width || 800;
      const maxHeight = prevLayout.canvas_height || 800;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: prevLayout.layout_json.objects.map((item) => {
            if (item.id !== selectedObjectId) return item;

            const nextWidth = Math.max(MIN_OBJECT_SIZE, Math.round(Number(item.width || 0) * factor));
            const nextHeight = Math.max(MIN_OBJECT_SIZE, Math.round(Number(item.height || 0) * factor));

            return {
              ...item,
              width: nextWidth,
              height: nextHeight,
              x: clamp(Number(item.x || 0), 0, Math.max(maxWidth - nextWidth, 0)),
              y: clamp(Number(item.y || 0), 0, Math.max(maxHeight - nextHeight, 0)),
            };
          }),
        },
      };
    });
  };

  const handleRotateSelected = () => {
    if (!layout || !selectedObjectId) return;

    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: prevLayout.layout_json.objects.map((item) => {
            if (item.id !== selectedObjectId) return item;
            const rotation = ((Number(item.rotation || 0) + 90) % 360 + 360) % 360;
            return { ...item, rotation };
          }),
        },
      };
    });
  };

  const handleAddObject = () => {
    if (!layout) return;
    const nextObject = createNewObject(selectedTool, layout.layout_json.objects.length);
    setLayoutWithHistory((prevLayout) => {
      if (!prevLayout) return prevLayout;

      return {
        ...prevLayout,
        layout_json: {
          ...prevLayout.layout_json,
          objects: [...prevLayout.layout_json.objects, nextObject],
        },
      };
    });
    setSelectedObjectId(nextObject.id);
  };

  const handleGenerateFromDesks = async () => {
    if (!selectedRoomId) return;
    setError(null);
    try {
      const data = await roomLayoutService.generateFromDesks(selectedRoomId);
      setLayoutWithHistory(() => data);
      setSelectedObjectId(null);
    } catch (err) {
      setError(err.message || 'Failed to generate layout from desks');
    }
  };

  const handleSave = async () => {
    if (!selectedRoomId || !layout) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        room: Number(selectedRoomId),
        version: layout.version,
        canvas_width: layout.canvas_width,
        canvas_height: layout.canvas_height,
        layout_json: layout.layout_json,
      };
      const saved = await roomLayoutService.updateRoomLayout(selectedRoomId, payload);
      setLayout(saved);
    } catch (err) {
      setError(err.message || 'Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600 dark:text-gray-400">Loading room builder...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Builder</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and maintain room layout blueprints for desk planning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Room</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!selectedRoomId || !layout ? (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500 dark:text-gray-400">
          Select a room to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_280px] gap-4">
          <ToolPanel
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onAddObject={handleAddObject}
            onDeleteSelected={handleDeleteSelected}
            onDuplicateSelected={handleDuplicateSelected}
            onScaleSelected={handleScaleSelected}
            onRotateSelected={handleRotateSelected}
            onGenerateFromDesks={handleGenerateFromDesks}
            onSave={handleSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            hasSelection={!!selectedObjectId}
            saving={saving}
          />

          <CanvasStage
            layout={layout}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={updateObjectById}
          />

          <PropertiesPanel
            selectedObject={selectedObject}
            onUpdateSelectedObject={updateSelectedObject}
          />
        </div>
      )}
    </div>
  );
}
