const assert = require('node:assert/strict');
const test = require('node:test');

const { analyzeGraph } = require('../graph-insights.js');
const { analyzeOntology, toGraph, TYPE_WEIGHTS } = require('../ontology-insights.js');
const ontology = require('../ontology-data.js');

// 도메인을 모르는 작은 그래프. 진단 계층이 용어 지식 없이 동작하는지 확인한다.
const toyGraph = {
    nodes: [
        { id: 'a1', label: 'A1', groupId: 'ga' },
        { id: 'a2', label: 'A2', groupId: 'ga' },
        { id: 'a3', label: 'A3', groupId: 'ga' },
        { id: 'b1', label: 'B1', groupId: 'gb' },
        { id: 'b2', label: 'B2', groupId: 'gb' },
        { id: 'b3', label: 'B3', groupId: 'gb' },
        { id: 'c1', label: 'C1', groupId: 'gc' },
        { id: 'c2', label: 'C2', groupId: 'gc' },
        { id: 'c3', label: 'C3', groupId: 'gc' },
    ],
    edges: [
        { id: 'e1', source: 'a1', target: 'b1', type: 'uses' },
        { id: 'e2', source: 'b1', target: 'b2', type: 'uses' },
    ],
    groups: [
        { id: 'ga', label: '가 묶음' },
        { id: 'gb', label: '나 묶음' },
        { id: 'gc', label: '다 묶음' },
    ],
    relationTypes: [
        { id: 'uses', label: '사용' },
        { id: 'precedes', label: '선행' },
    ],
};

test('진단 계층은 도메인 용어를 모르는 그래프에서도 동작한다', () => {
    const result = analyzeGraph(toyGraph);
    assert.ok(result.findings.length > 0);
    assert.equal(result.summary.nodes, 9);
    assert.equal(result.summary.edges, 2);
    assert.equal(result.summary.isolatedNodes, 6); // a1·b1·b2만 이어져 있다
});

test('바깥과 하나도 이어지지 않은 묶음을 찾아낸다', () => {
    const result = analyzeGraph(toyGraph);
    const disconnected = result.findings.filter(item => item.code === 'GROUP_DISCONNECTED');
    assert.equal(disconnected.length, 1);
    assert.equal(disconnected[0].groupId, 'gc');
});

test('쓰이지 않은 관계 유형을 알리고 도메인 가중치를 점수에 반영한다', () => {
    const plain = analyzeGraph(toyGraph);
    const weighted = analyzeGraph(toyGraph, { typeWeights: { precedes: 50 } });
    const pick = result => result.findings.find(item => (
        item.code === 'RELATION_TYPE_UNUSED' && item.title.includes('선행')
    ));
    assert.ok(pick(plain), '쓰이지 않은 유형을 못 찾았습니다');
    assert.equal(pick(plain).impact, 1);
    assert.equal(pick(weighted).impact, 50);
    assert.equal(pick(weighted), weighted.findings[0], '가중치가 높은 항목이 맨 위여야 합니다');
});

test('모든 발견에는 점수 근거와 할 일이 붙는다', () => {
    const result = analyzeOntology(ontology);
    for (const item of result.findings) {
        assert.ok(item.title.trim(), `${item.code}: 제목 없음`);
        assert.ok(item.action.trim(), `${item.code}: 할 일 없음`);
        assert.ok(item.impactReason.trim(), `${item.code}: 점수 근거 없음`);
        assert.ok(Number.isFinite(item.impact), `${item.code}: 점수 없음`);
        assert.ok(Array.isArray(item.targets));
    }
});

test('발견은 점수가 큰 것부터 나오고 순서가 흔들리지 않는다', () => {
    const first = analyzeOntology(ontology);
    const second = analyzeOntology(ontology);
    assert.deepEqual(first, second);
    for (let i = 1; i < first.findings.length; i += 1) {
        assert.ok(first.findings[i - 1].impact >= first.findings[i].impact, '점수 순서가 어긋납니다');
    }
});

test('학습에 직접 답하는 관계 유형이 비면 가장 위쪽으로 올라온다', () => {
    const result = analyzeOntology(ontology);
    const unused = result.findings.filter(item => item.code === 'RELATION_TYPE_UNUSED');
    const prerequisite = unused.find(item => item.title.includes('먼저 학습'));
    const contrast = unused.find(item => item.title.includes('차이 비교'));
    assert.ok(prerequisite, '선행 학습 관계 미사용이 보고되지 않았습니다');
    assert.ok(contrast, '차이 비교 관계 미사용이 보고되지 않았습니다');
    assert.equal(prerequisite.impact, TYPE_WEIGHTS.prerequisite_of);
    assert.equal(contrast.impact, TYPE_WEIGHTS.contrasts_with);
});

test('어댑터는 검토 완료 관계만 그래프에 넣는다', () => {
    const graph = toGraph({
        termRegistry: [
            { id: 't1', label: 'T1', topicIds: ['g1'], termKind: 'concept' },
            { id: 't2', label: 'T2', topicIds: ['g1'], termKind: 'concept' },
        ],
        topics: [{ id: 'g1', label: '묶음' }],
        relations: [
            { id: 'r1', source: 't1', target: 't2', type: 'is_a', status: 'REVIEWED' },
            { id: 'r2', source: 't2', target: 't1', type: 'is_a', status: 'INFERRED' },
        ],
    });
    assert.equal(graph.edges.length, 1);
    assert.equal(graph.edges[0].id, 'r1');
});

test('전체가 이어진 그래프에서는 끊김 관련 발견이 나오지 않는다', () => {
    const healthy = {
        nodes: toyGraph.nodes,
        groups: toyGraph.groups,
        relationTypes: [{ id: 'uses', label: '사용' }],
        edges: [
            { id: 'e1', source: 'a1', target: 'b1', type: 'uses' },
            { id: 'e2', source: 'b1', target: 'c1', type: 'uses' },
            { id: 'e3', source: 'a2', target: 'b2', type: 'uses' },
            { id: 'e4', source: 'a3', target: 'c2', type: 'uses' },
            { id: 'e5', source: 'b3', target: 'c3', type: 'uses' },
        ],
    };
    const codes = analyzeGraph(healthy).findings.map(item => item.code);
    assert.ok(!codes.includes('GROUP_DISCONNECTED'));
    assert.ok(!codes.includes('ISOLATED_NODES'));
});

const view = require('../ontology-graph-view.js');

test('진단 목록은 발견마다 카드 하나를 그린다', () => {
    const analysis = analyzeOntology(ontology);
    const html = view.buildInsightList(analysis.findings);
    assert.equal((html.match(/graph-insights__item/g) || []).length, analysis.findings.length);
});

test('짚을 대상이 있는 발견에만 지도 이동 버튼이 붙는다', () => {
    const analysis = analyzeOntology(ontology);
    const html = view.buildInsightList(analysis.findings);
    const withTargets = analysis.findings.filter(item => item.targets.length).length;
    assert.equal((html.match(/data-insight-target/g) || []).length, withTargets);
});

test('발견이 없으면 빈틈이 없다고 알린다', () => {
    assert.match(view.buildInsightList([]), /빈틈이 없습니다/);
});

test('진단 카드도 사용자 데이터를 HTML로 해석하지 않는다', () => {
    const html = view.buildInsightList([{
        code: 'ISOLATED_NODES',
        title: '<img src=x onerror=alert(1)>',
        detail: '<script>bad()</script>',
        action: '확인',
        impact: 1,
        impactReason: '이유',
        targets: [],
    }]);
    assert.ok(!html.includes('<img'), '제목이 태그로 들어갔습니다');
    assert.ok(!html.includes('<script>bad'), '설명이 태그로 들어갔습니다');
});

test('요약문은 진단 건수와 이어진 비율을 함께 알린다', () => {
    const analysis = analyzeOntology(ontology);
    const text = view.insightSummaryText(analysis.summary);
    assert.match(text, new RegExp(`진단 ${analysis.summary.findings}건`));
    assert.match(text, new RegExp(`${analysis.summary.connectedNodes}/${analysis.summary.nodes}`));
});
