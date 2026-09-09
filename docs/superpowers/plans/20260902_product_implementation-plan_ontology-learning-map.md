# 온톨로지 기반 IT 용어 학습 지도 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IT Quiz의 공개 용어 159개를 검증 가능한 온톨로지로 분류하고, 근거가 확인된 관계와 목적별 학습 경로를 사용자가 이해할 수 있는 반응형 학습 지도로 제공한다.

**Architecture:** `terms-data.js`를 용어명·정의의 유일한 정본으로 유지하고, 새 `ontology-data.js`에는 안정적인 용어 ID, 학습 주제, 검토된 관계, 학습 경로만 저장한다. `ontology-utils.js`가 데이터 무결성·그래프 탐색·경로 적합도 진단을 담당하고, `learning-map.js`가 이를 데스크톱의 읽을 수 있는 경로 흐름과 모바일 단계 목록으로 표현한다. Graphify·Gemini 결과는 오프라인 후보 입력으로만 사용하며 배포 앱은 외부 AI, DB, 그래프 DB에 의존하지 않는다.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript UMD modules, DOM, Node.js built-in test runner (`node --test`), GitHub Pages

**Spec:** 내부 온톨로지 학습 설계 문서 (2026-09-02). 개인 로컬 경로는 공개본에서 제외한다.

**Related UI Guide:** `DESIGN.md`

## 권장 실행 프로필

- **권장 Agent:** Codex
- **권장 Model:** `gpt-5.6-sol`
- **권장 Reasoning:** `High`
- **Execution Mode:** `codex/term-learning-map` 브랜치에서 코드·테스트·문서 변경과 검증된 로컬 선별 커밋까지
- **중요 경계:** 공개 GitHub 저장소 push, PR 생성, 병합, GitHub Pages 배포, 외부 AI 재전송은 이 계획 실행 범위가 아니다. 각각 Sylvie의 명시 승인이 있어야 한다.
- **이유:** 159개 데이터 계약, 온톨로지 제약, 관계 품질, 반응형 접근성을 함께 검증해야 하는 아키텍처 작업이다. PHI·인증·DB·인프라는 변경하지 않는다.

## 2026-09-03 실험 결정 — A안

- 이번 구현에서는 159개 모든 용어를 하나 이상의 학습 경로에 넣는다.
- 이 결정의 목적은 100% 경로 커버리지가 실제로 어떤 문제를 만드는지 관찰하는 것이다. 100%라는 숫자를 학습 품질로 간주하지 않는다.
- 각 경로 배치에는 `fit: strong | moderate | weak`와 한 문장 `fitRationale`을 기록한다. `weak`는 숨기거나 실패시키지 않고 진단 보고서에 그대로 노출한다.
- 경로 포함은 의미 관계 승인과 다르다. 같은 경로에 있다는 이유만으로 두 용어 사이에 관계선을 만들지 않는다.
- 로컬 구현 완료와 배포 준비를 분리한다. 159/159 경로 배치와 품질 보고서가 나오면 실험 구현은 완료할 수 있지만, `weak` 배치가 남아 있으면 배포 준비 상태는 `needs content review`로 표시한다.
- 비교를 위해 `weakAssignments`, `pathsOverCapacity`, `termsRepeatedAcrossPaths`, `pathsWithoutReviewedRelations`를 수치로 출력한다.
- 강제 배치 전 `baseline`과 배치 후 `experimentA`를 각각 저장한다. 두 결과를 비교해야 기존 데이터 결함과 A안이 새로 만든 결함을 구분할 수 있다.

## 실험이 답해야 할 질문

이 실험은 “159개를 연결할 수 있는가”가 아니라 “신뢰할 수 있는 지식 그래프를 만들기 전에 무엇을 정의해야 하는가”를 확인한다. 구현 결과는 다음 질문에 답해야 한다.

1. 어떤 용어가 동일 개체의 다른 표기이며, 어떤 용어가 별도 개체인가?
2. 용어, 명령어, 파일, 프레임워크, 서비스, 학습 주제와 학습 경로를 같은 종류의 노드로 다뤄도 되는가?
3. 각 속성의 이름, 자료형, 필수 여부, 허용값과 정본 출처가 정의되어 있는가?
4. 각 관계의 출발 개체·도착 개체, 방향, 대칭성, 다중성, 금지 조합이 정의되어 있는가?
5. 관계를 사실로 승인할 수 있는 근거와 검토 책임자가 정해져 있는가?
6. 사용자가 그래프로 답을 얻어야 하는 질문이 무엇인가?
7. 159개 강제 배치가 만든 약한 연결은 어떤 사전 정의 부족에서 발생했는가?

그래프가 답해야 할 사용자 질문(competency questions)은 아래 다섯 개로 고정한다. 화면이나 관계가 이 질문 중 하나에도 답하지 못하면 추가하지 않는다.

1. 이 용어를 이해하기 전에 먼저 알아야 할 용어는 무엇인가?
2. 이름이나 역할이 비슷해 혼동하기 쉬운 용어와 차이는 무엇인가?
3. 이 용어는 어떤 도구·환경과 함께 사용되며, 그 이유는 무엇인가?
4. 특정 개발 목표를 이루려면 어떤 순서로 용어를 학습해야 하는가?
5. 이 연결은 어떤 정의나 공식 문서를 근거로 만들었는가?

문제 유형과 사전 작업의 연결은 다음 기준으로 기록한다.

| 관찰된 문제 | 부족했을 가능성이 큰 사전 작업 |
|---|---|
| 같은 개념이 중복 노드로 나타남 | 정본 개체명, 안정 ID, 별칭·동의어 규칙 |
| 한 용어가 여러 종류로 해석됨 | 개체 유형과 유형별 판별 기준 |
| 값 형식이 제각각임 | 속성 사전, 자료형, 필수값, 허용값 |
| 관계 방향이 뒤집히거나 의미가 모호함 | 관계 정의, domain/range, 방향·대칭성 규칙 |
| 순환이나 모순 관계가 생김 | 관계 제약, 금지 조합, 순환 허용 여부 |
| 출처 없는 연결이 많음 | provenance(출처 이력)와 승인 절차 |
| 경로에 억지로 들어간 용어가 많음 | 학습 목표, 경로 포함 기준, 제외 기준 |
| 화면이 복잡하지만 배울 흐름이 없음 | 사용자가 답해야 할 핵심 질문과 화면 목적 |

최종 보고서는 각 문제를 단순 UI 버그로 처리하지 않고 `관찰 → 원인 가설 → 필요한 사전 정의 → 재실험 방법`으로 기록한다.

실험용 결함 코드는 다음처럼 원인 계층별로 분리한다.

| 계층 | 결함 코드 | 의미 |
|---|---|---|
| 개체 | `ENTITY_DUPLICATE_CANDIDATE` | 동일 개체로 보이는 레코드가 둘 이상 있음 |
| 개체 | `ENTITY_TYPE_AMBIGUOUS` | 하나의 용어가 둘 이상의 개체 유형으로 해석됨 |
| 속성 | `PROPERTY_MISSING_OR_INVALID` | 필수 속성 누락 또는 형식·허용값 불일치 |
| 관계 | `RELATION_AMBIGUOUS_OR_INVALID` | 관계 의미·방향·출발/도착 유형·제약이 불명확함 |
| 근거 | `PROVENANCE_INSUFFICIENT` | 출처가 관계 사실과 방향을 직접 뒷받침하지 않음 |
| 학습 | `PATH_ASSIGNMENT_WEAK` | 학습 목표와 용어 배치의 관련성이 약함 |
| 사용성 | `COMPETENCY_QUESTION_UNANSWERED` | 그래프가 정한 사용자 질문에 답하지 못함 |

## Global Constraints

- 제품 런타임은 현재와 같은 정적 HTML/CSS/JavaScript 구조를 유지한다. 새 프레임워크, 외부 DB, 그래프 DB, 런타임 LLM 호출을 추가하지 않는다.
- `terms-data.js`가 159개 용어명·정의·별칭의 유일한 정본이다. 온톨로지 파일에 정의를 복사하지 않는다.
- 159개 모든 용어는 고유한 안정 ID, 하나 이상의 학습 주제, 하나 이상의 학습 경로를 가져야 한다. 학습 경로 배치에는 적합도와 이유를 반드시 기록한다.
- 직접 의미 관계가 없는 용어를 억지로 연결하지 않는다. 주제 소속과 학습 경로 포함은 의미 관계와 별도로 표시한다.
- 사용자 화면에는 `REVIEWED` 관계만 표시한다. `EXTRACTED`, `INFERRED`, `REJECTED`, `SUPERSEDED` 후보는 배포 그래프에서 제외한다.
- 모든 공개 관계는 관계 유형, 방향, 쉬운 연결 이유, 출처 참조, 검토일을 가져야 한다.
- 전체 159개 점 구름을 기본 화면으로 사용하지 않는다. 기본은 한 주제의 8~15개 학습 경로이며 전체 보기는 주제 탐색과 그룹 목록을 함께 제공한다.
- 모바일 390px에서는 그래프를 단계 목록으로 바꾸고 가로 스크롤을 만들지 않는다.
- 키보드만으로 주제, 용어, 관계, 학습 경로, 퀴즈 시작 버튼을 사용할 수 있어야 한다.
- 기존 퀴즈, 용어사전 검색, 퀴즈 중 사전 열기, 다크 모드 기본값, 자동 진행 동작을 회귀시키지 않는다.
- `.playwright-cli/`, `.superpowers/`, `graphify-out/`, 스크린샷, 임시 후보 파일은 커밋하지 않는다.
- `ksleep-company-os`, `care-ops`, `ksleep-app`은 읽거나 변경하지 않는다. 이번 구현 대상은 IT Quiz 저장소뿐이다.

## 산출물 구조

| 파일 | 책임 |
|---|---|
| `ontology-schema.js` | 개체·관계 유형, 관계 방향·허용 범위, 상태 상수 |
| `ontology-data.js` | 159개 용어 ID/주제/경로 매핑, 검토된 관계, 주제와 학습 경로 데이터 |
| `ontology-utils.js` | 온톨로지 검증, 인덱스 생성, 주제/경로/연결 조회, 선행 관계 순환 검사 |
| `learning-map.js` | 학습 지도 상태와 DOM 기반 경로 렌더링, 검색, 선택, 키보드 조작 |
| `scripts/bootstrap-ontology-registry.js` | `terms-data.js`에서 159개 ID 등록부 초안을 누락 없이 생성 |
| `scripts/audit-ontology-readiness.js` | A안 적용 전·후 준비도와 결함 코드를 같은 형식으로 측정 |
| `scripts/import-graphify-candidates.js` | Graphify JSON을 배포 데이터와 분리된 검토 후보 형식으로 변환 |
| `docs/ontology/README.md` | 후보 생성→검토→배포 데이터 승격 절차와 관계 작성 규칙 |
| `docs/ontology/ontology-readiness-checklist.md` | 개체·속성·관계·근거·질문을 구현 전 확인하는 체크리스트 |
| `docs/ontology/experiment-a-report.md` | 159개 강제 경로 배치에서 발생한 문제와 필요한 사전 작업 |
| `docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json` | 경로 배치 전 입력 커밋·해시와 준비도 기준선 |
| `docs/ontology/audits/20260903_ontology-audit_post-force-path.json` | 159개 강제 배치 후 같은 규칙으로 측정한 결과 |
| `test/ontology-contract.test.js` | 159개 커버리지와 온톨로지 무결성 계약 |
| `test/ontology-candidates.test.js` | 후보 변환과 검토 상태 분리 계약 |
| `test/learning-map.test.js` | 조회·경로·퀴즈 범위의 순수 함수 테스트 |
| `test/ontology-path-quality.test.js` | A안의 159/159 경로 배치와 적합도 문제 진단 계약 |
| `test/learning-map-ui.test.js` | HTML·스크립트 순서·접근성·반응형 정적 계약 |
| `index.html` | 학습 지도 화면과 접근 가능한 상세 패널 마크업 |
| `style.css` | 세 칸 데스크톱 지도, 태블릿, 모바일 단계 목록 스타일 |
| `app.js` | 기존 화면 라우팅과 학습 경로 기반 퀴즈 시작 연결 |

---

### Task 1: 온톨로지 계약과 검증 함수

**Files:**
- Create: `ontology-schema.js`
- Create: `ontology-utils.js`
- Create: `test/ontology-contract.test.js`
- Create: `docs/ontology/ontology-readiness-checklist.md`

**Interfaces:**
- Consumes: 이후 Task가 제공할 `{ topics, termRegistry, relations, learningPaths }`
- Produces: `ITQuizOntologySchema`, `ITQuizOntologyUtils.validateOntology()`, `buildOntologyIndex()`, `detectPrerequisiteCycle()`

- [ ] **Step 1: 실패하는 최소 온톨로지 계약 테스트 작성**

`test/ontology-contract.test.js`에 다음 계약을 먼저 작성한다.

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const schema = require('../ontology-schema.js');
const { validateOntology, detectPrerequisiteCycle } = require('../ontology-utils.js');

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
```

- [ ] **Step 2: 테스트가 예상대로 실패하는지 확인**

Run: `node --test test/ontology-contract.test.js`

Expected: `Cannot find module '../ontology-schema.js'`

- [ ] **Step 3: 허용 관계와 상태를 UMD 모듈로 구현**

`ontology-schema.js`는 브라우저와 Node 테스트에서 같은 객체를 사용하도록 기존 `terms-utils.js` 패턴을 따른다. `terms-data.js`는 Node에서 용어 배열을 직접 export하고 브라우저에서 같은 배열을 `IT_QUIZ_BASE_TERMS`에 노출한다. 새 `ontology-data.js`도 Node에서 온톨로지 객체를 직접 export하고 브라우저에서 같은 객체를 `IT_QUIZ_ONTOLOGY`에 노출한다.

개체와 속성 사전을 먼저 고정한다.

```js
const ENTITY_TYPES = {
    term: { required: ['id', 'entityType', 'label', 'topicIds'] },
    topic: { required: ['id', 'entityType', 'label'] },
    learningPath: { required: ['id', 'entityType', 'title', 'primaryTermIds', 'supportingTermIds'] },
    source: { required: ['id', 'entityType', 'kind', 'ref'] },
};

const PROPERTY_DEFINITIONS = {
    id: { type: 'string', required: true, immutable: true },
    entityType: { type: 'enum', values: Object.keys(ENTITY_TYPES), required: true },
    label: { type: 'string', required: true, owner: 'terms-data.js' },
    aliases: { type: 'string[]', required: false, owner: 'terms-data.js' },
    definition: { type: 'string', required: true, owner: 'terms-data.js' },
    topicIds: { type: 'string[]', required: true, minItems: 1, owner: 'ontology-data.js' },
    fit: { type: 'enum', values: ['strong', 'moderate', 'weak'], owner: 'ontology-data.js' },
    fitRationale: { type: 'string', minLength: 1, owner: 'ontology-data.js' },
};
```

정본 라벨은 `terms-data.js`의 `term`, 검색용 별칭은 같은 레코드의 `aliases`, 설명은 같은 레코드의 `definition`이다. 온톨로지는 이를 복사하지 않고 안정 ID와 `label`로 연결한다. 의미 관계 유형은 아래 10개로 제한하고 각 유형에 `domain`(출발 개체 유형), `range`(도착 개체 유형), 방향·대칭성·다중성 규칙을 둔다. 이번 데이터에서는 용어 간 관계를 여러 개 허용하므로 다중성은 `many-to-many`지만, 값을 생략하지 않아 이후 사업 온톨로지에서 `one-to-many` 같은 제약으로 바꿀 수 있게 한다.

```js
const RELATION_TYPES = {
    is_a: { label: '종류', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    part_of: { label: '구성', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    prerequisite_of: { label: '먼저 학습', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false, acyclic: true },
    used_with: { label: '함께 사용', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: true },
    runs_on: { label: '실행 환경', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    produces: { label: '결과 생성', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    deploys_to: { label: '배포', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    implements: { label: '구현', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: false },
    contrasts_with: { label: '차이 비교', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: true },
    alternative_to: { label: '대안', domain: ['term'], range: ['term'], cardinality: 'many-to-many', symmetric: true },
};
```

- [ ] **Step 4: 검증과 인덱스 함수를 최소 구현**

`validateOntology(data)`는 `{ code, message, refId }` 배열을 반환하고 다음 오류 코드를 생성한다.

```js
const ERROR_CODES = [
    'DUPLICATE_ID', 'UNKNOWN_TOPIC', 'UNKNOWN_TERM', 'UNKNOWN_PATH',
    'TERM_TOPIC_REQUIRED', 'TERM_PATH_REQUIRED', 'RELATION_TYPE_INVALID',
    'RELATION_STATUS_INVALID', 'RELATION_RATIONALE_REQUIRED',
    'RELATION_SOURCE_REQUIRED', 'RELATION_SOURCE_INVALID',
    'RELATION_REVIEWER_ROLE_REQUIRED', 'RELATION_REVIEW_RECORD_REQUIRED',
    'RELATION_REVIEW_DATE_REQUIRED',
    'RELATION_SELF_LOOP', 'RELATION_DOMAIN_INVALID', 'RELATION_RANGE_INVALID',
    'PREREQUISITE_CYCLE', 'PATH_SIZE_INVALID',
    'PATH_FIT_REQUIRED', 'PATH_FIT_INVALID',
];
```

`PATH_SIZE_INVALID`는 `primaryTermIds`와 `supportingTermIds`의 합집합이 8~15개가 아닐 때 발생한다. `PATH_FIT_REQUIRED`는 경로에 들어간 용어의 `fitAssessments`가 없거나 `fitRationale`이 비었을 때, `PATH_FIT_INVALID`는 `fit`이 `strong | moderate | weak`가 아닐 때 발생한다. `buildOntologyIndex(data)`는 `termsById`, `topicsById`, `pathsById`, `relationsByTermId`, `pathsByTermId` Map을 반환한다. `detectPrerequisiteCycle(relations)`는 DFS 색상 상태를 사용해 최초 순환 경로를 ID 배열로 반환하고 순환이 없으면 빈 배열을 반환한다.

`REVIEWED` 관계는 `reviewedByRole: 'content-owner'`, 비어 있지 않은 `reviewRecordId`, ISO 날짜 `reviewedAt`을 모두 요구한다. 에이전트 실행 사실이나 Graphify의 `EXTRACTED` 상태를 콘텐츠 승인으로 바꾸지 않는다.

- [ ] **Step 5: 구현 전 온톨로지 준비도 체크리스트 작성**

`docs/ontology/ontology-readiness-checklist.md`에 다음 Gate를 체크박스로 작성한다.

```text
개체: 정본 이름, 안정 ID, 별칭, 개체 유형, 유형 판별 기준, 중복 판정 규칙
속성: 이름, 뜻, 자료형, 필수 여부, 허용값, 정본 출처, 결측 처리
관계: 이름, 뜻, domain, range, 방향, 대칭성, 다중성, 순환, 금지 조합
근거: 허용 출처, 검토 상태, 검토 책임자, 변경 이력
질문: 위 다섯 competency question과 각 질문의 화면 행동
품질: 누락, 중복, 고립, 약한 경로 배치, 모순 관계 측정법
```

각 Gate에는 `충족`, `부분 충족`, `미충족` 중 하나와 근거 파일을 기록한다. 미충족 항목을 자동으로 채우거나 통과로 간주하지 않는다. A안 배치 전에 이 체크리스트와 `baseline` 감사 결과를 먼저 커밋해, 배치 후 문제를 과거 결함처럼 잘못 해석하지 않게 한다.

- [ ] **Step 6: 계약 테스트 통과 확인**

Run: `node --test test/ontology-contract.test.js`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 7: 첫 원자적 커밋**

```bash
git add ontology-schema.js ontology-utils.js test/ontology-contract.test.js docs/ontology/ontology-readiness-checklist.md
git diff --cached --check
git commit -m "feat: define ontology validation contract"
```

---

### Task 2: 159개 용어의 안정 ID와 학습 주제 분류

**Files:**
- Create: `scripts/bootstrap-ontology-registry.js`
- Create: `test/ontology-bootstrap.test.js`
- Create: `ontology-data.js`
- Modify: `test/ontology-contract.test.js`

**Interfaces:**
- Consumes: `IT_QUIZ_BASE_TERMS` from `terms-data.js`, Task 1의 스키마와 검증 함수
- Produces: 누락 없는 등록부 초안, `IT_QUIZ_ONTOLOGY.topics`, `termRegistry`, 비어 있는 `relations`와 `learningPaths` 골격

- [ ] **Step 1: 159개 등록·주제 커버리지 테스트 추가**

```js
const terms = require('../terms-data.js');
const ontology = require('../ontology-data.js');

test('159개 용어가 중복 없는 안정 ID와 주제를 가진다', () => {
    assert.equal(ontology.termRegistry.length, 159);
    assert.equal(new Set(ontology.termRegistry.map(item => item.id)).size, 159);
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
```

- [ ] **Step 2: 테스트가 `ontology-data.js` 부재로 실패하는지 확인**

Run: `node --test test/ontology-contract.test.js`

Expected: `Cannot find module '../ontology-data.js'`

- [ ] **Step 3: 등록부 부트스트랩 테스트와 스크립트 작성**

`test/ontology-bootstrap.test.js`에서 `buildRegistry(terms)`가 입력 순서를 보존하고 159개 고유 ID를 생성하며, 충돌 시 조용히 번호를 붙이지 않고 오류를 던지는지 검증한다. `scripts/bootstrap-ontology-registry.js`는 다음 API를 export한다.

```js
function makeStableId(term) {
    const explicit = ID_OVERRIDES[term];
    if (explicit) return explicit;
    const ascii = String(term).normalize('NFKD').toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    if (!ascii) throw new Error(`Explicit ID override required: ${term}`);
    return `term-${ascii}`;
}

function buildRegistry(terms) {
    const registry = terms.map(item => ({
        id: makeStableId(item.term),
        entityType: 'term',
        label: item.term,
        topicIds: [],
    }));
    const ids = registry.map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate generated term ID');
    return registry;
}
```

한글만 있는 용어와 파일명 용어는 `ID_OVERRIDES`에 명시적으로 넣는다. CLI 실행 시 `terms-data.js`를 읽고 JSON만 stdout으로 출력한다.

Run: `node --test test/ontology-bootstrap.test.js && node scripts/bootstrap-ontology-registry.js > /tmp/it-quiz-term-registry.json`

Expected: 테스트 통과, JSON 레코드 159개, 중복 ID 0개.

- [ ] **Step 4: 12개 학습 주제 정의**

`ontology-data.js`에 다음 ID와 사용자 표시명을 사용한다.

```js
const topics = [
    ['software-basics', '코드와 소프트웨어 기초'],
    ['web-ui', '웹 화면과 렌더링'],
    ['app-platforms', '앱 프레임워크와 플랫폼'],
    ['runtime-cli-packages', '실행 환경과 명령어'],
    ['interfaces-network', 'API와 시스템 연결'],
    ['version-control-delivery', 'Git 협업과 배포'],
    ['developer-ai-tools', '개발·AI 코딩 도구'],
    ['product-design', '화면 설계와 사용자 경험'],
    ['backend-cloud-auth', '백엔드·클라우드·인증'],
    ['data-analysis', '파일과 데이터 분석'],
    ['ai-ml-agents', 'AI·머신러닝·에이전트'],
    ['product-building', '아이디어와 제품 만들기'],
].map(([id, label]) => ({ id: `topic-${id}`, entityType: 'topic', label }));
```

- [ ] **Step 5: 생성한 159개 등록부에 주제 분류 추가**

각 레코드는 정의를 복사하지 않고 정확히 다음 모양만 사용한다.

```js
{
    id: 'term-react',
    entityType: 'term',
    label: 'React(리액트)',
    topicIds: ['topic-web-ui', 'topic-app-platforms'],
}
```

ID는 최초 저장 후 용어 표시명이 바뀌어도 변경하지 않는다. 동일 용어가 여러 주제에 속할 수 있지만 첫 번째 `topicIds` 항목을 기본 주제로 사용한다. `pathIds`는 역참조 중복이므로 저장하지 않고 `buildOntologyIndex()`가 학습 경로에서 계산한다. 12개 주제 묶음별로 분류하고 매 묶음마다 등록 수·미분류 수·중복 ID를 출력해 한 번에 159개를 손으로 작성하지 않는다.

- [ ] **Step 6: 전체 온톨로지 검증 통과 확인**

Run: `node --test test/ontology-contract.test.js test/terms-data.test.js`

Expected: 159개 ID와 주제가 모두 확인되고 기존 159개 데이터 테스트도 통과한다.

- [ ] **Step 7: 용어 등록부 커밋**

```bash
git add scripts/bootstrap-ontology-registry.js test/ontology-bootstrap.test.js ontology-data.js test/ontology-contract.test.js
git diff --cached --check
git commit -m "feat: classify all terms into ontology topics"
```

---

### Task 3: Graphify 후보 변환과 검토 경계

**Current input check (2026-09-03):** 저장소의 `graphify-out/`에는 감지·캐시 파일만 있고 관계 그래프 JSON은 없다. 따라서 이 Task는 외부 결과를 안전하게 받을 수 있는 인터페이스와 fixture 검증까지만 완료 조건으로 삼는다. 실제 Graphify/Gemini 후보 생성은 별도 외부 전송 승인 후 실행하며, 실행하지 않은 결과를 사용했다고 기록하지 않는다.

**Files:**
- Create: `scripts/import-graphify-candidates.js`
- Create: `test/ontology-candidates.test.js`
- Create: `docs/ontology/README.md`

**Interfaces:**
- Consumes: Graphify의 `{ nodes, links }` JSON, `terms-data.js`, `ontology-data.js`
- Produces: 표준 출력의 `{ candidates, rejected, stats }` JSON. 제품 스크립트에서는 이 파일을 로드하지 않는다.

- [ ] **Step 1: 후보 변환 테스트 작성**

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { convertGraphifyGraph } = require('../scripts/import-graphify-candidates.js');

test('Graphify 관계는 검토 전 INFERRED 또는 EXTRACTED 후보로만 남는다', () => {
    const result = convertGraphifyGraph({
        nodes: [
            { id: 'g-react', label: 'React' },
            { id: 'g-next', label: 'Next.js' },
        ],
        links: [{
            source: 'g-next', target: 'g-react', relation: 'implements',
            confidence: 'EXTRACTED', confidence_score: 1,
            source_file: 'public-terms-03.md',
        }],
    }, [
        { id: 'term-react', entityType: 'term', label: 'React(리액트)' },
        { id: 'term-next-js', entityType: 'term', label: 'Next.js' },
    ]);

    assert.equal(result.candidates[0].status, 'EXTRACTED');
    assert.equal(result.candidates[0].published, false);
    assert.equal(result.candidates[0].reviewedAt, null);
    assert.equal(result.stats.published, 0);
});

test('알 수 없는 노드와 관계는 rejected에 이유를 남긴다', () => {
    const result = convertGraphifyGraph({
        nodes: [{ id: 'g-x', label: '없는 용어' }],
        links: [{ source: 'g-x', target: 'g-y', relation: 'mystery' }],
    }, []);
    assert.equal(result.candidates.length, 0);
    assert.equal(result.rejected[0].reason, 'UNKNOWN_TERM_OR_RELATION');
});
```

- [ ] **Step 2: 후보 변환 테스트 실패 확인**

Run: `node --test test/ontology-candidates.test.js`

Expected: import script not found.

- [ ] **Step 3: 관계 매핑과 후보 변환 구현**

Graphify 관계는 앱의 관계 유형과 이름·방향·의미가 모두 정확히 일치할 때만 자동 변환한다. `calls`, `references`, `semantically_similar_to`처럼 더 넓거나 다른 의미의 관계를 `runs_on`, `used_with`, `contrasts_with`로 추측 변환하지 않는다. 직접 대응되지 않는 관계는 `conceptually_related_to`로 뭉개지 않고 `rejected`로 보내 사람이 원문과 두 용어 정의를 확인한다.

```js
const GRAPHIFY_RELATION_MAP = {
    implements: 'implements',
    used_with: 'used_with',
    runs_on: 'runs_on',
    prerequisite_of: 'prerequisite_of',
    produces: 'produces',
    deploys_to: 'deploys_to',
    contrasts_with: 'contrasts_with',
    alternative_to: 'alternative_to',
    is_a: 'is_a',
    part_of: 'part_of',
};
```

CLI 계약은 다음과 같다.

```bash
node scripts/import-graphify-candidates.js /absolute/path/to/graph.json > /private/tmp/it-quiz-ontology-candidates.json
```

입력 경로가 없거나 JSON 구조가 다르면 exit code 1과 한 줄 오류를 stderr에 출력한다. stdout에는 토큰·경로·개인정보가 아닌 변환 JSON만 출력한다.

- [ ] **Step 4: 후보 검토·승격 절차 문서화**

`docs/ontology/README.md`에 아래 순서를 고정한다.

```text
공개 용어 정의 준비
→ Graphify/Gemini 후보 생성
→ import-graphify-candidates.js로 형식 통일
→ 관계 유형·방향·근거 검토
→ REVIEWED만 ontology-data.js에 사람이 옮김
→ node --test로 무결성 확인
→ 학습 지도에서 연결 이유 확인
```

문서에는 `EXTRACTED도 사실 검증 완료를 뜻하지 않는다`, `후보 파일은 제품이 로드하지 않는다`, `출처 없는 관계는 승격하지 않는다`를 명시한다.

Task 4의 초기 관계는 Graphify가 만들었다고 가정하지 않는다. `terms-data.js` 정의 또는 권위 있는 공식 문서를 근거로 별도 작성하며, 실제 Graphify JSON이 생긴 경우에만 아래 명령으로 후보 통계를 추가한다.

```bash
node scripts/import-graphify-candidates.js graphify-out/it-quiz-relations.json > /tmp/it-quiz-ontology-candidates.json
```

- [ ] **Step 5: 후보 경계 테스트와 전체 회귀 테스트**

Run: `node --test test/ontology-candidates.test.js && node --test`

Expected: candidate tests pass and all existing tests pass.

- [ ] **Step 6: 후보 파이프라인 커밋**

```bash
git add scripts/import-graphify-candidates.js test/ontology-candidates.test.js docs/ontology/README.md
git diff --cached --check
git commit -m "feat: add auditable ontology candidate pipeline"
```

---

### Task 4: 검토된 관계와 159개 학습 경로 커버리지

**Files:**
- Modify: `ontology-data.js`
- Modify: `test/ontology-contract.test.js`
- Create: `test/learning-map.test.js`
- Create: `test/ontology-path-quality.test.js`
- Create: `scripts/audit-ontology-readiness.js`
- Create: `test/ontology-readiness-audit.test.js`
- Create: `docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json`
- Create: `docs/ontology/audits/20260903_ontology-audit_post-force-path.json`

**Interfaces:**
- Consumes: Task 2의 159개 `termRegistry`, Task 3의 후보 검토 규칙
- Produces: `relations`, `learningPaths`, `getTopicGraph()`, `getLearningPath()`, `getTermConnections()`, 전·후 준비도 감사 JSON

- [ ] **Step 1: 강제 배치 전 준비도 기준선 저장**

`scripts/audit-ontology-readiness.js`는 `terms-data.js`와 아직 경로를 넣지 않은 `ontology-data.js`를 받아 아래 형식의 JSON을 반환한다. 같은 입력이면 정렬 순서까지 같은 결과를 내야 한다.

```js
{
    phase: 'baseline',
    inputCommit: 'git-commit-sha',
    inputSha256: {
        termsData: 'sha256',
        ontologyData: 'sha256',
    },
    summary: {
        entities: 159,
        duplicateCandidates: 0,
        ambiguousEntityTypes: 0,
        propertyIssues: 0,
        invalidRelations: 0,
        insufficientProvenance: 0,
        weakPathAssignments: 0,
        unansweredCompetencyQuestions: 5,
    },
    findings: [{
        code: 'COMPETENCY_QUESTION_UNANSWERED',
        refId: 'cq-1',
        observation: '선행 학습 관계가 아직 없습니다.',
        requiredPrework: 'prerequisite_of 관계의 판정 기준과 근거 출처를 정의합니다.',
        retest: '검토된 선행 관계를 추가한 뒤 cq-1 질의가 경로와 출처를 반환하는지 확인합니다.',
    }],
}
```

`test/ontology-readiness-audit.test.js`는 결함 코드가 허용 목록 밖의 문자열을 사용하지 않는지, 모든 finding에 `observation`, `requiredPrework`, `retest`가 있는지, 동일 입력에서 동일 JSON이 나오는지 검증한다. 감사 파일에는 입력 Git commit과 `terms-data.js`, `ontology-data.js` SHA-256을 기록한다. 기준선은 경로를 넣기 전에 `docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json`으로 한 번 생성하고 이후 현재 데이터로 덮어쓰지 않는다.

Run:

```bash
node --test test/ontology-readiness-audit.test.js
node scripts/audit-ontology-readiness.js --phase baseline > docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json
```

Expected: 감사 테스트 통과, `phase: baseline`, 159개 개체의 배치 전 결함 수와 사례가 기록됨.

- [ ] **Step 2: 관계와 경로 커버리지 테스트 작성**

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const ontology = require('../ontology-data.js');
const terms = require('../terms-data.js');
const {
    getLearningPath, getTermConnections, getTopicGraph, validateOntology,
} = require('../ontology-utils.js');

test('A안은 159개 모든 용어를 적합도 평가와 함께 학습 경로에 포함한다', () => {
    const covered = new Set(ontology.learningPaths.flatMap(path => [
        ...path.primaryTermIds,
        ...path.supportingTermIds,
    ]));
    assert.equal(covered.size, 159);
    for (const item of ontology.termRegistry) {
        assert.ok(covered.has(item.id), `${item.label}: 학습 경로에서 누락됨`);
    }
    for (const path of ontology.learningPaths) {
        for (const termId of [...path.primaryTermIds, ...path.supportingTermIds]) {
            assert.match(path.fitAssessments[termId].fit, /^(strong|moderate|weak)$/);
            assert.ok(path.fitAssessments[termId].fitRationale.trim());
        }
    }
});

test('공개 관계는 REVIEWED이고 이유·출처·검토일이 있다', () => {
    for (const relation of ontology.relations) {
        assert.equal(relation.status, 'REVIEWED');
        assert.ok(relation.rationale.trim());
        assert.ok(relation.sourceRefs.length >= 1);
        assert.ok(relation.sourceRefs.every(source => source.kind && source.ref));
        assert.equal(relation.reviewedByRole, 'content-owner');
        assert.match(relation.reviewRecordId, /^review-/);
        assert.match(relation.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.deepEqual(validateOntology(ontology), []);
});

test('웹 앱 배포 경로는 검증된 관계 순서로 조회된다', () => {
    const path = getLearningPath(ontology, 'path-web-deployment');
    assert.deepEqual(path.primaryTermIds, [
        'term-html', 'term-css', 'term-javascript', 'term-react',
        'term-vite', 'term-github', 'term-github-actions', 'term-github-pages',
    ]);
    assert.ok(getTermConnections(ontology, 'term-react').every(item => item.status === 'REVIEWED'));
    assert.equal(getTopicGraph(ontology, 'topic-version-control-delivery').topic.id, 'topic-version-control-delivery');
});
```

- [ ] **Step 3: 경로와 조회 함수 부재로 테스트가 실패하는지 확인**

Run: `node --test test/learning-map.test.js test/ontology-contract.test.js`

Expected: learning path coverage and exported query functions fail.

- [ ] **Step 4: 목적별 학습 경로 15개 작성**

각 경로는 `primaryTermIds` 4~10개, `primaryTermIds + supportingTermIds` 합집합 8~15개를 사용하고 159개 전체의 합집합을 보장한다. 같은 용어를 여러 경로에 넣을 수 있지만 세 경로를 초과하면 진단 보고서에 표시한다. 아래 ID와 제목을 사용한다.

```js
const pathDefinitions = [
    ['web-page-basics', '웹페이지의 구조와 동작 이해하기'],
    ['web-rendering', '브라우저가 화면을 그리는 방법'],
    ['app-framework-choice', '앱 개발 방식 선택하기'],
    ['runtime-and-commands', '개발 환경과 명령어 사용하기'],
    ['api-system-connection', 'API로 시스템 연결하기'],
    ['git-collaboration', 'Git으로 변경 이력과 협업 관리하기'],
    ['web-deployment', '웹 앱이 배포되기까지'],
    ['ai-coding-tools', 'AI 코딩 도구와 개발 환경 사용하기'],
    ['interface-design', '화면을 설계하고 사용자에게 검증하기'],
    ['backend-cloud-auth', '백엔드·클라우드·인증 구성하기'],
    ['data-files', '데이터 파일을 읽고 변환하기'],
    ['data-analysis', 'Python으로 데이터를 분석하기'],
    ['machine-learning', '머신러닝 모델을 이해하기'],
    ['llm-agents', 'LLM이 정보와 도구를 사용하는 방법'],
    ['product-building', '아이디어를 제품과 포트폴리오로 만들기'],
];
```

각 경로 객체에는 `id`, `entityType: 'learningPath'`, `title`, `description`, `topicIds`, `primaryTermIds`, `supportingTermIds`, `fitAssessments`, `relationIds`, `quizTermIds`를 명시한다. `fitAssessments`는 경로의 모든 용어 ID를 키로 하고 `{ fit, fitRationale }`를 저장한다. `termRegistry[].pathIds`는 중복 저장하지 않고 `buildOntologyIndex()`가 역참조를 만든다.

- [ ] **Step 5: 검토된 의미 관계 작성**

각 관계 후보는 다음 형식을 사용한다. 아래 사실·방향·출처를 콘텐츠 책임자가 검토 패킷에서 승인한 경우에만 `status: 'REVIEWED'`와 검토 필드를 제품 데이터에 기록한다.

```js
{
    id: 'rel-react-used-with-vite',
    source: 'term-react',
    target: 'term-vite',
    type: 'used_with',
    status: 'REVIEWED',
    rationale: 'React는 화면을 구성하고 Vite는 개발 서버와 배포용 빌드를 담당합니다.',
    sourceRefs: [
        { kind: 'official-document', ref: 'https://react.dev/learn/build-a-react-app-from-scratch' },
        { kind: 'official-document', ref: 'https://vite.dev/guide/' },
    ],
    reviewedByRole: 'content-owner',
    reviewRecordId: 'review-rel-react-used-with-vite-20260903',
    reviewedAt: '2026-09-03',
}
```

허용 출처 `kind`는 `term-definition`, `official-document`, `reviewed-candidate` 세 가지다. `term-definition`은 안정 용어 ID를 쓰되 해당 정의 문장이 관계 유형과 방향을 직접 뒷받침할 때만 근거로 인정한다. 그렇지 않으면 `official-document` 공개 URL이 필요하다. `reviewed-candidate`는 검토 패킷의 후보 ID를 `ref`로 사용한다. 단순 용어 ID 두 개만 나열하는 것은 출처로 인정하지 않는다. 위 예시의 두 URL은 2026-09-03 기준 공식 React·Vite 문서에서 React 프로젝트의 Vite 사용과 Vite 역할을 직접 확인한 근거다.

구현 에이전트가 만든 관계 후보는 제품의 `ontology-data.js`에 넣지 않고 `/tmp` 검토 패킷에 `INFERRED`로 남긴다. `ontology-data.js.relations`에는 콘텐츠 책임자가 관계 유형·방향·근거를 확인하고 `reviewedByRole: 'content-owner'`, 추적 가능한 `reviewRecordId`, 날짜를 기록한 `REVIEWED` 관계만 넣는다. 개인 이름은 공개 저장소에 넣지 않는다. 승인된 관계가 없으면 빈 배열을 유지하고 `pathsWithoutReviewedRelations`를 실험 결과로 기록한다. 구현 에이전트가 빈칸을 임의 승인으로 메우지 않는다. `prerequisite_of`는 학습 순서를 나타낼 충분한 이유가 있을 때만 사용한다. 단순히 같은 주제나 경로라는 이유는 `topicIds`와 경로 배열로 표현하며 의미 관계를 만들지 않는다. 대칭 관계는 한 레코드만 저장하고 조회 함수가 양방향으로 반환한다.

- [ ] **Step 6: A안 경로 적합도 진단 구현**

`ontology-utils.js`에 `diagnosePathQuality(data)`를 추가해 다음 객체를 반환한다.

```js
{
    coveredTerms: 159,
    weakAssignments: [{ pathId, termId, fitRationale }],
    pathsOverCapacity: [],
    termsRepeatedAcrossPaths: [{ termId, pathIds }],
    pathsWithoutReviewedRelations: ['path-id'],
}
```

`test/ontology-path-quality.test.js`는 약한 배치를 실패로 숨기지 않고 동일한 ID와 이유로 보고하는지, 16번째 용어가 들어간 경로를 `pathsOverCapacity`로 잡는지 검증한다. 이 테스트의 목적은 A안을 통과시키는 것이 아니라 A안의 부작용을 재현 가능한 수치로 만드는 것이다.

- [ ] **Step 7: 배치 후 감사와 기준선 비교 구현**

같은 감사 스크립트를 `--phase experimentA`로 실행해 `docs/ontology/audits/20260903_ontology-audit_post-force-path.json`을 만든다. `compareReadinessAudits(baseline, experimentA)`는 최소한 아래를 분리해 반환한다.

```js
{
    preExisting: ['ENTITY_DUPLICATE_CANDIDATE'],
    introducedByForcedAssignment: ['PATH_ASSIGNMENT_WEAK'],
    resolvedByPrework: ['COMPETENCY_QUESTION_UNANSWERED'],
    unresolved: ['PROVENANCE_INSUFFICIENT'],
}
```

한 결함이 여러 레코드에서 발생하면 코드만 비교하지 않고 `code + refId`를 복합 키로 사용한다. 이 비교가 있어야 “사전 라벨링이 부족했던 문제”와 “A안이 새로 만든 억지 배치 문제”를 구분할 수 있다.

Run:

```bash
node scripts/audit-ontology-readiness.js --phase experimentA > docs/ontology/audits/20260903_ontology-audit_post-force-path.json
node --test test/ontology-readiness-audit.test.js test/ontology-path-quality.test.js
```

Expected: 전·후 감사가 모두 생성되고 각 finding이 `preExisting`, `introducedByForcedAssignment`, `resolvedByPrework`, `unresolved` 중 하나로 분류됨.

- [ ] **Step 8: 조회 함수 구현**

`ontology-utils.js`에 다음 계약을 추가한다. 아래처럼 존재하지 않는 ID는 즉시 오류로 드러내고, 호출자가 빈 결과를 정상값으로 오해하지 않게 한다.

```js
function getLearningPath(data, pathId) {
    const path = data.learningPaths.find(item => item.id === pathId);
    if (!path) throw new Error(`Unknown learning path: ${pathId}`);
    return path;
}

function getTermConnections(data, termId, { reviewedOnly = true } = {}) {
    if (!data.termRegistry.some(item => item.id === termId)) {
        throw new Error(`Unknown term: ${termId}`);
    }
    return data.relations.filter(relation => {
        const connected = relation.source === termId || relation.target === termId;
        return connected && (!reviewedOnly || relation.status === 'REVIEWED');
    });
}

function getTopicGraph(data, topicId) {
    const topic = data.topics.find(item => item.id === topicId);
    if (!topic) throw new Error(`Unknown topic: ${topicId}`);
    const termIds = data.termRegistry
        .filter(item => item.topicIds.includes(topicId))
        .map(item => item.id);
    const termIdSet = new Set(termIds);
    return {
        topic,
        terms: data.termRegistry.filter(item => termIdSet.has(item.id)),
        relations: data.relations.filter(relation =>
            relation.status === 'REVIEWED'
            && termIdSet.has(relation.source)
            && termIdSet.has(relation.target)),
    };
}

function getTermsForQuiz(data, pathId, allTerms) {
    const path = getLearningPath(data, pathId);
    const ontologyById = new Map(data.termRegistry.map(item => [item.id, item]));
    const sourceByName = new Map(allTerms.map(item => [item.term, item]));
    return path.quizTermIds.map(termId => {
        const registryItem = ontologyById.get(termId);
        const sourceTerm = registryItem && sourceByName.get(registryItem.label);
        if (!sourceTerm) throw new Error(`Unknown quiz term: ${termId}`);
        return sourceTerm;
    });
}
```

`getTermsForQuiz()`는 `quizTermIds` 순서를 보존하며 `terms-data.js`의 원본 객체를 반환한다. 알 수 없는 ID는 조용히 누락하지 않고 `Error`를 던진다.

- [ ] **Step 9: 159개 커버리지와 전체 무결성 검증**

Run: `node --test test/ontology-contract.test.js test/learning-map.test.js`

Expected: 159/159 terms covered, zero validation errors, zero prerequisite cycles. `weakAssignments`는 0으로 강제하지 않고 실제 값을 기록한다.

- [ ] **Step 10: 관계·경로 데이터 커밋**

```bash
git add ontology-data.js ontology-utils.js scripts/audit-ontology-readiness.js test/ontology-contract.test.js test/learning-map.test.js test/ontology-path-quality.test.js test/ontology-readiness-audit.test.js docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json docs/ontology/audits/20260903_ontology-audit_post-force-path.json
git diff --cached --check
git commit -m "feat: map all terms into experimental learning paths"
```

---

### Task 5: 학습 지도 화면 구조와 반응형 표현

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Create: `test/learning-map-ui.test.js`

**Interfaces:**
- Consumes: 기존 `screen` 라우팅과 다크·라이트 토큰
- Produces: `#learning-map-screen`, 주제 목록, 경로 영역, 용어·관계 상세 패널, 모바일 단계 목록

- [ ] **Step 1: 화면·접근성·스크립트 순서 테스트 작성**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('학습 지도는 주제·경로·상세 영역을 접근 가능한 컨트롤로 제공한다', () => {
    assert.match(html, /id="learning-map-screen"/);
    assert.match(html, /id="learning-topic-list"/);
    assert.match(html, /id="learning-path-flow"/);
    assert.match(html, /id="learning-detail"/);
    assert.match(html, /id="learning-map-status"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(html, /id="start-path-quiz"/);
    assert.match(html, /id="learning-map-btn"/);
});

test('온톨로지 데이터와 유틸은 지도 컨트롤러보다 먼저 로드된다', () => {
    const sources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
    assert.ok(sources.indexOf('ontology-schema.js') < sources.indexOf('learning-map.js'));
    assert.ok(sources.indexOf('ontology-data.js') < sources.indexOf('learning-map.js'));
    assert.ok(sources.indexOf('ontology-utils.js') < sources.indexOf('learning-map.js'));
});

test('390px에서 그래프를 단계 목록으로 바꾸고 가로 넘침을 막는다', () => {
    const mobileMapCss = css.match(
        /\/\* learning-map-mobile:start \*\/([\s\S]*?)\/\* learning-map-mobile:end \*\//,
    )?.[1] || '';
    assert.match(mobileMapCss, /\.learning-path-flow\s*\{[^}]*display:\s*none/s);
    assert.match(mobileMapCss, /\.learning-mobile-path\s*\{[^}]*display:\s*block/s);
    assert.match(mobileMapCss, /overflow-wrap:\s*anywhere/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/learning-map-ui.test.js`

Expected: learning map selectors and script files are missing.

- [ ] **Step 3: `index.html`에 독립 학습 지도 화면 추가**

기존 용어사전 화면, `전체 159개 보기` 목록과 퀴즈 중 사전 dialog는 유지한다. 사전 화면과 홈에 별도 `학습 지도 보기` 버튼(`learning-map-btn`)을 추가한다. 지도 화면은 다음 DOM ID를 사용한다.

```html
<section id="learning-map-screen" class="screen" aria-labelledby="learning-map-title">
  <aside class="learning-sidebar" aria-label="학습 주제">
    <input id="learning-map-search" type="search" placeholder="용어 검색 · 예: API">
    <div id="learning-topic-list"></div>
  </aside>
  <section class="learning-stage">
    <header><h1 id="learning-map-title">용어가 연결되는 흐름을 살펴보세요</h1></header>
    <ol id="learning-path-flow" class="learning-path-flow"></ol>
    <ol id="learning-mobile-path" class="learning-mobile-path"></ol>
  </section>
  <aside id="learning-detail" class="learning-detail"></aside>
  <p id="learning-map-status" class="sr-only" role="status" aria-live="polite"></p>
</section>
```

지도 화면의 기본 주 행동은 `이 경로로 퀴즈 풀기` 한 개다. `전체 지도`는 12개 주제와 159개 용어 그룹 목록을 제공하고, `학습 경로`는 선택한 8~15개 용어와 검토된 관계만 보여준다.

- [ ] **Step 4: 데스크톱·태블릿·모바일 CSS 구현**

- 1151px 이상: `280px minmax(620px, 1fr) 340px` 세 칸
- 721~1150px: 주제 목록과 경로 두 칸, 상세 패널은 경로 아래
- 720px 이하: 한 칸, 주제 탭 컨테이너만 `overflow-x: auto`, 페이지 자체는 넘치지 않음, 데스크톱 경로 흐름 숨김, 단계 목록 표시
- 390px: 문구·버튼·긴 용어명 포함 `scrollWidth === clientWidth`

그림자 카드 반복, 의미 없는 점, 장식용 세로 컬러선, 이모지를 사용하지 않는다. 기존 CSS 변수와 다크 모드 토큰을 재사용한다.

- [ ] **Step 5: 화면 계약 테스트 통과 확인**

Run: `node --test test/learning-map-ui.test.js test/color-contrast.test.js`

Expected: map UI tests and color contrast tests pass.

- [ ] **Step 6: 화면 골격 커밋**

```bash
git add index.html style.css test/learning-map-ui.test.js
git diff --cached --check
git commit -m "feat: add responsive learning map layout"
```

---

### Task 6: 지도 상호작용·검색·연결 이유 표시

**Files:**
- Create: `learning-map.js`
- Modify: `ontology-utils.js`
- Modify: `app.js`
- Modify: `test/learning-map.test.js`
- Modify: `test/learning-map-ui.test.js`

**Interfaces:**
- Consumes: `IT_QUIZ_ONTOLOGY`, `IT_QUIZ_BASE_TERMS`, `ITQuizOntologyUtils`
- Produces: `ITQuizLearningMap.createLearningMapController()`, 선택 상태, DOM 렌더링, `onStartQuiz(pathId)` 콜백

- [ ] **Step 1: 순수 상태 전이 테스트 추가**

```js
const { createLearningMapState } = require('../learning-map.js');
const { searchOntologyTerms } = require('../ontology-utils.js');

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
        terms: [{ term: 'Interface(인터페이스)', definition: '사람과 기계의 접점', aliases: [] }],
        termRegistry: [{
            id: 'term-interface', entityType: 'term',
            label: 'Interface(인터페이스)', topicIds: ['topic-interfaces-network'],
        }],
        pathsByTermId: new Map([['term-interface', ['path-api-system-connection']]]),
        query: '접점',
    });
    assert.equal(result[0].id, 'term-interface');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/learning-map.test.js`

Expected: learning map module exports are missing.

- [ ] **Step 3: UMD 지도 컨트롤러와 검색 구현**

`learning-map.js`는 다음 API를 내보낸다.

```js
{
    createLearningMapController,
    createLearningMapState,
    renderLearningMap,
}
```

`searchOntologyTerms({ terms, termRegistry, pathsByTermId, query })`는 배열과 인덱스를 인자로 받는 순수 함수로 만든다. 내부에서 기존 `ITQuizContent.searchGlossaryTerms(terms, query)`를 호출하고 각 결과에 `termRegistry` ID, 기본 주제, 포함 경로를 결합한다. 브라우저 전역은 함수 안에서 직접 읽지 않는다. 검색 결과를 누르면 해당 용어가 포함된 첫 학습 경로를 열고 상세 패널에 정의와 검토된 연결을 표시한다.

- [ ] **Step 4: 관계가 읽히는 경로 렌더링 구현**

데스크톱 경로는 `primaryTermIds` 순서와 `fitAssessments`를 사용한 CSS Grid/Flex 흐름으로 렌더링한다. 자유 배치, force simulation, 좌표 계산과 SVG 선은 사용하지 않는다. 모든 노드는 용어명이 보이는 `<button>`으로 만들고, 인접한 두 단계 사이의 검토된 관계를 별도의 키보드 접근 가능한 관계 버튼으로 렌더링한다. 교차 관계는 화면에 선을 겹쳐 그리지 않고 선택한 용어의 상세 패널에 목록으로 표시한다. 관계 버튼에는 다음 접근성 이름을 사용한다.

```text
React에서 Vite로 연결: 함께 사용
```

관계를 선택하면 상세 패널에 관계 유형, `source → target`, `rationale`, 구조화된 출처를 표시한다. 주제 소속과 학습 경로 포함은 의미 관계 버튼으로 렌더링하지 않는다.

- [ ] **Step 5: 전체 보기와 모바일 단계 목록 구현**

전체 보기는 12개 주제 버튼과 각 주제의 모든 용어명을 그룹 목록으로 보여 159개가 실제로 확인되게 한다. 모바일은 `primaryTermIds` 순서의 `<ol>`과 각 단계 사이 관계명을 표시하며 관계가 없는 보조 용어는 `함께 알아둘 용어` 목록에 둔다.

- [ ] **Step 6: 기존 화면 라우팅 연결**

`app.js`의 `showScreen()` 계약을 유지하면서 다음 연결을 추가한다.

- `#show-all-terms-btn` → 기존처럼 159개 전체 용어 목록 표시
- `#learning-map-btn` → `learning-map-screen`
- 지도 안 `용어사전으로 돌아가기` → `dictionary-screen`
- 상단 `용어 사전 159` → 기존 dictionary screen
- 홈과 퀴즈 화면 진입 시 지도 선택 상태는 유지하되 화면만 전환

- [ ] **Step 7: 상태·검색·회귀 테스트 통과 확인**

Run: `node --test test/learning-map.test.js test/learning-map-ui.test.js test/learning-support.test.js test/quiz-dictionary-routing.test.js`

Expected: all selected tests pass.

- [ ] **Step 8: 지도 상호작용 커밋**

```bash
git add learning-map.js ontology-utils.js app.js test/learning-map.test.js test/learning-map-ui.test.js
git diff --cached --check
git commit -m "feat: make ontology learning paths interactive"
```

---

### Task 7: 학습 경로별 퀴즈 연결

**Files:**
- Modify: `app.js`
- Modify: `quiz-content.js`
- Modify: `test/learning-map.test.js`
- Create: `test/scoped-quiz.test.js`

**Interfaces:**
- Consumes: `getTermsForQuiz(ontology, pathId, termsData)`, 지도 컨트롤러의 `onStartQuiz(pathId)`
- Produces: `startQuiz(type, { sourceTerms, scopeLabel })`, 경로 용어로 제한된 객관식 문제

- [ ] **Step 1: 경로별 퀴즈 범위 테스트 작성**

```js
test('학습 경로 퀴즈는 해당 경로 용어만 정답으로 사용한다', () => {
    const sourceTerms = [
        { term: 'HTML', definition: '구조' },
        { term: 'CSS', definition: '스타일' },
        { term: 'JavaScript', definition: '동작' },
        { term: 'React', definition: '화면 구성' },
    ];
    const questions = generateMultipleChoiceQuestions({ answerPool: sourceTerms, allTerms: sourceTerms });
    assert.ok(questions.every(question => sourceTerms.some(term => term.term === question.correctAnswer)));
});
```

- [ ] **Step 2: 기존 생성 함수 시그니처로 실패하는지 확인**

Run: `node --test test/learning-map.test.js test/scoped-quiz.test.js test/quiz-ux.test.js`

Expected: scoped question generation contract fails.

- [ ] **Step 3: 문제 생성 입력을 정답 풀과 전체 오답 풀로 분리**

현재 `app.js` 안에 있는 문제 생성 로직을 `quiz-content.js`의 순수 함수 `generateMultipleChoiceQuestions({ answerPool, allTerms, count, seed, shuffle })`로 옮긴다. `app.js`는 `answerPool = termsData`, `allTerms = termsData`, `count = 15`를 기본값으로 넘긴다. 정답 후보는 `answerPool`에서만 고르고, 오답은 기존 혼동군 규칙을 유지하며 `allTerms`에서 찾는다. 경로 용어가 15개보다 적으면 중복 없이 해당 개수만 출제한다. 기존 `test/quiz-ux.test.js` 단언은 변경하지 않고 `test/scoped-quiz.test.js`에 새 범위 계약을 추가한다.

- [ ] **Step 4: 지도 CTA를 기존 퀴즈 흐름에 연결**

`startQuiz('multiple-choice', { sourceTerms, scopeLabel: path.title })`를 호출한다. 문제 화면의 보조 문구에는 `웹 앱이 배포되기까지 · 객관식`처럼 현재 경로를 표시한다. 결과 화면과 다시 풀기는 동일한 경로 범위를 보존한다.

- [ ] **Step 5: 기존 네 가지 홈 퀴즈 회귀 확인**

Run: `node --test test/quiz-ux.test.js test/learning-support.test.js test/answer-validation.test.js`

Expected: 기존 홈 퀴즈는 전체 용어 풀을 계속 사용하고 지도 퀴즈만 경로 범위를 사용한다.

- [ ] **Step 6: 경로 퀴즈 커밋**

```bash
git add app.js quiz-content.js test/scoped-quiz.test.js test/learning-map.test.js
git diff --cached --check
git commit -m "feat: start quizzes from ontology learning paths"
```

---

### Task 8: 전체 검증·문서 갱신·정적 배포 준비

**Files:**
- Modify: `DESIGN.md`
- Modify: `index.html`
- Modify: `test/learning-map-ui.test.js`
- Create: `docs/ontology/experiment-a-report.md`

**Interfaces:**
- Consumes: Tasks 1~7의 완성 기능
- Produces: 검증 가능한 디자인 규칙, 일치하는 정적 자산 버전, A안 실험 보고서, 배포 전 증거

- [ ] **Step 1: 디자인 기준에 학습 지도 규칙 추가**

`DESIGN.md`에 다음 원칙을 기록한다.

- 전체 주제 지도는 탐색용, 목적별 학습 경로는 학습용이다.
- 모든 공개 선은 관계명·이유·출처를 가져야 한다.
- 주제 소속선을 의미 관계처럼 그리지 않는다.
- 모바일은 그래프보다 읽을 수 있는 단계 목록을 우선한다.
- 지도 화면의 주 행동은 `이 경로로 퀴즈 풀기` 하나다.

- [ ] **Step 2: 정적 자산 버전을 한 값으로 갱신**

`index.html`의 로컬 CSS·JS query version을 동일한 새 값 `20260903.1`로 변경한다. 로드 순서는 다음과 같이 고정한다.

```text
terms-utils.js
terms-data.js
ontology-schema.js
ontology-data.js
ontology-utils.js
quiz-ux.js
quiz-content.js
learning-map.js
app.js
```

- [ ] **Step 3: 전체 자동 테스트 실행**

Run: `node --test`

Expected: all tests pass, 0 fail.

- [ ] **Step 4: 정적 서버에서 데스크톱·태블릿·모바일 QA**

Run:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

별도 터미널 또는 브라우저 자동화에서 다음 크기를 확인한다.

- Desktop: 1512×982
- Tablet portrait: 834×1194
- Mobile: 390×844

각 크기에서 확인할 증거:

- 전체 159개 용어가 주제 그룹에서 확인됨
- 경로 노드와 관계명이 잘리지 않음
- 노드와 관계 선택 시 상세 설명 변경
- 용어 검색으로 해당 경로 이동
- 모바일에서 데스크톱 경로 흐름 대신 단계 목록 표시
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- 키보드 Tab/Enter/Escape 사용 가능
- console error 0
- 기존 홈·퀴즈·용어사전·결과 화면 정상

- [ ] **Step 5: 데이터 무결성 보고 출력**

Run:

```bash
node - <<'NODE'
const ontology = require('./ontology-data.js');
const { validateOntology, diagnosePathQuality } = require('./ontology-utils.js');
const covered = new Set(ontology.learningPaths.flatMap(path => [...path.primaryTermIds, ...path.supportingTermIds]));
const pathQuality = diagnosePathQuality(ontology);
console.log(JSON.stringify({
  terms: ontology.termRegistry.length,
  topics: ontology.topics.length,
  paths: ontology.learningPaths.length,
  reviewedRelations: ontology.relations.filter(item => item.status === 'REVIEWED').length,
  coveredTerms: covered.size,
  validationErrors: validateOntology(ontology).length,
  weakAssignments: pathQuality.weakAssignments.length,
  pathsOverCapacity: pathQuality.pathsOverCapacity.length,
  termsRepeatedAcrossPaths: pathQuality.termsRepeatedAcrossPaths.length,
  pathsWithoutReviewedRelations: pathQuality.pathsWithoutReviewedRelations.length,
}, null, 2));
NODE
```

Expected: `terms: 159`, `topics: 12`, `paths: 15`, `coveredTerms: 159`, `validationErrors: 0`, `pathsOverCapacity: 0`. `weakAssignments`, 중복 배치와 관계 없는 경로는 실제 값을 기록하며 0으로 조작하지 않는다. 관계 수는 의미와 근거 검토 결과를 따르므로 목표 개수로 강제하지 않는다.

이어서 Task 4에서 고정 저장한 두 감사를 비교한다. 현재 데이터로 `baseline`을 다시 생성하지 않는다.

```bash
node scripts/audit-ontology-readiness.js --compare docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json docs/ontology/audits/20260903_ontology-audit_post-force-path.json
```

Expected: 모든 finding이 `preExisting`, `introducedByForcedAssignment`, `resolvedByPrework`, `unresolved` 중 하나로 분류되고 미분류 finding은 0개다.

- [ ] **Step 6: A안 실험 결과에서 사전 작업 도출**

`docs/ontology/experiment-a-report.md`를 다음 구조로 작성한다.

```markdown
# 159개 전체 경로 배치 실험 보고서

## 실험 조건
- 전체 용어 수: 감사 JSON의 `summary.entities` 실측값
- 전체 경로 수: `ontology-data.js` 실측값
- 강제 조건: 모든 용어가 하나 이상의 경로에 포함

## 강제 배치 전후 비교
| 분류 | 개수 | 결함 코드 | 대표 refId |

## 관찰 결과
| 문제 유형 | 개수 | 대표 사례 | 사용자 영향 |

## 원인과 필요한 사전 작업
| 관찰 | 원인 가설 | 먼저 정의해야 할 것 | 재검증 방법 |

## 온톨로지 준비도 결론
| 사전 작업 | 상태 | 이번 실험의 증거 | 다음 데이터셋에 재사용할 규칙 |

## 그래프가 답해야 할 질문
| competency question | 답변 가능 여부 | 사용한 관계·경로 | 부족한 사전 정의 |

## 배포 판단
| 구분 | 상태 | 근거 |
```

보고서에는 최소한 `weakAssignments`, 경로 반복 배치, 관계 없는 경로, 중복/모호 라벨, 관계 제약 오류를 포함한다. 각 문제를 `관찰 → 원인 가설 → 필요한 사전 정의 → 재실험`으로 연결하고, 숫자가 0인 항목도 0으로 기록한다. 표의 상태·개수·근거 칸은 측정 결과로 모두 채우며 빈 라벨을 남기지 않는다.

마지막에는 IT Quiz에서 확인한 사전 작업을 다른 도메인에 재사용할 수 있는 순서로 고정한다.

```text
1. competency question 정의
2. 정본 데이터와 개체 경계 확정
3. 안정 ID·정본 라벨·별칭 규칙 확정
4. 개체 유형과 유형 판별 기준 확정
5. 속성 사전과 결측·허용값 규칙 확정
6. 관계 사전(domain/range/방향/대칭성/다중성/순환/금지 조합) 확정
7. 허용 근거·검토 역할·변경 이력 확정
8. 후보 추출 후 인간 검토
9. 무결성·질문 응답 가능성·사용성 검증
10. 승인된 관계만 제품에 노출
```

이 순서는 향후 `ksleep-company-os`, `care-ops`, CareLoop에 개념적으로 재사용할 수 있지만, 이 저장소의 용어 유형·관계·결과를 의료·운영 데이터에 그대로 복사하지 않는다. 각 제품의 업무 책임자, PHI 경계, 승인 규칙을 별도로 정의해야 한다.

- [ ] **Step 7: 커밋 전 소유권과 범위 재확인**

```bash
git status --short --branch
git diff --check
git diff --name-only origin/main...HEAD
```

`.playwright-cli/`, `.superpowers/`, `graphify-out/`과 스크린샷은 stage하지 않는다. 이번 계획에 명시되지 않은 파일은 `JUDGMENT_REQUIRED`로 남긴다.

- [ ] **Step 8: 최종 문서·버전 커밋**

```bash
git add DESIGN.md index.html test/learning-map-ui.test.js docs/ontology/experiment-a-report.md
git diff --cached --name-only
git diff --cached --check
git commit -m "docs: record ontology learning map contract"
```

- [ ] **Step 9: 로컬 완료 상태 보고**

보고에는 다음을 분리한다.

- 구현 완료 파일과 로컬 commit
- `node --test` 결과
- 159개 온톨로지 검증 결과
- A안 전·후 감사 비교, 경로 품질 수치와 사전 작업 도출 결과
- 데스크톱·태블릿·모바일 QA 결과
- 범위 밖으로 남긴 untracked 파일 개수
- push/PR/merge/deploy가 수행되지 않았다는 사실

## 실행 종료 조건

이 계획의 로컬 구현은 다음 조건이 모두 참일 때만 `completed`로 보고한다.

- 159개 용어가 고유 ID·주제·학습 경로로 100% 등록됨
- 모든 경로 배치에 `strong | moderate | weak` 적합도와 이유가 기록됨
- 사용자에게 노출되는 관계가 모두 `REVIEWED`이며 이유와 출처가 있음
- 온톨로지 검증 오류 0개, 선행 관계 순환 0개
- 자동 테스트 전체 통과
- 데스크톱·태블릿·모바일에서 가로 넘침과 console error 0
- 기존 퀴즈와 용어사전 회귀 없음
- 강제 배치 전·후 결함이 네 분류로 모두 귀속되고 미분류 결함 0개
- 요청 범위 파일만 로컬 커밋됨

위 조건은 **A안 로컬 실험 구현 완료**를 뜻한다. `weakAssignments > 0`, 사람이 승인하지 않은 관계 또는 미충족 준비도 Gate가 하나라도 있으면 배포 준비 상태는 `needs content review`다. 약한 배치를 숨기거나 임의로 `strong`으로 바꿔 배포 조건을 통과시키지 않는다.

공개 저장소 push, PR, 병합, GitHub Pages 배포와 live 검증은 별도 승인 후 `superpowers:finishing-a-development-branch`, `review`, `land-and-deploy`, `canary` 절차로 수행한다.
