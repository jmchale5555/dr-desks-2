import { useEffect, useMemo, useRef } from 'react';
import { Fragment } from 'react';
import { Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';

const MIN_SIZE = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function CanvasStage({ layout, selectedObjectId, onSelectObject, onUpdateObject }) {
  const objects = layout?.layout_json?.objects || [];
  const canvasWidth = layout?.canvas_width || 800;
  const canvasHeight = layout?.canvas_height || 800;
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});

  useEffect(() => {
    const transformer = transformerRef.current;
    const selectedNode = selectedObjectId ? shapeRefs.current[selectedObjectId] : null;

    if (!transformer) return;

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedObjectId, objects]);

  const gridLines = useMemo(() => {
    const grid = layout?.layout_json?.grid;
    if (!grid?.enabled || !grid?.size) return [];

    const lines = [];
    for (let x = 0; x <= canvasWidth; x += grid.size) {
      lines.push({ id: `vx_${x}`, points: [x, 0, x, canvasHeight] });
    }
    for (let y = 0; y <= canvasHeight; y += grid.size) {
      lines.push({ id: `hz_${y}`, points: [0, y, canvasWidth, y] });
    }
    return lines;
  }, [layout, canvasWidth, canvasHeight]);

  const snap = (value) => {
    const grid = layout?.layout_json?.grid;
    if (!grid?.enabled || !grid?.snap || !grid?.size) return value;
    return Math.round(value / grid.size) * grid.size;
  };

  const constrainPosition = (obj, x, y) => {
    const width = obj.width || 0;
    const height = obj.height || 0;
    return {
      x: clamp(snap(x), 0, Math.max(canvasWidth - width, 0)),
      y: clamp(snap(y), 0, Math.max(canvasHeight - height, 0)),
    };
  };

  const handleDragEnd = (obj, e) => {
    const next = constrainPosition(obj, e.target.x(), e.target.y());
    onUpdateObject(obj.id, next);
  };

  const handleTransformEnd = (obj) => {
    const node = shapeRefs.current[obj.id];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rawWidth = Math.max(MIN_SIZE, node.width() * scaleX);
    const rawHeight = Math.max(MIN_SIZE, node.height() * scaleY);
    const width = snap(rawWidth);
    const height = snap(rawHeight);
    const rotation = snap(Math.round(node.rotation() / 15) * 15);

    node.scaleX(1);
    node.scaleY(1);

    const nextPos = constrainPosition(obj, node.x(), node.y());
    onUpdateObject(obj.id, {
      ...nextPos,
      width,
      height,
      rotation,
    });
  };

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Canvas</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {canvasWidth} x {canvasHeight}
        </p>
      </div>

      <div className="rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900/20 overflow-auto">
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              onSelectObject(null);
            }
          }}
        >
          <Layer>
            {gridLines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke="#e5e7eb"
                strokeWidth={1}
                listening={false}
              />
            ))}
          </Layer>

          <Layer>
            {objects.map((obj) => {
              const isSelected = selectedObjectId === obj.id;
              const fill = obj.type === 'desk' ? '#93c5fd' : '#d1d5db';
              const stroke = isSelected ? '#2563eb' : '#4b5563';
              const strokeWidth = isSelected ? 2 : 1;

              return (
                <Fragment key={obj.id}>
                  <Rect
                    ref={(node) => {
                      if (node) shapeRefs.current[obj.id] = node;
                    }}
                    x={obj.x}
                    y={obj.y}
                    width={obj.width}
                    height={obj.height}
                    rotation={obj.rotation || 0}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    draggable={!obj.locked}
                    onClick={() => onSelectObject(obj.id)}
                    onTap={() => onSelectObject(obj.id)}
                    onDragEnd={(e) => handleDragEnd(obj, e)}
                    onTransformEnd={() => handleTransformEnd(obj)}
                  />
                  <Text
                    x={obj.x + 4}
                    y={obj.y + Math.max((obj.height - 12) / 2, 2)}
                    width={Math.max(obj.width - 8, 8)}
                    height={Math.max(obj.height - 4, 12)}
                    rotation={obj.rotation || 0}
                    text={obj.meta?.label || obj.id}
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

            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      {objects.length === 0 && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No objects yet. Add one from the tools panel.</p>
      )}
    </section>
  );
}
