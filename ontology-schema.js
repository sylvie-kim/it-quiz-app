(function exposeOntologySchema(root) {
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
        termKind: {
            type: 'enum',
            values: [
                'concept', 'method', 'process', 'language', 'framework', 'service',
                'tool', 'command', 'file', 'format', 'platform', 'event',
            ],
            required: false,
            owner: 'ontology-data.js',
        },
        fit: { type: 'enum', values: ['strong', 'moderate', 'weak'], owner: 'ontology-data.js' },
        fitRationale: { type: 'string', minLength: 1, owner: 'ontology-data.js' },
    };

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

    const RELATION_STATUSES = ['EXTRACTED', 'INFERRED', 'REVIEWED', 'REJECTED', 'SUPERSEDED'];

    const schema = { ENTITY_TYPES, PROPERTY_DEFINITIONS, RELATION_TYPES, RELATION_STATUSES };
    root.ITQuizOntologySchema = schema;
    if (typeof module === 'object' && module.exports) module.exports = schema;
})(typeof globalThis !== 'undefined' ? globalThis : window);
