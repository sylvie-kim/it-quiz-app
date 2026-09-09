// 전체 연결 지도 — 159개 용어를 12개 주제 덩어리로 배치하고 승인된 관계를 선으로 잇는다.
//
// 배치는 난수를 쓰지 않는다. 같은 입력이면 항상 같은 좌표가 나와야 화면이 흔들리지 않고
// 테스트로 고정할 수 있다. 주제는 큰 원 위에 균등 배치하고, 주제 안의 용어는 개수에 따라
// 여러 겹의 작은 원으로 나눠 놓는다.

(function exposeOntologyGraph(root) {
    const schema = typeof module === 'object' && module.exports
        ? require('./ontology-schema.js')
        : root.ITQuizOntologySchema;

    const DEFAULTS = Object.freeze({
        width: 1000,
        height: 1000,
        clusterRadiusRatio: 0.34, // 주제 중심이 놓이는 큰 원의 반지름 비율
        ringGap: 26,              // 주제 안쪽 겹과 겹 사이 간격
        firstRingCount: 6,        // 첫 겹에 놓는 용어 수
        ringGrowth: 4,            // 겹이 하나 늘 때마다 늘어나는 자리 수
    });

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    // 주제 안에서 index번째 용어가 놓일 상대 좌표. 중심에서 겹겹이 바깥으로 나간다.
    function ringPosition(index, options) {
        const { ringGap, firstRingCount, ringGrowth } = options;
        let ring = 0;
        let remaining = index;
        for (;;) {
            const capacity = ring === 0 ? 1 : firstRingCount + (ring - 1) * ringGrowth;
            if (remaining < capacity) {
                if (ring === 0) return { dx: 0, dy: 0 };
                const angle = (remaining / capacity) * Math.PI * 2 - Math.PI / 2;
                const radius = ring * ringGap;
                return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
            }
            remaining -= capacity;
            ring += 1;
        }
    }

    function round(value) {
        return Math.round(value * 100) / 100;
    }

    function computeGraphLayout(ontology, overrides = {}) {
        const options = { ...DEFAULTS, ...overrides };
        const topics = list(ontology && ontology.topics);
        const registry = list(ontology && ontology.termRegistry);
        const relations = list(ontology && ontology.relations)
            .filter(relation => relation && relation.status === 'REVIEWED');

        const centerX = options.width / 2;
        const centerY = options.height / 2;
        const clusterRadius = Math.min(options.width, options.height) * options.clusterRadiusRatio;

        // 용어가 속한 첫 주제를 기준으로 묶는다. 여러 주제에 걸친 용어도 자리는 하나만 갖는다.
        const membersByTopic = new Map(topics.map(topic => [topic.id, []]));
        for (const term of registry) {
            const topicId = list(term.topicIds)[0];
            if (!membersByTopic.has(topicId)) continue;
            membersByTopic.get(topicId).push(term);
        }

        const degreeById = new Map();
        for (const relation of relations) {
            degreeById.set(relation.source, (degreeById.get(relation.source) || 0) + 1);
            degreeById.set(relation.target, (degreeById.get(relation.target) || 0) + 1);
        }

        const clusters = [];
        const nodes = [];
        const positionById = new Map();

        topics.forEach((topic, topicIndex) => {
            const angle = (topicIndex / topics.length) * Math.PI * 2 - Math.PI / 2;
            const cx = centerX + Math.cos(angle) * clusterRadius;
            const cy = centerY + Math.sin(angle) * clusterRadius;
            const members = membersByTopic.get(topic.id) || [];

            clusters.push({
                id: topic.id,
                label: topic.label,
                x: round(cx),
                y: round(cy),
                termCount: members.length,
                colorIndex: topicIndex,
            });

            members.forEach((term, memberIndex) => {
                const { dx, dy } = ringPosition(memberIndex, options);
                const x = round(cx + dx);
                const y = round(cy + dy);
                positionById.set(term.id, { x, y });
                nodes.push({
                    id: term.id,
                    label: term.label,
                    topicId: topic.id,
                    termKind: term.termKind,
                    colorIndex: topicIndex,
                    degree: degreeById.get(term.id) || 0,
                    x,
                    y,
                });
            });
        });

        const edges = relations
            .filter(relation => positionById.has(relation.source) && positionById.has(relation.target))
            .map(relation => {
                const from = positionById.get(relation.source);
                const to = positionById.get(relation.target);
                const relationType = schema && schema.RELATION_TYPES && schema.RELATION_TYPES[relation.type];
                return {
                    id: relation.id,
                    source: relation.source,
                    target: relation.target,
                    type: relation.type,
                    typeLabel: relationType ? relationType.label : relation.type,
                    symmetric: Boolean(relationType && relationType.symmetric),
                    x1: from.x,
                    y1: from.y,
                    x2: to.x,
                    y2: to.y,
                };
            });

        const connected = nodes.filter(node => node.degree > 0).length;

        return {
            width: options.width,
            height: options.height,
            clusters,
            nodes,
            edges,
            summary: {
                terms: nodes.length,
                topics: clusters.length,
                relations: edges.length,
                connectedTerms: connected,
                isolatedTerms: nodes.length - connected,
            },
        };
    }

    // 한 용어를 골랐을 때 강조할 대상. 자기 자신과 직접 이웃, 그 사이 선만 남긴다.
    function highlightFor(layout, termId) {
        if (!termId) return { nodeIds: new Set(), edgeIds: new Set() };
        const nodeIds = new Set([termId]);
        const edgeIds = new Set();
        for (const edge of list(layout && layout.edges)) {
            if (edge.source !== termId && edge.target !== termId) continue;
            edgeIds.add(edge.id);
            nodeIds.add(edge.source);
            nodeIds.add(edge.target);
        }
        return { nodeIds, edgeIds };
    }

    const api = { computeGraphLayout, highlightFor, ringPosition, DEFAULTS };
    root.ITQuizOntologyGraph = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
