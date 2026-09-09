// IT 용어 사전을 graph-insights.js가 이해하는 모양으로 바꾸는 어댑터.
// 진단 계산에는 도메인 지식이 들어가지 않는다. 도메인 지식은 여기에만 둔다.

(function exposeOntologyInsights(root) {
    const insights = typeof module === 'object' && module.exports
        ? require('./graph-insights.js')
        : root.GraphInsights;
    const schema = typeof module === 'object' && module.exports
        ? require('./ontology-schema.js')
        : root.ITQuizOntologySchema;

    // 학습자가 실제로 던지는 질문에 직접 답하는 관계는 더 급하다.
    // 근거: docs/ontology/ontology-readiness-checklist.md의 competency question 1·2번.
    const TYPE_WEIGHTS = Object.freeze({
        prerequisite_of: 12,  // "먼저 뭘 배워야 하나"
        contrasts_with: 10,   // "이거랑 저거랑 뭐가 다르나" — 퀴즈 오답 품질도 여기서 나온다
        alternative_to: 5,
        is_a: 3,
        part_of: 3,
    });

    function toGraph(ontology) {
        return {
            nodes: (ontology.termRegistry || []).map(term => ({
                id: term.id,
                label: term.label,
                groupId: (term.topicIds || [])[0],
                kind: term.termKind,
            })),
            edges: (ontology.relations || [])
                .filter(relation => relation && relation.status === 'REVIEWED')
                .map(relation => ({
                    id: relation.id,
                    source: relation.source,
                    target: relation.target,
                    type: relation.type,
                })),
            groups: (ontology.topics || []).map(topic => ({ id: topic.id, label: topic.label })),
            relationTypes: Object.entries((schema && schema.RELATION_TYPES) || {})
                .map(([id, value]) => ({ id, label: value.label, symmetric: Boolean(value.symmetric) })),
        };
    }

    function analyzeOntology(ontology) {
        return insights.analyzeGraph(toGraph(ontology), { typeWeights: TYPE_WEIGHTS });
    }

    const api = { analyzeOntology, toGraph, TYPE_WEIGHTS };
    root.ITQuizOntologyInsights = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
