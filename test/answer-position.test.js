const assert = require('node:assert/strict');
const test = require('node:test');

const terms = require('../terms-data.js');
const quiz = require('../quiz-content.js');

test('객관식 정답이 보기 네 자리에 골고루 나온다', () => {
    for (const seed of [1, 12345, 1700000000000, undefined]) {
        const questions = quiz.generateMultipleChoiceQuestions({ answerPool: terms, allTerms: terms, count: 40, seed });
        const counts = [0, 0, 0, 0];
        questions.forEach(item => { counts[item.options.indexOf(item.correctAnswer)] += 1; });
        assert.ok(counts.every(count => count >= 3), `seed ${seed}: 정답 자리가 쏠렸습니다 ${counts}`);
    }
});
