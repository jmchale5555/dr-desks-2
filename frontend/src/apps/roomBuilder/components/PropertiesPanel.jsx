const numberFields = ['x', 'y', 'width', 'height', 'rotation'];

export default function PropertiesPanel({ selectedObject, onUpdateSelectedObject }) {
  if (!selectedObject) {
    return (
      <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Select an object to edit its properties.</p>
      </aside>
    );
  }

  const handleNumberChange = (field, value) => {
    onUpdateSelectedObject({ [field]: Number(value) });
  };

  return (
    <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h2>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Label</label>
        <input
          type="text"
          value={selectedObject.meta?.label || ''}
          onChange={(e) => onUpdateSelectedObject({ meta: { ...selectedObject.meta, label: e.target.value } })}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {numberFields.map((field) => (
          <div key={field}>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{field}</label>
            <input
              type="number"
              value={selectedObject[field]}
              onChange={(e) => handleNumberChange(field, e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
