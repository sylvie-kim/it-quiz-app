const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { convertGraphifyGraph } = require('../scripts/import-graphify-candidates.js');

const importerPath = path.join(__dirname, '..', 'scripts', 'import-graphify-candidates.js');

function assertSafeCliFailure(result, forbiddenText) {
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim().split(/\r?\n/).length, 1);
    assert.equal(result.stderr.includes(forbiddenText), false);
}

test('Graphify 관계는 검토 전 INFERRED 또는 EXTRACTED 후보로만 남는다', () => {
    const result = convertGraphifyGraph({
        nodes: [
            { id: 'g-react', label: 'React' },
            { id: 'g-next', label: 'Next.js' },
        ],
        links: [{
            source: 'g-next', target: 'g-react', relation: 'implements',
            confidence: 'EXTRACTED', confidence_score: 1,
            source_file: 'public-terms-03.md',
        }],
    }, [
        { id: 'term-react', entityType: 'term', label: 'React(리액트)' },
        { id: 'term-next-js', entityType: 'term', label: 'Next.js' },
    ]);

    assert.equal(result.candidates[0].status, 'EXTRACTED');
    assert.equal(result.candidates[0].published, false);
    assert.equal(result.candidates[0].reviewedAt, null);
    assert.equal(result.stats.published, 0);
});

test('알 수 없는 노드와 관계는 rejected에 이유를 남긴다', () => {
    const result = convertGraphifyGraph({
        nodes: [{ id: 'g-x', label: '없는 용어' }],
        links: [{ source: 'g-x', target: 'g-y', relation: 'mystery' }],
    }, []);
    assert.equal(result.candidates.length, 0);
    assert.equal(result.rejected[0].reason, 'UNKNOWN_TERM_OR_RELATION');
});

test('등록된 별칭은 정본 용어 ID로만 해석하고 관계 방향은 보존한다', () => {
    const result = convertGraphifyGraph({
        nodes: [
            { id: 'g-tdd', label: 'Test-Driven Development' },
            { id: 'g-code', label: 'Code' },
        ],
        links: [{ source: 'g-tdd', target: 'g-code', relation: 'implements' }],
    }, [
        { id: 'term-tdd', entityType: 'term', label: 'TDD(Test-Driven Development, 테스트 주도 개발)' },
        { id: 'term-code', entityType: 'term', label: 'Code' },
    ]);

    assert.deepEqual(result.candidates[0], {
        id: 'candidate-term-tdd-implements-term-code',
        source: 'term-tdd',
        target: 'term-code',
        type: 'implements',
        status: 'INFERRED',
        published: false,
        reviewedAt: null,
        sourceFile: null,
        confidenceScore: null,
    });
});

test('Object 상속 관계명은 허용 관계로 변환하지 않는다', () => {
    const result = convertGraphifyGraph({
        nodes: [
            { id: 'g-react', label: 'React' },
            { id: 'g-next', label: 'Next.js' },
        ],
        links: [{ source: 'g-next', target: 'g-react', relation: 'toString' }],
    }, [
        { id: 'term-react', entityType: 'term', label: 'React(리액트)' },
        { id: 'term-next-js', entityType: 'term', label: 'Next.js' },
    ]);

    assert.equal(result.candidates.length, 0);
    assert.equal(result.rejected[0].reason, 'UNKNOWN_TERM_OR_RELATION');
});

test('서로 다른 안정 ID의 중복 별칭은 입력 순서와 무관하게 거절한다', () => {
    const graph = {
        nodes: [
            { id: 'g-react', label: 'React' },
            { id: 'g-next', label: 'Next.js' },
        ],
        links: [{ source: 'g-react', target: 'g-next', relation: 'implements' }],
    };
    const registry = [
        { id: 'term-react', entityType: 'term', label: 'React(리액트)' },
        { id: 'term-react-other', entityType: 'term', label: 'React' },
        { id: 'term-next-js', entityType: 'term', label: 'Next.js' },
    ];

    for (const result of [
        convertGraphifyGraph(graph, registry),
        convertGraphifyGraph(graph, [...registry].reverse()),
    ]) {
        assert.equal(result.candidates.length, 0);
        assert.equal(result.rejected[0].reason, 'AMBIGUOUS_TERM_OR_ALIAS');
    }
});

test('CLI는 입력 경로가 없으면 안전한 한 줄 오류로 종료한다', () => {
    const result = spawnSync(process.execPath, [importerPath], { encoding: 'utf8' });

    assertSafeCliFailure(result, process.cwd());
});

test('CLI는 구조가 잘못된 JSON에서 입력 경로와 토큰을 출력하지 않는다', (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'it-quiz-ontology-'));
    const fixturePath = path.join(fixtureDir, 'sensitive-token-candidate.json');
    fs.writeFileSync(fixturePath, JSON.stringify({ nodes: [] }));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

    const result = spawnSync(process.execPath, [importerPath, fixturePath], { encoding: 'utf8' });

    assertSafeCliFailure(result, 'sensitive-token-candidate');
    assert.equal(result.stderr.includes(fixtureDir), false);
});
