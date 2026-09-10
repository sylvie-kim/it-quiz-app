const assert = require('node:assert/strict');
const test = require('node:test');

const terms = require('../terms-data.js');
const ontology = require('../ontology-data.js');
const quiz = require('../quiz-content.js');

const termByName = new Map(terms.map(item => [item.term, item]));
const topicIdsByTerm = Object.fromEntries(ontology.termRegistry.map(item => [item.label, item.topicIds]));

test('공식 명칭과 플랫폼 설명이 퀴즈에서 잘못된 사실을 가르치지 않는다', () => {
    assert.ok(termByName.has('npm'), 'npm을 약어처럼 풀어 쓴 이름을 사용하면 안 된다');
    assert.equal(termByName.has('npm(node package manager)'), false);
    assert.doesNotMatch(termByName.get('Expo(엑스포)').definition, /Facebook|Meta/i);
    assert.match(termByName.get('Module(모듈)').definition, /가져오|내보내|불러/);
    assert.match(termByName.get('Routing(라우팅)').definition, /URL|요청/);
    assert.match(termByName.get('Token(토큰)').definition, /언어 모델|AI/);
    assert.match(termByName.get('authController.js').definition, /표준.*아니|정해진.*아니/);
    assert.match(termByName.get('App.jsx').definition, /관례|프로젝트.*따라/);
});

test('관례적인 authController.js 파일명을 Node.js 전용 관계로 표시하지 않는다', () => {
    assert.equal(
        ontology.relations.some(relation => relation.id === 'rel-authcontroller-js-runs-on-node-js'),
        false,
    );
});

test('SDK와 PWA 상황 문제는 적용 범위와 지원 조건을 질문 안에서 알려준다', () => {
    const questions = quiz.generateApplicationQuestions({ seed: 20260909 });
    const sdk = questions.find(item => item.correctAnswer === 'SDK');
    const pwa = questions.find(item => item.correctAnswer === 'PWA');

    assert.match(sdk.questionText, /iOS/);
    assert.match(sdk.questionText, /Android/);
    assert.match(sdk.questionText, /특정 플랫폼|서비스/);
    assert.match(pwa.questionText, /구현|지원/);
});

test('참거짓 오답은 검토된 조합만 사용하며 사실상 맞는 상하위 개념을 섞지 않는다', () => {
    const reviewedFalsePairs = new Set([
        'SDK(Software Development Kit)::IDE(Integrated Development Environment)',
        'API(Application Programming Interface)::SDK(Software Development Kit)',
        'React(리액트)::Next.js',
        '클라이언트 렌더링::서버사이드 렌더링',
        'Crawling(크롤링)::Scraping(스크래핑)',
        'Wireframe(와이어프레임)::Prototype(프로토타입)',
        'GitHub Pages::GitHub Actions',
        'npm install::npm run build',
        'CSV::XLSX (엑셀)',
        'RAG::Tool Calling',
        'TDD(Test-Driven Development, 테스트 주도 개발)::Refactoring(리팩토링)',
        'HTML::CSS',
    ]);

    for (let seed = 1; seed <= 40; seed += 1) {
        const questions = quiz.generateTrueFalseQuestions({ terms, seed });
        assert.equal(questions.length, 15);
        assert.equal(questions.filter(item => item.correctAnswer).length, 10);
        assert.equal(questions.filter(item => !item.correctAnswer).length, 5);
        for (const item of questions.filter(question => !question.correctAnswer)) {
            assert.ok(
                reviewedFalsePairs.has(`${item.term.term}::${item.definitionSource.term}`),
                `${item.term.term}과 ${item.definitionSource.term}은 검토되지 않은 오답 조합이다`,
            );
        }
    }
});

test('객관식은 정답의 상위·하위 개념을 함께 정답처럼 보이는 선택지로 내지 않는다', () => {
    const blocked = new Map([
        ['API(Application Programming Interface)', ['Interface(인터페이스)', 'Protocol(프로토콜)']],
        ['MCP(Model Context Protocol)', ['Protocol(프로토콜)', 'API(Application Programming Interface)']],
        ['Rendering(렌더링)', ['정적 렌더링', '클라이언트 렌더링', '서버사이드 렌더링']],
        ['Hosting(호스팅)', ['GitHub Pages', 'Cloudflare Pages', 'Vercel', 'Netlify']],
        ['React(리액트)', ['MUI(Material UI)']],
        ['머신러닝', ['딥러닝']],
    ]);

    for (const [answerName, excludedNames] of blocked) {
        const answer = termByName.get(answerName);
        const options = quiz.buildMultipleChoiceOptions({
            answer,
            definition: answer.definition,
            terms,
            topicIdsByTerm,
            shuffle: values => values,
        });
        assert.equal(options.length, 4, answerName);
        for (const excluded of excludedNames) {
            assert.equal(options.includes(excluded), false, `${answerName}에 ${excluded} 선택지를 함께 내면 안 된다`);
        }
    }
});
