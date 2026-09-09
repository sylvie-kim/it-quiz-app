// 퀴즈 데이터
const termsData = IT_QUIZ_BASE_TERMS.map(item => ({ ...item }));

// 퀴즈 상태
let currentQuizType = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let answered = false;
let questionStates = []; // 각 문제의 상태를 저장
let autoAdvanceTimer = null;
const AUTO_ADVANCE_DELAY_MS = 1500;
let learningMapController = null;
let glossaryLearningController = null;
let quizResumeScreen = 'home-screen';
let currentQuizScope = { sourceTerms: termsData, scopeLabel: '' };

// DOM 요소
const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const dictionaryScreen = document.getElementById('dictionary-screen');
const questionTitle = document.getElementById('question-title');
const questionContent = document.getElementById('question-content');
const answerOptions = document.getElementById('answer-options');
const feedback = document.getElementById('feedback');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const homeBtn = document.getElementById('home-btn');
const restartBtn = document.getElementById('restart-btn');
const homeResultBtn = document.getElementById('home-result-btn');
const questionActionHint = document.getElementById('question-action-hint');
const questionActions = document.getElementById('question-actions');
const quizContainer = document.getElementById('quiz-container');
const quizDictionaryButton = document.getElementById('quiz-dictionary-button');
const quizDictionaryDialog = document.getElementById('quiz-dictionary-dialog');
const quizDictionaryClose = document.getElementById('quiz-dictionary-close');
const quizDictionarySearch = document.getElementById('quiz-dictionary-search');
const quizDictionaryStatus = document.getElementById('quiz-dictionary-status');
const quizDictionaryResults = document.getElementById('quiz-dictionary-results');

// 사전 관련 DOM 요소
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const showAllTermsBtn = document.getElementById('show-all-terms-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const dictionaryResults = document.getElementById('dictionary-results');
const searchResults = document.getElementById('search-results');
const allTerms = document.getElementById('all-terms');
const resultsCount = document.getElementById('results-count');
const resultsList = document.getElementById('results-list');
const termsList = document.getElementById('terms-list');
const termTags = document.querySelectorAll('.term-tag');
const sortBtns = document.querySelectorAll('.sort-btn');

// 접근성 컨트롤 요소는 함수 내에서 동적으로 가져옴

// 접근성 설정
const savedDarkMode = localStorage.getItem('darkMode');
let isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
let isMotionReduced = localStorage.getItem('motionReduced') === 'true' || 
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 사전 기능 관련 변수
let searchTimeout;
let currentSortMode = 'alphabetical';

// 용어 아이콘 및 카테고리 매핑
function getTermIcon(term) {
    const dataIcon = termsData.find(item => item.term === term)?.icon;
    if (dataIcon) return dataIcon;

    const iconMap = {
        'Interface': '🔌',
        'API': '🔗',
        'MCP': '🤖',
        'Protocol': '📋',
        'IDE': '💻',
        'Vibe Coding': '🚀',
        'Framework': '🏗️',
        'Library': '📚',
        'HTML': '🌐',
        'CSS': '🎨',
        'JavaScript': '⚡',
        'React': '⚛️',
        'Component': '🧩',
        'Reactive Component': '🔄',
        'Node.js': '🟢',
        'Next.js': '⏭️',
        'Rendering': '🖼️',
        'Routing': '🗺️',
        'Wireframe': '📐',
        'Prototype': '🎨',
        'Compile': '⚙️',
        '실행(Execution)': '▶️',
        'Hosting': '☁️',
        '파싱(Parsing)': '🔍',
        '크롤링': '🕷️',
        '스크래핑': '📊',
        '객체(Object)': '📦',
        'UI': '🖥️',
        '리팩토링': '🔧',
        '토큰': '🎯',
        '트리': '🌳',
        'CDN': '🌍',
        'PWA': '📱',
        'SDK': '🛠️'
    };
    const baseTerm = term.split('(')[0].trim();
    return iconMap[term] || iconMap[baseTerm] || '';
}

function getTermCategory(term) {
    const categoryMap = {
        'Interface': 'concepts',
        'API': 'concepts',
        'MCP': 'concepts',
        'Protocol': 'concepts',
        'IDE': 'tools',
        'Vibe Coding': 'concepts',
        'Framework': 'concepts',
        'Library': 'concepts',
        'HTML': 'languages',
        'CSS': 'languages',
        'JavaScript': 'languages',
        'React': 'frameworks',
        'Component': 'concepts',
        'Reactive Component': 'concepts',
        'Node.js': 'runtime',
        'Next.js': 'frameworks',
        'Rendering': 'concepts',
        'Routing': 'concepts',
        'Wireframe': 'design',
        'Prototype': 'design',
        'Compile': 'concepts',
        '실행(Execution)': 'concepts',
        'Hosting': 'deployment',
        '파싱(Parsing)': 'concepts',
        '크롤링': 'concepts',
        '스크래핑': 'concepts',
        '객체(Object)': 'concepts',
        'UI': 'design',
        '리팩토링': 'concepts',
        '토큰': 'concepts',
        '트리': 'concepts',
        'CDN': 'deployment',
        'PWA': 'concepts',
        'SDK': 'tools'
    };
    
    const categoryNames = {
        'concepts': '개념',
        'languages': '언어',
        'frameworks': '프레임워크',
        'tools': '도구',
        'runtime': '런타임',
        'design': '디자인',
        'deployment': '배포',
        'data': '데이터'
    };

    const dataCategory = termsData.find(item => item.term === term)?.category;
    const baseTerm = term.split('(')[0].trim();
    const category = dataCategory || categoryMap[term] || categoryMap[baseTerm] || 'concepts';
    return categoryNames[category];
}

// 접근성 초기화
const {
    buildFeedbackModel,
    buildReviewItemHTML,
    escapeHTML,
    shouldAutoAdvance,
    shouldSubmitOnSelection,
} = ITQuizUX;
const {
    generateMultipleChoiceQuestions: generateMultipleChoiceQuestionsFromTerms,
    resolveQuizScope,
    searchGlossaryTerms,
    shouldOpenQuizDictionary,
} = ITQuizContent;

function initializeAccessibility() {
    // 다크모드 설정
    const themeToggle = document.getElementById('theme-toggle');
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.textContent = '라이트 모드';
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '다크 모드';
    }
    
    // 모션 감소 설정 (간소화 - 토글 버튼 제거됨)
    if (isMotionReduced) {
        document.documentElement.setAttribute('data-motion', 'reduced');
    } else {
        document.documentElement.removeAttribute('data-motion');
    }
}

const quizTopicIdsByTerm = Object.fromEntries(
    IT_QUIZ_ONTOLOGY.termRegistry.map(term => [term.label, term.topicIds])
);

// 다크모드 토글
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.textContent = '라이트 모드';
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '다크 모드';
    }
}

// 모션 감소 토글 (함수 제거됨 - 토글 버튼이 제거되어 더 이상 사용되지 않음)

// 🎯 UX 개선: 문제 유형별 제목과 서브타이틀
function getQuestionTypeTitle(type) {
    switch (type) {
        case 'multiple-choice':
            return '객관식 문제';
        case 'short-answer':
            return '단답형 문제';
        case 'true-false':
            return '참/거짓 문제';
        case 'application':
            return '상황 적용';
        default:
            return '퀴즈';
    }
}

function getQuestionSubtitle(type) {
    switch (type) {
        case 'multiple-choice':
            return '다음 정의에 해당하는 용어를 선택하세요';
        case 'short-answer':
            return '다음 정의에 해당하는 용어를 입력하세요';
        case 'true-false':
            return '용어와 정의가 올바르게 연결되었는지 판단하세요';
        case 'application':
            return '실제 상황에서 어떤 용어가 적용되는지 입력하세요';
        default:
            return '';
    }
}

// 퀴즈 유형별 제목 (기존 호환성을 위해 유지)
const quizTitles = {
    'multiple-choice': '객관식 문제',
    'short-answer': '단답형 문제',
    'true-false': '참/거짓 문제',
    'application': '상황 적용'
};

// 유틸리티 함수
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomItems(array, count, seed) {
    // 시드가 제공되면 시드 기반 랜덤, 아니면 일반 랜덤
    const shuffled = seed ? shuffleArrayWithSeed(array, seed) : shuffleArray(array);
    return shuffled.slice(0, count);
}

// 시드 기반 셔플 함수 (매번 다른 문제 생성을 위해)
function shuffleArrayWithSeed(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    // 간단한 선형 합동 생성기 (Linear Congruential Generator)
    function seededRandom() {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        return currentSeed / 4294967296;
    }
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function normalizeText(text) {
    return text.toLowerCase().trim().replace(/[()]/g, '');
}

// 고급 답안 검증 함수 - 영어/한글 답변 모두 인정
function isAnswerCorrect(userAnswer, correctAnswer, fullTerm) {
    // 기본 정규화
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    const normalizedFull = fullTerm ? normalizeText(fullTerm) : '';
    
    // 🔍 디버깅: 정규화된 값들 출력
    console.log('🔍 답안 검증 디버깅:', {
        원본사용자답안: userAnswer,
        원본정답: correctAnswer,
        원본전체용어: fullTerm,
        정규화사용자답안: normalizedUser,
        정규화정답: normalizedCorrect,
        정규화전체용어: normalizedFull
    });
    
    // 1. 정확한 답안 매칭
    if (normalizedUser === normalizedCorrect) {
        console.log('✅ 1번 체크: 정확한 답안 매칭 성공');
        return true;
    }
    
    // 2. 전체 용어 매칭 (예: "API (Application Programming Interface)")
    if (normalizedFull && normalizedUser === normalizedFull) {
        console.log('✅ 2번 체크: 전체 용어 매칭 성공');
        return true;
    }
    
    // 3. 괄호 앞부분만 매칭 (예: "API")
    if (normalizedFull && normalizedUser === normalizedFull.split(' (')[0]) {
        console.log('✅ 3번 체크: 괄호 앞부분 매칭 성공');
        return true;
    }

    // 4. 괄호 안 단일 표기와 데이터에 명시한 동의어만 인정
    const matchedTerm = termsData.find(item =>
        item.term === fullTerm || item.term === correctAnswer
    );
    const acceptedAliases = new Set();
    for (const candidate of [
        { term: correctAnswer },
        { term: fullTerm },
        matchedTerm,
    ]) {
        if (!candidate) continue;
        for (const alias of ITQuizTerms.getTermAliases(candidate)) {
            acceptedAliases.add(alias);
        }
    }
    if (acceptedAliases.has(ITQuizTerms.normalizeTermName(userAnswer))) {
        console.log('✅ 4번 체크: 명시된 동의어 매칭 성공');
        return true;
    }
    
    // 6. 영어-한글 매핑 테이블
    const termMappings = {
        // 영어 -> 한글
        'api': ['api', '에이피아이', '아피'],
        'html': ['html', '에이치티엠엘', 'HTML'],
        'css': ['css', '씨에스에스', 'CSS'],
        'javascript': ['javascript', '자바스크립트', 'js'],
        'react': ['react', '리액트'],
        'node.js': ['node.js', 'nodejs', '노드제이에스', '노드'],
        'framework': ['framework', '프레임워크'],
        'library': ['library', '라이브러리'],
        'component': ['component', '컴포넌트'],
        'interface': ['interface', '인터페이스'],
        'protocol': ['protocol', '프로토콜'],
        'routing': ['routing', '라우팅'],
        'rendering': ['rendering', '렌더링'],
        'compile': ['compile', '컴파일'],
        'hosting': ['hosting', '호스팅'],
        'parsing': ['parsing', '파싱', 'parsing파싱', '파싱parsing'],
        'refactoring': ['refactoring', '리팩토링'],
        'token': ['token', '토큰'],
        'tree': ['tree', '트리'],
        'cdn': ['cdn', '시디엔'],
        'pwa': ['pwa', '피더블유에이'],
        'sdk': ['sdk', '에스디케이'],
        'ide': ['ide', '아이디이'],
        'ui': ['ui', '유아이', '사용자인터페이스', '사용자 인터페이스'],
        'mcp': ['mcp', '엠씨피'],
        'next.js': ['next.js', 'nextjs', '넥스트제이에스', '넥스트'],
        'wireframe': ['wireframe', '와이어프레임'],
        'prototype': ['prototype', '프로토타입'],
        'object': ['object', '객체'],
        'execution': ['execution', '실행'],
        'crawling': ['crawling', '크롤링'],
        'scraping': ['scraping', '스크래핑'],
        
        // 한글 -> 영어도 지원
        '에이피아이': ['api', '에이피아이', '아피'],
        '자바스크립트': ['javascript', '자바스크립트', 'js'],
        '리액트': ['react', '리액트'],
        '프레임워크': ['framework', '프레임워크'],
        '라이브러리': ['library', '라이브러리'],
        '컴포넌트': ['component', '컴포넌트'],
        '인터페이스': ['interface', '인터페이스'],
        '프로토콜': ['protocol', '프로토콜'],
        '라우팅': ['routing', '라우팅'],
        '렌더링': ['rendering', '렌더링'],
        '컴파일': ['compile', '컴파일'],
        '호스팅': ['hosting', '호스팅'],
        '파싱': ['parsing', '파싱', 'parsing파싱', '파싱parsing'],
        '리팩토링': ['refactoring', '리팩토링'],
        '토큰': ['token', '토큰'],
        '트리': ['tree', '트리'],
        '객체': ['object', '객체'],
        '실행': ['execution', '실행'],
        '크롤링': ['crawling', '크롤링'],
        '스크래핑': ['scraping', '스크래핑']
    };
    
    // 7. 매핑 테이블을 통한 검증
    console.log('🔍 매핑 테이블 검증 시작...');
    for (const [key, variants] of Object.entries(termMappings)) {
        if (variants.includes(normalizedUser)) {
            console.log(`🔍 사용자 답안 "${normalizedUser}"이 "${key}" 그룹에서 발견됨:`, variants);
            // 사용자 답안이 매핑 테이블에 있으면, 정답도 같은 그룹에 있는지 확인
            if (variants.includes(normalizedCorrect) || 
                variants.includes(normalizedFull) || 
                variants.includes(normalizedFull.split(' (')[0])) {
                console.log('✅ 7번 체크: 매핑 테이블 매칭 성공');
                return true;
            } else {
                console.log(`❌ 정답 "${normalizedCorrect}", 전체용어 "${normalizedFull}"이 같은 그룹에 없음`);
            }
        }
    }
    
         // 8. 부분 매칭 (최소 3글자 이상, 80% 이상 일치)
     if (normalizedUser.length >= 3 && normalizedCorrect.length >= 3) {
         const shorter = normalizedUser.length < normalizedCorrect.length ? normalizedUser : normalizedCorrect;
         const longer = normalizedUser.length < normalizedCorrect.length ? normalizedCorrect : normalizedUser;
         
         if (longer.includes(shorter) && shorter.length / longer.length >= 0.8) {
             console.log('✅ 9번 체크: 부분 매칭 성공');
             return true;
         }
     }
     
     // 9. 한영 혼용 표기 허용 (예: "HTTP프로토콜", "API인터페이스")
    const cleanUser = normalizedUser.replace(/[^a-z가-힣0-9]/g, '');
    const cleanCorrect = normalizedCorrect.replace(/[^a-z가-힣0-9]/g, '');
    const cleanFull = normalizedFull.replace(/[^a-z가-힣0-9]/g, '');
    
         if (cleanUser === cleanCorrect || cleanUser === cleanFull) {
         console.log('✅ 10번 체크: 한영 혼용 표기 매칭 성공');
         return true;
     }
     
     console.log('❌ 모든 검증 실패 - 오답 처리');
     return false;
}

// 문제 생성 함수들
function generateShortAnswerQuestions() {
    const questions = [];
    // 매번 다른 문제를 위한 시드 생성
    const seed = Date.now() + Math.floor(Math.random() * 1000);
    const selectedTerms = getRandomItems(termsData, 12, seed);
    
    selectedTerms.forEach(term => {
        const icon = getTermIcon(term.term);
        const category = getTermCategory(term.term);
        const termName = term.term.split(' (')[0]; // 괄호 안의 설명 제거
        
        questions.push({
            type: 'short-answer',
            questionText: term.definition,
            question: `<div class="category-hint">카테고리: ${category}</div>
            <div class="definition-box">
                <div class="definition-text">${term.definition}</div>
            </div>`,
            correctAnswer: termName, // 짧은 형태의 용어명을 정답으로 설정
            fullTerm: term.term, // 전체 용어는 별도로 보관
            term: term.term,
            termDefinition: term.definition,
            explanation: `정답은 "${termName}"입니다.\n\n${term.definition}`
        });
    });
    
    return questions;
}

function generateTrueFalseQuestions() {
    const questions = [];
    // 매번 다른 문제를 위한 시드 생성
    const seed = Date.now() + Math.floor(Math.random() * 1000);
    const selectedTerms = getRandomItems(termsData, 10, seed);
    
    // 정답 문제
    selectedTerms.forEach(term => {
        const icon = getTermIcon(term.term);
        
        questions.push({
            type: 'true-false',
            questionText: `${term.term}과 제시된 정의가 올바르게 연결됐나요?`,
            question: `<div class="term-definition-pair">
                <div class="term-label">
                    <strong>용어:</strong> ${term.term}
                </div>
                <div class="definition-label">
                    <strong>정의:</strong> ${term.definition}
                </div>
            </div>`,
            correctAnswer: true,
            term: term.term,
            termDefinition: term.definition,
            shownDefinitionTerm: term.term,
            shownDefinition: term.definition,
            explanation: `정답입니다. ${term.term}은(는) ${term.definition}`
        });
    });
    
    // 오답 문제 - 비슷한 카테고리의 정의를 사용
    const wrongTerms = getRandomItems(termsData, 5, seed + 100);
    wrongTerms.forEach(term => {
        const category = getTermCategory(term.term);
        const relatedTerms = termsData.filter(t => 
            t.term !== term.term && 
            getTermCategory(t.term) === category
        );
        
        const definitionSource = relatedTerms.length > 0
            ? getRandomItems(relatedTerms, 1, seed + term.term.length)[0]
            : getRandomItems(termsData.filter(t => t.term !== term.term), 1, seed + term.term.length)[0];
        const wrongDefinition = definitionSource.definition;
        
        const icon = getTermIcon(term.term);
        
        questions.push({
            type: 'true-false',
            questionText: `${term.term}과 제시된 정의가 올바르게 연결됐나요?`,
            question: `<div class="term-definition-pair">
                <div class="term-label">
                    <strong>용어:</strong> ${term.term}
                </div>
                <div class="definition-label">
                    <strong>정의:</strong> ${wrongDefinition}
                </div>
            </div>`,
            correctAnswer: false,
            term: term.term,
            termDefinition: term.definition,
            shownDefinitionTerm: definitionSource.term,
            shownDefinition: definitionSource.definition,
            explanation: `틀렸습니다. ${term.term}의 올바른 정의는: ${term.definition}`
        });
    });
    
    return shuffleArray(questions);
}

function generateApplicationQuestions() {
    // 매번 다른 문제를 위한 시드 생성
    const seed = Date.now() + Math.floor(Math.random() * 1000);
    
    const applicationExamples = [
        {
            term: "API (Application Programming Interface)",
            scenario: "쇼핑몰 웹사이트에서 결제 버튼을 누르면 카드사 시스템과 연결되어 결제가 처리됩니다. 이때 쇼핑몰과 카드사 간의 소통을 가능하게 하는 것은?",
            explanation: "API는 서로 다른 소프트웨어 애플리케이션 간의 소통을 가능하게 하는 인터페이스입니다."
        },
        {
            term: "CDN (Content Delivery Network)",
            scenario: "한국에 있는 사용자가 미국 서버의 동영상을 빠르게 시청할 수 있도록 전 세계 곳곳에 서버를 두고 가까운 곳에서 콘텐츠를 제공하는 기술은?",
            explanation: "CDN은 전 세계에 분산된 서버를 통해 사용자에게 가장 가까운 위치에서 콘텐츠를 제공하여 속도를 향상시키는 기술입니다."
        },
        {
            term: "React",
            scenario: "웹사이트의 버튼, 메뉴, 카드 등을 독립적인 작은 단위로 만들어서 조립하듯이 화면을 구성할 수 있게 해주는 JavaScript 라이브러리는?",
            explanation: "React는 컴포넌트 기반으로 사용자 인터페이스를 구축할 수 있게 해주는 JavaScript 라이브러리입니다."
        },
        {
            term: "Framework",
            scenario: "개발자가 정해진 규칙과 구조에 따라 코드를 작성하면, 전체적인 프로그램 흐름을 자동으로 관리해주는 개발 도구는?",
            explanation: "Framework는 개발의 기본 구조와 규칙을 제공하여 개발자가 더 쉽고 효율적으로 애플리케이션을 만들 수 있게 해주는 도구입니다."
        },
        {
            term: "리팩토링 (Refactoring)",
            scenario: "프로그램의 기능은 그대로 유지하면서 코드를 더 읽기 쉽고 유지보수하기 편하게 개선하는 작업을 무엇이라고 합니까?",
            explanation: "리팩토링은 소프트웨어의 외부 동작은 그대로 유지하면서 내부 구조를 개선하는 작업입니다."
        },
        {
            term: "Rendering",
            scenario: "브라우저가 HTML, CSS, JavaScript 코드를 해석해서 사용자가 볼 수 있는 웹페이지로 만드는 과정을 무엇이라고 합니까?",
            explanation: "Rendering은 코드를 해석하여 사용자가 볼 수 있는 화면으로 변환하는 과정입니다."
        },
        {
            term: "SDK (Software Development Kit)",
            scenario: "iOS 앱을 개발할 때 필요한 도구들(라이브러리, API, 문서, 개발환경 등)을 한 번에 제공하는 패키지를 무엇이라고 합니까?",
            explanation: "SDK는 특정 플랫폼이나 운영체제를 위한 애플리케이션 개발에 필요한 도구들을 모아놓은 개발 키트입니다."
        },
        {
            term: "PWA (Progressive Web App)",
            scenario: "웹사이트이지만 스마트폰 홈화면에 설치할 수 있고, 오프라인에서도 작동하며, 푸시 알림도 받을 수 있는 웹 애플리케이션 기술은?",
            explanation: "PWA는 웹 기술로 만들어졌지만 네이티브 앱과 같은 경험을 제공하는 웹 애플리케이션입니다."
        },
        {
            term: "Protocol",
            scenario: "서로 다른 시스템들이 데이터를 주고받을 때 어떤 형식과 절차를 따라야 하는지 정해둔 표준화된 규칙을 무엇이라고 합니까?",
            explanation: "Protocol은 컴퓨터 네트워크에서 데이터를 주고받을 때 따라야 하는 표준화된 규칙과 절차입니다."
        },
        {
            term: "Interface",
            scenario: "스마트폰 터치스크린처럼 사람과 기계가 서로 소통할 수 있도록 해주는 접점을 무엇이라고 합니까?",
            explanation: "Interface는 서로 다른 시스템이나 사용자와 기계 간에 상호작용할 수 있도록 해주는 접점입니다."
        }
    ];
    
    // 응용 문제도 랜덤하게 섞어서 반환 (10개 중 랜덤하게 선택)
    const shuffledExamples = shuffleArrayWithSeed(applicationExamples, seed);
    return shuffledExamples.map(example => {
        const termName = example.term.split(' (')[0]; // 괄호 안의 설명 제거
        
        return {
            type: 'application',
            questionText: example.scenario,
            question: `<div class="scenario-box"><p class="scenario-text">${example.scenario}</p></div>`,
            correctAnswer: termName, // 짧은 형태의 용어명을 정답으로 설정
            fullTerm: example.term, // 전체 용어는 별도로 보관
            term: example.term,
            termDefinition: example.explanation,
            explanation: `정답은 "${termName}"입니다.\n\n${example.explanation}`
        };
    });
}

// 화면 전환 함수
function clearAutoAdvanceTimer() {
    if (autoAdvanceTimer === null) return;
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
}

function showScreen(screen, updateHistory = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // screen이 문자열인 경우 element로 변환
    const screenElement = typeof screen === 'string' ? document.getElementById(screen) : screen;
    screenElement.classList.add('active');
    
    // 🎯 퀴즈 모드일 때 관리자 패널 숨기기
    const screenId = screenElement.id;
    if (['home-screen', 'quiz-screen', 'result-screen'].includes(screenId)) quizResumeScreen = screenId;
    const route = screenId === 'learning-home-screen' ? 'learn'
        : screenId === 'dictionary-screen' ? 'search'
        : screenId === 'learning-map-screen' ? 'connections' : 'quiz';
    const page = route;
    document.querySelectorAll('[data-app-page]').forEach(button => {
        if (button.dataset.appPage === page) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
    if (updateHistory && window.location.hash !== `#${route}`) window.history.pushState(null, '', `#${route}`);
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (screenId === 'quiz-screen' || screenId === 'result-screen' || screenId === 'dictionary-screen') {
        document.body.classList.add('quiz-mode');
    } else {
        document.body.classList.remove('quiz-mode');
    }

    if (screenId !== 'quiz-screen') {
        clearAutoAdvanceTimer();
        questionActions.classList.remove('is-docked');
        quizContainer.classList.remove('has-docked-actions');
    }
}

function openLearningMap() {
    showScreen('learning-home-screen');
}

function openConnections() {
    showScreen('learning-map-screen');
    learningMapController?.render();
    document.querySelector('[data-learning-view="graph"]')?.click();
}

function openTermSearch() {
    if (quizScreen.classList.contains('active')) { openQuizDictionary(); return; }
    showScreen('dictionary-screen');
    searchInput.focus({ preventScroll: true });
}

function restorePageFromHash() {
    const route = window.location.hash;
    const screen = route === '#search' || route === '#dictionary' ? 'dictionary-screen'
        : route === '#quiz' ? quizResumeScreen
        : route === '#connections' ? 'learning-map-screen'
        : route === '#learn' ? 'learning-home-screen' : 'home-screen';
    showScreen(screen, false);
    if (screen === 'learning-map-screen') {
        learningMapController?.render();
        document.querySelector('[data-learning-view="graph"]')?.click();
    }
}


function updateQuestionActionsPosition() {
    if (!quizScreen.classList.contains('active')) return;

    questionActions.classList.remove('is-docked');
    quizContainer.classList.remove('has-docked-actions');

    const contentAnchor = feedback.classList.contains('hidden')
        ? (quizDictionaryButton.classList.contains('hidden') ? answerOptions : quizDictionaryButton)
        : feedback;
    const shouldDock = ITQuizUX.shouldDockQuestionActions({
        contentBottom: contentAnchor.getBoundingClientRect().bottom,
        actionHeight: questionActions.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
    });

    questionActions.classList.toggle('is-docked', shouldDock);
    quizContainer.classList.toggle('has-docked-actions', shouldDock);
}

// 퀴즈 시작
function startQuiz(type, options = {}) {
    clearAutoAdvanceTimer();
    currentQuizScope = resolveQuizScope({ options, allTerms: termsData });
    currentQuizType = type;
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    answered = false;
    questionStates = []; // 각 문제의 상태 초기화
    
    // 문제 생성
    switch (type) {
        case 'multiple-choice':
            currentQuestions = generateMultipleChoiceQuestionsFromTerms({
                answerPool: currentQuizScope.sourceTerms,
                allTerms: termsData,
                topicIdsByTerm: quizTopicIdsByTerm,
                count: 15,
                seed: Date.now() + Math.floor(Math.random() * 1000),
            });
            break;
        case 'short-answer':
            currentQuestions = generateShortAnswerQuestions();
            break;
        case 'true-false':
            currentQuestions = generateTrueFalseQuestions();
            break;
        case 'application':
            currentQuestions = generateApplicationQuestions();
            break;
    }
    
    // 각 문제의 상태를 저장할 배열 초기화
    questionStates = new Array(currentQuestions.length).fill(null);
    
    questionTitle.textContent = quizTitles[type];
    showScreen('quiz-screen');
    displayQuestion();
}

// 문제 표시
function displayQuestion() {
    clearAutoAdvanceTimer();
    const question = currentQuestions[currentQuestionIndex];
    const savedState = questionStates[currentQuestionIndex];
    answered = savedState ? savedState.answered : false;
    
    // 🎯 문제 유형과 설명을 함께 표시
    const questionTitle = document.getElementById('question-title');
    const questionSubtitle = document.getElementById('question-subtitle');
    
    if (questionTitle) questionTitle.textContent = getQuestionTypeTitle(question.type);
    if (questionSubtitle) {
        questionSubtitle.textContent = currentQuizScope.scopeLabel && question.type === 'multiple-choice'
            ? `${currentQuizScope.scopeLabel} · 객관식`
            : getQuestionSubtitle(question.type);
    }
    
    // 진행률 업데이트
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    
    // 질문 내용
    questionContent.innerHTML = `<div class="question-text">${question.question}</div>`;
    
    // 답안 옵션 초기화
    answerOptions.innerHTML = '';
    feedback.classList.add('hidden');
    const canUseDictionary = !answered && ['short-answer', 'application'].includes(question.type);
    quizDictionaryButton.classList.toggle('hidden', !canUseDictionary);
    
    // 버튼 상태 초기화
    if (answered) {
        submitBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        questionActionHint.textContent = currentQuestionIndex === currentQuestions.length - 1
            ? '해설을 확인한 뒤 결과를 보세요.'
            : '해설을 확인한 뒤 다음 문제로 이동하세요.';
        // 피드백 표시
        if (savedState.feedback) {
            feedback.innerHTML = savedState.feedback;
            feedback.className = savedState.feedbackClass;
            feedback.classList.remove('hidden');
        }
    } else {
        submitBtn.disabled = true;
        submitBtn.textContent = '답 확인';
        submitBtn.classList.toggle('hidden', shouldSubmitOnSelection(question.type));
        nextBtn.classList.add('hidden');
        questionActionHint.textContent = shouldSubmitOnSelection(question.type)
            ? '답을 고르면 바로 채점됩니다.'
            : '답을 입력한 뒤 확인하세요.';
    }
    
    // 문제 유형별 UI 생성
    if (question.type === 'multiple-choice') {
        displayMultipleChoice(question);
    } else if (question.type === 'short-answer') {
        displayShortAnswer(question);
    } else if (question.type === 'true-false') {
        displayTrueFalse(question);
    } else if (question.type === 'application') {
        displayApplication(question);
    }
    
    // 이전에 답변한 내용이 있다면 복원
    if (savedState && savedState.userAnswer !== undefined) {
        restoreUserAnswer(question, savedState.userAnswer, savedState.isCorrect);
    }

    updateQuestionActionsPosition();
}

function displayMultipleChoice(question) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'answer-options';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('button');
        optionDiv.type = 'button';
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => selectOption(optionDiv, option));
        optionsDiv.appendChild(optionDiv);
    });
    
    answerOptions.appendChild(optionsDiv);
}

function displayShortAnswer(question) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.placeholder = '답을 입력하세요...';
    input.addEventListener('input', () => {
        submitBtn.disabled = input.value.trim() === '';
    });
    
    // ⚡ Enter 키로 답안 제출
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !answered && input.value.trim() !== '') {
            submitAnswer();
        }
    });
    
    answerOptions.appendChild(input);
    input.focus(); // 자동 포커스
}

function displayTrueFalse(question) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'tf-buttons';
    
    const trueBtn = document.createElement('button');
    trueBtn.type = 'button';
    trueBtn.className = 'tf-button';
    trueBtn.textContent = '참 (True)';
    trueBtn.addEventListener('click', () => selectTrueFalse(trueBtn, true));
    
    const falseBtn = document.createElement('button');
    falseBtn.type = 'button';
    falseBtn.className = 'tf-button';
    falseBtn.textContent = '거짓 (False)';
    falseBtn.addEventListener('click', () => selectTrueFalse(falseBtn, false));
    
    buttonsDiv.appendChild(trueBtn);
    buttonsDiv.appendChild(falseBtn);
    answerOptions.appendChild(buttonsDiv);
}

function displayApplication(question) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.placeholder = '용어를 입력하세요...';
    input.addEventListener('input', () => {
        submitBtn.disabled = input.value.trim() === '';
    });
    
    // ⚡ Enter 키로 답안 제출
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !answered && input.value.trim() !== '') {
            submitAnswer();
        }
    });
    
    answerOptions.appendChild(input);
    input.focus(); // 자동 포커스
}

function getQuizInput() {
    return answerOptions.querySelector('.text-input');
}

function getShortTermName(term) {
    return String(term || '').split('(')[0].trim();
}

function renderQuizDictionaryResults(query) {
    if (!quizDictionaryResults || !quizDictionaryStatus) return;
    quizDictionaryResults.replaceChildren();

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
        quizDictionaryStatus.textContent = '한 글자부터 검색할 수 있습니다.';
        return;
    }

    const results = searchGlossaryTerms(termsData, normalizedQuery).slice(0, 8);
    quizDictionaryStatus.textContent = results.length
        ? `${results.length}개 용어를 찾았습니다.`
        : '검색 결과가 없습니다. 문제의 다른 단어나 뜻으로 찾아보세요.';

    results.forEach(term => {
        const item = document.createElement('article');
        item.className = 'quiz-dictionary-result';

        const copy = document.createElement('div');
        const name = document.createElement('h3');
        const definition = document.createElement('p');
        name.textContent = term.term;
        definition.textContent = term.definition;
        copy.append(name, definition);

        const useButton = document.createElement('button');
        useButton.type = 'button';
        useButton.className = 'text-button quiz-dictionary-use';
        useButton.textContent = '답안에 넣기';
        useButton.addEventListener('click', () => {
            const input = getQuizInput();
            if (!input) return;
            input.value = getShortTermName(term.term);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            quizDictionaryDialog.close();
        });

        item.append(copy);
        if (getQuizInput() && !answered) item.append(useButton);
        quizDictionaryResults.appendChild(item);
    });
}

function openQuizDictionary() {
    if (!quizDictionaryDialog || !quizScreen.classList.contains('active')) return;
    clearAutoAdvanceTimer();
    quizDictionarySearch.value = '';
    renderQuizDictionaryResults('');
    quizDictionaryDialog.showModal();
    window.setTimeout(() => quizDictionarySearch.focus(), 0);
}

function closeQuizDictionary() {
    if (quizDictionaryDialog?.open) quizDictionaryDialog.close();
}

// 답안 선택 함수들
function selectOption(optionDiv, value) {
    if (answered) return;
    const question = currentQuestions[currentQuestionIndex];
    
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    optionDiv.classList.add('selected');
    submitBtn.disabled = false;
    submitBtn.dataset.answer = value;
    if (shouldSubmitOnSelection(question.type)) submitAnswer();
}

function selectTrueFalse(button, value) {
    if (answered) return;
    const question = currentQuestions[currentQuestionIndex];
    
    document.querySelectorAll('.tf-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    submitBtn.disabled = false;
    submitBtn.dataset.answer = value;
    if (shouldSubmitOnSelection(question.type)) submitAnswer();
}

// 사용자 답변 복원 함수
function restoreUserAnswer(question, userAnswer, isCorrect) {
    if (question.type === 'multiple-choice') {
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.add('disabled');
            opt.disabled = true;
            if (opt.textContent === question.correctAnswer) {
                opt.classList.add('correct');
            } else if (opt.textContent === userAnswer && !isCorrect) {
                opt.classList.add('incorrect');
                opt.classList.add('selected');
            } else if (opt.textContent === userAnswer && isCorrect) {
                opt.classList.add('selected');
            }
        });
    } else if (question.type === 'short-answer' || question.type === 'application') {
        const input = answerOptions.querySelector('.text-input');
        input.value = userAnswer;
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
        input.disabled = true;
    } else if (question.type === 'true-false') {
        document.querySelectorAll('.tf-button').forEach(btn => {
            btn.disabled = true;
            if ((btn.textContent.includes('참') && question.correctAnswer) || 
                (btn.textContent.includes('거짓') && !question.correctAnswer)) {
                btn.classList.add('correct');
            } else if (((btn.textContent.includes('참') && userAnswer === true) ||
                      (btn.textContent.includes('거짓') && userAnswer === false)) && !isCorrect) {
                btn.classList.add('incorrect');
                btn.classList.add('selected');
            } else if (((btn.textContent.includes('참') && userAnswer === true) ||
                      (btn.textContent.includes('거짓') && userAnswer === false)) && isCorrect) {
                btn.classList.add('selected');
            }
        });
    }
}

// 답안 제출
function submitAnswer() {
    if (answered) return;
    
    const question = currentQuestions[currentQuestionIndex];
    let userAnswer;
    let isCorrect;
    
    if (question.type === 'multiple-choice') {
        userAnswer = submitBtn.dataset.answer;
        isCorrect = userAnswer === question.correctAnswer;
    } else if (question.type === 'short-answer') {
        userAnswer = answerOptions.querySelector('.text-input').value.trim();
        
        // 🌟 고급 답안 검증 - 영어/한글 답변 모두 인정
        isCorrect = isAnswerCorrect(userAnswer, question.correctAnswer, question.fullTerm);
        
        // 디버깅: 답안 검증 과정 로그
        console.log('🔍 단답형 문제 채점:', {
            사용자답안: userAnswer,
            정답: question.correctAnswer,
            전체용어: question.fullTerm,
            채점결과: isCorrect ? '✅ 정답' : '❌ 오답'
        });
    } else if (question.type === 'application') {
        userAnswer = answerOptions.querySelector('.text-input').value.trim();
        
        // 🌟 고급 답안 검증 - 영어/한글 답변 모두 인정
        isCorrect = isAnswerCorrect(userAnswer, question.correctAnswer, question.fullTerm);
        
        // 디버깅: 답안 검증 과정 로그
        console.log('🔍 응용 문제 채점:', {
            사용자답안: userAnswer,
            정답: question.correctAnswer,
            전체용어: question.fullTerm,
            채점결과: isCorrect ? '✅ 정답' : '❌ 오답'
        });
    } else if (question.type === 'true-false') {
        userAnswer = submitBtn.dataset.answer === 'true';
        isCorrect = userAnswer === question.correctAnswer;
    }
    
    answered = true;
    quizDictionaryButton.classList.add('hidden');
    const feedbackModel = buildFeedbackModel(question, isCorrect);
    const answerRecord = {
        questionText: question.questionText,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        feedbackModel,
    };

    userAnswers.push(answerRecord);
    if (isCorrect) score++;

    const feedbackHtml = renderFeedbackHTML(feedbackModel, isCorrect);
    const feedbackClass = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    
    // 문제 상태 저장
    questionStates[currentQuestionIndex] = {
        answered: true,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        feedbackModel,
        feedback: feedbackHtml,
        feedbackClass: feedbackClass
    };

    showFeedback(feedbackModel, isCorrect);
    submitBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    nextBtn.innerHTML = currentQuestionIndex === currentQuestions.length - 1
        ? '결과 보기 <span aria-hidden="true">→</span>'
        : '다음 문제 <span aria-hidden="true">→</span>';
    const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
    const hasLearningDetail = Boolean(feedbackModel.summary || feedbackModel.sections.length);
    const willAutoAdvance = shouldAutoAdvance({
        isCorrect,
        isMotionReduced,
        hasLearningDetail,
    });
    questionActionHint.textContent = willAutoAdvance
        ? (isLastQuestion ? '잠시 후 결과를 표시합니다.' : '잠시 후 다음 문제로 자동 이동합니다.')
        : isLastQuestion
        ? '해설을 확인한 뒤 결과를 보세요.'
        : '해설을 확인한 뒤 다음 문제로 이동하세요.';

    updateQuestionActionsPosition();
    
    // 시각적 피드백
    if (question.type === 'multiple-choice') {
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.add('disabled');
            opt.disabled = true;
            if (opt.textContent === question.correctAnswer) {
                opt.classList.add('correct');
            } else if (opt.classList.contains('selected') && !isCorrect) {
                opt.classList.add('incorrect');
            }
        });
    } else if (question.type === 'short-answer' || question.type === 'application') {
        const input = answerOptions.querySelector('.text-input');
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
        input.disabled = true;
    } else if (question.type === 'true-false') {
        document.querySelectorAll('.tf-button').forEach(btn => {
            btn.disabled = true;
            if ((btn.textContent.includes('참') && question.correctAnswer) || 
                (btn.textContent.includes('거짓') && !question.correctAnswer)) {
                btn.classList.add('correct');
            } else if (btn.classList.contains('selected') && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
    }

    feedback.focus({ preventScroll: true });
    const visibleBottom = questionActions.classList.contains('is-docked')
        ? questionActions.getBoundingClientRect().top - 16
        : window.innerHeight;
    if (feedback.getBoundingClientRect().bottom > visibleBottom) {
        feedback.scrollIntoView({ behavior: isMotionReduced ? 'auto' : 'smooth', block: 'nearest' });
    }

    if (willAutoAdvance) {
        autoAdvanceTimer = window.setTimeout(nextQuestion, AUTO_ADVANCE_DELAY_MS);
    }
}

function renderFeedbackHTML(model, isCorrect) {
    const sections = model.sections.map(section => `
        <div class="feedback-comparison">
            <div>
                <span class="feedback-comparison__label">${escapeHTML(section.label)}</span>
                <strong>${escapeHTML(section.term)}</strong>
            </div>
            <p>${escapeHTML(section.definition)}</p>
        </div>
    `).join('');

    return `
        <h3 class="feedback__heading"><span aria-hidden="true">${isCorrect ? '✓' : '×'}</span>${escapeHTML(model.title)}</h3>
        ${model.summary ? `<p class="feedback__summary">${escapeHTML(model.summary)}</p>` : ''}
        ${sections}
    `;
}

function showFeedback(model, isCorrect) {
    feedback.innerHTML = renderFeedbackHTML(model, isCorrect);
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.classList.remove('hidden');
}

// 다음 문제
function nextQuestion() {
    clearAutoAdvanceTimer();
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
    } else {
        displayQuestion();
    }
}

// 결과 표시
function showResults() {
    const percentage = Math.round((score / currentQuestions.length) * 100);
    
    document.getElementById('score-percentage').textContent = `${percentage}%`;
    document.getElementById('correct-count').textContent = score;
    document.getElementById('total-count').textContent = currentQuestions.length;
    
    let message = '헷갈린 용어를 비교하면 다음 시도에서 더 빨라집니다.';
    if (percentage === 100) message = '모든 용어를 정확히 구분했습니다.';
    else if (percentage >= 80) message = '대부분 정확합니다. 아래 항목만 다시 확인해보세요.';
    else if (percentage >= 60) message = '기본 개념은 잡혔습니다. 헷갈린 정의를 비교해보세요.';
    document.getElementById('score-message').textContent = message;
    
    // 틀린 답안 표시
    const wrongAnswers = userAnswers.filter(answer => !answer.isCorrect);
    const wrongList = document.getElementById('wrong-list');
    
    if (wrongAnswers.length > 0) {
        document.getElementById('wrong-answers').style.display = 'block';
        wrongList.innerHTML = wrongAnswers
            .map((answer, index) => buildReviewItemHTML(answer, index))
            .join('');
    } else {
        document.getElementById('wrong-answers').style.display = 'none';
    }
    
    showScreen(resultScreen);
}

// 사전 기능 함수들
function searchTerms(query) {
    if (!query.trim()) {
        showWelcomeMessage();
        return;
    }
    
    const filtered = searchGlossaryTerms(termsData, query);
    
    showSearchResults(filtered, query);
}

function showSearchResults(results, query) {
    hideAllResults();
    
    const searchResultsDiv = document.getElementById('search-results');
    const resultsCountSpan = document.getElementById('results-count');
    const resultsListDiv = document.getElementById('results-list');
    
    if (searchResultsDiv) {
        searchResultsDiv.classList.remove('hidden');
        searchResultsDiv.style.display = 'block';
    }
    
    if (resultsCountSpan) {
        resultsCountSpan.textContent = `${results.length}개 결과`;
    }
    
    if (resultsListDiv) {
        if (results.length === 0) {
            resultsListDiv.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>"${escapeHTML(query)}"에 대한 검색 결과가 없습니다</h3>
                    <p>다른 검색어를 시도해보세요.</p>
                </div>
            `;
        } else {
            const itemsHtml = results.map(term => createTermItem(term)).join('');
            resultsListDiv.innerHTML = itemsHtml;
        }
    }
}

function showWelcomeMessage() {
    hideAllResults();
    const welcomeElement = document.querySelector('.welcome-message');
    if (welcomeElement) {
        welcomeElement.style.display = 'block';
    }
    
    // 용어 개수 업데이트
    updateTermsCount();
}

function updateTermsCount() {
    const termsCount = termsData ? termsData.length : 0;
    
    // 홈 화면 상단의 용어 개수 업데이트
    const homeTermsCountElement = document.getElementById('home-terms-count');
    if (homeTermsCountElement) {
        homeTermsCountElement.textContent = termsCount;
    }
    
    // 메인 화면 사전 카드의 용어 개수 업데이트
    const termsCountElement = document.getElementById('terms-count');
    if (termsCountElement) {
        termsCountElement.textContent = termsCount;
    }
    
    // 사전 화면의 용어 개수 업데이트
    const termsCountWelcomeElement = document.getElementById('terms-count-welcome');
    if (termsCountWelcomeElement) {
        termsCountWelcomeElement.textContent = termsCount;
    }
    
    console.log(`🎯 모든 UI의 용어 개수가 ${termsCount}개로 업데이트되었습니다.`);
}

function showAllTerms(sortMode = 'alphabetical') {
    hideAllResults();
    if (allTerms) {
        allTerms.classList.remove('hidden');
        allTerms.style.display = 'block';
    }
    
    let sorted = [...termsData];
    if (sortMode === 'alphabetical') {
        sorted.sort((a, b) => a.term.localeCompare(b.term, 'ko'));
    } else if (sortMode === 'category') {
        sorted.sort((a, b) => {
            const catA = getTermCategory(a.term);
            const catB = getTermCategory(b.term);
            if (catA === catB) {
                return a.term.localeCompare(b.term, 'ko');
            }
            return catA.localeCompare(catB, 'ko');
        });
    }
    
    if (termsList) {
        termsList.innerHTML = sorted.map(term => createTermItem(term)).join('');
    }
}

function hideAllResults() {
    const welcomeElement = document.querySelector('.welcome-message');
    if (welcomeElement) {
        welcomeElement.style.display = 'none';
    }
    
    const searchResultsDiv = document.getElementById('search-results');
    if (searchResultsDiv) {
        searchResultsDiv.classList.add('hidden');
        searchResultsDiv.style.display = 'none';
    }
    
    const allTermsDiv = document.getElementById('all-terms');
    if (allTermsDiv) {
        allTermsDiv.classList.add('hidden');
        allTermsDiv.style.display = 'none';
    }
}

function createTermItem(term) {
    const icon = getTermIcon(term.term);
    const category = getTermCategory(term.term);
    const registryTerm = IT_QUIZ_ONTOLOGY.termRegistry.find(item => item.label === term.term);
    const contextButton = registryTerm ? `<button class="text-button" type="button" data-gl-term="${escapeHTML(registryTerm.id)}">학습 위치와 연결 보기 →</button>` : '';
    
    // 정의에서 키워드 강조
    const highlightedDefinition = highlightKeywords(term.definition);
    
    return `
        <div class="term-item">
            <div class="term-header">
                <div class="term-icon">${icon}</div>
                <div class="term-title">
                    <h3 class="term-name">${term.term}</h3>
                    <span class="term-category">${category}</span>
                </div>
            </div>
            <p class="term-definition">${highlightedDefinition}</p>
            ${contextButton}
        </div>
    `;
}

function highlightKeywords(text) {
    // 중요한 키워드들을 강조 표시
    const keywords = [
        '프로그래밍', '개발', '웹', '애플리케이션', '시스템', '데이터',
        '사용자', '기능', '도구', '언어', '프레임워크', '라이브러리',
        '컴포넌트', '인터페이스', '프로토콜'
    ];
    
    let highlighted = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlighted = highlighted.replace(regex, '<strong>$1</strong>');
    });
    
    return highlighted;
}

function showSuggestions(query) {
    if (!query.trim() || !searchSuggestions) {
        if (searchSuggestions) {
            searchSuggestions.classList.remove('show');
        }
        return;
    }
    
    const suggestions = searchGlossaryTerms(termsData, query).slice(0, 5);
    
    if (suggestions.length === 0) {
        searchSuggestions.classList.remove('show');
        return;
    }
    
    searchSuggestions.innerHTML = suggestions.map(term => `
        <div class="suggestion-item" data-term="${term.term}">
            <div class="suggestion-icon">${getTermIcon(term.term)}</div>
            <div class="suggestion-text">
                <div class="suggestion-term">${term.term}</div>
                <div class="suggestion-definition">${term.definition.substring(0, 50)}...</div>
            </div>
        </div>
    `).join('');
    
    searchSuggestions.classList.add('show');
    
    // 제안 클릭 이벤트
    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const termName = item.dataset.term;
            if (searchInput) {
                searchInput.value = termName;
                searchTerms(termName);
                searchSuggestions.classList.remove('show');
            }
        });
    });
}

function resetSearch() {
    clearTimeout(searchTimeout);
    if (searchInput) {
        searchInput.value = '';
    }
    if (searchSuggestions) {
        searchSuggestions.classList.remove('show');
    }
    showWelcomeMessage();
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    // 접근성 초기화
    initializeAccessibility();
    
    // 초기 용어 개수 업데이트
    updateTermsCount();
    
    // 접근성 컨트롤 이벤트 (motion-toggle 제거됨)
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    learningMapController = ITQuizLearningMap.createLearningMapController({
        ontology: IT_QUIZ_ONTOLOGY,
        terms: termsData,
        onStartQuiz: pathId => {
            const path = ITQuizOntologyUtils.getLearningPath(IT_QUIZ_ONTOLOGY, pathId);
            const sourceTerms = ITQuizOntologyUtils.getTermsForQuiz(IT_QUIZ_ONTOLOGY, pathId, termsData);
            startQuiz('multiple-choice', { sourceTerms, scopeLabel: path.title });
        },
    });
    learningMapController.render();
    glossaryLearningController = ITQuizGlossaryLearning.mount({
        ontology: IT_QUIZ_ONTOLOGY,
        terms: termsData,
        onStartQuiz: pathId => learningMapController.startPathQuiz(pathId),
        onShowLearning: openLearningMap,
    });
    document.querySelectorAll('[data-app-page]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.appPage === 'learn') openLearningMap();
            else if (button.dataset.appPage === 'connections') openConnections();
            else if (button.dataset.appPage === 'search') openTermSearch();
            else if (!quizScreen.classList.contains('active')) showScreen(quizResumeScreen);
        });
    });
    window.addEventListener('popstate', restorePageFromHash);
    window.addEventListener('hashchange', restorePageFromHash);
    restorePageFromHash();
    document.querySelectorAll('[data-gl-reset]').forEach(button => {
        button.addEventListener('click', () => { resetSearch(); searchInput.focus(); });
    });
    document.querySelectorAll('[data-open-learning-map]').forEach(button => {
        button.addEventListener('click', openLearningMap);
    });
    
    // 퀴즈 유형 선택
    document.querySelectorAll('[data-type]').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            if (type === 'dictionary') {
                if (shouldOpenQuizDictionary({
                    isQuizActive: quizScreen.classList.contains('active'),
                    quizType: currentQuizType,
                    answered,
                })) {
                    openQuizDictionary();
                } else {
                    showScreen(dictionaryScreen);
                    resetSearch();
                }
            } else {
                startQuiz(type);
            }
        });
    });
    
    // 기본 버튼 이벤트
    submitBtn.addEventListener('click', submitAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    quizDictionaryButton.addEventListener('click', openQuizDictionary);
    quizDictionaryClose.addEventListener('click', closeQuizDictionary);
    quizDictionarySearch.addEventListener('input', event => renderQuizDictionaryResults(event.target.value));
    quizDictionaryDialog.addEventListener('click', event => {
        if (event.target === quizDictionaryDialog) closeQuizDictionary();
    });
    quizDictionaryDialog.addEventListener('close', () => {
        getQuizInput()?.focus();
        updateQuestionActionsPosition();
    });
    window.addEventListener('resize', updateQuestionActionsPosition);
    homeBtn.addEventListener('click', () => showScreen(homeScreen));
    restartBtn.addEventListener('click', () => startQuiz(currentQuizType, currentQuizScope));
    homeResultBtn.addEventListener('click', () => showScreen(homeScreen));
    if (showAllTermsBtn) showAllTermsBtn.addEventListener('click', () => { searchInput.value = ''; showAllTerms(); });

    // 사전 기능 이벤트
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            
            clearTimeout(searchTimeout);
            searchSuggestions.classList.remove('show');
            if (query.trim()) {
                searchTimeout = setTimeout(() => searchTerms(query), 200);
            } else {
                resetSearch();
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                const query = searchInput.value;
                searchTerms(query);
                searchSuggestions.classList.remove('show');
            } else if (e.key === 'Escape') {
                searchSuggestions.classList.remove('show');
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value;
            searchTerms(query);
            searchSuggestions.classList.remove('show');
        });
    }
    

    
    // 인기 용어 태그 클릭
    const allTermTags = document.querySelectorAll('.term-tag');
    allTermTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const term = tag.dataset.term;
            if (searchInput && term) {
                searchInput.value = term;
                searchTerms(term);
            }
        });
    });
    
    // 정렬 버튼
    const allSortBtns = document.querySelectorAll('.sort-btn');
    allSortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            allSortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSortMode = btn.dataset.sort;
            showAllTerms(currentSortMode);
        });
    });
    
    // 외부 클릭 시 제안 숨기기
    document.addEventListener('click', (e) => {
        if (searchInput && searchSuggestions &&
            !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.remove('show');
        }
    });
});
