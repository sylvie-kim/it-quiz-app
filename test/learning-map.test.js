const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ontology = require('../ontology-data.js');
const terms = require('../terms-data.js');
const {
    buildOntologyIndex,
    getLearningPath,
    getTermConnections,
    getTermsForQuiz,
    getTopicGraph,
    searchOntologyTerms,
    validateOntology,
} = require('../ontology-utils.js');
const {
    buildLearningPathViewModel,
    createLearningMapController,
    createLearningMapState,
    getTermDetailModel,
    getPathsForTopic,
    restoreFocus,
    resolveSearchSelection,
} = require('../learning-map.js');

function makeFakeElement() {
    return {
        innerHTML: '',
        textContent: '',
        dataset: {},
        attributes: new Map(),
        addEventListener() {},
        append() {},
        insertAdjacentElement() {},
        querySelectorAll() { return []; },
        querySelector() { return null; },
        setAttribute(name, value) { this.attributes.set(name, value); },
        removeAttribute(name) { this.attributes.delete(name); },
    };
}

function makeLearningMapDom({ focusControl = null } = {}) {
    const elementsById = new Map([
        ['learning-map-screen', makeFakeElement()],
        ['learning-map-search', makeFakeElement()],
        ['learning-topic-list', makeFakeElement()],
        ['learning-path-flow', makeFakeElement()],
        ['learning-mobile-path', makeFakeElement()],
        ['learning-detail', makeFakeElement()],
        ['learning-map-status', makeFakeElement()],
        ['start-path-quiz', { ...makeFakeElement(), disabled: false }],
    ]);
    return {
        getElementById: id => elementsById.get(id) || null,
        createElement: () => makeFakeElement(),
        querySelectorAll: () => focusControl ? [focusControl] : [],
        elementsById,
    };
}

test('지도는 기본 경로와 선택한 용어를 예측 가능하게 바꾼다', () => {
    const state = createLearningMapState({
        defaultPathId: 'path-web-deployment',
        paths: [{ id: 'path-web-deployment', primaryTermIds: ['term-html', 'term-react'] }],
    });

    assert.equal(state.pathId, 'path-web-deployment');
    assert.equal(state.selectedTermId, 'term-html');
    state.selectTerm('term-react');
    assert.equal(state.selectedTermId, 'term-react');
});

test('검색은 용어명·별칭·정의와 일치한 결과의 경로를 돌려준다', () => {
    const result = searchOntologyTerms({
        terms: [{
            term: 'Interface(인터페이스)',
            definition: '사람과 기계의 접점',
            aliases: ['사용자 접점'],
        }],
        termRegistry: [{
            id: 'term-interface',
            entityType: 'term',
            label: 'Interface(인터페이스)',
            topicIds: ['topic-interfaces-network'],
        }],
        pathsByTermId: new Map([['term-interface', ['path-api-system-connection']]]),
        query: '접점',
    });

    assert.equal(result[0].id, 'term-interface');
    assert.deepEqual(result[0].pathIds, ['path-api-system-connection']);
    assert.equal(result[0].primaryTopicId, 'topic-interfaces-network');
});

test('경로 선택지는 15개 경로의 제목·설명·보조 용어를 직접 제공한다', () => {
    const views = ontology.learningPaths.map(path => buildLearningPathViewModel({ ontology, pathId: path.id }));

    assert.equal(views.length, 15);
    assert.ok(views.every(view => view.title && view.description));
    assert.ok(views.some(view => view.supportingTermIds.length > 0));
    assert.deepEqual(
        new Set(views.flatMap(view => [...view.primaryTermIds, ...view.supportingTermIds])),
        new Set(ontology.termRegistry.map(term => term.id)),
    );
});

test('학습 분야는 첫 주제가 아니라 연결된 모든 topicId 아래에 해당 경로를 보여준다', () => {
    const appPlatformPaths = getPathsForTopic(ontology, 'topic-app-platforms').map(path => path.id);
    const aiPaths = getPathsForTopic(ontology, 'topic-ai-ml-agents').map(path => path.id);

    assert.deepEqual(appPlatformPaths, [
        'path-app-framework-choice',
        'path-web-deployment',
    ]);
    assert.deepEqual(aiPaths, [
        'path-machine-learning',
        'path-llm-agents',
    ]);

    for (const topic of ontology.topics) {
        const expected = ontology.learningPaths.filter(path => path.topicIds.includes(topic.id)).map(path => path.id);
        assert.deepEqual(getPathsForTopic(ontology, topic.id).map(path => path.id), expected, topic.id);
    }

    assert.equal(new Set(ontology.learningPaths.map(path => path.id)).size, 15);
});

test('선택 용어 상세는 현재 경로의 적합도와 REVIEWED 관계의 근거만 보여준다', () => {
    const path = ontology.learningPaths.find(item => item.supportingTermIds.includes('term-routing'));
    const fixture = {
        ...ontology,
        relations: [
            {
                id: 'rel-reviewed', source: 'term-routing', target: 'term-api',
                type: 'used_with', status: 'REVIEWED', rationale: '검토된 연결 이유',
                sourceRefs: [{ kind: 'term-definition', ref: 'term-routing' }],
            },
            {
                id: 'rel-inferred', source: 'term-routing', target: 'term-http',
                type: 'used_with', status: 'INFERRED', rationale: '후보일 뿐',
                sourceRefs: [{ kind: 'term-definition', ref: 'term-routing' }],
            },
        ],
    };
    const detail = getTermDetailModel({
        ontology: fixture,
        terms,
        pathId: path.id,
        termId: 'term-routing',
    });

    assert.equal(detail.fit, 'moderate');
    assert.match(detail.fitRationale, /네트워크 트래픽/);
    assert.deepEqual(detail.reviewedRelations.map(relation => relation.id), ['rel-reviewed']);
    assert.equal(detail.reviewedRelations[0].rationale, '검토된 연결 이유');
    assert.deepEqual(detail.reviewedRelations[0].sourceRefs, [{ kind: 'term-definition', ref: 'term-routing' }]);
});

test('검색 결과는 포함된 첫 경로와 용어를 함께 선택하고 경로 퀴즈 콜백에 pathId를 전달한다', () => {
    const selection = resolveSearchSelection({ ontology, termId: 'term-routing' });
    assert.equal(selection.termId, 'term-routing');
    assert.equal(selection.pathId, 'path-api-system-connection');

    const received = [];
    const controller = createLearningMapController({
        ontology,
        terms,
        documentRef: null,
        elements: null,
        onStartQuiz: pathId => received.push(pathId),
    });
    controller.selectSearchResult('term-routing');
    controller.startPathQuiz();

    assert.equal(controller.state.pathId, 'path-api-system-connection');
    assert.equal(controller.state.selectedTermId, 'term-routing');
    assert.deepEqual(received, ['path-api-system-connection']);
    assert.deepEqual(controller.lastFocusTarget, { type: 'term', id: 'term-routing' });
});

test('학습 지도 CTA는 선택 경로의 용어와 제목을 기존 객관식 시작 흐름으로 넘긴다', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

    assert.match(appSource, /getTermsForQuiz\(IT_QUIZ_ONTOLOGY, pathId, termsData\)/);
    assert.match(appSource, /startQuiz\('multiple-choice', \{ sourceTerms, scopeLabel: path\.title \}\)/);
});

test('다시 렌더링한 뒤에는 보이는 동일 용어 버튼으로 초점을 돌린다', () => {
    const calls = [];
    const hiddenDesktopCopy = {
        getClientRects: () => [],
        focus: () => calls.push('hidden'),
    };
    const visibleMobileCopy = {
        getClientRects: () => [{}],
        focus: () => calls.push('visible'),
    };
    restoreFocus({
        documentRef: {
            querySelectorAll: selector => {
                assert.equal(selector, '[data-learning-term="term-routing"]');
                return [hiddenDesktopCopy, visibleMobileCopy];
            },
        },
    }, { type: 'term', id: 'term-routing' });

    assert.deepEqual(calls, ['visible']);
});

test('지도 DOM은 15개 경로와 선택한 주제·경로·본문 설명·퀴즈 대상을 함께 갱신한다', () => {
    const focusCalls = [];
    const documentRef = makeLearningMapDom({
        focusControl: {
            getClientRects: () => [{}],
            focus: () => focusCalls.push('restored'),
        },
    });
    const controller = createLearningMapController({ ontology, terms, documentRef });

    controller.selectTopic('topic-interfaces-network');
    const topicList = documentRef.elementsById.get('learning-topic-list');
    const stage = documentRef.elementsById.get('learning-path-flow');
    const cta = documentRef.elementsById.get('start-path-quiz');

    assert.equal(controller.state.topicId, 'topic-interfaces-network');
    assert.equal(controller.state.pathId, 'path-api-system-connection');
    const renderedPathIds = [...topicList.innerHTML.matchAll(/data-learning-path="([^"]+)"/g)]
        .map(match => match[1]);
    assert.deepEqual(
        [...new Set(renderedPathIds)].sort(),
        ontology.learningPaths.map(path => path.id).sort(),
    );
    assert.match(topicList.innerHTML, /data-learning-topic="topic-interfaces-network"[^>]*aria-pressed="true"/);
    assert.match(topicList.innerHTML, /data-learning-path="path-api-system-connection"[^>]*aria-current="step"/);
    assert.match(stage.innerHTML, /API로 시스템 연결하기/);
    assert.match(stage.innerHTML, /클라이언트와 서버가 규약과 데이터 형식을 통해 정보를 주고받는 구조/);
    assert.match(cta.textContent, /API로 시스템 연결하기/);
    assert.equal(cta.dataset.learningPath, 'path-api-system-connection');

    controller.selectTerm('term-api');
    assert.deepEqual(focusCalls, ['restored', 'restored']);
});

test('다중 주제 경로는 앱 플랫폼·AI 주제에서도 직접 선택할 수 있다', () => {
    const documentRef = makeLearningMapDom();
    const controller = createLearningMapController({ ontology, terms, documentRef });

    controller.selectTopic('topic-app-platforms');
    assert.equal(controller.state.pathId, 'path-app-framework-choice');
    assert.match(documentRef.elementsById.get('learning-topic-list').innerHTML, /data-learning-path="path-web-deployment"/);

    controller.selectTopic('topic-ai-ml-agents');
    assert.equal(controller.state.pathId, 'path-machine-learning');
    assert.match(documentRef.elementsById.get('learning-topic-list').innerHTML, /data-learning-path="path-llm-agents"/);
});

test('지도 DOM 상세는 REVIEWED 연결의 이유·출처를 보이고 INFERRED 후보를 숨긴다', () => {
    const documentRef = makeLearningMapDom();
    const fixture = {
        ...ontology,
        relations: [
            {
                id: 'rel-reviewed-dom', source: 'term-api', target: 'term-http',
                type: 'used_with', status: 'REVIEWED', rationale: 'API 통신에 HTTP를 사용한다는 검토 근거',
                sourceRefs: [{ kind: 'official-document', ref: 'https://example.com/http' }],
            },
            {
                id: 'rel-inferred-dom', source: 'term-api', target: 'term-json',
                type: 'used_with', status: 'INFERRED', rationale: '표시되면 안 되는 후보',
                sourceRefs: [{ kind: 'official-document', ref: 'https://example.com/json' }],
            },
        ],
    };
    const controller = createLearningMapController({ ontology: fixture, terms, documentRef });
    controller.selectRelation('rel-reviewed-dom');

    const detail = documentRef.elementsById.get('learning-detail').innerHTML;
    assert.match(detail, /API 통신에 HTTP를 사용한다는 검토 근거/);
    assert.match(detail, /공식 문서: https:\/\/example\.com\/http/);
    assert.doesNotMatch(detail, /표시되면 안 되는 후보/);
});

test('A안은 160개 모든 용어를 적합도 평가와 함께 15개 경로에 포함한다', () => {
    assert.equal(ontology.learningPaths.length, 15);
    const covered = new Set(ontology.learningPaths.flatMap(path => [
        ...path.primaryTermIds,
        ...path.supportingTermIds,
    ]));
    assert.equal(covered.size, 160);
    for (const item of ontology.termRegistry) {
        assert.ok(covered.has(item.id), `${item.label}: 학습 경로에서 누락됨`);
        assert.equal(Object.hasOwn(item, 'pathIds'), false);
    }
    for (const path of ontology.learningPaths) {
        const termIds = [...new Set([...path.primaryTermIds, ...path.supportingTermIds])];
        assert.ok(path.primaryTermIds.length >= 4 && path.primaryTermIds.length <= 10, `${path.id}: primary 4~10`);
        assert.ok(termIds.length >= 8 && termIds.length <= 15, `${path.id}: 전체 8~15`);
        assert.deepEqual(Object.keys(path.fitAssessments).sort(), [...termIds].sort());
        for (const termId of termIds) {
            assert.match(path.fitAssessments[termId].fit, /^(strong|moderate|weak)$/);
            assert.ok(path.fitAssessments[termId].fitRationale.trim());
        }
    }
});

test('공개 의미 관계는 REVIEWED 계약을 지키고 온톨로지는 유효하다', () => {
    assert.ok(ontology.relations.length > 0);
    for (const relation of ontology.relations) {
        assert.equal(relation.status, 'REVIEWED');
        assert.ok(relation.rationale.trim(), `${relation.id}: 근거 설명`);
        assert.ok(relation.sourceRefs.length >= 1, `${relation.id}: 근거 출처`);
        assert.ok(relation.sourceRefs.every(source => source.kind && source.ref));
        assert.equal(relation.reviewedByRole, 'content-owner');
        assert.match(relation.reviewRecordId, /^review-/);
        assert.match(relation.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.deepEqual(validateOntology(ontology), []);
});

test('웹 앱 배포 경로는 고정한 학습 순서로 조회된다', () => {
    const path = getLearningPath(ontology, 'path-web-deployment');
    assert.deepEqual(path.primaryTermIds, [
        'term-html', 'term-css', 'term-javascript', 'term-react',
        'term-vite', 'term-github', 'term-github-actions', 'term-github-pages',
    ]);
    const reactConnections = getTermConnections(ontology, 'term-react');
    assert.ok(reactConnections.length > 0);
    assert.ok(reactConnections.every(item => item.status === 'REVIEWED'));
    assert.equal(getTopicGraph(ontology, 'topic-version-control-delivery').topic.id, 'topic-version-control-delivery');
});

test('Routing은 웹 렌더링이 아니라 네트워크 연결 경로에 정의 근거와 함께 배치된다', () => {
    const rendering = getLearningPath(ontology, 'path-web-rendering');
    const apiConnection = getLearningPath(ontology, 'path-api-system-connection');
    assert.equal([...rendering.primaryTermIds, ...rendering.supportingTermIds].includes('term-routing'), false);
    assert.ok(apiConnection.supportingTermIds.includes('term-routing'));
    assert.deepEqual(apiConnection.fitAssessments['term-routing'], {
        fit: 'moderate',
        fitRationale: 'Routing은 네트워크 트래픽이 목적지까지 이동할 경로를 정하는 개념이므로 API와 시스템 연결 경로에서 통신 흐름을 이해하는 데 필요합니다.',
    });
});

test('인덱스가 경로 역참조를 계산하고 원본 용어 순서로 퀴즈 범위를 반환한다', () => {
    const index = buildOntologyIndex(ontology);
    assert.ok(index.pathsByTermId.get('term-html').some(path => path.id === 'path-web-deployment'));

    const path = getLearningPath(ontology, 'path-product-building');
    const selected = getTermsForQuiz(ontology, path.id, terms);
    assert.deepEqual(selected.map(item => item.term), path.quizTermIds.map(termId =>
        ontology.termRegistry.find(item => item.id === termId).label));
    assert.equal(selected[0], terms.find(item => item.term === selected[0].term));
});

test('조회 함수는 알 수 없는 ID를 빈 결과로 숨기지 않는다', () => {
    assert.throws(() => getLearningPath(ontology, 'path-missing'), /Unknown learning path: path-missing/);
    assert.throws(() => getTermConnections(ontology, 'term-missing'), /Unknown term: term-missing/);
    assert.throws(() => getTopicGraph(ontology, 'topic-missing'), /Unknown topic: topic-missing/);

    const changed = { ...ontology, learningPaths: ontology.learningPaths.map(path =>
        path.id === 'path-product-building' ? { ...path, quizTermIds: ['term-missing'] } : path) };
    assert.throws(() => getTermsForQuiz(changed, 'path-product-building', terms), /Unknown quiz term: term-missing/);
});

test('연결 조회는 기본적으로 REVIEWED만 반환하고 요청할 때만 후보를 포함한다', () => {
    const fixture = {
        ...ontology,
        relations: [
            { id: 'rel-reviewed', source: 'term-react', target: 'term-vite', status: 'REVIEWED' },
            { id: 'rel-inferred', source: 'term-html', target: 'term-react', status: 'INFERRED' },
        ],
    };
    assert.deepEqual(getTermConnections(fixture, 'term-react').map(item => item.id), ['rel-reviewed']);
    assert.deepEqual(
        getTermConnections(fixture, 'term-react', { reviewedOnly: false }).map(item => item.id),
        ['rel-reviewed', 'rel-inferred'],
    );
});

test('용어 상세는 승인된 연결을 양방향으로 모아 화면에 넘긴다', () => {
    const model = getTermDetailModel({
        ontology, terms, pathId: 'path-web-deployment', termId: 'term-react',
    });
    const pairs = model.reviewedRelations.map(item => `${item.source}|${item.type}|${item.target}`);

    // React가 출발인 관계와 도착인 관계가 함께 보여야 "무엇 위에서 돌고 무엇이 React를 쓰는지"를 답할 수 있다.
    assert.ok(pairs.includes('term-react|runs_on|term-javascript'), 'React가 출발인 관계 누락');
    assert.ok(pairs.includes('term-vite|used_with|term-react'), 'React가 도착인 관계 누락');
    assert.ok(model.reviewedRelations.every(item => item.status === 'REVIEWED'));
    assert.ok(model.reviewedRelations.every(item => item.sourceRefs.length >= 1));
});

test('연결이 없는 용어는 빈 목록을 돌려주고 오류를 내지 않는다', () => {
    const model = getTermDetailModel({
        ontology, terms, pathId: 'path-web-deployment', termId: 'term-github',
    });
    assert.deepEqual(model.reviewedRelations, []);
});
