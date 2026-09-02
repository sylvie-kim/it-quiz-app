const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { shouldOpenQuizDictionary } = require(path.join(__dirname, '..', 'quiz-content.js'));

test('단답형과 상황 적용을 푸는 중 상단 용어사전도 퀴즈 안에서 연다', () => {
    assert.equal(shouldOpenQuizDictionary({ isQuizActive: true, quizType: 'short-answer', answered: false }), true);
    assert.equal(shouldOpenQuizDictionary({ isQuizActive: true, quizType: 'application', answered: false }), true);
    assert.equal(shouldOpenQuizDictionary({ isQuizActive: false, quizType: 'short-answer', answered: false }), false);
    assert.equal(shouldOpenQuizDictionary({ isQuizActive: true, quizType: 'multiple-choice', answered: false }), false);
    assert.equal(shouldOpenQuizDictionary({ isQuizActive: true, quizType: 'short-answer', answered: true }), false);
});
