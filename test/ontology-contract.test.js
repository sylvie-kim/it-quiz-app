const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const schema = require('../ontology-schema.js');
const { validateOntology, detectPrerequisiteCycle } = require('../ontology-utils.js');
const { buildRegistry } = require('../scripts/bootstrap-ontology-registry.js');
const terms = require('../terms-data.js');
const ontology = require('../ontology-data.js');

test('160개 용어가 중복 없는 안정 ID와 주제를 가진다', () => {
    assert.equal(ontology.termRegistry.length, 160);
    assert.equal(new Set(ontology.termRegistry.map(item => item.id)).size, 160);
    assert.deepEqual(
        new Set(ontology.termRegistry.map(item => item.label)),
        new Set(terms.map(item => item.term)),
    );
    for (const item of ontology.termRegistry) {
        assert.match(item.id, /^term-[a-z0-9-]+$/);
        assert.equal(item.entityType, 'term');
        assert.ok(item.topicIds.length >= 1, `${item.label}: 학습 주제가 필요하다`);
    }
});

test('Routing은 네트워크 트래픽 경로를 정하는 개념으로 분류한다', () => {
    const routing = ontology.termRegistry.find(item => item.id === 'term-routing');

    assert.deepEqual(routing.topicIds, ['topic-interfaces-network']);
});

test('배포 등록부 ID는 부트스트랩이 만든 160개 안정 ID와 순서까지 같다', () => {
    assert.deepEqual(
        ontology.termRegistry.map(item => item.id),
        buildRegistry(terms).map(item => item.id),
    );
});

test('브라우저 UMD는 Node와 같은 온톨로지를 IT_QUIZ_ONTOLOGY에 노출한다', () => {
    const context = { IT_QUIZ_BASE_TERMS: terms };
    vm.createContext(context);
    vm.runInContext(
        fs.readFileSync(path.join(__dirname, '..', 'ontology-data.js'), 'utf8'),
        context,
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.IT_QUIZ_ONTOLOGY)),
        ontology,
    );
});

test('등록부는 정의를 복사하지 않고 12개 학습 주제만 참조한다', () => {
    const expectedTopics = [
        ['topic-software-basics', '코드와 소프트웨어 기초'],
        ['topic-web-ui', '웹 화면과 렌더링'],
        ['topic-app-platforms', '앱 프레임워크와 플랫폼'],
        ['topic-runtime-cli-packages', '실행 환경과 명령어'],
        ['topic-interfaces-network', 'API와 시스템 연결'],
        ['topic-version-control-delivery', 'Git 협업과 배포'],
        ['topic-developer-ai-tools', '개발·AI 코딩 도구'],
        ['topic-product-design', '화면 설계와 사용자 경험'],
        ['topic-backend-cloud-auth', '백엔드·클라우드·인증'],
        ['topic-data-analysis', '파일과 데이터 분석'],
        ['topic-ai-ml-agents', 'AI·머신러닝·에이전트'],
        ['topic-product-building', '아이디어와 제품 만들기'],
    ].map(([id, label]) => ({ id, entityType: 'topic', label }));

    assert.deepEqual(ontology.topics, expectedTopics);
    const topicIds = new Set(ontology.topics.map(topic => topic.id));
    const validTermKinds = new Set(schema.PROPERTY_DEFINITIONS.termKind.values);
    for (const item of ontology.termRegistry) {
        assert.deepEqual(Object.keys(item), ['id', 'entityType', 'label', 'termKind', 'topicIds']);
        assert.ok(validTermKinds.has(item.termKind), `${item.label}: 허용되지 않는 termKind ${item.termKind}`);
        assert.ok(item.topicIds.every(topicId => topicIds.has(topicId)), `${item.label}: 알 수 없는 주제`);
    }
    const relationIds = ontology.relations.map(relation => relation.id);
    assert.equal(new Set(relationIds).size, relationIds.length, '관계 ID가 중복됩니다');
    assert.equal(ontology.learningPaths.length, 15);
});

test('12개 기본 주제 묶음이 사전 분석의 160개 분류를 빠짐없이 보존한다', () => {
    const primaryCounts = Object.fromEntries(ontology.topics.map(topic => [topic.id, 0]));
    for (const item of ontology.termRegistry) primaryCounts[item.topicIds[0]] += 1;

    assert.deepEqual(primaryCounts, {
        'topic-software-basics': 16,
        'topic-web-ui': 21,
        'topic-app-platforms': 12,
        'topic-runtime-cli-packages': 10,
        'topic-interfaces-network': 12,
        'topic-version-control-delivery': 12,
        'topic-developer-ai-tools': 13,
        'topic-product-design': 10,
        'topic-backend-cloud-auth': 10,
        'topic-data-analysis': 18,
        'topic-ai-ml-agents': 17,
        'topic-product-building': 9,
    });
});

test('온톨로지는 허용된 관계와 상태만 사용한다', () => {
    assert.deepEqual(schema.RELATION_STATUSES, [
        'EXTRACTED', 'INFERRED', 'REVIEWED', 'REJECTED', 'SUPERSEDED',
    ]);
    assert.equal(schema.RELATION_TYPES.prerequisite_of.symmetric, false);
    assert.equal(schema.RELATION_TYPES.used_with.symmetric, true);
    assert.equal(Object.hasOwn(schema.RELATION_TYPES, 'belongs_to_topic'), false);
    assert.equal(Object.hasOwn(schema.RELATION_TYPES, 'appears_in_path'), false);
});

test('개체 유형과 속성 사전이 이름·자료형·필수 여부를 고정한다', () => {
    assert.deepEqual(schema.ENTITY_TYPES.term.required, ['id', 'entityType', 'label', 'topicIds']);
    assert.equal(schema.PROPERTY_DEFINITIONS.label.type, 'string');
    assert.equal(schema.PROPERTY_DEFINITIONS.topicIds.type, 'string[]');
    assert.deepEqual(schema.PROPERTY_DEFINITIONS.termKind.values, [
        'concept', 'method', 'process', 'language', 'framework', 'service',
        'tool', 'command', 'file', 'format', 'platform', 'event',
    ]);
    assert.deepEqual(schema.RELATION_TYPES.used_with.domain, ['term']);
    assert.deepEqual(schema.RELATION_TYPES.used_with.range, ['term']);
    assert.equal(schema.RELATION_TYPES.used_with.cardinality, 'many-to-many');
});

test('공개 관계는 근거와 검토일 없이는 통과하지 않는다', () => {
    const errors = validateOntology({
        topics: [{ id: 'topic-web', entityType: 'topic', label: '웹 개발' }],
        termRegistry: [{ id: 'term-react', entityType: 'term', label: 'React', topicIds: ['topic-web'] }],
        relations: [{
            id: 'rel-react-vite', source: 'term-react', target: 'term-vite',
            type: 'used_with', status: 'REVIEWED', rationale: '', sourceRefs: [],
            reviewedByRole: '', reviewRecordId: '', reviewedAt: '',
        }],
        learningPaths: [{
            id: 'path-web', entityType: 'learningPath', title: '웹 개발',
            primaryTermIds: ['term-react'], supportingTermIds: [],
            fitAssessments: {
                'term-react': { fit: 'strong', fitRationale: '화면 개발 경로의 핵심 개념입니다.' },
            },
        }],
    });
    assert.ok(errors.some(error => error.code === 'RELATION_RATIONALE_REQUIRED'));
    assert.ok(errors.some(error => error.code === 'RELATION_SOURCE_REQUIRED'));
    assert.ok(errors.some(error => error.code === 'RELATION_REVIEWER_ROLE_REQUIRED'));
    assert.ok(errors.some(error => error.code === 'RELATION_REVIEW_RECORD_REQUIRED'));
    assert.ok(errors.some(error => error.code === 'RELATION_REVIEW_DATE_REQUIRED'));
});

test('선행 관계의 순환을 탐지한다', () => {
    const relations = [
        { source: 'a', target: 'b', type: 'prerequisite_of' },
        { source: 'b', target: 'a', type: 'prerequisite_of' },
    ];
    assert.deepEqual(detectPrerequisiteCycle(relations), ['a', 'b', 'a']);
});

test('REVIEWED 관계의 출처는 kind별 ref 계약을 지킨다', () => {
    const errors = validateOntology({
        topics: [{ id: 'topic-web', entityType: 'topic', label: '웹 개발' }],
        termRegistry: [
            { id: 'term-react', entityType: 'term', label: 'React', topicIds: ['topic-web'] },
            { id: 'term-vite', entityType: 'term', label: 'Vite', topicIds: ['topic-web'] },
        ],
        relations: [
            {
                id: 'rel-invalid-document', source: 'term-react', target: 'term-vite',
                type: 'used_with', status: 'REVIEWED', rationale: '검증된 관계입니다.',
                sourceRefs: [{ kind: 'official-document', ref: 'ftp://example.com/reference' }],
                reviewedByRole: 'content-owner', reviewRecordId: 'review-invalid-document', reviewedAt: '2026-09-03',
            },
            {
                id: 'rel-invalid-term', source: 'term-react', target: 'term-vite',
                type: 'used_with', status: 'REVIEWED', rationale: '검증된 관계입니다.',
                sourceRefs: [{ kind: 'term-definition', ref: 'term-missing' }],
                reviewedByRole: 'content-owner', reviewRecordId: 'review-invalid-term', reviewedAt: '2026-09-03',
            },
            {
                id: 'rel-invalid-candidate', source: 'term-react', target: 'term-vite',
                type: 'used_with', status: 'REVIEWED', rationale: '검증된 관계입니다.',
                sourceRefs: [{ kind: 'reviewed-candidate', ref: 'review-rel-react-vite' }],
                reviewedByRole: 'content-owner', reviewRecordId: 'review-invalid-candidate', reviewedAt: '2026-09-03',
            },
        ],
        learningPaths: [],
    });
    assert.deepEqual(
        errors.filter(error => error.code === 'RELATION_SOURCE_INVALID').map(error => error.refId),
        ['rel-invalid-document', 'rel-invalid-term', 'rel-invalid-candidate'],
    );
});

test('경로 적합도와 배치 근거가 모두 잘못되면 두 오류를 반환한다', () => {
    const errors = validateOntology({
        topics: [{ id: 'topic-web', entityType: 'topic', label: '웹 개발' }],
        termRegistry: [{ id: 'term-react', entityType: 'term', label: 'React', topicIds: ['topic-web'] }],
        relations: [],
        learningPaths: [{
            id: 'path-web', entityType: 'learningPath', title: '웹 개발',
            primaryTermIds: ['term-react'], supportingTermIds: [],
            fitAssessments: { 'term-react': { fit: 'unsupported', fitRationale: '' } },
        }],
    });
    assert.ok(errors.some(error => error.code === 'PATH_FIT_REQUIRED' && error.refId === 'term-react'));
    assert.ok(errors.some(error => error.code === 'PATH_FIT_INVALID' && error.refId === 'term-react'));
});

test('공개 문서 출처는 IPv4-mapped IPv6 사설 주소를 허용하지 않는다', () => {
    const refs = [
        'http://[::ffff:127.0.0.1]/',
        'http://[::ffff:7f00:1]/',
        'http://[::ffff:10.0.0.1]/',
        'http://[::ffff:a00:1]/',
    ];
    const errors = validateOntology({
        topics: [{ id: 'topic-web', entityType: 'topic', label: '웹 개발' }],
        termRegistry: [
            { id: 'term-react', entityType: 'term', label: 'React', topicIds: ['topic-web'] },
            { id: 'term-vite', entityType: 'term', label: 'Vite', topicIds: ['topic-web'] },
        ],
        relations: refs.map((ref, index) => ({
            id: `rel-ipv4-mapped-${index}`, source: 'term-react', target: 'term-vite',
            type: 'used_with', status: 'REVIEWED', rationale: '검증된 관계입니다.',
            sourceRefs: [{ kind: 'official-document', ref }],
            reviewedByRole: 'content-owner', reviewRecordId: `review-ipv4-mapped-${index}`, reviewedAt: '2026-09-03',
        })),
        learningPaths: [],
    });
    assert.deepEqual(
        errors.filter(error => error.code === 'RELATION_SOURCE_INVALID').map(error => error.refId),
        refs.map((_, index) => `rel-ipv4-mapped-${index}`),
    );
});

test('공개 HTTPS 문서 근거를 가진 완전한 REVIEWED 관계는 검증을 통과한다', () => {
    const termIds = [
        'term-react', 'term-vite', 'term-html', 'term-css',
        'term-javascript', 'term-git', 'term-node', 'term-npm',
    ];
    const errors = validateOntology({
        topics: [{ id: 'topic-web', entityType: 'topic', label: '웹 개발' }],
        termRegistry: termIds.map(id => ({
            id, entityType: 'term', label: id, topicIds: ['topic-web'],
        })),
        relations: [{
            id: 'rel-react-vite', source: 'term-react', target: 'term-vite',
            type: 'used_with', status: 'REVIEWED', rationale: 'React 프로젝트에서 Vite를 사용할 수 있습니다.',
            sourceRefs: [{ kind: 'official-document', ref: 'https://react.dev/learn/build-a-react-app-from-scratch' }],
            reviewedByRole: 'content-owner', reviewRecordId: 'review-rel-react-vite', reviewedAt: '2026-09-03',
        }],
        learningPaths: [{
            id: 'path-web', entityType: 'learningPath', title: '웹 개발',
            primaryTermIds: termIds.slice(0, 4), supportingTermIds: termIds.slice(4),
            fitAssessments: Object.fromEntries(termIds.map(id => [id, {
                fit: 'strong', fitRationale: '웹 개발 경로의 학습 용어입니다.',
            }])),
        }],
    });
    assert.deepEqual(errors, []);
});
