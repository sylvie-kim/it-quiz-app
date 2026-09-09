const assert = require('node:assert/strict');
const test = require('node:test');

const extractor = require('../scripts/extract-definition-relations.js');
const ontology = require('../ontology-data.js');
const schema = require('../ontology-schema.js');

const result = extractor.extract();
const registryIds = new Set(ontology.termRegistry.map(item => item.id));

test('후보는 항상 INFERRED이며 제품 데이터로 승격되지 않는다', () => {
    assert.ok(result.candidates.length > 0);
    for (const candidate of result.candidates) {
        assert.equal(candidate.status, 'INFERRED');
        assert.equal(candidate.published, false);
        assert.equal(candidate.reviewedAt, null);
    }
    // 승격된 관계는 후보 ID가 아니라 rel- 접두사를 쓴다. 후보가 그대로 제품에 들어가지 않았음을 확인한다.
    const candidateIds = new Set(result.candidates.map(item => item.id));
    for (const relation of ontology.relations) {
        assert.ok(!candidateIds.has(relation.id), `후보 ID가 제품 관계에 그대로 들어갔습니다: ${relation.id}`);
        assert.equal(relation.status, 'REVIEWED');
    }
});

test('후보의 두 끝은 등록부에 있는 서로 다른 용어다', () => {
    for (const candidate of result.candidates) {
        assert.ok(registryIds.has(candidate.source), `알 수 없는 source: ${candidate.source}`);
        assert.ok(registryIds.has(candidate.target), `알 수 없는 target: ${candidate.target}`);
        assert.notEqual(candidate.source, candidate.target);
    }
});

test('후보 관계 유형은 스키마의 10개 사전 안에만 있다', () => {
    const allowed = new Set(Object.keys(schema.RELATION_TYPES));
    for (const candidate of result.candidates) {
        assert.ok(allowed.has(candidate.type), `허용되지 않는 관계 유형: ${candidate.type}`);
    }
});

test('모든 후보에는 정의문 근거와 term-definition 출처가 붙는다', () => {
    for (const candidate of result.candidates) {
        assert.ok(candidate.evidenceSentence.trim(), `${candidate.id}: 근거 문장 없음`);
        assert.ok(candidate.sourceRefs.length >= 1);
        for (const ref of candidate.sourceRefs) {
            assert.equal(ref.kind, 'term-definition');
            assert.ok(registryIds.has(ref.ref), `출처가 용어 ID가 아님: ${ref.ref}`);
        }
    }
});

test('같은 source·type·target 조합은 한 번만 나온다', () => {
    const keys = result.candidates.map(item => `${item.source}|${item.type}|${item.target}`);
    assert.equal(new Set(keys).size, keys.length);
});

test('입력이 같으면 후보 목록과 순서가 같다', () => {
    assert.deepEqual(extractor.extract(), result);
});

test('제품이 언어를 만든다고 읽히면 실행 환경 관계로 교정한다', () => {
    assert.equal(extractor.refine('produces', 'language', 'framework'), 'runs_on');
    assert.equal(extractor.refine('produces', 'language', 'method'), 'produces');
    assert.equal(extractor.refine('runs_on', 'concept', 'framework'), 'implements');
    assert.equal(extractor.refine('used_with', 'framework', 'tool'), 'used_with');
});

test('대표 사례를 나열한 문장은 방향을 뒤집어 하위 개념에서 상위 개념으로 향한다', () => {
    const markdownIsA = result.candidates.find(item => (
        item.type === 'is_a' && item.source === 'term-markdown'
    ));
    assert.ok(markdownIsA, 'Markdown is_a 후보가 없습니다');
    assert.equal(markdownIsA.target, 'term-markup-language');
});

test('너무 일반적인 용어는 관계 대상에서 제외한다', () => {
    for (const candidate of result.candidates) {
        assert.ok(!extractor.TOO_GENERIC.has(candidate.target), `일반 용어가 대상: ${candidate.id}`);
    }
});
