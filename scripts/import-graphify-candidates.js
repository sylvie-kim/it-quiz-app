const fs = require('node:fs');
const path = require('node:path');

const terms = require('../terms-data.js');
const ontology = require('../ontology-data.js');
const { getTermAliases, normalizeTermName } = require('../terms-utils.js');

const GRAPHIFY_RELATION_MAP = Object.freeze({
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
});

function validateGraph(graph) {
    if (!graph || typeof graph !== 'object' || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
        throw new TypeError('expected JSON object with nodes and links arrays');
    }
}

function indexTerms(termRegistry) {
    const aliasesToTerms = new Map();
    const ambiguousAliases = new Set();
    const termsByName = new Map(terms.map(item => [normalizeTermName(item.term), item]));

    for (const term of termRegistry) {
        if (!term || term.entityType !== 'term' || typeof term.id !== 'string' || typeof term.label !== 'string') continue;

        const sourceTerm = termsByName.get(normalizeTermName(term.label));
        const aliases = sourceTerm ? getTermAliases(sourceTerm) : getTermAliases(term.label);
        for (const alias of aliases) {
            const existing = aliasesToTerms.get(alias);
            if (!existing) aliasesToTerms.set(alias, term);
            if (existing && existing.id !== term.id) ambiguousAliases.add(alias);
        }
    }

    return { aliasesToTerms, ambiguousAliases };
}

function getNodeId(value) {
    return value && typeof value === 'object' ? value.id : value;
}

function convertGraphifyGraph(graph, termRegistry = ontology.termRegistry) {
    validateGraph(graph);
    if (!Array.isArray(termRegistry)) throw new TypeError('expected term registry array');

    const graphNodes = new Map();
    for (const node of graph.nodes) {
        if (node && typeof node.id === 'string' && typeof node.label === 'string') {
            graphNodes.set(node.id, node);
        }
    }

    const { aliasesToTerms, ambiguousAliases } = indexTerms(termRegistry);
    const candidates = [];
    const rejected = [];

    graph.links.forEach((link, index) => {
        const sourceNode = graphNodes.get(getNodeId(link && link.source));
        const targetNode = graphNodes.get(getNodeId(link && link.target));
        const sourceAlias = sourceNode && normalizeTermName(sourceNode.label);
        const targetAlias = targetNode && normalizeTermName(targetNode.label);
        const source = sourceAlias && aliasesToTerms.get(sourceAlias);
        const target = targetAlias && aliasesToTerms.get(targetAlias);
        const type = link && Object.hasOwn(GRAPHIFY_RELATION_MAP, link.relation)
            ? GRAPHIFY_RELATION_MAP[link.relation]
            : null;

        if (ambiguousAliases.has(sourceAlias) || ambiguousAliases.has(targetAlias)) {
            rejected.push({ linkIndex: index, reason: 'AMBIGUOUS_TERM_OR_ALIAS' });
            return;
        }

        if (!source || !target || !type) {
            rejected.push({ linkIndex: index, reason: 'UNKNOWN_TERM_OR_RELATION' });
            return;
        }

        const status = link.confidence === 'EXTRACTED' ? 'EXTRACTED' : 'INFERRED';
        candidates.push({
            id: `candidate-${source.id}-${type}-${target.id}`,
            source: source.id,
            target: target.id,
            type,
            status,
            published: false,
            reviewedAt: null,
            sourceFile: typeof link.source_file === 'string' ? path.basename(link.source_file) : null,
            confidenceScore: typeof link.confidence_score === 'number' ? link.confidence_score : null,
        });
    });

    return {
        candidates,
        rejected,
        stats: {
            candidates: candidates.length,
            rejected: rejected.length,
            extracted: candidates.filter(candidate => candidate.status === 'EXTRACTED').length,
            inferred: candidates.filter(candidate => candidate.status === 'INFERRED').length,
            published: 0,
        },
    };
}

function runCli(argv) {
    if (argv.length !== 3) throw new Error('provide one Graphify JSON input path');
    const graph = JSON.parse(fs.readFileSync(argv[2], 'utf8'));
    return convertGraphifyGraph(graph);
}

if (require.main === module) {
    try {
        process.stdout.write(`${JSON.stringify(runCli(process.argv), null, 2)}\n`);
    } catch (error) {
        process.stderr.write(`Error: ${error.message}\n`);
        process.exitCode = 1;
    }
}

module.exports = { GRAPHIFY_RELATION_MAP, convertGraphifyGraph };
