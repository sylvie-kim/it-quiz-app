// 전체 연결 지도 화면. ontology-graph.js가 계산한 좌표를 SVG로 그린다.
// 외부 라이브러리를 쓰지 않는다. GitHub Pages에 정적 파일로 그대로 올라가야 하기 때문이다.

(function exposeOntologyGraphView(root) {
    const TOPIC_COLORS = [
        '#4f8cff', '#f2994a', '#27ae8f', '#c76bd8', '#e05c6e', '#3fbfd6',
        '#f2c14e', '#7a86f0', '#5fae5f', '#e0708f', '#8f9bb3', '#d98b3f',
    ];

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // 사전 라벨은 "React(리액트)"처럼 괄호 설명이 붙는다. 점 옆에는 앞부분만 쓴다.
    function shortLabel(label) {
        return String(label).split(/[(（]/)[0].trim();
    }

    function nodeRadius(node) {
        return node.degree > 0 ? 6 + Math.min(node.degree, 4) : 3.5;
    }

    function buildSvg(layout, { selectedId = null, highlight = null } = {}) {
        const dim = Boolean(selectedId);
        const parts = [];
        parts.push(`<svg viewBox="0 0 ${layout.width} ${layout.height}" class="learning-graph__svg" role="img" aria-label="용어 ${layout.summary.terms}개와 검토된 관계 ${layout.summary.relations}개의 연결 지도">`);

        parts.push('<g class="learning-graph__edges">');
        for (const edge of layout.edges) {
            const on = !dim || (highlight && highlight.edgeIds.has(edge.id));
            parts.push(`<line class="learning-graph__edge${on ? '' : ' is-dim'}" x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}"><title>${escapeHTML(`${shortLabel(edge.sourceLabel || edge.source)} → ${shortLabel(edge.targetLabel || edge.target)} (${edge.typeLabel})`)}</title></line>`);
        }
        parts.push('</g>');

        parts.push('<g class="learning-graph__nodes">');
        for (const node of layout.nodes) {
            const on = !dim || (highlight && highlight.nodeIds.has(node.id));
            const selected = node.id === selectedId;
            const color = TOPIC_COLORS[node.colorIndex % TOPIC_COLORS.length];
            const classes = [
                'learning-graph__node',
                node.degree > 0 ? 'is-connected' : 'is-isolated',
                on ? '' : 'is-dim',
                selected ? 'is-selected' : '',
            ].filter(Boolean).join(' ');
            parts.push(`<circle class="${classes}" cx="${node.x}" cy="${node.y}" r="${nodeRadius(node)}" fill="${color}" tabindex="0" role="button" data-graph-term="${escapeHTML(node.id)}" aria-label="${escapeHTML(`${shortLabel(node.label)} · 연결 ${node.degree}개`)}"><title>${escapeHTML(`${shortLabel(node.label)} · 연결 ${node.degree}개`)}</title></circle>`);
        }
        parts.push('</g>');

        // 이름표는 연결이 있는 점에만 붙인다. 159개 전부 붙이면 읽을 수 없다.
        parts.push('<g class="learning-graph__labels">');
        for (const node of layout.nodes) {
            if (node.degree === 0) continue;
            const on = !dim || (highlight && highlight.nodeIds.has(node.id));
            parts.push(`<text class="learning-graph__label${on ? '' : ' is-dim'}" x="${node.x}" y="${node.y - nodeRadius(node) - 5}" text-anchor="middle">${escapeHTML(shortLabel(node.label))}</text>`);
        }
        parts.push('</g>');

        parts.push('</svg>');
        return parts.join('');
    }

    function buildLegend(layout) {
        return layout.clusters.map(cluster => (
            `<span class="learning-graph__legend-item"><i style="background:${TOPIC_COLORS[cluster.colorIndex % TOPIC_COLORS.length]}"></i>${escapeHTML(cluster.label)} <b>${cluster.termCount}</b></span>`
        )).join('');
    }

    function summaryText(layout, selectedNode) {
        if (selectedNode) {
            return selectedNode.degree > 0
                ? `${shortLabel(selectedNode.label)} · 직접 연결 ${selectedNode.degree}개. 배경을 누르면 전체로 돌아갑니다.`
                : `${shortLabel(selectedNode.label)}은(는) 아직 검토된 연결이 없습니다. 배경을 누르면 전체로 돌아갑니다.`;
        }
        const { terms, relations, connectedTerms, isolatedTerms } = layout.summary;
        return `용어 ${terms}개 · 검토된 연결 ${relations}개 · 연결된 용어 ${connectedTerms}개 · 아직 외톨이 ${isolatedTerms}개`;
    }

    const CODE_LABELS = {
        GROUP_DISCONNECTED: '끊긴 묶음',
        GROUP_INTERNAL_ONLY: '자기들끼리만',
        ISOLATED_NODES: '외톨이 항목',
        RELATION_TYPE_UNUSED: '빠진 관계 종류',
        ONE_WAY_NODES: '한쪽 방향만',
        HUB_OVERLOAD: '연결 쏠림',
    };

    function buildInsightList(findings) {
        if (!findings.length) {
            return '<li class="graph-insights__empty">지금 손볼 구조적 빈틈이 없습니다.</li>';
        }
        return findings.map(item => {
            const jump = item.targets.length
                ? `<button class="graph-insights__jump" type="button" data-insight-target="${escapeHTML(item.targets[0])}">지도에서 보기</button>`
                : '';
            return `<li class="graph-insights__item">
                <div class="graph-insights__meta">
                    <span class="graph-insights__code">${escapeHTML(CODE_LABELS[item.code] || item.code)}</span>
                    <span class="graph-insights__impact" title="고치면 이어지는 항목 수">${item.impact}</span>
                </div>
                <h3>${escapeHTML(item.title)}</h3>
                <p class="graph-insights__detail">${escapeHTML(item.detail)}</p>
                <p class="graph-insights__why">${escapeHTML(item.impactReason)}</p>
                <p class="graph-insights__action">→ ${escapeHTML(item.action)}</p>
                ${jump}
            </li>`;
        }).join('');
    }

    function insightSummaryText(summary) {
        return `구조 진단 ${summary.findings}건 · 이어진 항목 ${summary.connectedNodes}/${summary.nodes} · 점수는 고치면 이어지는 항목 수입니다.`;
    }

    function createGraphView({ documentRef, ontology, graphModule, insightsModule } = {}) {
        const doc = documentRef || (typeof document !== 'undefined' ? document : null);
        const graph = graphModule || root.ITQuizOntologyGraph;
        if (!doc || !graph || !ontology) return null;

        const canvas = doc.getElementById('learning-graph-canvas');
        const legend = doc.getElementById('learning-graph-legend');
        const summary = doc.getElementById('learning-graph-summary');
        const panel = doc.getElementById('learning-graph');
        if (!canvas || !panel) return null;

        const layout = graph.computeGraphLayout(ontology);
        const labelById = new Map(layout.nodes.map(node => [node.id, node.label]));
        for (const edge of layout.edges) {
            edge.sourceLabel = labelById.get(edge.source);
            edge.targetLabel = labelById.get(edge.target);
        }

        let selectedId = null;

        function render() {
            const node = selectedId ? layout.nodes.find(item => item.id === selectedId) : null;
            const highlight = selectedId ? graph.highlightFor(layout, selectedId) : null;
            canvas.innerHTML = buildSvg(layout, { selectedId, highlight });
            if (summary) summary.textContent = summaryText(layout, node);
            bind();
        }

        function select(termId) {
            selectedId = selectedId === termId ? null : termId;
            render();
        }

        function bind() {
            canvas.querySelectorAll('[data-graph-term]').forEach(circle => {
                circle.addEventListener('click', event => {
                    event.stopPropagation();
                    select(circle.dataset.graphTerm);
                });
                circle.addEventListener('keydown', event => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    select(circle.dataset.graphTerm);
                });
            });
        }

        canvas.addEventListener('click', () => {
            if (!selectedId) return;
            selectedId = null;
            render();
        });

        if (legend) legend.innerHTML = buildLegend(layout);

        // 진단 목록. 그래프가 "무엇이 비었는지"만 보여주고 끝나지 않도록 다음 행동을 붙인다.
        const analyzer = insightsModule || root.ITQuizOntologyInsights;
        const insightList = doc.getElementById('graph-insights-list');
        const insightSummary = doc.getElementById('graph-insights-summary');
        if (analyzer && insightList) {
            const analysis = analyzer.analyzeOntology(ontology);
            insightList.innerHTML = buildInsightList(analysis.findings);
            if (insightSummary) insightSummary.textContent = insightSummaryText(analysis.summary);
            insightList.querySelectorAll('[data-insight-target]').forEach(button => {
                button.addEventListener('click', () => {
                    selectedId = button.dataset.insightTarget;
                    render();
                    canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
        }

        render();

        return {
            layout,
            render,
            select,
            get selectedId() { return selectedId; },
            show() { panel.hidden = false; },
            hide() { panel.hidden = true; },
        };
    }

    function bindViewSwitch(documentRef, view) {
        const doc = documentRef || document;
        const flow = doc.getElementById('learning-path-flow');
        const mobileFlow = doc.getElementById('learning-mobile-path');
        const buttons = [...doc.querySelectorAll('[data-learning-view]')];
        if (!buttons.length || !view) return;

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.learningView;
                buttons.forEach(other => {
                    const on = other === button;
                    other.classList.toggle('active', on);
                    other.setAttribute('aria-selected', String(on));
                });
                const graphMode = mode === 'graph';
                if (flow) flow.hidden = graphMode;
                if (mobileFlow) mobileFlow.hidden = graphMode;
                if (graphMode) view.show(); else view.hide();
            });
        });
    }

    const api = { createGraphView, bindViewSwitch, buildSvg, buildLegend, buildInsightList, insightSummaryText, summaryText, shortLabel, CODE_LABELS, TOPIC_COLORS };
    root.ITQuizOntologyGraphView = api;
    if (typeof module === 'object' && module.exports) module.exports = api;

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const ontology = root.IT_QUIZ_ONTOLOGY || root.ITQuizOntology;
            const view = createGraphView({ documentRef: document, ontology });
            if (view) bindViewSwitch(document, view);
        });
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
