
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export interface HistoricalEdgeData {
  type: string;
  customLabel?: string;
}

type HistoricalEdgeProps = EdgeProps<{ type: string; customLabel?: string }>;

export function HistoricalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: HistoricalEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data || { type: 'connected' };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="px-2 py-1 bg-white rounded shadow-sm border text-sm">
            {edgeData.customLabel || edgeData.type || 'connected'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
