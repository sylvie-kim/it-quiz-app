const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const terms = require('../terms-data.js');

function navigation() {
    const nodes = new Map();
    function node(id) {
        if (!nodes.has(id)) {
            const classes = new Set();
            nodes.set(id, { id, dataset: {}, attributes: {}, focus() {},
                classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
                setAttribute(name, value) { this.attributes[name] = value; },
                removeAttribute(name) { delete this.attributes[name]; },
            });
        }
        return nodes.get(id);
    }
    const screens = ['learning-home-screen', 'dictionary-screen', 'learning-map-screen', 'home-screen', 'quiz-screen', 'result-screen'].map(node);
    const tabs = ['quiz', 'learn', 'connections', 'search'].map(page => { const item = node(page); item.dataset.appPage = page; return item; });
    const location = { hash: '' }, entries = [];
    const context = {
        IT_QUIZ_BASE_TERMS: terms,
        IT_QUIZ_ONTOLOGY: require('../ontology-data.js'),
        ITQuizOntologyUtils: require('../ontology-utils.js'),
        ITQuizUX: require('../quiz-ux.js'),
        ITQuizContent: require('../quiz-content.js'),
        document: { getElementById: node, body: node('body'), querySelector: () => ({ click() {} }), querySelectorAll: selector => selector === '.screen' ? screens : selector === '[data-app-page]' ? tabs : [] },
        window: { location, history: { pushState(a, b, hash) { entries.push(hash); location.hash = hash; } }, scrollTo() {}, matchMedia: () => ({ matches: false }) },
        localStorage: { getItem: () => null },
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(require.resolve('../app.js'), 'utf8').split('// 이벤트 리스너')[0], context);
    return { run: code => vm.runInContext(code, context), nodes, screens, tabs, location, entries };
}

test('learning, search and the relation detail have one unambiguous active top menu', () => {
    const n = navigation();
    for (const [screen, tab, hash] of [
        ['learning-home-screen', 'learn', '#learn'],
        ['dictionary-screen', 'search', '#search'],
        ['learning-map-screen', 'connections', '#connections'],
    ]) {
        n.run(`showScreen('${screen}')`);
        assert.equal(n.location.hash, hash);
        assert.deepEqual(n.tabs.filter(t => t.attributes['aria-current']).map(t => t.dataset.appPage), [tab]);
        assert.deepEqual(n.screens.filter(s => s.classList.contains('active')).map(s => s.id), [screen]);
    }
});

test('returning to quiz restores the running question rather than the quiz picker', () => {
    const n = navigation();
    n.run("showScreen('quiz-screen'); openLearningMap()");
    const count = n.entries.length;
    n.location.hash = '#quiz';
    n.run('restorePageFromHash()');
    assert.equal(n.nodes.get('quiz-screen').classList.contains('active'), true);
    assert.equal(n.entries.length, count, 'back/forward must not create another history entry');
});

test('default landing is Quiz; Learn and old dictionary bookmarks still work', () => {
    const n = navigation();
    n.run('restorePageFromHash()');
    assert.equal(n.nodes.get('home-screen').classList.contains('active'), true);
    n.location.hash = '#learn';
    n.run('restorePageFromHash()');
    assert.equal(n.nodes.get('learning-home-screen').classList.contains('active'), true);
    n.location.hash = '#dictionary';
    n.run('restorePageFromHash()');
    assert.equal(n.nodes.get('dictionary-screen').classList.contains('active'), true);
    assert.equal(n.entries.length, 0);
});

test('connections opens directly and restores its own tab without adding history', () => {
    const n = navigation();
    n.run('openConnections()');
    assert.equal(n.location.hash, '#connections');
    assert.equal(n.nodes.get('connections').attributes['aria-current'], 'page');
    n.run('openLearningMap()');
    const count = n.entries.length;
    n.location.hash = '#connections';
    n.run('restorePageFromHash()');
    assert.equal(n.entries.length, count);
    assert.equal(n.nodes.get('learning-map-screen').classList.contains('active'), true);
    assert.deepEqual(n.tabs.filter(t => t.attributes['aria-current']).map(t => t.dataset.appPage), ['connections']);
});
