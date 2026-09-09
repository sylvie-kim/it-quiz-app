// 정의문 기반 관계 후보 추출기
//
// 정본 정의(`terms-data.js`)가 다른 용어를 실제로 언급하고, 그 문장이 관계 유형과
// 방향을 직접 뒷받침할 때만 후보를 만든다. 결과는 항상 `INFERRED`이며 제품 데이터가
// 아니다. 콘텐츠 책임자가 검토 패킷에서 승인한 뒤에만 사람이 `ontology-data.js`로 옮긴다.

const terms = require('../terms-data.js');
const ontology = require('../ontology-data.js');
const { getTermAliases, normalizeTermName } = require('../terms-utils.js');

// 문장이 이 표현을 담고 있으면 해당 관계로 본다. 위에서부터 먼저 걸리는 하나만 쓴다.
// 방향은 전부 source(정의의 주인) -> target(정의문에 언급된 용어)이다.
const PATTERNS = Object.freeze([
    { type: 'runs_on', cues: ['위에 구축된', '위에 구축', '기반으로 한', '기반의', '기반', '환경에서 실행', '밖에서 실행할 수 있게'] },
    { type: 'implements', cues: ['을 구현', '를 구현', '구현하여', '준수하는', '따르는'] },
    { type: 'produces', cues: ['생성하는', '만들어 내는', '만드는', '생성해'] },
    { type: 'deploys_to', cues: ['배포하는', '배포와', '공개하는'] },
    { type: 'part_of', cues: ['의 한 부분', '구성 요소', '구성요소', '포함하는'] },
    { type: 'is_a', cues: ['대표적입니다', '등이 대표적'], reverse: true },
    { type: 'is_a', cues: ['의 일종', '중 하나로', '언어로', '형식입니다'] },
    { type: 'used_with', cues: ['함께 사용', '와 함께', '과 함께', '이용해', '사용하여', '사용해', '이용하여', '연결해', '연결하는'] },
    { type: 'contrasts_with', cues: ['대신', '반면', '와 달리', '과 달리', '사용하지 않고'] },
]);

// 너무 흔해서 언급만으로 관계를 주장할 수 없는 용어. 후보에서 제외한다.
const TOO_GENERIC = new Set([
    'term-interface', 'term-ui', 'term-api', 'term-object', 'term-module', 'term-execution',
    'term-runtime', 'term-library', 'term-framework', 'term-i-o', 'term-token', 'term-tree',
    'term-component', 'term-rendering', 'term-protocol', 'term-cli', 'term-branch', 'term-fetch',
    'term-merge', 'term-native', 'term-markup', 'term-console', 'term-sdk',
]);

function buildAliasIndex(termRegistry) {
    const byAlias = new Map();
    const ambiguous = new Set();
    const sourceByName = new Map(terms.map(item => [normalizeTermName(item.term), item]));

    for (const record of termRegistry) {
        const sourceTerm = sourceByName.get(normalizeTermName(record.label));
        const aliases = sourceTerm ? getTermAliases(sourceTerm) : getTermAliases(record.label);
        for (const alias of aliases) {
            if (String(alias).length < 3) continue; // 2글자 이하 별칭은 오탐이 많다
            const existing = byAlias.get(alias);
            if (!existing) byAlias.set(alias, record);
            else if (existing.id !== record.id) ambiguous.add(alias);
        }
    }
    for (const alias of ambiguous) byAlias.delete(alias);
    return byAlias;
}

function splitSentences(text) {
    return String(text).split(/(?<=[.。！?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

function classify(sentence) {
    for (const { type, cues, reverse } of PATTERNS) {
        if (cues.some(cue => sentence.includes(cue))) return { type, reverse: Boolean(reverse) };
    }
    return null;
}

// 정의문 표현만으로는 유형을 잘못 고르기 쉬운 조합을 대상 용어의 종류로 교정한다.
const PRODUCT_KINDS = new Set(['framework', 'tool', 'platform', 'service']);

function refine(type, targetKind, sourceKind) {
    // 제품이 언어를 "만든다"고 읽히면 실제로는 그 언어 위에서 동작한다는 뜻이다.
    if (type === 'produces' && targetKind === 'language' && PRODUCT_KINDS.has(sourceKind)) return 'runs_on';
    if (type === 'deploys_to' && targetKind === 'language') return 'used_with';
    if (type === 'runs_on' && targetKind === 'concept') return 'implements';
    return type;
}

function extract() {
    const registry = ontology.termRegistry;
    const byAlias = buildAliasIndex(registry);
    const defByLabel = new Map(terms.map(t => [normalizeTermName(t.term), t.definition]));
    const aliasList = [...byAlias.keys()].sort((a, b) => b.length - a.length); // 긴 이름 우선

    const candidates = [];
    const seen = new Set();
    const skipped = [];

    for (const record of registry) {
        const definition = defByLabel.get(normalizeTermName(record.label));
        if (!definition) continue;

        for (const sentence of splitSentences(definition)) {
            const classified = classify(sentence);
            if (!classified) continue;

            const normalizedSentence = normalizeTermName(sentence);
            for (const alias of aliasList) {
                if (!normalizedSentence.includes(alias)) continue;
                const target = byAlias.get(alias);
                if (!target || target.id === record.id) continue;
                if (TOO_GENERIC.has(target.id)) { skipped.push({ from: record.id, to: target.id, reason: 'TARGET_TOO_GENERIC' }); continue; }

                const type = refine(classified.type, target.termKind, record.termKind);
                const [sourceId, targetId] = classified.reverse
                    ? [target.id, record.id]
                    : [record.id, target.id];
                const key = `${sourceId}|${type}|${targetId}`;
                if (seen.has(key)) continue;
                seen.add(key);

                candidates.push({
                    id: `cand-${sourceId.replace(/^term-/, '')}-${type.replace(/_/g, '-')}-${targetId.replace(/^term-/, '')}`,
                    source: sourceId,
                    target: targetId,
                    type,
                    status: 'INFERRED',
                    sourceLabel: classified.reverse ? target.label : record.label,
                    targetLabel: classified.reverse ? record.label : target.label,
                    matchedAlias: alias,
                    evidenceSentence: sentence,
                    sourceRefs: [{ kind: 'term-definition', ref: record.id }],
                    published: false,
                    reviewedAt: null,
                });
                break; // 한 문장당 대상 하나
            }
        }
    }

    candidates.sort((a, b) => a.id.localeCompare(b.id));
    const byType = {};
    for (const c of candidates) byType[c.type] = (byType[c.type] || 0) + 1;

    return {
        candidates,
        skipped,
        stats: {
            terms: registry.length,
            candidates: candidates.length,
            byType,
            skipped: skipped.length,
            generatedFrom: 'terms-data.js definitions',
        },
    };
}

if (require.main === module) {
    process.stdout.write(`${JSON.stringify(extract(), null, 2)}\n`);
}

module.exports = { extract, classify, refine, buildAliasIndex, PATTERNS, TOO_GENERIC };
