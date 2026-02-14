import { Fragment } from 'react';
import { Layer, Rect, Stage, Text } from 'react-konva';

const STATUS_COLORS = {
  unknown: { fill: '#d1d5db', stroke: '#6b7280' },
  available: { fill: '#bbf7d0', stroke: '#16a34a' },
  unavailable: { fill: '#fecaca', stroke: '#dc2626' },
  inactive: { fill: '#e5e7eb', stroke: '#9ca3af' },
};

function getDeskKey(obj) {
  if (obj?.meta?.deskId) return `id:${obj.meta.deskId}`;
  if (obj?.meta?.deskNumber) return `num:${obj.meta.deskNumber}`;
  return null;
}

export default function RoomLayoutViewer({
  layout,
  desks,
  deskStatusById,
  selectedDeskId,
  interactive,
  onDeskSelect,
  state,
  message,
}) {
  const canvasWidth = layout?.canvas_width || 800;
  const canvasHeight = layout?.canvas_height || 800;
  const objects = layout?.layout_json?.objects || [];
  const deskObjects = objects.filter((obj) => obj.type === 'desk');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Room Map</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{canvasWidth} x {canvasHeight}</span>
      </div>

      {message && (
        <div className="text-xs rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          {message}
        </div>
      )}

      {(state === 'noRoomSelected' || state === 'layoutLoading' || state === 'layoutMissing') ? (
        <div className="h-48 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {message}
        </div>
      ) : (
        <div className="rounded-md border border-gray-300 dark:border-gray-600 overflow-auto bg-gray-50 dark:bg-gray-900/20">
          <Stage width={canvasWidth} height={canvasHeight}>
            <Layer>
              {deskObjects.map((obj) => {
                const key = getDeskKey(obj);
                const deskStatus = (key && deskStatusById[key]) || 'unknown';
                const isSelected = String(selectedDeskId) === String(obj.meta?.deskId);
                const colors = STATUS_COLORS[deskStatus] || STATUS_COLORS.unknown;
                const label = obj.meta?.label || `Desk ${obj.meta?.deskNumber || ''}`;
                const canSelect = interactive && deskStatus === 'available' && obj.meta?.deskId;

                return (
                  <Fragment key={obj.id}>
                    <Rect
                      x={obj.x}
                      y={obj.y}
                      width={obj.width}
                      height={obj.height}
                      rotation={obj.rotation || 0}
                      fill={colors.fill}
                      stroke={isSelected ? '#2563eb' : colors.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      dash={deskStatus === 'inactive' ? [4, 3] : []}
                      onClick={() => canSelect && onDeskSelect(String(obj.meta.deskId))}
                      onTap={() => canSelect && onDeskSelect(String(obj.meta.deskId))}
                      opacity={deskStatus === 'inactive' ? 0.7 : 1}
                    />
                    <Text
                      x={obj.x + 4}
                      y={obj.y + Math.max((obj.height - 12) / 2, 2)}
                      width={Math.max(obj.width - 8, 8)}
                      height={Math.max(obj.height - 4, 12)}
                      rotation={obj.rotation || 0}
                      text={label}
                      fontSize={12}
                      align="center"
                      verticalAlign="middle"
                      wrap="none"
                      ellipsis
                      fill="#111827"
                      listening={false}
                    />
                  </Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded bg-green-200 border border-green-600"></span>Available</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded bg-red-200 border border-red-600"></span>Unavailable</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded bg-gray-300 border border-gray-600"></span>Unknown</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded border border-gray-400 bg-gray-200"></span>Inactive</div>
      </div>

      {desks.length === 0 && state !== 'layoutLoading' && (
        <p className="text-xs text-gray-500 dark:text-gray-400">No desks loaded for this room.</p>
      )}
    </div>
  );
}
