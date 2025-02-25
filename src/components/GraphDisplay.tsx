import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  ReactFlowInstance,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge as addEdgeReactFlow,
  OnConnectStartParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BaseNode from "./nodes/BaseNode";
import { useGraph } from "@/context/GraphContext";
import { debounce } from "lodash";
import { NodeData, EdgeTypes, EdgeType } from "@/lib/types";
import dagre from "dagre";

const nodeTypes = {
  custom: BaseNode,
};

const getEdgeStyle = (type: EdgeType) => {
  const styles: Record<string, React.CSSProperties> = {
    [EdgeTypes.CAUSES]: { stroke: "#ef4444", strokeWidth: 2 },
    [EdgeTypes.INFLUENCES]: { stroke: "#a855f7", strokeWidth: 2 },
    [EdgeTypes.PARTICIPATES]: { stroke: "#3b82f6", strokeWidth: 2 },
    [EdgeTypes.LOCATED]: { stroke: "#22c55e", strokeWidth: 2 },
  };
  return styles[type] || { stroke: "#64748b", strokeWidth: 2 };
};

const useResizeObserver = (ref: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return dimensions;
};

function hasType(data: any): data is { type: string } {
  return typeof data === "object" && data !== null && "type" in data;
}

const getLayoutedElements = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node<NodeData>[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 172;
  const nodeHeight = 36;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const GraphDisplay = () => {
  const {
    nodes: contextNodes,
    edges: contextEdges,
    selectNode,
    selectEdge,
    addEdge: addNewEdge,
    setContainerDimensions,
    containerDimensions,
    defaultEdgeType,
  } = useGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState(contextNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(contextEdges);

  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const dimensions = useResizeObserver(containerRef);

  const debouncedFitView = useCallback(
    debounce(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView();
      }
    }, 200),
    []
  );

  useEffect(() => {
    if (dimensions?.width && dimensions?.height) {
      if (
        !containerDimensions ||
        dimensions.width !== containerDimensions.width ||
        dimensions.height !== containerDimensions.height
      ) {
        setContainerDimensions({
          width: dimensions.width,
          height: dimensions.height,
        });
        debouncedFitView();
      }
    }
  }, [
    dimensions,
    containerDimensions,
    setContainerDimensions,
    debouncedFitView,
  ]);

  // Sync context nodes and edges into React Flow state
  useEffect(() => {
    setNodes(contextNodes);
    setEdges(contextEdges);
  }, [contextNodes, contextEdges, setNodes, setEdges]);

  // Layout the graph when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0) {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, [nodes.length, edges.length, nodes, edges, setNodes, setEdges]);

  const flowNodes = nodes.map((node) => ({
    id: node.id,
    type: "custom",
    position: node.position || { x: 0, y: 0 },
    data: node.data,
    draggable: true,
  }));

  const flowEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true,
    style: getEdgeStyle(edge.type as EdgeType),
    data: { type: edge.type },
  }));

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      selectNode(node);
    },
    [selectNode]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: (edge.label || "") as string,
        type: (edge.data?.type as EdgeType) || defaultEdgeType,
      });
    },
    [selectEdge, defaultEdgeType]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge = {
          id: `edge-${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          label: "New Connection",
          type: EdgeTypes.INFLUENCES,
        };
        setEdges((eds) => addEdgeReactFlow(newEdge, eds));

        // Sync with context
        addNewEdge(newEdge);
      }
    },
    [addNewEdge, setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    instance.fitView();
  }, []);

  const onConnectStart = useCallback(
    (connection: OnConnectStartParams, event: React.MouseEvent) => {
      // Optional: handle connection start
    },
    []
  );

  const onConnectEnd = useCallback((event: React.MouseEvent) => {
    // Optional: handle connection end
  }, []);

  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-background border-x">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        connectOnClick={false}
        connectionMode={ConnectionMode.Loose}
        onInit={onInit}
        fitView
        attributionPosition="bottom-right"
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (hasType(node.data)) {
              const colors: Record<string, string> = {
                person: "#3b82f6",
                event: "#ef4444",
                place: "#22c55e",
                concept: "#a855f7",
              };
              return colors[node.data.type] || "#64748b";
            }
            return "#64748b";
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;
