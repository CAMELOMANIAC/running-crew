#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
// node generate-master-templet.cjs
// ==========================================
// [설정 값] 블러드웹의 구조를 결정하는 상수
// ==========================================
const TIER_CONFIG = [
  { tier: 0, radius: 0, nodeCount: 1 }, // 중심점 (레벨)
  { tier: 1, radius: 140, nodeCount: 6 }, // 1티어 링 (6개 노드, 60도 간격)
  { tier: 2, radius: 260, nodeCount: 12 }, // 2티어 링 (12개 노드, 30도 간격)
  { tier: 3, radius: 380, nodeCount: 18 }, // 3티어 링 (18개 노드, 20도 간격)
];

const nodes = [];
const links = [];

// ==========================================
// 1. 노드(Nodes) 생성 로직
// ==========================================
TIER_CONFIG.forEach(({ tier, radius, nodeCount }) => {
  for (let i = 0; i < nodeCount; i++) {
    // 360도를 노드 개수만큼 균등 분할 (라디안 변환)
    const angleDegrees = (360 / nodeCount) * i;
    const angleRadians = (angleDegrees * Math.PI) / 180;

    // 중심(0,0) 기준 상대 좌표 계산 (소수점 첫째짜리 반올림)
    const x = Math.round(radius * Math.cos(angleRadians) * 10) / 10;
    const y = Math.round(radius * Math.sin(angleRadians) * 10) / 10;

    nodes.push({
      id: `node_${tier}_${i}`,
      tier,
      index: i,
      x,
      y,
      angle: Math.round(angleDegrees),
    });
  }
});

// 빠른 조회를 위해 티어별로 노드를 분류
const nodesByTier = (tier) => nodes.filter((n) => n.tier === tier);

// ==========================================
// 2. 링크(Links) 생성 로직 (교차 구조 포함)
// ==========================================

// --- [규칙 A] 같은 티어 내부의 가로(원형) 연결선 ---
TIER_CONFIG.forEach(({ tier, nodeCount }) => {
  if (tier === 0) return;
  const tierNodes = nodesByTier(tier);

  for (let i = 0; i < nodeCount; i++) {
    const current = tierNodes[i];
    const next = tierNodes[(i + 1) % nodeCount]; // 마지막 노드는 다시 0번째 노드와 연결
    links.push({ source: current.id, target: next.id, type: "HORIZONTAL" });
  }
});

// --- [규칙 B] 중심점(Tier 0)에서 1티어로 뻗어나가는 세로선 ---
const centerNode = nodesByTier(0)[0];
nodesByTier(1).forEach((node) => {
  links.push({ source: centerNode.id, target: node.id, type: "VERTICAL" });
});

// --- [규칙 C] 1티어 ➡️ 2티어 ➡️ 3티어 간의 세로 및 사선 교차선 ---
const connectTiers = (innerTier, outerTier) => {
  const innerNodes = nodesByTier(innerTier);
  const outerNodes = nodesByTier(outerTier);

  innerNodes.forEach((inner) => {
    outerNodes.forEach((outer) => {
      // 두 노드의 각도 차이 계산
      let angleDiff = Math.abs(inner.angle - outer.angle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      // 각도 차이가 15도 이하면 '직선(세로)'으로 연결
      if (angleDiff <= 15) {
        links.push({ source: inner.id, target: outer.id, type: "VERTICAL" });
      }
      // 각도 차이가 16도 이상 35도 이하면 '사선(교차)'으로 연결
      else if (angleDiff > 15 && angleDiff <= 35) {
        links.push({ source: inner.id, target: outer.id, type: "CROSS" });
      }
    });
  });
};

connectTiers(1, 2); // 1티어와 2티어 연결
connectTiers(2, 3); // 2티어와 3티어 연결

// ==========================================
// 3. 파일 저장 (master-bloodweb.json)
// ==========================================
const outputData = {
  totalNodes: nodes.length,
  totalLinks: links.length,
  nodes,
  links,
};

const outputPath = path.join(process.cwd(), "master-bloodweb.json");
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");

console.log(`\n✅ 마스터 템플릿 생성 완료!`);
console.log(`📍 위치: ${outputPath}`);
console.log(`📊 통계: 노드 ${nodes.length}개 / 링크 ${links.length}개 (가로, 세로, 사선 교차 포함)\n`);
