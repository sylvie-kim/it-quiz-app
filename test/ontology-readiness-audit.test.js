const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const ontology = require('../ontology-data.js');
const schema = require('../ontology-schema.js');
const terms = require('../terms-data.js');

let auditModule = {};
try {
    auditModule = require('../scripts/audit-ontology-readiness.js');
} catch {
    // The first TDD run proves the audit module does not exist yet.
}

test('준비도 감사는 생성·비교 함수를 공개한다', () => {
    assert.equal(typeof auditModule.createReadinessAudit, 'function');
    assert.equal(typeof auditModule.compareReadinessAudits, 'function');
});

test('같은 입력 감사에는 허용 코드와 재검사 절차가 같은 순서로 기록된다', () => {
    const input = {
        phase: 'baseline',
        terms,
        ontology: { ...ontology, learningPaths: [] },
        inputCommit: 'commit-under-test',
        inputSha256: { termsData: 'terms-hash', ontologyData: 'ontology-hash' },
    };
    const first = auditModule.createReadinessAudit(input);
    const second = auditModule.createReadinessAudit(input);

    assert.deepEqual(first, second);
    assert.equal(first.phase, 'baseline');
    assert.equal(first.summary.entities, 160);
    assert.equal(first.summary.weakPathAssignments, 0);
    assert.equal(first.summary.unansweredCompetencyQuestions, 3);
    assert.equal(first.summary.ambiguousEntityTypes, 0);
    assert.equal(first.summary.propertyIssues, 0);
    assert.equal(
        first.findings.filter(item => item.code === 'ENTITY_TYPE_AMBIGUOUS').length,
        0,
    );
    for (const finding of first.findings) {
        assert.ok(auditModule.ALLOWED_FINDING_CODES.includes(finding.code), finding.code);
        assert.ok(finding.observation.trim(), `${finding.code}: observation`);
        assert.ok(finding.requiredPrework.trim(), `${finding.code}: requiredPrework`);
        assert.ok(finding.retest.trim(), `${finding.code}: retest`);
    }
});

test('유효한 termKind를 모두 제공하면 개체 유형 준비도 결함이 사라진다', () => {
    const corrected = {
        ...ontology,
        termRegistry: ontology.termRegistry.map(item => ({ ...item, termKind: 'concept' })),
    };
    const result = auditModule.createReadinessAudit({
        phase: 'experimentA', terms, ontology: corrected, schema,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });

    assert.equal(result.summary.ambiguousEntityTypes, 0);
    assert.equal(result.summary.propertyIssues, 0);
});

test('한 용어의 termKind만 비우면 그 용어 finding만 새로 관찰된다', () => {
    const brokenTermId = ontology.termRegistry[0].id;
    const brokenOntology = {
        ...ontology,
        termRegistry: ontology.termRegistry.map((item, index) => (
            index === 0 ? { ...item, termKind: undefined } : item
        )),
    };
    const baseline = auditModule.createReadinessAudit({
        phase: 'baseline', terms, ontology: brokenOntology, schema,
        inputCommit: 'fixture-before', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });
    const experiment = auditModule.createReadinessAudit({
        phase: 'experimentA', terms, ontology, schema,
        inputCommit: 'fixture-after', inputSha256: { termsData: 'a', ontologyData: 'c' },
    });
    const comparison = auditModule.compareReadinessAudits(baseline, experiment);

    assert.equal(baseline.summary.ambiguousEntityTypes, 1);
    assert.equal(
        baseline.findings.filter(item => item.code === 'ENTITY_TYPE_AMBIGUOUS').length,
        1,
    );
    assert.equal(experiment.summary.ambiguousEntityTypes, 0);
    assert.deepEqual(comparison.resolvedByPrework, [
        { code: 'ENTITY_TYPE_AMBIGUOUS', refId: brokenTermId },
    ]);
    assert.equal(
        comparison.preExisting.filter(item => item.code === 'ENTITY_TYPE_AMBIGUOUS').length,
        0,
    );
    assert.deepEqual(comparison.unclassified, []);
});

test('정의·별칭·등록부 ID의 실제 결함만 속성 및 중복 후보로 계산한다', () => {
    const malformedTerms = terms.map((item, index) => {
        if (index === 0) return { ...item, definition: '' };
        if (index === 1) return { ...item, aliases: [terms[0].term] };
        if (index === 2) return { ...item, aliases: 'not-an-array' };
        return item;
    });
    const malformedOntology = {
        ...ontology,
        termRegistry: ontology.termRegistry.map((item, index) => ({
            ...item,
            termKind: 'concept',
            ...(index === 2 ? { id: 'invalid registry id' } : {}),
        })),
    };
    const result = auditModule.createReadinessAudit({
        phase: 'experimentA', terms: malformedTerms, ontology: malformedOntology, schema,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });

    assert.equal(result.summary.duplicateCandidates, 1);
    assert.ok(result.summary.propertyIssues >= 3);
    assert.ok(result.findings.some(item => item.code === 'PROPERTY_MISSING_OR_INVALID'
        && item.refId === 'source:TDD(Test-Driven Development, 테스트 주도 개발):definition'));
    assert.ok(result.findings.some(item => item.code === 'PROPERTY_MISSING_OR_INVALID'
        && item.refId === 'registry:Markup(마크업):id'));
    assert.ok(result.findings.some(item => item.code === 'PROPERTY_MISSING_OR_INVALID'
        && item.refId === 'source:Markup(마크업):aliases'));
});

test('감사 CLI는 입력 commit과 두 정본 파일의 SHA-256을 기록한다', () => {
    const result = spawnSync(process.execPath, [
        path.join(__dirname, '..', 'scripts', 'audit-ontology-readiness.js'),
        '--phase', 'baseline',
    ], { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);

    const output = JSON.parse(result.stdout);
    const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.match(output.inputCommit, /^[0-9a-f]{40}$/);
    assert.deepEqual(output.inputSha256, {
        termsData: sha256(path.join(__dirname, '..', 'terms-data.js')),
        ontologyData: sha256(path.join(__dirname, '..', 'ontology-data.js')),
    });
});

test('감사 비교는 같은 코드의 다른 refId를 별도 결함으로 분류한다', () => {
    const baseline = {
        findings: [
            { code: 'ENTITY_TYPE_AMBIGUOUS', refId: 'shared' },
            { code: 'PROPERTY_MISSING_OR_INVALID', refId: 'resolved' },
            { code: 'PATH_ASSIGNMENT_WEAK', refId: 'shared-weak' },
        ],
    };
    const experiment = {
        findings: [
            { code: 'ENTITY_TYPE_AMBIGUOUS', refId: 'shared' },
            { code: 'PATH_ASSIGNMENT_WEAK', refId: 'shared-weak' },
            { code: 'PATH_ASSIGNMENT_WEAK', refId: 'new-weak' },
            { code: 'COMPETENCY_QUESTION_UNANSWERED', refId: 'cq-5' },
        ],
    };

    assert.deepEqual(auditModule.compareReadinessAudits(baseline, experiment), {
        preExisting: [
            { code: 'ENTITY_TYPE_AMBIGUOUS', refId: 'shared' },
            { code: 'PATH_ASSIGNMENT_WEAK', refId: 'shared-weak' },
        ],
        resolvedByPrework: [{ code: 'PROPERTY_MISSING_OR_INVALID', refId: 'resolved' }],
        introducedByForcedAssignment: [{ code: 'PATH_ASSIGNMENT_WEAK', refId: 'new-weak' }],
        unresolved: [{ code: 'COMPETENCY_QUESTION_UNANSWERED', refId: 'cq-5' }],
        unclassified: [],
    });
});

test('계약이 깨진 REVIEWED 관계는 competency question을 해결하지 않는다', () => {
    const invalidRelation = {
        id: 'rel-invalid-prerequisite',
        source: 'term-html',
        target: 'term-css',
        type: 'prerequisite_of',
        status: 'REVIEWED',
        rationale: '',
        sourceRefs: [],
        reviewedByRole: 'content-owner',
        reviewRecordId: 'review-invalid-prerequisite',
        reviewedAt: '2026-09-03',
    };
    const result = auditModule.createReadinessAudit({
        phase: 'experimentA', terms,
        ontology: { ...ontology, relations: [invalidRelation] }, schema,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });
    const unanswered = result.findings
        .filter(item => item.code === 'COMPETENCY_QUESTION_UNANSWERED')
        .map(item => item.refId);

    assert.ok(unanswered.includes('cq-1'));
    assert.ok(unanswered.includes('cq-5'));
});

test('여러 관계가 만든 선행 순환은 관련 관계 모두를 무효화하고 질문을 해결하지 않는다', () => {
    const relationDefaults = {
        type: 'prerequisite_of',
        status: 'REVIEWED',
        rationale: '두 용어 사이의 학습 순서를 검토한 fixture입니다.',
        reviewedByRole: 'content-owner',
        reviewedAt: '2026-09-03',
    };
    const cyclicRelations = [
        {
            ...relationDefaults,
            id: 'rel-html-before-css',
            source: 'term-html',
            target: 'term-css',
            sourceRefs: [{ kind: 'term-definition', ref: 'term-html' }],
            reviewRecordId: 'review-html-before-css',
        },
        {
            ...relationDefaults,
            id: 'rel-css-before-html',
            source: 'term-css',
            target: 'term-html',
            sourceRefs: [{ kind: 'term-definition', ref: 'term-css' }],
            reviewRecordId: 'review-css-before-html',
        },
    ];
    const result = auditModule.createReadinessAudit({
        phase: 'experimentA', terms,
        ontology: { ...ontology, relations: cyclicRelations }, schema,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });
    const unanswered = result.findings
        .filter(item => item.code === 'COMPETENCY_QUESTION_UNANSWERED')
        .map(item => item.refId);
    const invalidRelationRefs = result.findings
        .filter(item => item.code === 'RELATION_AMBIGUOUS_OR_INVALID')
        .map(item => item.refId);

    assert.deepEqual(invalidRelationRefs, ['rel-css-before-html', 'rel-html-before-css']);
    assert.ok(unanswered.includes('cq-1'));
    assert.ok(unanswered.includes('cq-5'));
});

test('적합도 계약이 깨진 경로는 학습 순서 질문을 해결하지 않는다', () => {
    const invalidPaths = ontology.learningPaths.map((pathItem, index) => {
        if (index !== 0) return pathItem;
        const termId = pathItem.primaryTermIds[0];
        return {
            ...pathItem,
            fitAssessments: {
                ...pathItem.fitAssessments,
                [termId]: { fit: 'unsupported', fitRationale: '' },
            },
        };
    });
    const result = auditModule.createReadinessAudit({
        phase: 'experimentA', terms,
        ontology: { ...ontology, learningPaths: invalidPaths }, schema,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });

    assert.ok(result.findings.some(item =>
        item.code === 'COMPETENCY_QUESTION_UNANSWERED' && item.refId === 'cq-4'));
});

test('감사는 존재하지 않는 관계 끝점을 관계 결함으로 집계한다', () => {
    const fixture = {
        topics: [{ id: 'topic-one', entityType: 'topic', label: '주제' }],
        termRegistry: [{ id: 'term-one', entityType: 'term', label: '용어', topicIds: ['topic-one'] }],
        learningPaths: [],
        relations: [{
            id: 'rel-missing-target',
            source: 'term-one',
            target: 'term-missing',
            type: 'used_with',
            status: 'REVIEWED',
            rationale: 'fixture relation',
            sourceRefs: [{ kind: 'term-definition', ref: 'term-one' }],
            reviewedByRole: 'content-owner',
            reviewRecordId: 'review-fixture',
            reviewedAt: '2026-09-03',
        }],
    };
    const result = auditModule.createReadinessAudit({
        phase: 'baseline', terms: [], ontology: fixture,
        inputCommit: 'fixture', inputSha256: { termsData: 'a', ontologyData: 'b' },
    });

    assert.equal(result.summary.invalidRelations, 1);
    assert.ok(result.findings.some(item =>
        item.code === 'RELATION_AMBIGUOUS_OR_INVALID' && item.refId === 'rel-missing-target'));
});

test('배치 전 기준선은 당시 commit과 입력 해시를 보존하고 배치 후 감사와 분리된다', () => {
    const baseline = require('../docs/ontology/audits/20260903_ontology-audit_pre-path-baseline.json');
    const experiment = require('../docs/ontology/audits/20260903_ontology-audit_post-force-path.json');

    assert.equal(baseline.inputCommit, '1cf49265aeb07d2210b8ea528a1b364ff78e654a');
    assert.deepEqual(baseline.inputSha256, {
        termsData: '9e12a4ac5aae6fc3547caad588b6b4081ba53757dadd12f7b643265904eb8e03',
        ontologyData: '272f4f446d349b423e0b402247592e55c2bc1a158888ba58ff4b37761a1d2097',
    });
    assert.equal(baseline.summary.ambiguousEntityTypes, 159);
    assert.equal(baseline.summary.propertyIssues, 0);
    assert.equal(baseline.summary.weakPathAssignments, 0);
    assert.equal(experiment.summary.weakPathAssignments, 3);
    assert.notEqual(baseline.inputSha256.ontologyData, experiment.inputSha256.ontologyData);
    assert.deepEqual(auditModule.compareReadinessAudits(baseline, experiment), {
        preExisting: baseline.findings
            .filter(item => experiment.findings.some(other => other.code === item.code && other.refId === item.refId))
            .map(({ code, refId }) => ({ code, refId })),
        resolvedByPrework: [{ code: 'COMPETENCY_QUESTION_UNANSWERED', refId: 'cq-4' }],
        introducedByForcedAssignment: experiment.findings
            .filter(item => item.code === 'PATH_ASSIGNMENT_WEAK')
            .map(({ code, refId }) => ({ code, refId })),
        unresolved: [],
        unclassified: [],
    });
});
