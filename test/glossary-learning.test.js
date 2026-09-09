const test = require('node:test');
const assert = require('node:assert/strict');
const ontology = require('../ontology-data.js');
const terms = require('../terms-data.js');
const { stages, pathTerms, getTermContext, createLessonState } = require('../glossary-learning.js');

test('six stages cover all fifteen existing paths and all 160 glossary terms', () => {
    const ids = stages.flatMap(stage => stage.paths);
    assert.equal(stages.length, 6);
    assert.equal(new Set(ids).size, 15);
    assert.deepEqual(new Set(ids), new Set(ontology.learningPaths.map(path => path.id)));
    const covered = new Set(ontology.learningPaths.flatMap(pathTerms));
    assert.equal(covered.size, 160);
    ontology.termRegistry.forEach(term => {
        assert.ok(covered.has(term.id), term.label);
        assert.ok(terms.some(source => source.term === term.label), term.label);
        assert.ok(getTermContext(ontology, term.id).paths.length > 0);
    });
});

test('lesson progresses to a quiz, distinguishes wrong answers and clears stale feedback on replay', () => {
    const lesson = createLessonState();
    assert.equal(lesson.grade('CSS'), null);
    lesson.next().next();
    assert.equal(lesson.step, 2);
    assert.equal(lesson.quizOpen, false);
    lesson.next();
    assert.equal(lesson.grade('HTML'), false);
    assert.equal(lesson.grade('CSS'), true);
    assert.equal(lesson.grade('arbitrary'), null);
    lesson.select(0);
    assert.equal(lesson.quizOpen, false);
    assert.equal(lesson.answer, '');
    assert.throws(() => lesson.select(3), /Unknown/);
});

test('unreviewed, unrelated and unsupported edges never appear as direct term connections', () => {
    const source = ontology.relations[0];
    const fixture = { ...ontology, relations: [
        source,
        { ...source, id: 'candidate', status: 'INFERRED' },
        { ...source, id: 'no-source', sourceRefs: [] },
        { ...source, id: 'no-reason', rationale: '' },
        { ...source, id: 'unrelated', source: 'term-css', target: 'term-html' },
    ] };
    assert.deepEqual(getTermContext(fixture, source.source).relations.map(r => r.id), [source.id]);
    assert.throws(() => getTermContext(ontology, 'not-a-term'), /Unknown term/);
});

test('a term can be taught in a path without claiming a direct semantic relation', () => {
    const context = getTermContext({ ...ontology, relations: [] }, 'term-css');
    assert.ok(context.paths.some(path => path.id === 'path-web-page-basics'));
    assert.equal(context.relations.length, 0);
});
