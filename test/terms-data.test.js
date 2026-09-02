const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const dataPath = path.join(__dirname, '..', 'terms-data.js');
const {
    getTermAliases,
    normalizeTermName,
} = require(path.join(__dirname, '..', 'terms-utils.js'));

test('단순 AI 회사·대화 서비스명은 제외하고 실무 도구 용어는 유지한다', () => {
    const terms = require(dataPath);
    const names = new Set(terms.map(({ term }) => term));

    for (const basicName of ['OpenAI', 'ChatGPT', 'Claude', 'Gemini', 'Grok']) {
        assert.equal(names.has(basicName), false, `${basicName}는 단순 서비스명 암기 문제에서 제외해야 한다`);
    }

    assert.equal(names.has('Claude Code'), true, '개발 실무 도구는 유지해야 한다');
    assert.equal(names.has('Claude Design'), true, '디자인 실무 도구는 유지해야 한다');
});

test('기본 용어 사전은 76개 기존 용어와 83개 신규 용어를 중복 없이 제공한다', () => {
    assert.ok(fs.existsSync(dataPath), 'terms-data.js가 아직 없다');

    const terms = require(dataPath);
    const normalizedNames = terms.map(({ term }) =>
        term.normalize('NFKC').trim().toLocaleLowerCase('ko-KR')
    );

    assert.equal(terms.length, 159);
    assert.equal(terms.filter(({ origin }) => origin === 'google-sheet').length, 76);
    assert.equal(terms.filter(({ origin }) => origin === 'source-glossary').length, 83);
    assert.equal(new Set(normalizedNames).size, 159);

    assert.ok(terms.some(({ term }) => term === 'Vibe Coding(바이브코딩)'));
    assert.ok(!terms.some(({ term }) => /Vive Coding/i.test(term)));
    assert.ok(terms.some(({ term }) => term === '생성형 AI'));
    assert.ok(terms.some(({ term }) => term === 'RAG'));
    assert.ok(terms.some(({ term }) => term === '캡스톤'));

    for (const item of terms) {
        assert.ok(item.term.trim(), '빈 용어명이 없어야 한다');
        assert.ok(item.definition.trim(), `${item.term}: 빈 정의가 없어야 한다`);
        assert.equal(
            (item.definition.match(/\(/g) || []).length,
            (item.definition.match(/\)/g) || []).length,
            `${item.term}: 정의의 괄호가 닫혀야 한다`
        );
    }

    const markupLanguage = terms.find(({ term }) => term.startsWith('Markup language'));
    assert.ok(!markupLanguage.definition.endsWith('마크업 언'), '잘린 정의가 없어야 한다');

    const aliasOwners = new Map();
    for (const item of terms) {
        for (const alias of getTermAliases(item)) {
            assert.ok(
                !aliasOwners.has(alias),
                `${aliasOwners.get(alias)}와 ${item.term}의 동의어 ${alias}가 겹치면 안 된다`
            );
            aliasOwners.set(alias, item.term);
        }
    }

    for (const item of terms) {
        const normalizedDefinition = normalizeTermName(item.definition);
        const leakedAlias = getTermAliases(item).find(alias =>
            alias.length >= 2 && normalizedDefinition.includes(alias)
        );
        assert.equal(
            leakedAlias,
            undefined,
            `${item.term}: 단답형 정의에 정답 ${leakedAlias}이 직접 노출되면 안 된다`
        );
    }
});

test('앱은 공유 용어 데이터의 159개 항목으로 시작한다', () => {
    const terms = require(dataPath);
    const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const dataSection = appSource.split('// 퀴즈 상태')[0];
    const context = { IT_QUIZ_BASE_TERMS: terms };

    vm.createContext(context);
    vm.runInContext(`${dataSection};globalThis.__termsData = termsData;`, context);

    assert.equal(context.__termsData.length, 159);
    assert.notEqual(context.__termsData, terms, '실행 중 변경이 원본 데이터에 번지면 안 된다');
});

test('브라우저는 앱 코드보다 먼저 공유 용어 데이터를 불러온다', () => {
    const projectRoot = path.join(__dirname, '..');
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(([, src]) => src);
    const context = {};

    vm.createContext(context);
    for (const source of scriptSources) {
        if (source === 'app.js') {
            assert.equal(context.IT_QUIZ_BASE_TERMS?.length, 159);
            return;
        }
        if (source === 'terms-data.js') {
            vm.runInContext(fs.readFileSync(path.join(projectRoot, source), 'utf8'), context);
        }
    }

    assert.fail('index.html에서 app.js 로드를 찾지 못했다');
});
