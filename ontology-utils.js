(function exposeOntologyUtilities(root) {
    const schema = typeof module === 'object' && module.exports
        ? require('./ontology-schema.js')
        : root.ITQuizOntologySchema;
    const content = typeof module === 'object' && module.exports
        ? require('./quiz-content.js')
        : null;

    function resolveGlossarySearch() {
        const quizContent = content || root.ITQuizContent;
        return quizContent && typeof quizContent.searchGlossaryTerms === 'function'
            ? quizContent.searchGlossaryTerms
            : null;
    }

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

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    function isIsoDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }

    function isPrivateIpv4(host) {
        const octets = host.split('.').map(Number);
        if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
        return octets[0] === 0
            || octets[0] === 10
            || octets[0] === 127
            || (octets[0] === 169 && octets[1] === 254)
            || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
            || (octets[0] === 192 && octets[1] === 168);
    }

    function mappedIpv4(host) {
        const match = /^::ffff:(.+)$/i.exec(host);
        if (!match) return '';
        if (match[1].includes('.')) return match[1];

        const hexParts = match[1].split(':');
        if (hexParts.length !== 2 || hexParts.some(part => !/^[0-9a-f]{1,4}$/i.test(part))) return '';
        const [high, low] = hexParts.map(part => parseInt(part, 16));
        return [high >> 8, high & 255, low >> 8, low & 255].join('.');
    }

    function isPrivateHostname(hostname) {
        const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
        if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
        if (host === '::1' || /^f[cd][0-9a-f:]*$/i.test(host) || /^fe[89ab][0-9a-f:]*$/i.test(host)) return true;

        const mapped = mappedIpv4(host);
        return isPrivateIpv4(mapped || host);
    }

    function isPublicHttpUrl(value) {
        if (!isNonEmptyString(value)) return false;
        try {
            const url = new URL(value);
            return (url.protocol === 'http:' || url.protocol === 'https:')
                && !url.username
                && !url.password
                && !isPrivateHostname(url.hostname);
        } catch {
            return false;
        }
    }

    function isValidSourceRef(source, index) {
        if (!source || typeof source !== 'object' || !isNonEmptyString(source.ref)) return false;
        if (source.kind === 'official-document') return isPublicHttpUrl(source.ref);
        if (source.kind === 'term-definition') return index.termsById.has(source.ref);
        if (source.kind === 'reviewed-candidate') return /^candidate-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.ref);
        return false;
    }

    function addError(errors, code, message, refId) {
        errors.push({ code, message, refId });
    }

    function collectEntities(data) {
        const entities = new Map();
        for (const item of [...list(data.topics), ...list(data.termRegistry), ...list(data.learningPaths), ...list(data.sources)]) {
            if (item && item.id) entities.set(item.id, item);
        }
        return entities;
    }

    function buildOntologyIndex(data = {}) {
        const termsById = new Map(list(data.termRegistry).filter(item => item && item.id).map(item => [item.id, item]));
        const topicsById = new Map(list(data.topics).filter(item => item && item.id).map(item => [item.id, item]));
        const pathsById = new Map(list(data.learningPaths).filter(item => item && item.id).map(item => [item.id, item]));
        const relationsByTermId = new Map();
        const pathsByTermId = new Map();

        function append(index, key, value) {
            if (!index.has(key)) index.set(key, []);
            index.get(key).push(value);
        }

        for (const relation of list(data.relations)) {
            if (!relation) continue;
            if (termsById.has(relation.source)) append(relationsByTermId, relation.source, relation);
            if (termsById.has(relation.target) && relation.target !== relation.source) append(relationsByTermId, relation.target, relation);
        }

        for (const path of list(data.learningPaths)) {
            if (!path) continue;
            for (const termId of new Set([...list(path.primaryTermIds), ...list(path.supportingTermIds)])) {
                if (termsById.has(termId)) append(pathsByTermId, termId, path);
            }
        }

        return { termsById, topicsById, pathsById, relationsByTermId, pathsByTermId };
    }

    function detectPrerequisiteCycle(relations = []) {
        const adjacency = new Map();
        for (const relation of list(relations)) {
            if (!relation || relation.type !== 'prerequisite_of' || !relation.source || !relation.target) continue;
            if (!adjacency.has(relation.source)) adjacency.set(relation.source, []);
            adjacency.get(relation.source).push(relation.target);
            if (!adjacency.has(relation.target)) adjacency.set(relation.target, []);
        }

        const colors = new Map();
        const trail = [];

        function visit(id) {
            colors.set(id, 'gray');
            trail.push(id);
            for (const next of adjacency.get(id) || []) {
                if (colors.get(next) === 'gray') return [...trail.slice(trail.indexOf(next)), next];
                if (colors.get(next) !== 'black') {
                    const cycle = visit(next);
                    if (cycle.length) return cycle;
                }
            }
            trail.pop();
            colors.set(id, 'black');
            return [];
        }

        for (const id of adjacency.keys()) {
            if (!colors.has(id)) {
                const cycle = visit(id);
                if (cycle.length) return cycle;
            }
        }
        return [];
    }

    function validateOntology(data = {}) {
        const errors = [];
        const collections = [data.topics, data.termRegistry, data.relations, data.learningPaths, data.sources];
        const ids = new Set();
        const index = buildOntologyIndex(data);
        const entities = collectEntities(data);

        for (const collection of collections) {
            for (const item of list(collection)) {
                if (!item || !item.id) continue;
                if (ids.has(item.id)) addError(errors, 'DUPLICATE_ID', 'ID는 온톨로지 전체에서 고유해야 합니다.', item.id);
                ids.add(item.id);
            }
        }

        for (const term of list(data.termRegistry)) {
            if (!term) continue;
            const topicIds = list(term.topicIds);
            if (!topicIds.length) addError(errors, 'TERM_TOPIC_REQUIRED', '용어에는 하나 이상의 주제가 필요합니다.', term.id);
            for (const topicId of topicIds) {
                if (!index.topicsById.has(topicId)) addError(errors, 'UNKNOWN_TOPIC', '용어가 존재하지 않는 주제를 참조합니다.', topicId);
            }
        }

        for (const relation of list(data.relations)) {
            if (!relation) continue;
            const relationId = relation.id;
            const relationType = schema.RELATION_TYPES[relation.type];
            const sourceEntity = entities.get(relation.source);
            const targetEntity = entities.get(relation.target);

            if (!relationType) addError(errors, 'RELATION_TYPE_INVALID', '허용되지 않은 관계 유형입니다.', relationId);
            if (!schema.RELATION_STATUSES.includes(relation.status)) addError(errors, 'RELATION_STATUS_INVALID', '허용되지 않은 관계 상태입니다.', relationId);
            if (!sourceEntity) addError(errors, 'UNKNOWN_TERM', '관계의 출발 용어를 찾을 수 없습니다.', relation.source || relationId);
            if (!targetEntity) addError(errors, 'UNKNOWN_TERM', '관계의 도착 용어를 찾을 수 없습니다.', relation.target || relationId);
            if (relation.source && relation.source === relation.target) addError(errors, 'RELATION_SELF_LOOP', '관계는 자기 자신을 가리킬 수 없습니다.', relationId);
            if (relationType && sourceEntity && !relationType.domain.includes(sourceEntity.entityType)) {
                addError(errors, 'RELATION_DOMAIN_INVALID', '관계의 출발 개체 유형이 허용 범위를 벗어났습니다.', relationId);
            }
            if (relationType && targetEntity && !relationType.range.includes(targetEntity.entityType)) {
                addError(errors, 'RELATION_RANGE_INVALID', '관계의 도착 개체 유형이 허용 범위를 벗어났습니다.', relationId);
            }

            if (relation.status === 'REVIEWED') {
                if (!isNonEmptyString(relation.rationale)) addError(errors, 'RELATION_RATIONALE_REQUIRED', '검토 완료 관계에는 근거 설명이 필요합니다.', relationId);
                if (!Array.isArray(relation.sourceRefs) || !relation.sourceRefs.length) {
                    addError(errors, 'RELATION_SOURCE_REQUIRED', '검토 완료 관계에는 하나 이상의 근거 출처가 필요합니다.', relationId);
                } else if (relation.sourceRefs.some(source => !isValidSourceRef(source, index))) {
                    addError(errors, 'RELATION_SOURCE_INVALID', '관계 근거 출처의 유형과 참조값이 유효하지 않습니다.', relationId);
                }
                if (relation.reviewedByRole !== 'content-owner') {
                    addError(errors, 'RELATION_REVIEWER_ROLE_REQUIRED', '검토 완료 관계의 책임자는 content-owner여야 합니다.', relationId);
                }
                if (!isNonEmptyString(relation.reviewRecordId)) addError(errors, 'RELATION_REVIEW_RECORD_REQUIRED', '검토 완료 관계에는 검토 기록 ID가 필요합니다.', relationId);
                if (!isIsoDate(relation.reviewedAt)) addError(errors, 'RELATION_REVIEW_DATE_REQUIRED', '검토 완료 관계에는 ISO 날짜 검토일이 필요합니다.', relationId);
            }
        }

        for (const path of list(data.learningPaths)) {
            if (!path) continue;
            const termIds = [...new Set([...list(path.primaryTermIds), ...list(path.supportingTermIds)])];
            if (termIds.length < 8 || termIds.length > 15) addError(errors, 'PATH_SIZE_INVALID', '학습 경로는 8~15개 용어를 포함해야 합니다.', path.id);
            for (const termId of termIds) {
                if (!index.termsById.has(termId)) addError(errors, 'UNKNOWN_TERM', '학습 경로가 존재하지 않는 용어를 참조합니다.', termId);
                const assessment = path.fitAssessments && path.fitAssessments[termId];
                if (!assessment || !isNonEmptyString(assessment.fitRationale)) {
                    addError(errors, 'PATH_FIT_REQUIRED', '경로의 모든 용어에는 배치 근거가 필요합니다.', termId);
                }
                if (assessment && !['strong', 'moderate', 'weak'].includes(assessment.fit)) {
                    addError(errors, 'PATH_FIT_INVALID', '경로 적합도는 strong, moderate, weak 중 하나여야 합니다.', termId);
                }
            }
        }

        for (const term of list(data.termRegistry)) {
            if (term && term.id && !index.pathsByTermId.has(term.id)) {
                addError(errors, 'TERM_PATH_REQUIRED', '용어는 하나 이상의 학습 경로에 포함되어야 합니다.', term.id);
            }
        }

        const cycle = detectPrerequisiteCycle(data.relations);
        if (cycle.length) addError(errors, 'PREREQUISITE_CYCLE', '선행 학습 관계에 순환이 있습니다.', cycle.join(' -> '));

        return errors;
    }

    function getLearningPath(data, pathId) {
        const path = list(data && data.learningPaths).find(item => item.id === pathId);
        if (!path) throw new Error(`Unknown learning path: ${pathId}`);
        return path;
    }

    function getTermConnections(data, termId, { reviewedOnly = true } = {}) {
        if (!list(data && data.termRegistry).some(item => item.id === termId)) {
            throw new Error(`Unknown term: ${termId}`);
        }
        return list(data && data.relations).filter(relation => {
            const connected = relation.source === termId || relation.target === termId;
            return connected && (!reviewedOnly || relation.status === 'REVIEWED');
        });
    }

    function getTopicGraph(data, topicId) {
        const topic = list(data && data.topics).find(item => item.id === topicId);
        if (!topic) throw new Error(`Unknown topic: ${topicId}`);
        const termIds = list(data.termRegistry)
            .filter(item => list(item.topicIds).includes(topicId))
            .map(item => item.id);
        const termIdSet = new Set(termIds);
        return {
            topic,
            terms: list(data.termRegistry).filter(item => termIdSet.has(item.id)),
            relations: list(data.relations).filter(relation =>
                relation.status === 'REVIEWED'
                && termIdSet.has(relation.source)
                && termIdSet.has(relation.target)),
        };
    }

    function getTermsForQuiz(data, pathId, allTerms) {
        const path = getLearningPath(data, pathId);
        const ontologyById = new Map(list(data.termRegistry).map(item => [item.id, item]));
        const sourceByName = new Map(list(allTerms).map(item => [item.term, item]));
        return list(path.quizTermIds).map(termId => {
            const registryItem = ontologyById.get(termId);
            const sourceTerm = registryItem && sourceByName.get(registryItem.label);
            if (!sourceTerm) throw new Error(`Unknown quiz term: ${termId}`);
            return sourceTerm;
        });
    }

    function searchOntologyTerms({ terms, termRegistry, pathsByTermId, query } = {}) {
        const registryByLabel = new Map(list(termRegistry).map(item => [item && item.label, item]));
        const searchGlossaryTerms = resolveGlossarySearch();
        const matches = searchGlossaryTerms
            ? searchGlossaryTerms(list(terms), query)
            : [];

        return matches.map(term => {
            const registry = registryByLabel.get(term.term);
            if (!registry) return null;
            const paths = pathsByTermId instanceof Map ? pathsByTermId.get(registry.id) || [] : [];
            const pathIds = paths.map(path => typeof path === 'string' ? path : path.id).filter(Boolean);
            return {
                ...term,
                id: registry.id,
                label: registry.label,
                topicIds: [...list(registry.topicIds)],
                primaryTopicId: list(registry.topicIds)[0] || '',
                pathIds,
            };
        }).filter(Boolean);
    }

    function diagnosePathQuality(data = {}) {
        const termIds = new Set(list(data.termRegistry).map(item => item && item.id));
        const covered = new Set();
        const weakAssignments = [];
        const pathsOverCapacity = [];
        const pathIdsByTerm = new Map();
        const reviewedRelationIds = new Set(list(data.relations)
            .filter(item => item && item.status === 'REVIEWED')
            .map(item => item.id));
        const pathsWithoutReviewedRelations = [];

        for (const path of list(data.learningPaths)) {
            if (!path) continue;
            const pathTermIds = [...new Set([
                ...list(path.primaryTermIds),
                ...list(path.supportingTermIds),
            ])];
            if (pathTermIds.length > 15) pathsOverCapacity.push({ pathId: path.id, termCount: pathTermIds.length });
            if (!list(path.relationIds).some(id => reviewedRelationIds.has(id))) {
                pathsWithoutReviewedRelations.push(path.id);
            }
            for (const termId of pathTermIds) {
                if (termIds.has(termId)) covered.add(termId);
                if (!pathIdsByTerm.has(termId)) pathIdsByTerm.set(termId, []);
                pathIdsByTerm.get(termId).push(path.id);
                const assessment = path.fitAssessments && path.fitAssessments[termId];
                if (assessment && assessment.fit === 'weak') {
                    weakAssignments.push({
                        pathId: path.id,
                        termId,
                        fitRationale: assessment.fitRationale,
                    });
                }
            }
        }

        const termsRepeatedAcrossPaths = [...pathIdsByTerm.entries()]
            .filter(([, pathIds]) => pathIds.length > 3)
            .map(([termId, pathIds]) => ({ termId, pathIds }));

        return {
            coveredTerms: covered.size,
            weakAssignments,
            pathsOverCapacity,
            termsRepeatedAcrossPaths,
            pathsWithoutReviewedRelations,
        };
    }

    const utilities = {
        ERROR_CODES,
        validateOntology,
        buildOntologyIndex,
        detectPrerequisiteCycle,
        diagnosePathQuality,
        getLearningPath,
        getTermConnections,
        getTopicGraph,
        getTermsForQuiz,
        searchOntologyTerms,
    };
    root.ITQuizOntologyUtils = utilities;
    if (typeof module === 'object' && module.exports) module.exports = utilities;
})(typeof globalThis !== 'undefined' ? globalThis : window);
