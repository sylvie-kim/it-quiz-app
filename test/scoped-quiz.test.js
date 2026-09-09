const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const ontology = require(path.join(__dirname, '..', 'ontology-data.js'));
const terms = require(path.join(__dirname, '..', 'terms-data.js'));
const { getTermsForQuiz } = require(path.join(__dirname, '..', 'ontology-utils.js'));
const {
    generateMultipleChoiceQuestions,
    resolveQuizScope,
} = require(path.join(__dirname, '..', 'quiz-content.js'));

const allTerms = [
    { term: '서버사이드 렌더링', definition: '서버에서 HTML을 만들어 전달하는 방식입니다.' },
    { term: '정적 렌더링', definition: '빌드할 때 HTML을 미리 만드는 방식입니다.' },
    { term: '클라이언트 렌더링', definition: '브라우저에서 JavaScript로 화면을 만드는 방식입니다.' },
    { term: 'SPA(Single Page Application)', definition: '페이지 전체를 새로고침하지 않고 화면을 바꾸는 앱입니다.' },
    { term: 'Rendering(렌더링)', definition: '코드를 사용자가 보는 화면으로 바꾸는 과정입니다.' },
    { term: 'PWA(Progressive Web App)', definition: '웹 기술로 앱 같은 경험을 제공하는 방식입니다.' },
];

const answerPool = allTerms.slice(0, 4);

test('학습 경로 퀴즈는 경로 용어만 정답으로 사용하고 전체 용어 풀에서 혼동군 오답을 고른다', () => {
    const questions = generateMultipleChoiceQuestions({
        answerPool,
        allTerms,
        count: 15,
        seed: 42,
    });

    assert.equal(questions.length, answerPool.length, '경로가 15개보다 작으면 가능한 문제만 낸다');
    assert.ok(questions.every(question => answerPool.some(term => term.term === question.correctAnswer)));
    assert.ok(questions.every(question => question.options.length === 4));
    assert.ok(questions.every(question => new Set(question.options).size === question.options.length));
    assert.ok(questions.every(question => question.options.every(option => allTerms.some(term => term.term === option))));

    const oneTermPath = generateMultipleChoiceQuestions({
        answerPool: [allTerms[0]],
        allTerms,
        count: 15,
        seed: 42,
    });
    assert.ok(oneTermPath[0].options.some(option => !answerPool.slice(0, 1).some(term => term.term === option)),
        '오답은 경로 밖의 전체 용어 풀에서도 찾을 수 있어야 한다');
});

test('경로 객관식 생성은 같은 seed에서 같은 순서를 내고 입력 배열을 바꾸지 않는다', () => {
    const beforeAnswers = answerPool.map(item => item.term);
    const beforeTerms = allTerms.map(item => item.term);
    const first = generateMultipleChoiceQuestions({ answerPool, allTerms, count: 15, seed: 91 });
    const second = generateMultipleChoiceQuestions({ answerPool, allTerms, count: 15, seed: 91 });

    assert.deepEqual(first, second);
    assert.deepEqual(answerPool.map(item => item.term), beforeAnswers);
    assert.deepEqual(allTerms.map(item => item.term), beforeTerms);
});

test('실제 15개 학습 경로는 모든 경로 용어를 정답으로 하는 사용 가능한 객관식 문제를 만든다', () => {
    const topicIdsByTerm = Object.fromEntries(ontology.termRegistry.map(term => [term.label, term.topicIds]));

    for (const learningPath of ontology.learningPaths) {
        const sourceTerms = getTermsForQuiz(ontology, learningPath.id, terms);
        const questions = generateMultipleChoiceQuestions({
            answerPool: sourceTerms,
            allTerms: terms,
            topicIdsByTerm,
            count: 15,
            seed: 20260903,
        });

        assert.equal(questions.length, Math.min(15, new Set(sourceTerms.map(term => term.term)).size), learningPath.id);
        assert.deepEqual(new Set(questions.map(question => question.correctAnswer)), new Set(sourceTerms.map(term => term.term)), learningPath.id);
        for (const question of questions) {
            assert.equal(question.options.length, 4, learningPath.id);
            assert.equal(new Set(question.options).size, 4, learningPath.id);
            for (const option of question.options.filter(option => option !== question.correctAnswer)) {
                assert.equal(
                    question.questionText.normalize('NFKC').toLocaleLowerCase('ko-KR')
                        .replace(/[^\p{L}\p{N}]+/gu, '')
                        .includes(option.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]+/gu, '')),
                    false,
                    `${learningPath.id}: 정의에 오답 선택지가 드러나면 안 됩니다`,
                );
            }
        }
    }
});

test('명시적으로 빈 경로 용어를 넘기면 전체 사전으로 되돌아가지 않고 안전하게 거절한다', () => {
    assert.throws(
        () => resolveQuizScope({ options: { sourceTerms: [] }, allTerms }),
        /at least one source term/i,
    );
    assert.equal(resolveQuizScope({ options: {}, allTerms }).sourceTerms, allTerms);
});


test('Express는 별칭과 공식 출처를 갖고 백엔드 경로에서 학습하고 퀴즈로 확인한다', () => {
    const express = terms.find(item => item.term === 'Express');
    assert.deepEqual(express.aliases, ['Express.js', '익스프레스']);
    assert.equal(express.sourceUrl, 'https://expressjs.com/');
    const entry = ontology.termRegistry.find(item => item.id === 'term-express');
    assert.equal(entry.termKind, 'framework');
    assert.deepEqual(entry.topicIds, ['topic-backend-cloud-auth']);
    const backend = ontology.learningPaths.find(item => item.id === 'path-backend-cloud-auth');
    assert.ok(getTermsForQuiz(ontology, backend.id, terms).some(item => item.term === 'Express'));
});
