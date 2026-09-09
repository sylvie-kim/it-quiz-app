// 지식그래프 진단 — 도메인과 무관한 계산 계층.
//
// 용어 사전이든 회사 결정 기록이든 환자 케어 기록이든, 그래프의 구조적 빈틈은 같은
// 방식으로 찾을 수 있다. 이 파일은 용어를 모른 채로 동작한다. 입력은 아래 모양이며
// 각 도메인은 자기 데이터를 이 모양으로 바꿔서 넣는다.
//
//   {
//     nodes:  [{ id, label, groupId }],
//     edges:  [{ id, source, target, type }],
//     groups: [{ id, label }],
//     relationTypes: [{ id, label, symmetric }],   // 선택
//   }
//
// 출력은 "지금 뭘 하면 가장 크게 좋아지는가" 순으로 정렬한 발견 목록이다.
// 모든 발견에는 왜 그 점수인지(impactReason)와 무엇을 하면 되는지(action)가 붙는다.
// 점수는 숨은 가중치가 아니라 "이걸 고치면 몇 개가 이어지는가"라는 셈이다.

(function exposeGraphInsights(root) {
    const DEFAULT_OPTIONS = Object.freeze({
        hubShareThreshold: 0.2,   // 한 노드가 전체 연결의 이 비율을 넘게 가지면 쏠림으로 본다
        minGroupSizeToReport: 3,  // 이보다 작은 묶음은 끊겨 있어도 따로 알리지 않는다
        typeWeights: {},          // 도메인이 중요하게 보는 관계 유형에 가중치를 준다
        defaultTypeWeight: 1,
    });

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function buildIndex(graph) {
        const nodes = list(graph && graph.nodes);
        const edges = list(graph && graph.edges).filter(edge => edge && edge.source && edge.target);
        const groups = list(graph && graph.groups);

        const nodeById = new Map(nodes.map(node => [node.id, node]));
        const groupById = new Map(groups.map(group => [group.id, group]));
        const membersByGroup = new Map(groups.map(group => [group.id, []]));
        for (const node of nodes) {
            if (membersByGroup.has(node.groupId)) membersByGroup.get(node.groupId).push(node);
        }

        const outDegree = new Map();
        const inDegree = new Map();
        const neighbors = new Map();
        // 묶음과 묶음 사이에 실제로 놓인 다리를 센다.
        const externalEdgesByGroup = new Map(groups.map(group => [group.id, 0]));
        const internalEdgesByGroup = new Map(groups.map(group => [group.id, 0]));

        function touch(map, key) {
            map.set(key, (map.get(key) || 0) + 1);
        }
        function link(a, b) {
            if (!neighbors.has(a)) neighbors.set(a, new Set());
            neighbors.get(a).add(b);
        }

        for (const edge of edges) {
            touch(outDegree, edge.source);
            touch(inDegree, edge.target);
            link(edge.source, edge.target);
            link(edge.target, edge.source);

            const sourceGroup = nodeById.get(edge.source)?.groupId;
            const targetGroup = nodeById.get(edge.target)?.groupId;
            if (sourceGroup && targetGroup) {
                if (sourceGroup === targetGroup) {
                    if (internalEdgesByGroup.has(sourceGroup)) touch(internalEdgesByGroup, sourceGroup);
                } else {
                    if (externalEdgesByGroup.has(sourceGroup)) touch(externalEdgesByGroup, sourceGroup);
                    if (externalEdgesByGroup.has(targetGroup)) touch(externalEdgesByGroup, targetGroup);
                }
            }
        }

        return {
            nodes, edges, groups, nodeById, groupById, membersByGroup,
            outDegree, inDegree, neighbors, externalEdgesByGroup, internalEdgesByGroup,
            degreeOf(id) {
                return (outDegree.get(id) || 0) + (inDegree.get(id) || 0);
            },
        };
    }

    function finding({ code, title, detail, action, impact, impactReason, targets = [], groupId = null }) {
        return { code, title, detail, action, impact, impactReason, targets, groupId };
    }

    // 1. 묶음 전체가 그래프에서 떨어져 있다. 다리 하나로 여러 개가 한꺼번에 이어지므로 가장 크다.
    function findDisconnectedGroups(index, options) {
        const results = [];
        for (const group of index.groups) {
            const members = index.membersByGroup.get(group.id) || [];
            if (members.length < options.minGroupSizeToReport) continue;
            if ((index.externalEdgesByGroup.get(group.id) || 0) > 0) continue;

            const internal = index.internalEdgesByGroup.get(group.id) || 0;
            results.push(finding({
                code: 'GROUP_DISCONNECTED',
                groupId: group.id,
                title: `‘${group.label}’이(가) 다른 묶음과 하나도 이어져 있지 않습니다`,
                detail: internal > 0
                    ? `안쪽 연결은 ${internal}개 있지만 바깥으로 나가는 연결이 없습니다.`
                    : '안쪽에도 바깥에도 연결이 없습니다.',
                action: `이 묶음의 항목 하나를 다른 묶음과 잇는 연결을 먼저 만드세요.`,
                impact: members.length,
                impactReason: `다리 하나를 놓으면 항목 ${members.length}개가 전체와 이어집니다.`,
                targets: members.slice(0, 5).map(node => node.id),
            }));
        }
        return results;
    }

    // 2. 안쪽으로만 이어진 묶음. 덜 급하지만 여전히 섬이다.
    function findInternalOnlyGroups(index, options) {
        const results = [];
        for (const group of index.groups) {
            const members = index.membersByGroup.get(group.id) || [];
            if (members.length < options.minGroupSizeToReport) continue;
            const external = index.externalEdgesByGroup.get(group.id) || 0;
            const internal = index.internalEdgesByGroup.get(group.id) || 0;
            if (external > 0 || internal === 0) continue;

            results.push(finding({
                code: 'GROUP_INTERNAL_ONLY',
                groupId: group.id,
                title: `‘${group.label}’은(는) 자기들끼리만 이어져 있습니다`,
                detail: `안쪽 연결 ${internal}개, 바깥 연결 0개.`,
                action: '다른 묶음과 이어지는 연결을 하나 이상 만드세요.',
                impact: Math.max(1, Math.round(members.length / 2)),
                impactReason: `묶음 항목 ${members.length}개가 전체 흐름에서 떨어져 있습니다.`,
                targets: members.slice(0, 5).map(node => node.id),
            }));
        }
        return results;
    }

    // 3. 묶음별 외톨이. 하나씩 알리면 목록이 넘치므로 묶음 단위로 모은다.
    function findIsolatedNodes(index) {
        const results = [];
        for (const group of index.groups) {
            const members = index.membersByGroup.get(group.id) || [];
            const isolated = members.filter(node => index.degreeOf(node.id) === 0);
            if (!isolated.length) continue;
            if (isolated.length === members.length) continue; // 묶음 전체 고립은 1번이 이미 알린다

            results.push(finding({
                code: 'ISOLATED_NODES',
                groupId: group.id,
                title: `‘${group.label}’ 안에 연결 없는 항목이 ${isolated.length}개 있습니다`,
                detail: `${isolated.slice(0, 3).map(node => node.label).join(', ')}${isolated.length > 3 ? ' 외' : ''}`,
                action: '같은 묶음의 이어진 항목과 어떤 관계인지 확인해 연결을 만드세요.',
                impact: isolated.length,
                impactReason: `항목 ${isolated.length}개가 아직 어디에도 닿아 있지 않습니다.`,
                targets: isolated.slice(0, 5).map(node => node.id),
            }));
        }
        return results;
    }

    // 4. 관계 사전에 있는데 실제로 한 번도 안 쓰인 유형. 도메인이 가중치로 중요도를 정한다.
    function findUnusedRelationTypes(graph, index, options) {
        const declared = list(graph && graph.relationTypes);
        if (!declared.length) return [];
        const used = new Set(index.edges.map(edge => edge.type));
        const results = [];
        for (const type of declared) {
            if (used.has(type.id)) continue;
            const weight = options.typeWeights[type.id] ?? options.defaultTypeWeight;
            results.push(finding({
                code: 'RELATION_TYPE_UNUSED',
                title: `‘${type.label}’ 관계가 아직 하나도 없습니다`,
                detail: '관계 사전에는 있지만 실제 데이터에 쓰인 적이 없습니다.',
                action: `‘${type.label}’로 이을 수 있는 짝을 찾아 후보를 만드세요.`,
                impact: weight,
                impactReason: weight > options.defaultTypeWeight
                    ? '이 관계 유형은 사용자가 가장 자주 묻는 질문에 직접 답합니다.'
                    : '표현할 수 있는 관계 종류가 그만큼 줄어듭니다.',
                targets: [],
            }));
        }
        return results;
    }

    // 5. 한 방향으로만 이어진 항목. 반대편 관계가 빠졌을 가능성이 크다.
    function findOneWayNodes(index) {
        const results = [];
        const oneWay = index.nodes.filter(node => {
            const out = index.outDegree.get(node.id) || 0;
            const inn = index.inDegree.get(node.id) || 0;
            return (out === 0) !== (inn === 0) && out + inn >= 2;
        });
        if (!oneWay.length) return results;

        results.push(finding({
            code: 'ONE_WAY_NODES',
            title: `한쪽 방향으로만 이어진 항목이 ${oneWay.length}개 있습니다`,
            detail: oneWay.slice(0, 3).map(node => node.label).join(', '),
            action: '반대 방향 관계가 빠졌는지 확인하세요.',
            impact: Math.min(oneWay.length, 3),
            impactReason: '한쪽만 이어져 있으면 되돌아오는 길을 답할 수 없습니다.',
            targets: oneWay.slice(0, 5).map(node => node.id),
        }));
        return results;
    }

    // 6. 연결이 특정 항목에 몰림. 그 하나가 틀리면 전체가 흔들린다.
    function findHubOverload(index, options) {
        if (!index.edges.length) return [];
        const total = index.edges.length * 2;
        const results = [];
        for (const node of index.nodes) {
            const degree = index.degreeOf(node.id);
            if (degree < 3) continue;
            const share = degree / total;
            if (share < options.hubShareThreshold) continue;
            results.push(finding({
                code: 'HUB_OVERLOAD',
                groupId: node.groupId,
                title: `‘${node.label}’에 연결이 몰려 있습니다`,
                detail: `전체 연결의 ${Math.round(share * 100)}%가 이 항목에 걸려 있습니다(${degree}개).`,
                action: '다른 항목의 연결을 늘려 한 곳 쏠림을 줄이세요.',
                impact: 1,
                impactReason: '쏠림 자체가 오류는 아니지만, 이 항목이 틀리면 영향 범위가 넓습니다.',
                targets: [node.id],
            }));
        }
        return results;
    }

    function analyzeGraph(graph, overrides = {}) {
        const options = {
            ...DEFAULT_OPTIONS,
            ...overrides,
            typeWeights: { ...DEFAULT_OPTIONS.typeWeights, ...(overrides.typeWeights || {}) },
        };
        const index = buildIndex(graph);

        const findings = [
            ...findDisconnectedGroups(index, options),
            ...findInternalOnlyGroups(index, options),
            ...findIsolatedNodes(index),
            ...findUnusedRelationTypes(graph, index, options),
            ...findOneWayNodes(index),
            ...findHubOverload(index, options),
        ];

        // 점수가 같으면 코드와 제목으로 순서를 고정한다. 화면이 흔들리면 안 된다.
        findings.sort((a, b) => (
            b.impact - a.impact
            || a.code.localeCompare(b.code)
            || a.title.localeCompare(b.title)
        ));

        const connected = index.nodes.filter(node => index.degreeOf(node.id) > 0).length;
        return {
            findings,
            summary: {
                nodes: index.nodes.length,
                edges: index.edges.length,
                groups: index.groups.length,
                connectedNodes: connected,
                isolatedNodes: index.nodes.length - connected,
                findings: findings.length,
                topAction: findings.length ? findings[0].action : null,
            },
        };
    }

    const api = { analyzeGraph, buildIndex, DEFAULT_OPTIONS };
    root.GraphInsights = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
