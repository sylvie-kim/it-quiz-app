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
        ['npm', 'npm install', 'npm run dev', 'npm run build', 'CLI(Command Line Interface)'],
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

    const ambiguousDistractorPairs = [
        ['API(Application Programming Interface)', 'Interface(인터페이스)'],
        ['API(Application Programming Interface)', 'Protocol(프로토콜)'],
        ['API(Application Programming Interface)', 'SDK(Software Development Kit)'],
        ['API(Application Programming Interface)', 'MCP(Model Context Protocol)'],
        ['MCP(Model Context Protocol)', 'Protocol(프로토콜)'],
        ['Rendering(렌더링)', '정적 렌더링'],
        ['Rendering(렌더링)', '클라이언트 렌더링'],
        ['Rendering(렌더링)', '서버사이드 렌더링'],
        ['Hosting(호스팅)', 'GitHub Pages'],
        ['Hosting(호스팅)', 'Cloudflare Pages'],
        ['Hosting(호스팅)', 'Vercel'],
        ['Hosting(호스팅)', 'Netlify'],
        ['React(리액트)', 'MUI(Material UI)'],
        ['머신러닝', '딥러닝'],
    ];

    const reviewedFalseDefinitionPairs = [
        ['SDK(Software Development Kit)', 'IDE(Integrated Development Environment)'],
        ['API(Application Programming Interface)', 'SDK(Software Development Kit)'],
        ['React(리액트)', 'Next.js'],
        ['클라이언트 렌더링', '서버사이드 렌더링'],
        ['Crawling(크롤링)', 'Scraping(스크래핑)'],
        ['Wireframe(와이어프레임)', 'Prototype(프로토타입)'],
        ['GitHub Pages', 'GitHub Actions'],
        ['npm install', 'npm run build'],
        ['CSV', 'XLSX (엑셀)'],
        ['RAG', 'Tool Calling'],
        ['TDD(Test-Driven Development, 테스트 주도 개발)', 'Refactoring(리팩토링)'],
        ['HTML', 'CSS'],
    ];

    const applicationExamples = [
        {
            term: 'API(Application Programming Interface)',
            scenario: '쇼핑몰 웹사이트에서 결제 버튼을 누르면 카드사 시스템에 결제 요청을 보냅니다. 두 소프트웨어가 정해진 방식으로 기능과 데이터를 주고받게 하는 접점은?',
            explanation: 'API는 서로 다른 소프트웨어가 기능과 데이터를 정해진 방식으로 주고받게 하는 접점입니다.',
        },
        {
            term: 'CDN(Content Delivery Network)',
            scenario: '한국 사용자가 미국 서버의 동영상을 빠르게 볼 수 있도록 세계 여러 지역의 서버 중 가까운 곳에서 콘텐츠를 전달하는 시스템은?',
            explanation: 'CDN은 여러 지역에 분산된 서버를 통해 사용자와 가까운 곳에서 콘텐츠를 전달합니다.',
        },
        {
            term: 'React(리액트)',
            scenario: '버튼, 메뉴, 카드 같은 화면 요소를 컴포넌트로 나누어 조립하듯 사용자 화면을 만드는 JavaScript 라이브러리는?',
            explanation: 'React는 컴포넌트 기반으로 사용자 인터페이스를 만드는 JavaScript 라이브러리입니다.',
        },
        {
            term: 'Framework(프레임워크)',
            scenario: '개발에 필요한 기본 구조와 흐름을 제공하고, 개발자가 그 규칙 안에서 기능을 작성하게 하는 개발 도구는?',
            explanation: '프레임워크는 애플리케이션의 기본 구조와 흐름을 제공합니다.',
        },
        {
            term: 'Refactoring(리팩토링)',
            scenario: '프로그램의 겉으로 보이는 동작은 유지하면서 코드를 더 읽고 고치기 쉽게 내부 구조를 개선하는 작업은?',
            explanation: '리팩토링은 소프트웨어의 외부 동작을 유지하면서 내부 구조를 개선하는 작업입니다.',
        },
        {
            term: 'Rendering(렌더링)',
            scenario: '브라우저가 HTML, CSS와 JavaScript로 표현된 내용을 사용자가 볼 수 있는 화면으로 만드는 과정은?',
            explanation: '렌더링은 데이터나 코드를 사용자가 보는 화면으로 표현하는 과정입니다.',
        },
        {
            term: 'SDK(Software Development Kit)',
            scenario: 'iOS SDK와 Android SDK처럼, 특정 플랫폼이나 서비스용 소프트웨어를 만들 때 필요한 API, 라이브러리, 문서, 빌드·테스트 도구를 모아 제공하는 개발 도구 묶음은?',
            explanation: 'SDK는 특정 플랫폼이나 서비스용 소프트웨어 개발에 필요한 도구와 자료를 모아 제공하는 개발 키트입니다.',
        },
        {
            term: 'PWA(Progressive Web App)',
            scenario: '웹 기술로 만들고, 지원되는 환경에서 설치할 수 있으며 필요에 따라 오프라인 동작이나 푸시 알림도 구현할 수 있는 애플리케이션은?',
            explanation: 'PWA는 설치 가능한 앱과 비슷한 경험을 제공하는 웹 애플리케이션이며, 일부 기능은 구현과 기기 지원에 따라 달라집니다.',
        },
        {
            term: 'Protocol(프로토콜)',
            scenario: '서로 다른 시스템이 데이터를 주고받을 때 따라야 할 형식과 절차를 정한 규칙은?',
            explanation: '프로토콜은 시스템 간 통신에서 따라야 할 규칙과 절차입니다.',
        },
        {
            term: 'Interface(인터페이스)',
            scenario: '스마트폰 터치 화면처럼 사용자와 기계, 또는 두 시스템이 서로 정보를 주고받게 하는 접점은?',
            explanation: '인터페이스는 사용자와 기계 또는 서로 다른 시스템이 상호작용하는 접점입니다.',
        },
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

    function isAmbiguousDistractor(first, second) {
        const firstName = normalize(first?.term);
        const secondName = normalize(second?.term);
        return ambiguousDistractorPairs.some(([left, right]) => {
            const normalizedLeft = normalize(left);
            const normalizedRight = normalize(right);
            return (firstName === normalizedLeft && secondName === normalizedRight)
                || (firstName === normalizedRight && secondName === normalizedLeft);
        });
    }

    function definitionMentionsTerm(definition, item) {
        const normalizedDefinition = normalize(definition);
        return termAliases(item).some(alias => alias.length >= 2 && normalizedDefinition.includes(alias));
    }

    function topicIdsFor(term, topicIdsByTerm) {
        if (!term || !topicIdsByTerm) return [];
        const name = String(term.term || '');
        const topics = topicIdsByTerm instanceof Map
            ? (topicIdsByTerm.get(name) || topicIdsByTerm.get(normalize(name)))
            : (topicIdsByTerm[name] || topicIdsByTerm[normalize(name)]);
        return Array.isArray(topics) ? topics : [];
    }

    function sharesTopic(first, second, topicIdsByTerm) {
        const firstTopics = new Set(topicIdsFor(first, topicIdsByTerm));
        return topicIdsFor(second, topicIdsByTerm).some(topicId => firstTopics.has(topicId));
    }

    function getDistractorCandidates({ answer, definition, terms, topicIdsByTerm }) {
        const group = findConfusionGroup(answer?.term);
        const sourceTerms = uniqueTerms(terms);
        const termByName = new Map(sourceTerms.map(item => [normalize(item.term), item]));
        const candidates = [];
        const usedNames = new Set([normalize(answer?.term)]);
        const addEligible = items => {
            items.forEach(item => {
                const name = normalize(item?.term);
                if (!item || !name || usedNames.has(name) || definitionMentionsTerm(definition, item)
                    || isAmbiguousDistractor(answer, item)) return;
                usedNames.add(name);
                candidates.push(item);
            });
        };

        // 먼저 기존 혼동군을 유지하고, 부족한 경우에만 온톨로지 주제/카테고리로 보충한다.
        addEligible((group || []).map(name => termByName.get(normalize(name))).filter(Boolean));
        if (candidates.length < 3 && topicIdsFor(answer, topicIdsByTerm).length) {
            addEligible(sourceTerms.filter(item => sharesTopic(answer, item, topicIdsByTerm)));
        }
        if (candidates.length < 3 && answer?.category) {
            addEligible(sourceTerms.filter(item => item.category && item.category === answer.category));
        }
        return candidates;
    }

    function buildMultipleChoiceOptions({ answer, definition, terms, topicIdsByTerm, shuffle = values => values }) {
        const distractors = getDistractorCandidates({ answer, definition, terms, topicIdsByTerm }).slice(0, 3);
        if (!answer || distractors.length < 3) return [];
        return shuffle([answer.term, ...distractors.map(item => item.term)]);
    }

    function shuffleItems(values, seed) {
        const shuffled = [...values];
        let currentSeed = Number.isFinite(seed) ? seed >>> 0 : null;
        const random = currentSeed === null
            ? Math.random
            : () => {
                currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
                return currentSeed / 4294967296;
            };

        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
        }
        return shuffled;
    }

    function uniqueTerms(terms) {
        const seen = new Set();
        return (terms || []).filter(term => {
            const name = String(term && term.term || '');
            if (!name || seen.has(name)) return false;
            seen.add(name);
            return true;
        });
    }

    function resolveQuizScope({ options = {}, allTerms = [] } = {}) {
        const hasExplicitSourceTerms = Object.hasOwn(options, 'sourceTerms');
        const sourceTerms = hasExplicitSourceTerms ? options.sourceTerms : allTerms;
        if (!Array.isArray(sourceTerms) || sourceTerms.length === 0) {
            throw new Error('A quiz scope requires at least one source term');
        }
        return {
            sourceTerms,
            scopeLabel: String(options.scopeLabel || ''),
        };
    }

    function generateMultipleChoiceQuestions({
        answerPool = [],
        allTerms = answerPool,
        topicIdsByTerm,
        count = 15,
        seed,
        shuffle,
    } = {}) {
        const randomize = typeof shuffle === 'function'
            ? shuffle
            : values => shuffleItems(values, seed);
        const candidates = uniqueTerms(answerPool).map(term => {
            const options = buildMultipleChoiceOptions({
                answer: term,
                definition: term.definition,
                terms: allTerms,
                topicIdsByTerm,
                shuffle: randomize,
            });
            if (options.length !== 4 || new Set(options).size !== 4) return null;
            return {
                type: 'multiple-choice',
                questionText: term.definition,
                question: `<div class="definition-box"><div class="definition-text">${term.definition}</div></div>`,
                options,
                correctAnswer: term.term,
                term: term.term,
                termDefinition: term.definition,
                explanation: `${term.term}은(는) ${term.definition}`,
            };
        }).filter(Boolean);

        const requestedCount = Math.max(0, Math.floor(Number(count) || 0));
        return randomize(candidates).slice(0, Math.min(requestedCount, candidates.length));
    }

    function generateTrueFalseQuestions({ terms = [], seed, correctCount = 10, falseCount = 5 } = {}) {
        const termByName = new Map(uniqueTerms(terms).map(item => [item.term, item]));
        const falsePairs = shuffleItems(reviewedFalseDefinitionPairs, seed)
            .map(([termName, definitionName]) => ({
                term: termByName.get(termName),
                definitionSource: termByName.get(definitionName),
            }))
            .filter(item => item.term && item.definitionSource)
            .slice(0, Math.max(0, Math.floor(Number(falseCount) || 0)));
        const falseTermNames = new Set(falsePairs.map(item => item.term.term));
        const trueTerms = shuffleItems(
            uniqueTerms(terms).filter(item => !falseTermNames.has(item.term)),
            Number.isFinite(seed) ? seed + 1 : seed,
        ).slice(0, Math.max(0, Math.floor(Number(correctCount) || 0)));

        const trueQuestions = trueTerms.map(term => ({
            type: 'true-false',
            term,
            definitionSource: term,
            correctAnswer: true,
        }));
        const falseQuestions = falsePairs.map(item => ({
            type: 'true-false',
            ...item,
            correctAnswer: false,
        }));
        return shuffleItems([...trueQuestions, ...falseQuestions], Number.isFinite(seed) ? seed + 2 : seed);
    }

    function generateApplicationQuestions({ seed } = {}) {
        return shuffleItems(applicationExamples, seed).map(example => {
            const correctAnswer = example.term.split('(')[0].trim();
            return {
                type: 'application',
                questionText: example.scenario,
                question: `<div class="scenario-box"><p class="scenario-text">${example.scenario}</p></div>`,
                correctAnswer,
                fullTerm: example.term,
                term: example.term,
                termDefinition: example.explanation,
                explanation: `정답은 "${correctAnswer}"입니다.\n\n${example.explanation}`,
            };
        });
    }

    function shouldOpenQuizDictionary({ isQuizActive, quizType, answered }) {
        return Boolean(
            isQuizActive
            && !answered
            && ['short-answer', 'application'].includes(quizType)
        );
    }

    return {
        buildMultipleChoiceOptions,
        generateApplicationQuestions,
        generateMultipleChoiceQuestions,
        generateTrueFalseQuestions,
        getDistractorCandidates,
        resolveQuizScope,
        searchGlossaryTerms,
        shouldOpenQuizDictionary,
    };
}));
