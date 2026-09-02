(function exposeTermUtilities(root) {
    const semanticAliases = new Map([
        ['vivecoding', 'vibecoding'],
        ['바이브코딩', 'vibecoding'],
        ['프로토타입', 'prototype'],
        ['웹크롤링', 'crawling'],
        ['크롤링', 'crawling'],
        ['토큰', 'token'],
        ['사용자인터페이스', 'ui'],
        ['userinterface', 'ui'],
    ]);

    function normalizeTermName(value) {
        const normalized = String(value || '')
            .normalize('NFKC')
            .toLocaleLowerCase('ko-KR')
            .replace(/vive/g, 'vibe')
            .replace(/[^\p{L}\p{N}]+/gu, '');

        return semanticAliases.get(normalized) || normalized;
    }

    function getTermAliases(value) {
        const item = value && typeof value === 'object' ? value : { term: value };
        const text = String(item.term || '').normalize('NFKC').trim();
        const aliases = new Set([normalizeTermName(text)]);
        const beforeParenthesis = text.split('(')[0];
        aliases.add(normalizeTermName(beforeParenthesis));

        for (const match of text.matchAll(/\(([^)]+)\)/g)) {
            const parenthetical = match[1].trim();
            if (!/[,·/]/.test(parenthetical)) {
                aliases.add(normalizeTermName(parenthetical));
            }
        }

        for (const alias of item.aliases || []) {
            aliases.add(normalizeTermName(alias));
        }

        aliases.delete('');
        return [...aliases];
    }

    function mergeTerms(baseTerms, incomingTerms) {
        const merged = (baseTerms || []).map(item => ({ ...item }));
        const aliasIndex = new Map();

        function indexTerm(item, index) {
            for (const alias of getTermAliases(item)) {
                if (!aliasIndex.has(alias)) aliasIndex.set(alias, index);
            }
        }

        merged.forEach(indexTerm);

        for (const incoming of incomingTerms || []) {
            const matchedIndex = getTermAliases(incoming)
                .map(alias => aliasIndex.get(alias))
                .find(index => index !== undefined);

            if (matchedIndex === undefined) {
                const next = { origin: 'external', ...incoming };
                merged.push(next);
                indexTerm(next, merged.length - 1);
                continue;
            }

            const current = merged[matchedIndex];
            merged[matchedIndex] = {
                ...current,
                ...incoming,
                term: current.term,
                origin: current.origin || incoming.origin || 'external',
            };
            indexTerm(merged[matchedIndex], matchedIndex);
        }

        return merged;
    }

    const utilities = { getTermAliases, mergeTerms, normalizeTermName };
    root.ITQuizTerms = utilities;
    if (typeof module === 'object' && module.exports) module.exports = utilities;
})(typeof globalThis !== 'undefined' ? globalThis : window);
