(function exposeQuizContent(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.ITQuizContent = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizContent() {
    const confusionGroups = [
        ['정적 렌더링', '클라이언트 렌더링', '서버사이드 렌더링', 'SPA(Single Page Application)', 'Rendering(렌더링)', 'PWA(Progressive Web App)'],
        ['API(Application Programming Interface)', 'Interface(인터페이스)', 'Protocol(프로토콜)', 'SDK(Software Development Kit)', 'MCP(Model Context Protocol)'],
        ['Framework(프레임워크)', 'Library(라이브러리)', 'Module(모듈)', 'Component(컴포넌트)', 'Runtime(런타임)'],
        ['React(리액트)', 'Vue.js', 'Next.js', 'Svelte', 'Angular', 'MUI(Material UI)'],
        ['HTML', 'CSS', 'JavaScript(자바스크립트)', 'TypeScript(타입스크립트)', 'Markup language(마크업 언어)'],
        ['npm(node package manager)', 'npm install', 'npm run dev', 'npm run build', 'CLI(Command Line Interface)'],
        ['GitHub', 'GitHub Pages', 'GitHub Actions', 'VCS(버전 관리 시스템)', '브랜치', 'Fetch', 'Merge'],
        ['Hosting(호스팅)', 'CDN(Content Delivery Network)', 'Cloudflare Pages', 'Vercel', 'Netlify', 'GitHub Pages'],
        ['JSON(JavaScript Object Notation)', 'TXT', 'Markdown (MD)', 'CSV', 'XLSX (엑셀)', 'PDF', 'Jupyter Notebook (.ipynb)'],
        ['Crawling(크롤링)', 'Scraping(스크래핑)', 'Parsing(파싱)', 'Refactoring(리팩토링)', 'Compile(컴파일)', 'Execution(실행)'],
        ['Wireframe(와이어프레임)', 'Prototype(프로토타입)', 'High-Fidelity Design(하이파이 시안)', 'Figma', 'Figma Make', 'UX', 'UI(User Interface)'],
        ['Claude Code', 'Codex', 'Antigravity', 'Lovable', 'V0', 'Google AI Studio', 'Claude Design'],
        ['Python', 'NumPy', 'pandas', 'Matplotlib', 'Plotly', 'Streamlit', 'Jupyter Notebook (.ipynb)'],
        ['머신러닝', '딥러닝', 'TensorFlow', 'PyTorch', 'LLM', '생성형 AI'],
        ['RAG', '벡터DB', 'Tool Calling', 'AI Agent', 'LangChain', 'MCP(Model Context Protocol)', '컨텍스트 윈도우'],
        ['TDD(Test-Driven Development, 테스트 주도 개발)', 'Refactoring(리팩토링)', 'MVP', '린 스타트업', '사용자 테스트'],
        ['PNG', 'JPG', 'PDF', 'SVG'],
    ];

    function normalize(value) {
        return String(value || '')
            .normalize('NFKC')
            .toLocaleLowerCase('ko-KR')
            .replace(/[^\p{L}\p{N}]+/gu, '');
    }

    function termAliases(item) {
        const term = String(item?.term || '');
        const aliases = [term, term.split('(')[0], ...(item?.aliases || [])];
        for (const match of term.matchAll(/\(([^)]+)\)/g)) {
            aliases.push(...match[1].split(/[,·/]/));
        }
        return [...new Set(aliases.map(normalize).filter(Boolean))];
    }

    function scoreGlossaryMatch(item, query) {
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return 0;

        const aliases = termAliases(item);
        const definition = normalize(item.definition);
        const keywords = (item.keywords || []).map(normalize);
        const category = normalize(item.category);

        if (aliases.some(alias => alias === normalizedQuery)) return 1000;
        if (aliases.some(alias => alias.startsWith(normalizedQuery))) return 850;
        if (aliases.some(alias => alias.includes(normalizedQuery))) return 750;
        if (keywords.some(keyword => keyword === normalizedQuery)) return 650;
        if (keywords.some(keyword => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))) return 600;
        if (definition.includes(normalizedQuery)) return 500;
        if (category.includes(normalizedQuery)) return 300;

        const tokens = String(query).normalize('NFKC').toLocaleLowerCase('ko-KR')
            .split(/[^\p{L}\p{N}]+/gu)
            .map(normalize)
            .filter(token => token.length >= 2);
        if (tokens.length > 1 && tokens.every(token => definition.includes(token))) return 450;
        return 0;
    }

    function searchGlossaryTerms(terms, query) {
        return (terms || [])
            .map((item, index) => ({ item, index, score: scoreGlossaryMatch(item, query) }))
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .map(result => result.item);
    }

    function findConfusionGroup(term) {
        const normalizedTerm = normalize(term);
        return confusionGroups.find(group => group.some(name => normalize(name) === normalizedTerm));
    }

    function definitionMentionsTerm(definition, item) {
        const normalizedDefinition = normalize(definition);
        return termAliases(item).some(alias => alias.length >= 2 && normalizedDefinition.includes(alias));
    }

    function getDistractorCandidates({ answer, definition, terms }) {
        const group = findConfusionGroup(answer?.term);
        if (!group) return [];

        const termByName = new Map((terms || []).map(item => [normalize(item.term), item]));
        return group
            .map(name => termByName.get(normalize(name)))
            .filter(Boolean)
            .filter(item => normalize(item.term) !== normalize(answer.term))
            .filter(item => !definitionMentionsTerm(definition, item));
    }

    function buildMultipleChoiceOptions({ answer, definition, terms, shuffle = values => values }) {
        const distractors = getDistractorCandidates({ answer, definition, terms }).slice(0, 3);
        if (!answer || distractors.length < 3) return [];
        return shuffle([answer.term, ...distractors.map(item => item.term)]);
    }

    return {
        buildMultipleChoiceOptions,
        getDistractorCandidates,
        searchGlossaryTerms,
    };
}));
