import { useState } from 'react';

const TOOLS = [
  { id: 'select', label: 'Select' },
  { id: 'desk', label: 'Desk' },
  { id: 'rectangle', label: 'Rectangle' },
];

export default function ToolPanel({
  selectedTool,
  onToolChange,
  onAddObject,
  onDeleteSelected,
  onDuplicateSelected,
  onGenerateFromDesks,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSelection,
  saving,
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tools</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToolChange(tool.id)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            Redo
          </button>
        </div>
        <button
          type="button"
          onClick={onAddObject}
          className="w-full px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Add Object
        </button>
        <button
          type="button"
          onClick={onDuplicateSelected}
          disabled={!hasSelection}
          className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
        >
          Duplicate Selected
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className="w-full px-3 py-2 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 disabled:opacity-50"
        >
          Delete Selected
        </button>
        <button
          type="button"
          onClick={onGenerateFromDesks}
          className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
        >
          Generate From Desks
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>

      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
        <button
          type="button"
          onClick={() => setShowShortcuts((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200"
        >
          <span>Shortcuts</span>
          <span>{showShortcuts ? 'Hide' : 'Show'}</span>
        </button>

        {showShortcuts && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">Undo: Ctrl/Cmd+Z</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Redo: Ctrl/Cmd+Y or Shift+Ctrl/Cmd+Z</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Duplicate: Ctrl/Cmd+D</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Delete: Delete/Backspace</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Nudge: Arrows (Shift = 10px)</p>
          </div>
        )}
      </div>
    </aside>
  );
}
