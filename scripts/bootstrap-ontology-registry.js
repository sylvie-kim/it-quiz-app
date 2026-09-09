const path = require('node:path');

const ID_OVERRIDES = Object.freeze({
    'authController.js': 'term-authcontroller-js',
    '정적 렌더링': 'term-static-rendering',
    '클라이언트 렌더링': 'term-client-rendering',
    '서버사이드 렌더링': 'term-server-side-rendering',
    '비동기 I/O 처리': 'term-async-io',
    'App.jsx': 'term-app-jsx',
    '포트폴리오': 'term-portfolio',
    '팀 빌딩': 'term-team-building',
    '생성형 AI': 'term-generative-ai',
    '프롬프트 엔지니어링': 'term-prompt-engineering',
    '크로스플랫폼 개발': 'term-cross-platform-development',
    '앱스토어 배포': 'term-app-store-deployment',
    '.env 파일': 'term-env',
    '.gitignore': 'term-gitignore',
    '커밋 사이클': 'term-commit-cycle',
    '브랜치': 'term-branch',
    '사용자 테스트': 'term-user-testing',
    '랜딩페이지': 'term-landing-page',
    '인증': 'term-authentication',
    '클라이언트-서버 구조': 'term-client-server-architecture',
    '프론트엔드 / 백엔드': 'term-frontend-backend',
    '린 스타트업': 'term-lean-startup',
    '비즈니스 모델 캔버스': 'term-business-model-canvas',
    '페르소나': 'term-persona',
    '데이터 분석': 'term-data-analysis',
    '머신러닝': 'term-machine-learning',
    '공공데이터 Open API': 'term-public-data-open-api',
    '캐글': 'term-kaggle',
    '딥러닝': 'term-deep-learning',
    '컨텍스트 윈도우': 'term-context-window',
    '서브에이전트': 'term-subagent',
    '벡터DB': 'term-vector-db',
    '멀티모달': 'term-multimodal',
    '캡스톤': 'term-capstone',
    '해커톤': 'term-hackathon',
});

function makeStableId(term) {
    const explicit = ID_OVERRIDES[term];
    if (explicit) return explicit;
    const ascii = String(term).normalize('NFKD').toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    if (!ascii) throw new Error(`Explicit ID override required: ${term}`);
    return `term-${ascii}`;
}

function buildRegistry(terms) {
    const registry = terms.map(item => ({
        id: makeStableId(item.term),
        entityType: 'term',
        label: item.term,
        topicIds: [],
    }));
    const ids = registry.map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate generated term ID');
    return registry;
}

if (require.main === module) {
    const terms = require(path.join(__dirname, '..', 'terms-data.js'));
    process.stdout.write(`${JSON.stringify(buildRegistry(terms), null, 2)}\n`);
}

module.exports = { ID_OVERRIDES, makeStableId, buildRegistry };
