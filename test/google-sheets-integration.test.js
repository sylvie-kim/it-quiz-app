const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const baseTerms = require(path.join(projectRoot, 'terms-data.js'));

test('브라우저 저장 데이터는 164개 기본 목록을 지우지 않고 같은 용어만 갱신한다', () => {
    const savedTerms = [
        {
            term: 'API(Application Programming Interface)',
            definition: '저장 데이터에서 갱신한 API 정의',
        },
        {
            term: 'Vive Coding(바이브코딩)',
            definition: '자연어로 의도를 설명해 코드를 만드는 개발 방식',
        },
    ];
    const context = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: {
            getItem(key) {
                if (key !== 'quizTermsData') return null;
                return JSON.stringify({ terms: savedTerms, lastUpdated: '2026-09-02T00:00:00Z' });
            },
        },
        termsData: baseTerms.map(item => ({ ...item })),
        updateTermsCount() {},
        window: {},
    };
    const utilsPath = path.join(projectRoot, 'terms-utils.js');

    vm.createContext(context);
    if (fs.existsSync(utilsPath)) {
        vm.runInContext(fs.readFileSync(utilsPath, 'utf8'), context);
    }
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'google-sheets-integration.js'), 'utf8'),
        context
    );
    context.window.GoogleSheetsIntegration.initializeTermsData();

    assert.equal(context.termsData.length, 164);
    const api = context.termsData.find(({ term }) => term.startsWith('API('));
    const vibeCoding = context.termsData.find(({ term }) => term.startsWith('Vibe Coding'));
    assert.equal(api.definition, '저장 데이터에서 갱신한 API 정의');
    assert.equal(api.origin, 'google-sheet');
    assert.equal(vibeCoding.term, 'Vibe Coding(바이브코딩)');
    assert.ok(!context.termsData.some(({ term }) => /Vive Coding/i.test(term)));
});
