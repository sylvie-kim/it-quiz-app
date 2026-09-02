const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const baseTerms = require(path.join(projectRoot, 'terms-data.js'));
const utilities = require(path.join(projectRoot, 'terms-utils.js'));

test('CSV 업로드도 164개 기본 목록을 지우지 않고 병합한다', async () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const inlineScript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map(([, source]) => source)
        .find(source => source.includes('async function handleCSVUpload'));
    assert.ok(inlineScript, 'CSV 업로드 함수를 찾지 못했다');

    const input = { files: [{}], value: 'selected.csv' };
    const context = {
        ITQuizTerms: utilities,
        GoogleSheetsIntegration: {
            async loadFromCSVFile() {
                return [{ term: 'API(Application Programming Interface)', definition: 'CSV 정의' }];
            },
        },
        alert() {},
        console: { log() {}, error() {} },
        document: {
            getElementById() {
                return { classList: { contains() { return false; } } };
            },
        },
        termsData: baseTerms.map(item => ({ ...item })),
    };

    vm.createContext(context);
    vm.runInContext(inlineScript, context);
    await context.handleCSVUpload(input);

    assert.equal(context.termsData.length, 164);
    assert.equal(
        context.termsData.find(({ term }) => term.startsWith('API(')).definition,
        'CSV 정의'
    );
    assert.equal(input.value, '');
});

test('실제 CSV 파서는 따옴표 안 쉼표와 이중 따옴표를 한 셀로 읽는다', async () => {
    class FakeFileReader {
        readAsText(file) {
            this.onload({ target: { result: file.content } });
        }
    }

    const context = {
        console: { log() {}, warn() {}, error() {} },
        FileReader: FakeFileReader,
        localStorage: {
            getItem() { return null; },
            setItem() {},
            removeItem() {},
        },
        window: {},
    };
    vm.createContext(context);
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'google-sheets-integration.js'), 'utf8'),
        context
    );

    const csv = [
        '\uFEFF"용어","정의"',
        '"CRUD(Create, Read, Update, Delete)","데이터를 만들고, 읽고, 고치고, 지우는 네 작업"',
        '"CSV 인용","큰따옴표 ""표기""도 보존"',
    ].join('\r\n');
    const parsed = await context.window.GoogleSheetsIntegration.loadFromCSVFile({ content: csv });

    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [
        {
            term: 'CRUD(Create, Read, Update, Delete)',
            definition: '데이터를 만들고, 읽고, 고치고, 지우는 네 작업',
        },
        {
            term: 'CSV 인용',
            definition: '큰따옴표 "표기"도 보존',
        },
    ]);
});
