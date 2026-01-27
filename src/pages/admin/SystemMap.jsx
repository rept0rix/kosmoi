import React, { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [
  // Roles
  {
    id: "guest",
    position: { x: 250, y: 0 },
    data: { label: "👤 Guest" },
    style: {
      background: "#1e293b",
      color: "#94a3b8",
      width: 100,
      border: "1px solid #334155",
      borderRadius: "8px",
    },
  },
  {
    id: "user",
    position: { x: 100, y: 150 },
    data: { label: "🔑 User" },
    style: {
      background: "#172554",
      color: "#60a5fa",
      width: 100,
      border: "1px solid #2563eb",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(37, 99, 235, 0.3)",
    },
  },
  {
    id: "admin",
    position: { x: 400, y: 150 },
    data: { label: "🛡️ Admin" },
    style: {
      background: "#451a03",
      color: "#fbbf24",
      width: 100,
      border: "1px solid #d97706",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(217, 119, 6, 0.3)",
    },
  },
  {
    id: "vendor",
    position: { x: 700, y: 150 },
    data: { label: "💼 Vendor" },
    style: {
      background: "#052e16",
      color: "#4ade80",
      width: 100,
      border: "1px solid #16a34a",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(22, 163, 74, 0.3)",
    },
  },

  // Public Pages
  {
    id: "landing",
    position: { x: 250, y: 100 },
    data: { label: "Landing Page" },
    style: {
      background: "#020617",
      color: "#e2e8f0",
      border: "1px solid #1e293b",
    },
  },
  {
    id: "about",
    position: { x: 150, y: 300 },
    data: { label: "About Us" },
    parentId: "landing",
    style: { background: "#0f172a", color: "#cbd5e1" },
  },
  {
    id: "pricing",
    position: { x: 350, y: 300 },
    data: { label: "Pricing" },
    parentId: "landing",
    style: { background: "#0f172a", color: "#cbd5e1" },
  },

  // App Pages
  {
    id: "boardroom",
    position: { x: 0, y: 300 },
    data: { label: "🧠 Board Room" },
    style: {
      background: "#1e1b4b",
      color: "#fff",
      border: "1px solid #4f46e5",
      boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)",
    },
  },
  {
    id: "mapview",
    position: { x: 100, y: 400 },
    data: { label: "🗺️ Map View" },
    style: {
      background: "#164e63",
      color: "#fff",
      border: "1px solid #0891b2",
    },
  },

  // Admin Pages
  {
    id: "dashboard",
    position: { x: 400, y: 300 },
    data: { label: "📊 Dashboard" },
    style: {
      background: "#451a03",
      color: "#fff",
      border: "1px solid #d97706",
    },
  },
  {
    id: "users",
    position: { x: 350, y: 400 },
    data: { label: "User Mgmt" },
    style: { background: "#292524", color: "#d6d3d1" },
  },
  {
    id: "crm",
    position: { x: 450, y: 400 },
    data: { label: "CRM" },
    style: { background: "#292524", color: "#d6d3d1" },
  },

  // Vendor Pages
  {
    id: "vendorlite",
    position: { x: 700, y: 300 },
    data: { label: "📱 Vendor Lite" },
    style: {
      background: "#064e3b",
      color: "#fff",
      border: "1px solid #059669",
    },
  },
];

const initialEdges = [
  {
    id: "e1-1",
    source: "guest",
    target: "landing",
    style: { stroke: "#475569" },
  },

  {
    id: "e2-1",
    source: "landing",
    target: "boardroom",
    label: "Login",
    animated: true,
    style: { stroke: "#60a5fa" },
    labelStyle: { fill: "#94a3b8" },
  },
  {
    id: "e2-2",
    source: "user",
    target: "boardroom",
    style: { stroke: "#60a5fa" },
  },
  {
    id: "e2-3",
    source: "boardroom",
    target: "mapview",
    style: { stroke: "#22d3ee" },
  },

  {
    id: "e3-1",
    source: "admin",
    target: "dashboard",
    style: { stroke: "#fbbf24" },
  },
  {
    id: "e3-2",
    source: "dashboard",
    target: "users",
    style: { stroke: "#d97706" },
  },
  {
    id: "e3-3",
    source: "dashboard",
    target: "crm",
    style: { stroke: "#d97706" },
  },

  {
    id: "e4-1",
    source: "vendor",
    target: "vendorlite",
    style: { stroke: "#4ade80" },
  },
];

export default function SystemMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#020617" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls className="bg-slate-800 border-slate-700 fill-slate-200" />
        <MiniMap
          className="bg-slate-900 border-slate-700"
          nodeColor={(n) => {
            if (n.style?.background) return String(n.style.background);
            return "#fff";
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#334155"
        />

        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
          <h1 className="font-bold text-lg text-white">
            Kosmoi System Architecture
          </h1>
          <p className="text-sm text-slate-400">
            Live visualization of system nodes
          </p>
        </div>
      </ReactFlow>
    </div>
  );
}
