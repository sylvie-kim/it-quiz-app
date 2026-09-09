const assert = require('node:assert/strict');
const test = require('node:test');
const ontology = require('../ontology-data.js');
const { diagnosePathQuality } = require('../ontology-utils.js');

test('A안의 약한 배치 세 건과 검토 관계 없는 15개 경로를 숨기지 않는다', () => {
    const result = diagnosePathQuality(ontology);
    assert.equal(result.coveredTerms, 160);
    assert.deepEqual(result.weakAssignments.map(({ pathId, termId }) => ({ pathId, termId })), [
        { pathId: 'path-runtime-and-commands', termId: 'term-tdd' },
        { pathId: 'path-ai-coding-tools', termId: 'term-selenium' },
        { pathId: 'path-ai-coding-tools', termId: 'term-playwright' },
    ]);
    assert.ok(result.weakAssignments.every(item => item.fitRationale.trim()));
    assert.deepEqual(result.pathsOverCapacity, []);
    assert.deepEqual(result.termsRepeatedAcrossPaths, []);
    assert.deepEqual(result.pathsWithoutReviewedRelations, ontology.learningPaths.map(path => path.id));
});

test('16번째 용어와 네 경로 초과 반복은 별도 품질 진단으로 반환한다', () => {
    const sixteenTerms = Array.from({ length: 16 }, (_, index) => `term-${index + 1}`);
    const paths = Array.from({ length: 4 }, (_, index) => ({
        id: `path-${index + 1}`,
        primaryTermIds: sixteenTerms.slice(0, 4),
        supportingTermIds: index === 0 ? sixteenTerms.slice(4) : ['term-5', 'term-6', 'term-7', 'term-8'],
        fitAssessments: Object.fromEntries(sixteenTerms.map(termId => [termId, {
            fit: 'strong', fitRationale: 'fixture',
        }])),
        relationIds: [],
    }));
    const fixture = {
        termRegistry: sixteenTerms.map(id => ({ id })),
        relations: [],
        learningPaths: paths,
    };

    const result = diagnosePathQuality(fixture);
    assert.deepEqual(result.pathsOverCapacity, [{ pathId: 'path-1', termCount: 16 }]);
    assert.deepEqual(result.termsRepeatedAcrossPaths, [
        { termId: 'term-1', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-2', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-3', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-4', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-5', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-6', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-7', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
        { termId: 'term-8', pathIds: ['path-1', 'path-2', 'path-3', 'path-4'] },
    ]);
});
