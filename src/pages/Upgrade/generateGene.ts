import masterBloodweb from "../../assets/master-bloodweb.json";

interface Node {
  id: string;
  tier: number;
  index: number;
  x: number;
  y: number;
  angle: number;
}

interface BloodNode extends Node {
  type: string;
}

interface BloodWebType {
  links: {
    source: string;
    target: string;
    type: string;
  }[];
  nodes: Node[];
  totalLinks: number;
  totalNodes: number;
}

const commonGenes = [
  {
    name: "test",
    cost: 100,
  },
  {
    name: "test2",
    cost: 100,
  },
];

const rareGenes = [
  {
    name: "test3",
    cost: 100,
  },
  {
    name: "test4",
    cost: 100,
  },
];

const legendaryGenes = [
  {
    name: "test5",
    cost: 100,
  },
  {
    name: "test6",
    cost: 100,
  },
];

const genes: Record<string, { name: string; cost: number }[]> = {
  common: commonGenes,
  rare: rareGenes,
  legendary: legendaryGenes,
};

const genesTierWeights: Record<number, { common: number; rare: number; legendary: number }> = {
  1: {
    common: 0.8,
    rare: 0.15,
    legendary: 0.05,
  },
  2: {
    common: 0.6,
    rare: 0.3,
    legendary: 0.1,
  },
  3: {
    common: 0.4,
    rare: 0.4,
    legendary: 0.2,
  },
};

function getReward(weights: Record<string, number>, random: number) {
  let cumulativeWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    cumulativeWeight += weight; // 가중치를 계속 누적해서 더함

    if (random < cumulativeWeight) {
      return key; // 랜덤값이 누적 범위보다 작으면 해당 항목 당첨
    }
  }
  return "common";
}

function generateGene() {
  const bloodWebObj = masterBloodweb satisfies BloodWebType;

  // 1. 삭제할 노드 후보군 필터링 (그래프 단절 방지)
  // 예: 0티어(가장 안쪽/시작점) 노드는 절대 지워지지 않도록 보호합니다.
  const deletableCandidates = bloodWebObj.nodes
    .filter((node) => node.tier > 0) // tier가 0보다 큰 바깥쪽 노드들만 후보로 지정
    .map((node) => node.id);

  // 2. 중복 없이 정확히 5개 무작위 선출
  const nodesToRemove: string[] = [];
  const targetCount = Math.min(5, deletableCandidates.length); // 후보가 5개보다 적을 경우 예외 처리

  for (let i = 0; i < targetCount; i++) {
    // 남은 후보군 중에서 랜덤 인덱스 선택
    const randomIndex = Math.floor(Math.random() * deletableCandidates.length);
    // splice를 사용해 후보군에서 꺼내오기 (중복 원천 차단)
    const [removedId] = deletableCandidates.splice(randomIndex, 1);
    nodesToRemove.push(removedId);
  }

  // 3. 해당 노드 제외 (BloodNode[] 타입 변환 및 유전자 할당)
  const filteredNodes = bloodWebObj.nodes.filter((node) => !nodesToRemove.includes(node.id));

  const bloodNodes: BloodNode[] = filteredNodes.map((node) => {
    if (node.tier === 0) {
      return {
        ...node,
        type: "", // 아이템이 없음을 나타내는 빈 문자열 (또는 "none")
      };
    }
    const tierWeights = genesTierWeights[node.tier];
    // 3. 가중치 범위 체크 함수

    const result = getReward(tierWeights, Math.random());
    return {
      ...node,
      type: genes[result][Math.floor(Math.random() * genes[result].length)].name,
    };
  });

  // 4. 지워진 노드와 연결된 링크도 함께 제거
  const filteredLinks = bloodWebObj.links.filter(
    (link) => !nodesToRemove.includes(link.source) && !nodesToRemove.includes(link.target),
  );

  return { bloodNodes, filteredLinks };
}

export default generateGene;
