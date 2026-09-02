const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const baseTerms = require(path.join(projectRoot, 'terms-data.js'));

test('새로 가져온 용어의 아이콘과 카테고리를 사전과 퀴즈에 사용한다', () => {
    const appSource = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
    const presentationSection = appSource.split('// 접근성 초기화')[0];
    const context = {
        IT_QUIZ_BASE_TERMS: baseTerms,
        document: {
            getElementById() { return {}; },
            querySelectorAll() { return []; },
        },
        localStorage: { getItem() { return null; } },
        window: { matchMedia() { return { matches: false }; } },
    };

    vm.createContext(context);
    vm.runInContext(
        `${presentationSection};globalThis.__result = {` +
        `portfolioIcon: getTermIcon('포트폴리오'),` +
        `pythonCategory: getTermCategory('Python'),` +
        `figmaCategory: getTermCategory('Figma')` +
        `};`,
        context
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.__result)),
        { portfolioIcon: '📁', pythonCategory: '언어', figmaCategory: '디자인' }
    );
});
