const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const baseTerms = require(path.join(projectRoot, 'terms-data.js'));
const utilities = require(path.join(projectRoot, 'terms-utils.js'));

function createUpdateContext(fetchImpl) {
    const notifications = [];
    let savedPayload = null;
    let welcomeUpdates = 0;
    let countUpdates = 0;
    const context = {
        console: { log() {}, warn() {}, error() {} },
        document: {
            querySelector() { return null; },
            createElement(tagName) {
                const element = {
                    tagName,
                    style: {},
                    remove() {},
                };
                return element;
            },
            getElementById() {
                return { classList: { contains() { return true; } } };
            },
            head: { appendChild() {} },
            body: { appendChild(element) { notifications.push(element); } },
        },
        fetch: fetchImpl,
        ITQuizTerms: utilities,
        localStorage: {
            getItem() { return null; },
            setItem(_key, value) { savedPayload = JSON.parse(value); },
            removeItem() {},
        },
        setTimeout() {},
        showWelcomeMessage() { welcomeUpdates += 1; },
        termsData: baseTerms.map(item => ({ ...item })),
        updateTermsCount() { countUpdates += 1; },
        window: {},
    };
    vm.createContext(context);
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'google-sheets-integration.js'), 'utf8'),
        context
    );
    return {
        context,
        getCountUpdates: () => countUpdates,
        getNotifications: () => notifications,
        getSavedPayload: () => savedPayload,
        getWelcomeUpdates: () => welcomeUpdates,
    };
}

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

test('Google Sheet 갱신은 기존 용어를 병합하고 신규 용어를 추가해 저장·화면 갱신한다', async () => {
    const fixture = createUpdateContext(async () => ({
        ok: true,
        async json() {
            return {
                values: [
                    ['용어', '정의'],
                    ['API(Application Programming Interface)', 'Sheet에서 갱신한 API 정의'],
                    ['새 외부 용어', 'Sheet에서 추가한 신규 정의'],
                ],
            };
        },
    }));

    const result = await fixture.context.window.GoogleSheetsIntegration.updateTermsFromGoogleSheets();

    assert.equal(result, true);
    assert.equal(fixture.context.termsData.length, 165);
    assert.equal(
        fixture.context.termsData.find(({ term }) => term.startsWith('API(')).definition,
        'Sheet에서 갱신한 API 정의'
    );
    assert.equal(fixture.getSavedPayload().terms.length, 2);
    assert.equal(fixture.getWelcomeUpdates(), 1);
    assert.equal(fixture.getCountUpdates(), 1);
    assert.match(fixture.getNotifications().at(-1).innerHTML, /성공적으로 업데이트/);
});

test('Google Sheet HTTP 오류는 기존 164개를 보존하고 오류 알림을 표시한다', async () => {
    const fixture = createUpdateContext(async () => ({ ok: false, status: 503 }));

    const result = await fixture.context.window.GoogleSheetsIntegration.updateTermsFromGoogleSheets();

    assert.equal(result, false);
    assert.equal(fixture.context.termsData.length, 164);
    assert.equal(fixture.getSavedPayload(), null);
    assert.match(fixture.getNotifications().at(-1).className, /error/);
    assert.match(fixture.getNotifications().at(-1).innerHTML, /503/);
});
