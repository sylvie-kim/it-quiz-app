const assert = require('node:assert/strict');
const test = require('node:test');

const terms = require('../terms-data.js');
const quiz = require('../quiz-content.js');

function normalize(value) {
    return String(value || '')
        .normalize('NFKC')
        .toLocaleLowerCase('ko-KR')
        .replace(/[^\p{L}\p{N}]+/gu, '');
}

// 용어 자체와 괄호 안 표기, 명시된 동의어를 모두 정답 표기로 본다.
function answerNames(item) {
    const term = String(item?.term || '');
    const names = [term, term.split('(')[0], ...(item?.aliases || [])];
    for (const match of term.matchAll(/\(([^)]+)\)/g)) {
        names.push(...match[1].split(/[,·/]/));
    }
    return [...new Set(names.map(normalize).filter(name => name.length >= 2))];
}

// 영문 낱말은 앞뒤에 다른 영문자가 붙지 않은 경우에만 노출로 센다(OAuth 안의 Auth는 노출이 아니다).
function mentionsWord(text, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = /^[A-Za-z]+$/.test(word)
        ? new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'i')
        : new RegExp(escaped, 'i');
    return pattern.test(text);
}

test('정의 문제는 정답 용어를 문제 안에서 그대로 알려주지 않는다', () => {
    for (const item of terms) {
        const definition = normalize(item.definition);
        const leaked = answerNames(item).filter(name => definition.includes(name));
        assert.deepEqual(leaked, [], `${item.term}: 정의가 정답을 그대로 노출한다 (${leaked.join(', ')})`);
    }
});

test('여러 낱말로 된 용어는 구성 낱말 전부를 정의에 드러내지 않는다', () => {
    for (const item of terms) {
        const base = item.term.split('(')[0].trim();
        const words = base.split(/[\s.]+/).filter(word => word.length >= 3);
        if (words.length < 2) continue;
        const shown = words.filter(word => mentionsWord(item.definition, word));
        assert.notEqual(
            shown.length,
            words.length,
            `${item.term}: 정의에 정답의 모든 낱말(${shown.join(', ')})이 드러나 답이 그냥 보인다`
        );
    }
});

test('상황 적용 문제는 정답 용어를 문제 안에서 그대로 알려주지 않는다', () => {
    const questions = quiz.generateApplicationQuestions({ seed: 20260915 });
    assert.ok(questions.length > 0);
    for (const question of questions) {
        const item = terms.find(entry => entry.term === question.term) || { term: question.term };
        const scenario = normalize(question.questionText);
        const leaked = answerNames(item).filter(name => scenario.includes(name));
        assert.deepEqual(leaked, [], `${question.term}: 상황 문제가 정답을 그대로 노출한다 (${leaked.join(', ')})`);
    }
});
