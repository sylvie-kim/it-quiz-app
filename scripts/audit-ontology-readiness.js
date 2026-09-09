const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { validateOntology } = require('../ontology-utils.js');
const ontologySchema = require('../ontology-schema.js');
const { makeStableId } = require('./bootstrap-ontology-registry.js');

const ALLOWED_FINDING_CODES = Object.freeze([
    'ENTITY_DUPLICATE_CANDIDATE',
    'ENTITY_TYPE_AMBIGUOUS',
    'PROPERTY_MISSING_OR_INVALID',
    'RELATION_AMBIGUOUS_OR_INVALID',
    'PROVENANCE_INSUFFICIENT',
    'PATH_ASSIGNMENT_WEAK',
    'COMPETENCY_QUESTION_UNANSWERED',
]);

const COMPETENCY_QUESTIONS = Object.freeze([
    {
        refId: 'cq-1',
        answered: data => validReviewedRelations(data).some(item => item.type === 'prerequisite_of'),
        observation: '검토된 선행 학습 관계가 없어 먼저 배울 용어를 답할 수 없습니다.',
        requiredPrework: 'prerequisite_of 관계의 판정 기준과 근거 출처를 정의합니다.',
        retest: '검토된 선행 관계를 추가한 뒤 cq-1 질의가 경로와 출처를 반환하는지 확인합니다.',
    },
    {
        refId: 'cq-2',
        answered: data => validReviewedRelations(data).some(item => item.type === 'contrasts_with'),
        observation: '검토된 비교 관계가 없어 혼동하기 쉬운 용어의 차이를 답할 수 없습니다.',
        requiredPrework: 'contrasts_with의 비교 기준과 양쪽 정의를 직접 뒷받침하는 근거를 정합니다.',
        retest: '검토된 비교 관계를 추가한 뒤 cq-2가 차이와 출처를 반환하는지 확인합니다.',
    },
    {
        refId: 'cq-3',
        answered: data => validReviewedRelations(data).some(item => ['used_with', 'runs_on'].includes(item.type)),
        observation: '검토된 함께 사용·실행 환경 관계가 없어 도구 조합과 이유를 답할 수 없습니다.',
        requiredPrework: 'used_with와 runs_on의 경계, 방향, 근거 기준을 정합니다.',
        retest: '검토된 관계를 추가한 뒤 cq-3가 연결 대상과 이유를 반환하는지 확인합니다.',
    },
    {
        refId: 'cq-4',
        answered: data => allTermsCovered(data) && learningPathsAreValid(data),
        observation: '학습 경로가 없어 개발 목표별 학습 순서를 답할 수 없습니다.',
        requiredPrework: '경로별 목표와 primary·supporting 포함 기준을 정의합니다.',
        retest: '전체 용어가 근거와 함께 경로에 배치된 뒤 cq-4가 순서를 반환하는지 확인합니다.',
    },
    {
        refId: 'cq-5',
        answered: data => validReviewedRelations(data).some(item => list(item.sourceRefs).length > 0),
        observation: '검토 기록과 출처가 있는 관계가 없어 연결 근거를 답할 수 없습니다.',
        requiredPrework: '관계 출처와 content-owner 검토 기록의 승격 절차를 정의합니다.',
        retest: '승인된 관계를 추가한 뒤 cq-5가 출처와 검토 기록을 반환하는지 확인합니다.',
    },
]);

function list(value) {
    return Array.isArray(value) ? value : [];
}

function relationValidation(data) {
    const relations = list(data.relations).filter(Boolean);
    const errorsByRelation = new Map(relations.map(relation => [relation, []]));
    const add = (relation, error) => errorsByRelation.get(relation).push(error);

    for (const error of validateOntology(data)) {
        if (String(error.code).startsWith('RELATION_') || error.code === 'DUPLICATE_ID') {
            for (const relation of relations.filter(item => item.id === error.refId)) add(relation, error);
            continue;
        }
        if (error.code === 'UNKNOWN_TERM') {
            for (const relation of relations.filter(item =>
                item.source === error.refId || item.target === error.refId)) add(relation, error);
            continue;
        }
        if (error.code === 'PREREQUISITE_CYCLE') {
            const cycleNodes = String(error.refId || '').split(' -> ').filter(Boolean);
            const cycleEdges = new Set(cycleNodes.slice(0, -1)
                .map((source, index) => `${source}\u0000${cycleNodes[index + 1]}`));
            for (const relation of relations.filter(item =>
                item.type === 'prerequisite_of'
                && cycleEdges.has(`${item.source}\u0000${item.target}`))) add(relation, error);
        }
    }
    return errorsByRelation;
}

function validReviewedRelations(data) {
    const errorsByRelation = relationValidation(data);
    return list(data.relations).filter(item =>
        item && item.status === 'REVIEWED' && errorsByRelation.get(item).length === 0);
}

function learningPathsAreValid(data) {
    const paths = list(data.learningPaths);
    if (!paths.length) return false;
    const registryIds = new Set(list(data.termRegistry).map(item => item && item.id));
    const pathIds = new Set();
    for (const pathItem of paths) {
        if (!pathItem || !pathItem.id || pathIds.has(pathItem.id)) return false;
        pathIds.add(pathItem.id);
        const primary = list(pathItem.primaryTermIds);
        const supporting = list(pathItem.supportingTermIds);
        const termIds = [...new Set([...primary, ...supporting])];
        if (primary.length < 4 || primary.length > 10 || termIds.length < 8 || termIds.length > 15) return false;
        if (termIds.some(termId => !registryIds.has(termId))) return false;
        if (termIds.some(termId => {
            const assessment = pathItem.fitAssessments && pathItem.fitAssessments[termId];
            return !assessment
                || !['strong', 'moderate', 'weak'].includes(assessment.fit)
                || typeof assessment.fitRationale !== 'string'
                || !assessment.fitRationale.trim();
        })) return false;
    }
    const pathErrorCodes = new Set([
        'UNKNOWN_PATH', 'TERM_PATH_REQUIRED', 'PATH_SIZE_INVALID',
        'PATH_FIT_REQUIRED', 'PATH_FIT_INVALID',
    ]);
    return !validateOntology(data).some(error => pathErrorCodes.has(error.code));
}

function allTermsCovered(data) {
    const covered = new Set(list(data.learningPaths).flatMap(item => [
        ...list(item && item.primaryTermIds),
        ...list(item && item.supportingTermIds),
    ]));
    return list(data.termRegistry).length > 0
        && list(data.termRegistry).every(item => item && covered.has(item.id));
}

function finding(code, refId, observation, requiredPrework, retest) {
    return { code, refId, observation, requiredPrework, retest };
}

function normalizeLabel(label) {
    return String(label || '').normalize('NFKC').toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
        .trim();
}

function duplicateFindings(terms) {
    const byLabel = new Map();
    for (const item of list(terms)) {
        if (!item || typeof item.term !== 'string') continue;
        for (const candidate of [item.term, ...list(item.aliases)]) {
            const normalized = normalizeLabel(candidate);
            if (!normalized) continue;
            if (!byLabel.has(normalized)) byLabel.set(normalized, new Set());
            byLabel.get(normalized).add(item.term);
        }
    }
    return [...byLabel.entries()]
        .filter(([, owners]) => owners.size > 1)
        .map(([normalized, owners]) => finding(
            'ENTITY_DUPLICATE_CANDIDATE',
            `label:${normalized}`,
            `정규화된 이름 또는 별칭 ${normalized}을 ${owners.size}개 레코드가 함께 사용합니다.`,
            '정본 이름과 별칭 규칙으로 같은 개체인지 별도 개체인지 판정합니다.',
            '별칭 병합 후 안정 ID가 하나인지 다시 검사합니다.',
        ));
}

function ambiguousTypeRecords(ontology, schema) {
    const termKind = schema.PROPERTY_DEFINITIONS && schema.PROPERTY_DEFINITIONS.termKind;
    const validKinds = new Set(termKind && list(termKind.values));
    return list(ontology.termRegistry).filter(item => !item || !validKinds.has(item.termKind));
}

function ambiguousTypeFindings(ontology, schema) {
    const ambiguous = ambiguousTypeRecords(ontology, schema);
    return ambiguous.map((item, index) => finding(
        'ENTITY_TYPE_AMBIGUOUS',
        item && item.id ? item.id : `registry:${index}:termKind`,
        `${item && item.label ? item.label : '알 수 없는 용어'}의 termKind가 없거나 허용값이 아니어서 실제 개체 종류를 판정할 수 없습니다.`,
        'concept, method, process, language, framework, service, tool, command, file, format, platform, event의 판별 기준을 정합니다.',
        '이 등록부 레코드에 유효한 termKind를 적용한 뒤 해당 refId가 감사에서 사라지는지 확인합니다.',
    ));
}

function propertyFindings(terms, ontology, schema) {
    const output = new Map();
    const definitions = schema.PROPERTY_DEFINITIONS || {};
    const termRequirements = list(schema.ENTITY_TYPES && schema.ENTITY_TYPES.term
        && schema.ENTITY_TYPES.term.required);
    const sourceByLabel = new Map(list(terms)
        .filter(item => item && typeof item.term === 'string')
        .map(item => [item.term, item]));
    const registryByLabel = new Map(list(ontology.termRegistry)
        .filter(item => item && typeof item.label === 'string')
        .map(item => [item.label, item]));

    function add(refId, observation) {
        if (output.has(refId)) return;
        output.set(refId, finding(
            'PROPERTY_MISSING_OR_INVALID',
            refId,
            observation,
            '속성 사전의 자료형·필수값·정본 소유 규칙에 맞게 원본 또는 등록부 값을 수정합니다.',
            '같은 입력으로 감사를 다시 실행해 해당 refId가 사라지는지 확인합니다.',
        ));
    }

    function invalidByDefinition(value, definition) {
        if (!definition) return false;
        if (definition.required && (value === undefined || value === null || value === '')) return true;
        if (value === undefined || value === null) return false;
        if (definition.type === 'string') return typeof value !== 'string' || !value.trim();
        if (definition.type === 'string[]') {
            return !Array.isArray(value)
                || value.some(item => typeof item !== 'string' || !item.trim())
                || (definition.minItems && value.length < definition.minItems);
        }
        if (definition.type === 'enum') return !list(definition.values).includes(value);
        return false;
    }

    for (const source of list(terms)) {
        const label = source && source.term;
        if (typeof label !== 'string' || !label.trim()) {
            add('source:unknown:label', '정본 용어 이름이 비어 있거나 문자열이 아닙니다.');
            continue;
        }
        if (invalidByDefinition(source.definition, definitions.definition)) {
            add(`source:${label}:definition`, `${label}의 필수 definition이 비어 있거나 문자열이 아닙니다.`);
        }
        if (source.aliases !== undefined && invalidByDefinition(source.aliases, definitions.aliases)) {
            add(`source:${label}:aliases`, `${label}의 aliases가 비어 있지 않은 문자열 배열이 아닙니다.`);
        }
        if (!registryByLabel.has(label)) {
            add(`source:${label}:registry`, `${label}에 대응하는 온톨로지 등록부 레코드가 없습니다.`);
        }
    }

    for (const registryItem of list(ontology.termRegistry)) {
        const label = registryItem && registryItem.label;
        const refLabel = typeof label === 'string' && label ? label : 'unknown';
        for (const propertyName of termRequirements) {
            if (propertyName === 'id' || propertyName === 'entityType' || propertyName === 'label' || propertyName === 'topicIds') continue;
            if (invalidByDefinition(registryItem && registryItem[propertyName], definitions[propertyName])) {
                add(`registry:${refLabel}:${propertyName}`, `${refLabel}의 필수 ${propertyName} 값이 속성 계약과 맞지 않습니다.`);
            }
        }
        if (!registryItem || typeof registryItem.id !== 'string'
            || !/^term-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(registryItem.id)) {
            add(`registry:${refLabel}:id`, `${refLabel}의 등록부 ID 형식이 안정 ID 계약과 맞지 않습니다.`);
        } else if (typeof label === 'string' && label) {
            try {
                if (registryItem.id !== makeStableId(label)) {
                    add(`registry:${refLabel}:id`, `${refLabel}의 등록부 ID가 정본 라벨에서 생성한 안정 ID와 다릅니다.`);
                }
            } catch {
                add(`registry:${refLabel}:id`, `${refLabel}의 안정 ID를 정본 라벨과 명시 override로 재현할 수 없습니다.`);
            }
        }
        if (!registryItem || registryItem.entityType !== 'term') {
            add(`registry:${refLabel}:entityType`, `${refLabel}의 entityType이 term이 아닙니다.`);
        }
        if (typeof label !== 'string' || !label.trim()) {
            add(`registry:${refLabel}:label`, '등록부 label이 비어 있거나 문자열이 아닙니다.');
        }
        if (!Array.isArray(registryItem && registryItem.topicIds) || !registryItem.topicIds.length
            || registryItem.topicIds.some(topicId => typeof topicId !== 'string' || !topicId.trim())) {
            add(`registry:${refLabel}:topicIds`, `${refLabel}의 topicIds가 하나 이상의 문자열 ID를 갖지 않습니다.`);
        }
        if (typeof label === 'string' && label && !sourceByLabel.has(label)) {
            add(`registry:${refLabel}:source`, `${refLabel}의 정본 terms-data.js 레코드를 찾을 수 없습니다.`);
        }
    }

    return [...output.values()];
}

function relationFindings(ontology) {
    const relations = list(ontology.relations).filter(Boolean);
    const errorsByRelation = relationValidation(ontology);
    return relations
        .filter(relation => errorsByRelation.get(relation).length > 0)
        .map(relation => relation.id)
        .sort()
        .map(refId => finding(
        'RELATION_AMBIGUOUS_OR_INVALID',
        refId,
        '관계의 유형·방향·개체 범위 또는 검토 계약을 통과하지 못했습니다.',
        '관계의 domain, range, 방향, 대칭성, 금지 조합을 검토합니다.',
        '관계를 수정한 뒤 validateOntology가 해당 관계 오류를 반환하지 않는지 확인합니다.',
    ));
}

function provenanceFindings(ontology) {
    const errorsByRelation = relationValidation(ontology);
    return list(ontology.relations)
        .filter(item => item && (item.status !== 'REVIEWED' || errorsByRelation.get(item).some(error => [
            'RELATION_STATUS_INVALID',
            'RELATION_RATIONALE_REQUIRED',
            'RELATION_SOURCE_REQUIRED',
            'RELATION_SOURCE_INVALID',
            'RELATION_REVIEWER_ROLE_REQUIRED',
            'RELATION_REVIEW_RECORD_REQUIRED',
            'RELATION_REVIEW_DATE_REQUIRED',
        ].includes(error.code))))
        .map(item => finding(
            'PROVENANCE_INSUFFICIENT',
            item.id,
            '제품 관계에 content-owner 검토 기록 또는 직접 근거가 부족합니다.',
            '관계 사실과 방향을 직접 뒷받침하는 허용 출처와 검토 기록을 준비합니다.',
            '검토 완료 뒤 REVIEWED 상태와 출처 계약을 다시 검사합니다.',
        ));
}

function weakPathFindings(ontology) {
    const output = [];
    for (const pathItem of list(ontology.learningPaths)) {
        const ids = [...new Set([
            ...list(pathItem && pathItem.primaryTermIds),
            ...list(pathItem && pathItem.supportingTermIds),
        ])];
        for (const termId of ids) {
            const assessment = pathItem.fitAssessments && pathItem.fitAssessments[termId];
            if (!assessment || assessment.fit !== 'weak') continue;
            output.push(finding(
                'PATH_ASSIGNMENT_WEAK',
                `${pathItem.id}:${termId}`,
                assessment.fitRationale,
                '독립 경로 추가 또는 현재 경로의 포함·제외 기준 보완이 필요합니다.',
                '경로 정의를 보완한 뒤 같은 용어의 적합도를 다시 평가합니다.',
            ));
        }
    }
    return output;
}

function competencyFindings(ontology) {
    return COMPETENCY_QUESTIONS
        .filter(question => !question.answered(ontology))
        .map(question => finding(
            'COMPETENCY_QUESTION_UNANSWERED',
            question.refId,
            question.observation,
            question.requiredPrework,
            question.retest,
        ));
}

function count(findings, code) {
    return findings.filter(item => item.code === code).length;
}

function createReadinessAudit({
    phase,
    terms,
    ontology,
    inputCommit,
    inputSha256,
    schema = ontologySchema,
}) {
    if (!['baseline', 'experimentA'].includes(phase)) throw new Error(`Unknown audit phase: ${phase}`);
    const findings = [
        ...duplicateFindings(terms),
        ...ambiguousTypeFindings(ontology, schema),
        ...propertyFindings(terms, ontology, schema),
        ...relationFindings(ontology),
        ...provenanceFindings(ontology),
        ...weakPathFindings(ontology),
        ...competencyFindings(ontology),
    ].sort((left, right) => left.code.localeCompare(right.code) || left.refId.localeCompare(right.refId));

    return {
        phase,
        inputCommit,
        inputSha256: { termsData: inputSha256.termsData, ontologyData: inputSha256.ontologyData },
        summary: {
            entities: list(ontology.termRegistry).length,
            duplicateCandidates: count(findings, 'ENTITY_DUPLICATE_CANDIDATE'),
            ambiguousEntityTypes: ambiguousTypeRecords(ontology, schema).length,
            propertyIssues: count(findings, 'PROPERTY_MISSING_OR_INVALID'),
            invalidRelations: count(findings, 'RELATION_AMBIGUOUS_OR_INVALID'),
            insufficientProvenance: count(findings, 'PROVENANCE_INSUFFICIENT'),
            weakPathAssignments: count(findings, 'PATH_ASSIGNMENT_WEAK'),
            unansweredCompetencyQuestions: count(findings, 'COMPETENCY_QUESTION_UNANSWERED'),
        },
        findings,
    };
}

function compareReadinessAudits(baseline, experiment) {
    const key = item => `${item.code}\u0000${item.refId}`;
    const project = item => ({ code: item.code, refId: item.refId });
    const unique = findings => new Map(list(findings).map(item => [key(item), project(item)]));
    const baselineByKey = unique(baseline.findings);
    const experimentByKey = unique(experiment.findings);
    const sort = items => items.sort((left, right) =>
        left.code.localeCompare(right.code) || left.refId.localeCompare(right.refId));

    const preExisting = [];
    const resolvedByPrework = [];
    const introducedByForcedAssignment = [];
    const unresolved = [];
    const unclassified = [];

    for (const [findingKey, item] of baselineByKey) {
        if (experimentByKey.has(findingKey)) preExisting.push(item);
        else resolvedByPrework.push(item);
    }
    for (const [findingKey, item] of experimentByKey) {
        if (baselineByKey.has(findingKey)) continue;
        if (item.code === 'PATH_ASSIGNMENT_WEAK') introducedByForcedAssignment.push(item);
        else unresolved.push(item);
    }
    return {
        preExisting: sort(preExisting),
        resolvedByPrework: sort(resolvedByPrework),
        introducedByForcedAssignment: sort(introducedByForcedAssignment),
        unresolved: sort(unresolved),
        unclassified: sort(unclassified),
    };
}

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function auditCurrentRepository(phase) {
    const root = path.join(__dirname, '..');
    const termsPath = path.join(root, 'terms-data.js');
    const ontologyPath = path.join(root, 'ontology-data.js');
    return createReadinessAudit({
        phase,
        terms: require(termsPath),
        ontology: require(ontologyPath),
        inputCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
        inputSha256: {
            termsData: sha256(termsPath),
            ontologyData: sha256(ontologyPath),
        },
    });
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === '--compare') {
        const baseline = JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf8'));
        const experiment = JSON.parse(fs.readFileSync(path.resolve(args[2]), 'utf8'));
        process.stdout.write(`${JSON.stringify(compareReadinessAudits(baseline, experiment), null, 2)}\n`);
    } else if (args[0] === '--phase') {
        process.stdout.write(`${JSON.stringify(auditCurrentRepository(args[1]), null, 2)}\n`);
    } else {
        process.stderr.write('Usage: audit-ontology-readiness.js --phase <baseline|experimentA> | --compare <baseline.json> <experiment.json>\n');
        process.exitCode = 1;
    }
}

module.exports = {
    ALLOWED_FINDING_CODES,
    createReadinessAudit,
    compareReadinessAudits,
    auditCurrentRepository,
};
