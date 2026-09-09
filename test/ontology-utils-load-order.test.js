const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const ontologyUtilsSource = fs.readFileSync(path.join(root, 'ontology-utils.js'), 'utf8');
const quizContentSource = fs.readFileSync(path.join(root, 'quiz-content.js'), 'utf8');

test('브라우저에서 사전 검색 유틸이 먼저 로드되어도 나중의 퀴즈 검색기를 사용한다', () => {
    const browser = vm.createContext({});
    browser.globalThis = browser;

    vm.runInContext(ontologyUtilsSource, browser);
    vm.runInContext(quizContentSource, browser);

    const results = browser.ITQuizOntologyUtils.searchOntologyTerms({
        terms: [{
            term: 'Interface(인터페이스)',
            definition: '사람과 기계가 만나는 접점',
            aliases: ['사용자 접점'],
        }],
        termRegistry: [{
            id: 'term-interface',
            label: 'Interface(인터페이스)',
            topicIds: ['topic-interfaces-network'],
        }],
        pathsByTermId: new Map([['term-interface', ['path-api-system-connection']]]),
        query: '접점',
    });

    assert.deepEqual(results.map(result => result.id), ['term-interface']);
});
