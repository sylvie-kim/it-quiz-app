const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..');
const baseTerms = require(path.join(projectRoot, 'terms-data.js'));
const { mergeTerms } = require(path.join(projectRoot, 'terms-utils.js'));

test('CRUD의 작업 이름은 독립 용어 Read의 동의어로 취급하지 않는다', () => {
    const merged = mergeTerms(baseTerms, [{
        term: 'Read',
        definition: '데이터를 읽는 독립 용어',
    }]);

    assert.equal(merged.length, 160);
    assert.equal(merged.find(({ term }) => term === 'Read').definition, '데이터를 읽는 독립 용어');
    assert.notEqual(
        merged.find(({ term }) => term.startsWith('CRUD(')).definition,
        '데이터를 읽는 독립 용어'
    );
});

test('명시된 Rails 동의어는 Ruby on Rails와 같은 용어로 병합한다', () => {
    const merged = mergeTerms(baseTerms, [{
        term: 'Rails',
        definition: '외부 데이터에서 갱신한 Rails 정의',
    }]);

    assert.equal(merged.length, 159);
    const rails = merged.find(({ term }) => term.startsWith('Ruby on Rails'));
    assert.equal(rails.definition, '외부 데이터에서 갱신한 Rails 정의');
    assert.equal(rails.term, 'Ruby on Rails(줄여서 Rails, 레일스)');
});

test('CRUD 전체 영문 확장명은 CRUD와 병합하지만 개별 작업 이름은 병합하지 않는다', () => {
    const mergedFullName = mergeTerms(baseTerms, [{
        term: 'Create, Read, Update, Delete',
        definition: '외부 데이터에서 갱신한 CRUD 정의',
    }]);
    assert.equal(mergedFullName.length, 159);
    assert.equal(
        mergedFullName.find(({ term }) => term.startsWith('CRUD(')).definition,
        '외부 데이터에서 갱신한 CRUD 정의'
    );

    for (const operation of ['Create', 'Read', 'Update', 'Delete']) {
        const mergedOperation = mergeTerms(baseTerms, [{
            term: operation,
            definition: `${operation} 독립 정의`,
        }]);
        assert.equal(mergedOperation.length, 160, `${operation}는 독립 용어여야 한다`);
    }
});
