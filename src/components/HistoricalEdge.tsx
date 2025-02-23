import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export interface HistoricalEdgeData {
  type: string;
  customLabel?: string;
  id: string;
  source: string;
  target: string;
  style?: React.CSSProperties;
}

export type HistoricalEdgeType = EdgeProps<HistoricalEdgeData>;

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
}: HistoricalEdgeType) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeLabel = data?.customLabel || data?.type || 'connected';

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
            {edgeLabel}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
