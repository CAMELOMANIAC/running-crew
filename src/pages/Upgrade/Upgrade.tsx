import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { Container, Graphics, TextStyle, Text } from "pixi.js";
import { extend, Application, useApplication } from "@pixi/react";
import { useAppStore } from "../../stores/appStore";
import generateGene from "./generateGene";
import "./Upgrade.css";

// Extend Pixi React components
extend({
  Container,
  Graphics,
  Text,
});

// Type definitions
interface BloodNode {
  id: string;
  tier: number;
  index: number;
  x: number;
  y: number;
  angle: number;
  type: string;
}

interface BloodLink {
  source: string;
  target: string;
  type: string;
}

interface GeneDef {
  cost: number;
  rarity: "common" | "rare" | "legendary";
  stat: "scorePerSecondRun" | "runDuration" | "scorePerSecondIdle";
  value: number;
}

// Map genes to upgrades
const GENE_DEFS: Record<string, GeneDef> = {
  test: { cost: 150, rarity: "common", stat: "scorePerSecondRun", value: 1.0 },
  test2: { cost: 150, rarity: "common", stat: "runDuration", value: 0.2 },
  test3: { cost: 350, rarity: "rare", stat: "scorePerSecondRun", value: 3.0 },
  test4: { cost: 350, rarity: "rare", stat: "runDuration", value: 0.5 },
  test5: { cost: 800, rarity: "legendary", stat: "scorePerSecondRun", value: 8.0 },
  test6: { cost: 700, rarity: "legendary", stat: "scorePerSecondIdle", value: 0.15 },
};

const getGeneDef = (type: string): GeneDef => {
  return (
    GENE_DEFS[type] || { cost: 100, rarity: "common", stat: "scorePerSecondRun", value: 0.5 }
  );
};

const emojiTextStyle = new TextStyle({
  fontSize: 16,
  align: "center",
});

const centerTextStyle = new TextStyle({
  fontSize: 22,
  align: "center",
});

// Node component
const NodeComponent = ({
  node,
  isPurchased,
  isPurchasable,
  isHovered,
  onPointerOver,
  onPointerOut,
  onPointerTap,
  pulseScale,
}: {
  node: BloodNode;
  isPurchased: boolean;
  isPurchasable: boolean;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerTap: () => void;
  pulseScale: number;
}) => {
  const geneDef = getGeneDef(node.type);
  const radius = node.tier === 0 ? 32 : 24;

  const drawNode = useCallback(
    (g: any) => {
      g.clear();

      let borderCol = 0x3d313a;
      let fillCol = 0x1c171d;
      let alpha = 0.85;
      let borderWidth = 2;

      if (node.tier > 0) {
        if (geneDef.rarity === "common") {
          borderCol = 0xcd7f32;
        } else if (geneDef.rarity === "rare") {
          borderCol = 0x10b981;
        } else if (geneDef.rarity === "legendary") {
          borderCol = 0xa855f7;
        }
      } else {
        borderCol = 0xff3c64;
      }

      if (isPurchased) {
        fillCol = borderCol;
        alpha = 0.95;
        borderWidth = 4;
      } else if (isPurchasable) {
        fillCol = 0x110712;
        alpha = 0.9;
        borderWidth = 3;
      } else {
        fillCol = 0x1a1a1a;
        alpha = 0.55;
        borderWidth = 1.5;
      }

      if (isHovered) {
        g.circle(0, 0, radius + 8);
        g.fill({ color: borderCol, alpha: 0.15 });
        borderWidth += 1;
      }

      g.circle(0, 0, radius);
      g.fill({ color: fillCol, alpha });
      g.stroke({ width: borderWidth, color: borderCol });

      if (isPurchasable || isPurchased) {
        g.circle(0, 0, radius - 4);
        g.stroke({ width: 1, color: borderCol, alpha: 0.4 });
      }
    },
    [node.tier, geneDef.rarity, isPurchased, isPurchasable, isHovered, radius]
  );

  let scale = 1.0;
  if (isHovered) {
    scale = 1.15;
  } else if (isPurchasable) {
    scale = pulseScale;
  }

  let emoji = "⭐";
  if (node.tier > 0) {
    if (geneDef.stat === "scorePerSecondRun") emoji = "🏃";
    else if (geneDef.stat === "runDuration") emoji = "⏳";
    else if (geneDef.stat === "scorePerSecondIdle") emoji = "💤";
  }

  return (
    <pixiContainer
      x={node.x}
      y={node.y}
      scale={scale}
      eventMode="static"
      cursor="pointer"
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerTap={onPointerTap}
    >
      <pixiGraphics draw={drawNode} />
      <pixiText
        text={emoji}
        anchor={0.5}
        x={0}
        y={0}
        style={node.tier === 0 ? centerTextStyle : emojiTextStyle}
      />
    </pixiContainer>
  );
};

// Connections Layer
const BloodwebLinks = ({
  links,
  nodesMap,
  purchasedNodeIds,
  purchasableNodeIds,
}: {
  links: BloodLink[];
  nodesMap: Map<string, BloodNode>;
  purchasedNodeIds: Set<string>;
  purchasableNodeIds: Set<string>;
}) => {
  const draw = useCallback(
    (g: any) => {
      g.clear();
      links.forEach((link) => {
        const src = nodesMap.get(link.source);
        const tgt = nodesMap.get(link.target);
        if (!src || !tgt) return;

        const srcPurchased = purchasedNodeIds.has(src.id);
        const tgtPurchased = purchasedNodeIds.has(tgt.id);

        let color = 0x3a2536;
        let alpha = 0.4;
        let width = 1.5;

        if (srcPurchased && tgtPurchased) {
          color = 0xff3c64;
          alpha = 0.9;
          width = 3.5;
        } else if (
          (srcPurchased && purchasableNodeIds.has(tgt.id)) ||
          (tgtPurchased && purchasableNodeIds.has(src.id))
        ) {
          color = 0x9e2a40;
          alpha = 0.6;
          width = 2.5;
        }

        g.moveTo(src.x, src.y);
        g.lineTo(tgt.x, tgt.y);
        g.stroke({ width, color, alpha });
      });
    },
    [links, nodesMap, purchasedNodeIds, purchasableNodeIds]
  );

  return <pixiGraphics draw={draw} />;
};

// Canvas Content Wrapper
const BloodwebCanvasContent = ({
  bloodNodes,
  filteredLinks,
  purchasedNodeIds,
  purchasableNodeIds,
  hoveredNodeId,
  setHoveredNodeId,
  onNodeClick,
  pulseScale,
}: {
  bloodNodes: BloodNode[];
  filteredLinks: BloodLink[];
  purchasedNodeIds: Set<string>;
  purchasableNodeIds: Set<string>;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  onNodeClick: (node: BloodNode) => void;
  pulseScale: number;
}) => {
  const { app } = useApplication();
  const viewportRef = useRef<any>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);

  useEffect(() => {
    if (app && viewportRef.current) {
      const cx = app.screen.width / 2;
      const cy = app.screen.height / 2;
      viewportRef.current.position.set(cx, cy);
      panRef.current = { x: cx, y: cy };
      zoomRef.current = 1.0;
      viewportRef.current.scale.set(1.0);
    }
  }, [app, bloodNodes]);

  useEffect(() => {
    if (!app || !app.canvas) return;
    const canvas = app.canvas;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      let newZoom = zoomRef.current;
      if (e.deltaY < 0) {
        newZoom *= zoomFactor;
      } else {
        newZoom /= zoomFactor;
      }
      newZoom = Math.max(0.35, Math.min(2.2, newZoom));
      zoomRef.current = newZoom;
      if (viewportRef.current) {
        viewportRef.current.scale.set(newZoom);
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [app]);

  const handleBgPointerDown = (e: any) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.data.global.x - panRef.current.x,
      y: e.data.global.y - panRef.current.y,
    };
  };

  const handleBgPointerMove = (e: any) => {
    if (!isDragging.current) return;
    const newX = e.data.global.x - dragStart.current.x;
    const newY = e.data.global.y - dragStart.current.y;
    panRef.current = { x: newX, y: newY };
    if (viewportRef.current) {
      viewportRef.current.position.set(newX, newY);
    }
  };

  const handleBgPointerUp = () => {
    isDragging.current = false;
  };

  const drawBackground = useCallback((g: any) => {
    g.clear();
    g.circle(0, 0, 140);
    g.stroke({ width: 1.5, color: 0x3a2536, alpha: 0.25 });

    g.circle(0, 0, 260);
    g.stroke({ width: 1.5, color: 0x3a2536, alpha: 0.2 });

    g.circle(0, 0, 380);
    g.stroke({ width: 1.5, color: 0x3a2536, alpha: 0.15 });
  }, []);

  const nodesMap = useMemo(() => {
    const map = new Map<string, BloodNode>();
    bloodNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [bloodNodes]);

  return (
    <>
      <pixiContainer
        eventMode="static"
        onPointerDown={handleBgPointerDown}
        onPointerMove={handleBgPointerMove}
        onPointerUp={handleBgPointerUp}
        onPointerUpOutside={handleBgPointerUp}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            if (app) {
              g.rect(0, 0, app.screen.width, app.screen.height);
              g.fill({ color: 0x070308, alpha: 0.001 });
            }
          }}
        />
      </pixiContainer>

      <pixiContainer ref={viewportRef}>
        <pixiGraphics draw={drawBackground} />

        <BloodwebLinks
          links={filteredLinks}
          nodesMap={nodesMap}
          purchasedNodeIds={purchasedNodeIds}
          purchasableNodeIds={purchasableNodeIds}
        />

        {bloodNodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isPurchased={purchasedNodeIds.has(node.id)}
            isPurchasable={purchasableNodeIds.has(node.id)}
            isHovered={hoveredNodeId === node.id}
            onPointerOver={() => setHoveredNodeId(node.id)}
            onPointerOut={() => setHoveredNodeId(null)}
            onPointerTap={() => onNodeClick(node)}
            pulseScale={pulseScale}
          />
        ))}
      </pixiContainer>
    </>
  );
};

// Main Component
const Upgrade = () => {
  const { id } = useParams<{ id: string }>();
  const canvasParentRef = useRef<HTMLDivElement>(null);

  const runnerId = id ? parseInt(id, 10) : 0;
  const runner = useAppStore((state) => state.runnerData[runnerId]);
  const score = useAppStore((state) => state.score);

  const [bloodweb, setBloodweb] = useState<{ bloodNodes: BloodNode[]; filteredLinks: BloodLink[] }>(() =>
    generateGene() as any
  );
  const { bloodNodes, filteredLinks } = bloodweb;

  const [purchasedNodeIds, setPurchasedNodeIds] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pulseScale, setPulseScale] = useState(1.0);

  useEffect(() => {
    const centerNode = bloodNodes.find((n) => n.tier === 0);
    if (centerNode) {
      setPurchasedNodeIds(new Set([centerNode.id]));
    } else {
      setPurchasedNodeIds(new Set());
    }
    setHoveredNodeId(null);
  }, [bloodNodes]);

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.1;
      setPulseScale(1.0 + Math.sin(angle) * 0.05);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  const purchasableNodeIds = useMemo(() => {
    const purchasables = new Set<string>();
    filteredLinks.forEach((link) => {
      const srcPurchased = purchasedNodeIds.has(link.source);
      const tgtPurchased = purchasedNodeIds.has(link.target);

      if (srcPurchased && !tgtPurchased) {
        purchasables.add(link.target);
      }
      if (tgtPurchased && !srcPurchased) {
        purchasables.add(link.source);
      }
    });
    return purchasables;
  }, [filteredLinks, purchasedNodeIds]);

  const purchaseNode = useCallback(
    (node: BloodNode) => {
      const geneDef = getGeneDef(node.type);
      if (score < geneDef.cost) {
        alert("점수가 부족합니다!");
        return;
      }

      useAppStore.setState((state) => {
        const r = state.runnerData[runnerId];
        if (!r) return state;

        const currentVal = r[geneDef.stat] ?? 0;
        const newVal = Math.round((currentVal + geneDef.value) * 100) / 100;

        const updatedRunner = {
          ...r,
          [geneDef.stat]: newVal,
        };

        return {
          score: state.score - geneDef.cost,
          runnerData: {
            ...state.runnerData,
            [runnerId]: updatedRunner,
          },
        };
      });

      useAppStore.getState().emitRunnerState();
      setPurchasedNodeIds((prev) => new Set([...prev, node.id]));
    },
    [score, runnerId]
  );

  const handleNodeClick = useCallback(
    (node: BloodNode) => {
      if (purchasableNodeIds.has(node.id)) {
        purchaseNode(node);
      }
    },
    [purchasableNodeIds, purchaseNode]
  );

  // Auto-regenerate when all genes are completed
  useEffect(() => {
    const nonCenterNodes = bloodNodes.filter((n) => n.tier > 0);
    if (nonCenterNodes.length > 0 && nonCenterNodes.every((n) => purchasedNodeIds.has(n.id))) {
      const timeout = setTimeout(() => {
        setBloodweb(generateGene() as any);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [purchasedNodeIds, bloodNodes]);

  if (!runner) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>러너 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="upgrade-container">
      <div className="canvas-container" ref={canvasParentRef} style={{ width: "100vw", height: "100vh" }}>
        <Application resizeTo={canvasParentRef} backgroundAlpha={0}>
          <BloodwebCanvasContent
            bloodNodes={bloodNodes}
            filteredLinks={filteredLinks}
            purchasedNodeIds={purchasedNodeIds}
            purchasableNodeIds={purchasableNodeIds}
            hoveredNodeId={hoveredNodeId}
            setHoveredNodeId={setHoveredNodeId}
            onNodeClick={handleNodeClick}
            pulseScale={pulseScale}
          />
        </Application>
      </div>
    </div>
  );
};

export default Upgrade;
