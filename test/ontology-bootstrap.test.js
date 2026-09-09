const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const terms = require('../terms-data.js');
const bootstrapPath = path.join(__dirname, '..', 'scripts', 'bootstrap-ontology-registry.js');
const { buildRegistry, makeStableId } = require(bootstrapPath);

test('등록부는 정본 입력 순서를 보존하면서 160개 고유 ID를 만든다', () => {
    const registry = buildRegistry(terms);

    assert.equal(registry.length, 160);
    assert.deepEqual(registry.map(item => item.label), terms.map(item => item.term));
    assert.equal(new Set(registry.map(item => item.id)).size, 160);
    assert.deepEqual(registry[0], {
        id: 'term-tdd',
        entityType: 'term',
        label: 'TDD(Test-Driven Development, 테스트 주도 개발)',
        topicIds: [],
    });
});

test('일반 라벨은 괄호 설명을 제외한 안정 ID로 변환한다', () => {
    assert.equal(makeStableId('React(리액트)'), 'term-react');
    assert.equal(makeStableId('Ruby on Rails(줄여서 Rails, 레일스)'), 'term-ruby-on-rails');
});

test('한글과 파일명 라벨은 명시한 의미 보존 ID를 사용한다', () => {
    assert.equal(makeStableId('정적 렌더링'), 'term-static-rendering');
    assert.equal(makeStableId('비동기 I/O 처리'), 'term-async-io');
    assert.equal(makeStableId('authController.js'), 'term-authcontroller-js');
    assert.equal(makeStableId('App.jsx'), 'term-app-jsx');
    assert.equal(makeStableId('.env 파일'), 'term-env');
    assert.equal(makeStableId('.gitignore'), 'term-gitignore');
    assert.equal(makeStableId('생성형 AI'), 'term-generative-ai');
    assert.equal(makeStableId('공공데이터 Open API'), 'term-public-data-open-api');
    assert.equal(makeStableId('벡터DB'), 'term-vector-db');
});

test('override가 없는 한글 라벨은 명시 ID를 요구한다', () => {
    assert.throws(
        () => makeStableId('새로운 한글 용어'),
        /Explicit ID override required: 새로운 한글 용어/,
    );
});

test('생성 ID가 충돌하면 임의 번호를 붙이지 않고 중단한다', () => {
    assert.throws(
        () => buildRegistry([{ term: 'React' }, { term: 'React(리액트)' }]),
        /Duplicate generated term ID/,
    );
});

test('CLI는 로그가 섞이지 않은 160개 JSON 레코드만 출력한다', () => {
    const stdout = execFileSync(process.execPath, [bootstrapPath], { encoding: 'utf8' });
    const registry = JSON.parse(stdout);

    assert.equal(registry.length, 160);
    assert.equal(new Set(registry.map(item => item.id)).size, 160);
});
