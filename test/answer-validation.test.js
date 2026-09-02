const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
const validationSource = source.slice(
    source.indexOf('function normalizeText'),
    source.indexOf('// 문제 생성 함수들')
);
const context = {
    console: { log() {} },
    ITQuizTerms: require(path.join(projectRoot, 'terms-utils.js')),
    termsData: require(path.join(projectRoot, 'terms-data.js')),
};
vm.createContext(context);
vm.runInContext(validationSource, context);

test('여러 단어로 된 용어는 첫 영어 단어만 입력하면 오답이다', () => {
    for (const [partial, full] of [
        ['Figma', 'Figma Make'],
        ['GitHub', 'GitHub Pages'],
        ['Git', 'GitHub Pages'],
        ['Google', 'Google AI Studio'],
        ['AI', 'AI Agent'],
        ['Notion', 'Notion MCP'],
    ]) {
        assert.equal(
            context.isAnswerCorrect(partial, full, full),
            false,
            `${partial}만으로 ${full}을 맞힐 수 없어야 한다`
        );
        assert.equal(context.isAnswerCorrect(full, full, full), true);
    }
});

test('괄호로 함께 표기한 단일 용어의 영어·한글 이름은 계속 인정한다', () => {
    assert.equal(
        context.isAnswerCorrect('Parsing', 'Parsing(파싱)', 'Parsing(파싱)'),
        true
    );
    assert.equal(
        context.isAnswerCorrect('파싱', 'Parsing(파싱)', 'Parsing(파싱)'),
        true
    );
});
