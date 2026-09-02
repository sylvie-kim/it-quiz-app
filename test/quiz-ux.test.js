const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..');
const ux = require(path.join(projectRoot, 'quiz-ux.js'));

const falseQuestion = {
    type: 'true-false',
    term: 'API',
    termDefinition: '서로 다른 프로그램이 기능과 데이터를 주고받는 규칙입니다.',
    shownDefinitionTerm: 'RAG',
    shownDefinition: '외부 문서를 검색해 답변 생성에 활용하는 방식입니다.',
    correctAnswer: false,
};

test('참/거짓이 참이고 정답이면 짧은 확인만 보여준다', () => {
    const model = ux.buildFeedbackModel({
        ...falseQuestion,
        shownDefinitionTerm: 'API',
        shownDefinition: falseQuestion.termDefinition,
        correctAnswer: true,
    }, true);

    assert.equal(model.title, '정답입니다');
    assert.deepEqual(model.sections, []);
});

test('거짓이 정답이면 용어의 실제 정의와 문제 정의의 주인을 함께 설명한다', () => {
    const model = ux.buildFeedbackModel(falseQuestion, true);

    assert.equal(model.title, '정답입니다');
    assert.equal(model.summary, '두 설명은 서로 다른 용어에 해당합니다.');
    assert.deepEqual(model.sections, [
        {
            label: 'API의 실제 정의',
            term: 'API',
            definition: falseQuestion.termDefinition,
        },
        {
            label: '문제에 나온 정의',
            term: 'RAG',
            definition: falseQuestion.shownDefinition,
        },
    ]);
});

test('참/거짓 오답은 사용자가 혼동한 두 용어의 차이를 설명한다', () => {
    const choseTrue = ux.buildFeedbackModel(falseQuestion, false);
    assert.equal(choseTrue.title, '정답은 거짓입니다');
    assert.equal(choseTrue.sections.length, 2);

    const choseFalse = ux.buildFeedbackModel({
        ...falseQuestion,
        shownDefinitionTerm: 'API',
        shownDefinition: falseQuestion.termDefinition,
        correctAnswer: true,
    }, false);
    assert.equal(choseFalse.title, '정답은 참입니다');
    assert.equal(choseFalse.sections[0].term, 'API');
});

test('오답 복습 HTML은 질문 마크업을 재삽입하지 않고 항목을 형제 구조로 닫는다', () => {
    const answers = [
        {
            questionText: 'API와 다음 정의가 올바르게 연결됐나요?',
            userAnswer: true,
            correctAnswer: false,
            feedbackModel: ux.buildFeedbackModel(falseQuestion, false),
        },
        {
            questionText: '<div class="term-definition-pair">깨진 질문 태그',
            userAnswer: false,
            correctAnswer: true,
            feedbackModel: ux.buildFeedbackModel({
                ...falseQuestion,
                shownDefinitionTerm: 'API',
                shownDefinition: falseQuestion.termDefinition,
                correctAnswer: true,
            }, false),
        },
    ];

    const html = answers.map((answer, index) => ux.buildReviewItemHTML(answer, index)).join('');
    assert.equal((html.match(/<article/g) || []).length, 2);
    assert.equal((html.match(/<\/article>/g) || []).length, 2);
    assert.ok(!html.includes('<div class="term-definition-pair">'));
    assert.ok(html.includes('&lt;div class=&quot;term-definition-pair&quot;&gt;'));
    assert.ok(!html.includes('당신의 답: false'));
    assert.match(html, /내 답:\s*<strong>참<\/strong>/);
});

test('선택형 문제는 별도 제출 없이 선택 즉시 채점하고 홈의 선택지는 실제 버튼이다', () => {
    assert.equal(ux.shouldSubmitOnSelection('multiple-choice'), true);
    assert.equal(ux.shouldSubmitOnSelection('true-false'), true);
    assert.equal(ux.shouldSubmitOnSelection('short-answer'), false);

    const appSource = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    assert.match(appSource, /shouldSubmitOnSelection\(question\.type\)/);
    assert.doesNotMatch(html, /<div class="quiz-type-card"/);
    assert.match(html, /<button[^>]+class="quiz-type-card"/);
});

test('새 화면 구조는 중첩 카드·장식 그라데이션·가짜 관리자 비밀번호를 제거한다', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(projectRoot, 'style.css'), 'utf8');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);

    assert.equal(new Set(ids).size, ids.length, '같은 id를 가진 요소가 둘 이상이면 안 된다');
    assert.doesNotMatch(html, /score-circle|brand-mark|관리자 비밀번호/);
    assert.doesNotMatch(css, /linear-gradient|border-left|height:\s*100vh\s*!important/);
    assert.match(html, /id="result-summary"/);
    assert.match(html, /id="wrong-list"[^>]*class="review-list"/);
});

test('긴 한국어 정의는 중간 화면에서도 2열 폭을 밀어내지 않는다', () => {
    const css = fs.readFileSync(path.join(projectRoot, 'style.css'), 'utf8');

    assert.match(
        css,
        /\.feedback-comparison\s*\{[^}]*grid-template-columns:\s*minmax\(0,/s
    );
    assert.match(css, /\.feedback-comparison\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
    assert.match(
        css,
        /@media\s*\(max-width:\s*900px\)[\s\S]*?\.feedback-comparison\s*\{[^}]*grid-template-columns:\s*1fr/s
    );
});

test('공개 앱에는 용어 데이터 관리와 외부 시트 업로드 기능을 노출하지 않는다', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const appSource = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

    assert.doesNotMatch(html, /admin-panel|admin-toggle|GoogleSheetsIntegration|google-sheets-integration|CSV 업로드/);
    assert.doesNotMatch(appSource, /GoogleSheetsIntegration/);
    assert.equal(fs.existsSync(path.join(projectRoot, 'google-sheets-integration.js')), false);
    assert.equal(fs.existsSync(path.join(projectRoot, 'Google_Sheets_연동_가이드.md')), false);
});

test('홈은 다크 모드가 기본이고 바이브코딩 학습용 3D 비주얼을 사용한다', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const appSource = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
    const heroAsset = path.join(projectRoot, 'assets', 'vibe-coding-blocks.png');

    assert.match(html, /<html\s+lang="ko"\s+data-theme="dark">/);
    assert.match(html, /id="theme-toggle"[^>]*>라이트 모드</);
    assert.match(html, /바이브코딩을 위한 기본 용어 학습/);
    assert.match(html, /src="assets\/vibe-coding-blocks\.png"/);
    assert.match(appSource, /savedDarkMode\s*===\s*null\s*\?\s*true/);
    assert.equal(fs.existsSync(heroAsset), true, '홈 3D 비주얼 파일이 있어야 한다');
});

test('퀴즈의 다음 행동은 공간이 있으면 해설 바로 아래, 부족하면 화면 안에 고정된다', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(projectRoot, 'style.css'), 'utf8');

    assert.match(html, /id="question-action-hint"/);
    assert.doesNotMatch(html, /class="keyboard-hint"/);
    assert.equal(ux.shouldDockQuestionActions({
        contentBottom: 610,
        actionHeight: 52,
        viewportHeight: 900,
    }), false, '공간이 충분하면 해설 다음에 바로 보여야 한다');
    assert.equal(ux.shouldDockQuestionActions({
        contentBottom: 810,
        actionHeight: 68,
        viewportHeight: 844,
    }), true, '공간이 부족하면 화면 안에 고정되어야 한다');
    assert.equal(ux.shouldDockQuestionActions({
        contentBottom: 685.5,
        actionHeight: 63.8,
        viewportHeight: 768,
    }), true, '버튼 위 20px 여백까지 포함해 1024×768 경계에서 잘리면 안 된다');
    assert.match(css, /\.question-actions\.is-docked\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*max\(/s);
    assert.doesNotMatch(css, /\.question-actions\s*\{[^}]*position:\s*fixed/s);
});

test('정적 배포의 CSS와 JavaScript는 같은 버전 주소로 함께 갱신된다', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const assetVersions = [...html.matchAll(/(?:style\.css|terms-utils\.js|terms-data\.js|quiz-ux\.js|app\.js)\?v=([^"']+)/g)]
        .map(([, version]) => version);

    assert.equal(assetVersions.length, 5, '배포에 필요한 CSS와 JavaScript 5개 모두 버전 주소가 있어야 한다');
    assert.equal(new Set(assetVersions).size, 1, 'CSS와 JavaScript가 서로 다른 캐시 버전을 사용하면 안 된다');
});

test('사전의 검색 결과 없음 문구는 사용자 검색어를 HTML로 실행하지 않는다', () => {
    const appSource = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

    assert.match(appSource, /<h3>"\$\{escapeHTML\(query\)\}"에 대한 검색 결과가 없습니다<\/h3>/);
});

test('사전의 긴 검색어는 모바일 화면 폭을 밀어내지 않는다', () => {
    const css = fs.readFileSync(path.join(projectRoot, 'style.css'), 'utf8');

    assert.match(css, /\.no-results h3\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});
