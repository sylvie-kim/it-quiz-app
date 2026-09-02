const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..');
const terms = require(path.join(projectRoot, 'terms-data.js'));
const {
    buildMultipleChoiceOptions,
    searchGlossaryTerms,
} = require(path.join(projectRoot, 'quiz-content.js'));

test('용어명을 몰라도 정의 속 단서로 사전을 검색한다', () => {
    const byContactPoint = searchGlossaryTerms(terms, '접점');
    const byHumanAndMachine = searchGlossaryTerms(terms, '사람과 기계');

    assert.ok(byContactPoint.length > 0, '정의 키워드 검색 결과가 있어야 한다');
    assert.ok(byHumanAndMachine.length > 0, '여러 단어로도 정의를 찾을 수 있어야 한다');
    assert.equal(byContactPoint[0].term, 'Interface(인터페이스)');
    assert.equal(byHumanAndMachine[0].term, 'Interface(인터페이스)');
});

test('정확한 용어명은 정의 일치보다 먼저 보여준다', () => {
    const results = searchGlossaryTerms(terms, 'API');

    assert.ok(results.length > 0, '정확한 용어 검색 결과가 있어야 한다');
    assert.equal(results[0].term, 'API(Application Programming Interface)');
});

test('객관식 선택지는 정의에 이미 등장한 용어를 반복하지 않는다', () => {
    const answer = terms.find(({ term }) => term === '서버사이드 렌더링');
    const options = buildMultipleChoiceOptions({
        answer,
        definition: '사용기술: Next.js. 특징은 SEO 최적화, 빠른 초기 로딩.',
        terms,
        shuffle: values => values,
    });

    assert.equal(options.length, 4);
    assert.ok(options.includes('서버사이드 렌더링'));
    assert.ok(!options.includes('Next.js'));
    assert.deepEqual(new Set(options).size, 4);
});

test('객관식 오답은 무관한 임의 용어가 아니라 같은 혼동군에서 고른다', () => {
    const answer = terms.find(({ term }) => term === '서버사이드 렌더링');
    const options = buildMultipleChoiceOptions({
        answer,
        definition: answer.definition,
        terms,
        shuffle: values => values,
    });
    const distractors = options.filter(option => option !== answer.term);

    assert.deepEqual(
        new Set(distractors),
        new Set(['정적 렌더링', '클라이언트 렌더링', 'SPA(Single Page Application)'])
    );
});

test('렌더링 방식의 정의는 특정 제품명을 정답 단서로 노출하지 않는다', () => {
    const serverRendering = terms.find(({ term }) => term === '서버사이드 렌더링');
    const clientRendering = terms.find(({ term }) => term === '클라이언트 렌더링');
    const staticRendering = terms.find(({ term }) => term === '정적 렌더링');

    assert.doesNotMatch(serverRendering.definition, /Next\.js/i);
    assert.doesNotMatch(clientRendering.definition, /React/i);
    assert.match(serverRendering.definition, /서버.*HTML|HTML.*서버/);
    assert.match(clientRendering.definition, /브라우저.*JavaScript|JavaScript.*브라우저/i);
    assert.match(staticRendering.definition, /미리.*생성|빌드.*생성/);
});
