const assert = require('node:assert/strict');
const test = require('node:test');

const { computeGraphLayout, highlightFor, ringPosition } = require('../ontology-graph.js');
const ontology = require('../ontology-data.js');

const layout = computeGraphLayout(ontology);

test('배치는 160개 용어와 12개 주제를 모두 담는다', () => {
    assert.equal(layout.summary.terms, 160);
    assert.equal(layout.summary.topics, 12);
    assert.equal(layout.nodes.length, 160);
    assert.equal(layout.clusters.length, 12);
});

test('같은 입력이면 좌표까지 같은 배치가 나온다', () => {
    assert.deepEqual(computeGraphLayout(ontology), layout);
});

test('모든 노드는 화면 범위 안에 놓인다', () => {
    for (const node of layout.nodes) {
        assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y), `${node.id}: 좌표 없음`);
        assert.ok(node.x >= 0 && node.x <= layout.width, `${node.id}: x 범위 밖 ${node.x}`);
        assert.ok(node.y >= 0 && node.y <= layout.height, `${node.id}: y 범위 밖 ${node.y}`);
    }
});

test('같은 주제의 용어는 서로 다른 자리를 갖는다', () => {
    const seen = new Set();
    for (const node of layout.nodes) {
        const key = `${node.x}|${node.y}`;
        assert.ok(!seen.has(key), `좌표가 겹칩니다: ${node.id}`);
        seen.add(key);
    }
});

test('선은 승인된 관계만 그리고 양 끝 좌표가 노드와 일치한다', () => {
    const nodeById = new Map(layout.nodes.map(node => [node.id, node]));
    assert.equal(layout.edges.length, ontology.relations.length);
    for (const edge of layout.edges) {
        const from = nodeById.get(edge.source);
        const to = nodeById.get(edge.target);
        assert.ok(from && to, `${edge.id}: 양 끝 노드 누락`);
        assert.equal(edge.x1, from.x);
        assert.equal(edge.y1, from.y);
        assert.equal(edge.x2, to.x);
        assert.equal(edge.y2, to.y);
        assert.ok(edge.typeLabel.trim(), `${edge.id}: 관계 이름 없음`);
    }
});

test('연결 수는 실제 관계 수와 맞고 외톨이가 몇 개인지 알려준다', () => {
    const connected = layout.nodes.filter(node => node.degree > 0);
    assert.equal(layout.summary.connectedTerms, connected.length);
    assert.equal(layout.summary.isolatedTerms, 160 - connected.length);
    const totalDegree = layout.nodes.reduce((sum, node) => sum + node.degree, 0);
    assert.equal(totalDegree, layout.edges.length * 2);
});

test('용어를 고르면 자기 자신과 직접 이웃만 강조한다', () => {
    const highlight = highlightFor(layout, 'term-react');
    assert.ok(highlight.nodeIds.has('term-react'));
    assert.ok(highlight.nodeIds.has('term-vite'), 'React를 쓰는 Vite가 빠졌습니다');
    assert.ok(highlight.nodeIds.has('term-javascript'), 'React가 올라탄 JavaScript가 빠졌습니다');
    assert.ok(!highlight.nodeIds.has('term-python'), '관계 없는 용어가 강조됐습니다');
    for (const edgeId of highlight.edgeIds) {
        const edge = layout.edges.find(item => item.id === edgeId);
        assert.ok(edge.source === 'term-react' || edge.target === 'term-react');
    }
});

test('고른 용어가 없으면 아무것도 강조하지 않는다', () => {
    const highlight = highlightFor(layout, null);
    assert.equal(highlight.nodeIds.size, 0);
    assert.equal(highlight.edgeIds.size, 0);
});

test('주제 안 첫 용어는 중심에 놓이고 나머지는 바깥 겹으로 나간다', () => {
    const center = ringPosition(0, { ringGap: 20, firstRingCount: 6, ringGrowth: 4 });
    assert.deepEqual(center, { dx: 0, dy: 0 });
    const second = ringPosition(1, { ringGap: 20, firstRingCount: 6, ringGrowth: 4 });
    assert.ok(Math.hypot(second.dx, second.dy) > 0);
});

const view = require('../ontology-graph-view.js');

function svgWithLabels(options) {
    const labelById = new Map(layout.nodes.map(node => [node.id, node.label]));
    for (const edge of layout.edges) {
        edge.sourceLabel = labelById.get(edge.source);
        edge.targetLabel = labelById.get(edge.target);
    }
    return view.buildSvg(layout, options);
}

test('SVG에는 용어마다 점 하나, 관계마다 선 하나가 나온다', () => {
    const svg = svgWithLabels();
    assert.equal((svg.match(/<circle/g) || []).length, 160);
    assert.equal((svg.match(/<line/g) || []).length, ontology.relations.length);
});

test('이름표는 연결이 있는 점에만 붙어 화면이 글자로 덮이지 않는다', () => {
    const svg = svgWithLabels();
    assert.equal((svg.match(/<text/g) || []).length, layout.summary.connectedTerms);
});

test('용어를 고르면 관계 없는 것들이 흐려진다', () => {
    const plain = svgWithLabels();
    const focused = svgWithLabels({
        selectedId: 'term-react',
        highlight: highlightFor(layout, 'term-react'),
    });
    assert.equal((plain.match(/is-dim/g) || []).length, 0);
    assert.ok((focused.match(/is-dim/g) || []).length > 0);
    assert.match(focused, /is-selected/);
});

test('점 라벨은 괄호 설명을 떼고 짧게 쓴다', () => {
    assert.equal(view.shortLabel('React(리액트)'), 'React');
    assert.equal(view.shortLabel('TDD(Test-Driven Development, 테스트 주도 개발)'), 'TDD');
    assert.equal(view.shortLabel('Node.js'), 'Node.js');
});

test('요약문은 외톨이 용어가 몇 개 남았는지 숨기지 않는다', () => {
    const text = view.summaryText(layout, null);
    assert.match(text, new RegExp(`용어 ${layout.summary.terms}개`));
    assert.match(text, new RegExp(`외톨이 ${layout.summary.isolatedTerms}개`));
});

test('범례는 주제 12개를 색과 용어 수까지 안내한다', () => {
    const legend = view.buildLegend(layout);
    assert.equal((legend.match(/legend-item/g) || []).length, 12);
    for (const cluster of layout.clusters) {
        assert.ok(legend.includes(cluster.label), `${cluster.label} 누락`);
    }
});

test('사용자 데이터가 들어가는 자리는 HTML로 해석되지 않는다', () => {
    const injected = view.buildLegend({
        clusters: [{ id: 't', label: '<img src=x onerror=alert(1)>', colorIndex: 0, termCount: 1 }],
    });
    assert.ok(!injected.includes('<img'), '라벨이 그대로 태그로 들어갔습니다');
    assert.match(injected, /&lt;img/);
});
