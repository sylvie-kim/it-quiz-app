// 기준: Google Sheet 76개 + AI 프로덕트 마스터 용어사전에서 선별·재작성한 83개 + 공식 문서 기반 Express 1개
// 원문 위치: https://note26.colabstart.workers.dev/%EC%9A%A9%EC%96%B4%EC%82%AC%EC%A0%84/
// 정의는 퀴즈에서 정답이 직접 드러나지 않도록 짧게 재작성했습니다.
(function exposeTerms(root) {
    const terms = [
    {
        "term": "TDD(Test-Driven Development, 테스트 주도 개발)",
        "definition": "소프트웨어 개발 방법론 중 하나로, 실제 코드를 작성하기 전에 테스트 코드를 먼저 작성하고, 그 테스트를 통과시키는 코드를 개발하는 방식",
        "aliases": ["Test-Driven Development", "테스트 주도 개발"],
        "origin": "google-sheet"
    },
    {
        "term": "authController.js",
        "definition": "프로젝트에서 로그인·회원가입 같은 인증 요청을 처리하는 파일에 흔히 붙이는 이름입니다. 정해진 표준 파일명은 아니며, 사용 기술과 프로젝트 구조에 따라 이름과 역할이 달라집니다.",
        "origin": "google-sheet"
    },
    {
        "term": "Markup(마크업)",
        "definition": "문서나 데이터의 구조를 명확하게 정의하기 위해 태그 등을 이용하는 체계를 의미 . 단순히 텍스트를 꾸미는 것이 아니라, 컴퓨터가 문서의 각 부분을 이해하고 처리할 수 있도록 구조화하는 것이 핵심",
        "origin": "google-sheet"
    },
    {
        "term": "Markup language(마크업 언어)",
        "definition": "태그나 기호를 사용해 문서의 구조와 의미를 표현하는 언어로, HTML·XML·Markdown 등이 대표적입니다.",
        "origin": "google-sheet"
    },
    {
        "term": "VCS(버전 관리 시스템)",
        "definition": "소스 코드, 문서 등 파일의 변화를 시간 순서대로 기록해두었다가 원한다면 언제든지 특정 시점의 버전으로 되돌릴 수 있게 해주는 시스템",
        "origin": "google-sheet"
    },
    {
        "term": "High-Fidelity Design(하이파이 시안)",
        "definition": "UI/UX 디자인에서 최종 앱 혹은 웹의 실제 화면처럼 정교하게 시각화된 디자인 시안을 의미",
        "origin": "google-sheet"
    },
    {
        "term": "Selenium(셀레니움)",
        "definition": "웹 브라우저를 자동으로 제어할 수 있게 해주는 오픈소스 자동화 도구",
        "origin": "google-sheet"
    },
    {
        "term": "정적 렌더링",
        "definition": "페이지 내용을 빌드할 때 미리 HTML로 생성해 두고, 요청이 오면 준비된 파일을 전달하는 렌더링 방식입니다.",
        "origin": "google-sheet"
    },
    {
        "term": "클라이언트 렌더링",
        "definition": "브라우저에서 JavaScript가 데이터를 받아 화면의 HTML을 만들거나 갱신하는 렌더링 방식입니다.",
        "origin": "google-sheet"
    },
    {
        "term": "서버사이드 렌더링",
        "definition": "서버가 요청에 맞는 HTML을 생성해 브라우저에 전달하는 렌더링 방식입니다.",
        "origin": "google-sheet"
    },
    {
        "term": "SPA(Single Page Application)",
        "definition": "웹사이트 전체가 하나의 HTML 페이지로 구성되어 있고, 사용자가 페이지 내에서 이동하거나 상호작용할 때마다 전체 페이지를 새로고침하지 않고 필요한 부분만 동적으로 업데이트하는 웹 개발 방식",
        "origin": "google-sheet"
    },
    {
        "term": "Vanilla JS(바닐라 JS)",
        "definition": "외부의 라이브러리나 프레임워크(jQuery, React, Vue, Angular 등)를 사용하지 않고, 오직 순수한 자바스크립트만으로 웹 개발을 하는 방식을 의미",
        "origin": "google-sheet"
    },
    {
        "term": "Snippet(스니펫)",
        "definition": "재사용 가능한 작은 코드 조각으로, 반복적으로 사용되는 프로그래밍 로직이나 기능을 미리 저장해두고 쉽게 삽입할 수 있는 코드 템플릿",
        "origin": "google-sheet"
    },
    {
        "term": "Expo(엑스포)",
        "definition": "React Native 앱을 더 쉽게 개발하도록 파일 기반 라우팅, 네이티브 모듈과 개발 도구를 제공하는 오픈소스 프레임워크입니다.",
        "sourceUrl": "https://docs.expo.dev/",
        "origin": "google-sheet"
    },
    {
        "term": "Module(모듈)",
        "definition": "관련 코드와 값을 하나의 범위로 나누고, 필요한 기능을 다른 코드에서 가져오거나 내보낼 수 있게 만든 구성 단위입니다.",
        "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
        "origin": "google-sheet"
    },
    {
        "term": "JSON(JavaScript Object Notation)",
        "definition": "경량의 데이터 교환 형식으로, 텍스트 기반의 구조화된 데이터를 표현하고 직렬화하기 위한 개방형 표준 포맷",
        "origin": "google-sheet"
    },
    {
        "term": "npm",
        "definition": "JavaScript 패키지를 찾고 설치·관리·공유하는 데 사용하는 명령줄 도구이자 패키지 생태계입니다.",
        "sourceUrl": "https://docs.npmjs.com/about-npm/",
        "origin": "google-sheet"
    },
    {
        "term": "npm install",
        "definition": "Node.js 환경에서 \"이 프로젝트에 필요한 외부 라이브러리(의존성)를 한 번에 설치해줘\"라는 뜻의 명령어",
        "origin": "google-sheet"
    },
    {
        "term": "npm run dev",
        "definition": "package.json의 scripts에 dev라는 이름으로 등록된 작업을 실행하는 npm 명령어입니다. 실제 동작은 프로젝트 설정에 따라 달라집니다.",
        "origin": "google-sheet"
    },
    {
        "term": "npm run build",
        "definition": "package.json의 scripts에 build라는 이름으로 등록된 작업을 실행하는 npm 명령어입니다. 변환·번들링·최적화 여부는 프로젝트 설정에 따라 달라집니다.",
        "origin": "google-sheet"
    },
    {
        "term": "I/O",
        "definition": "컴퓨터나 프로그램에서 데이터를 입력받거나 출력하는 모든 과정을 의미",
        "origin": "google-sheet"
    },
    {
        "term": "비동기 I/O 처리",
        "definition": "컴퓨터 프로그램이 입력/출력(I/O) 작업을 요청한 뒤, 그 작업이 끝날 때까지 기다리지 않고 다른 작업을 계속할 수 있게 하는 방식",
        "origin": "google-sheet"
    },
    {
        "term": "TypeScript(타입스크립트)",
        "definition": "자바스크립트의 상위 집합 (Superset) 프로그래밍 언어로, 자바스크립트의 모든 기능을 그대로 사용하면서, 타입 지정, 인터페이스 등 추가 기능을 통해 대규모 애플리케이션 개발에 적합",
        "origin": "google-sheet"
    },
    {
        "term": "CLI(Command Line Interface)",
        "definition": "사용자가 키보드로 명령어를 입력하여 컴퓨터 운영체제나 소프트웨어와 직접 상호작용하는 텍스트 기반 인터페이스",
        "origin": "google-sheet"
    },
    {
        "term": "PowerShell(파워쉘)",
        "definition": "명령줄 셸(Command-line shell)과 스크립팅 언어(Scripting language). 마우스로 클릭클릭하지 않고, 글자로 명령어를 입력해서 컴퓨터에게 일을 시키는 프로그램.",
        "origin": "google-sheet"
    },
    {
        "term": "Interface(인터페이스)",
        "definition": "두 시스템, 장치, 소프트웨어, 또는 사람과 기계 사이에서 정보를 주고받을 수 있도록 해주는 접점이자, 소통을 위한 규칙 또는 매개체",
        "keywords": ["접점", "사람과 기계", "소통", "연결"],
        "origin": "google-sheet"
    },
    {
        "term": "UI(User Interface)",
        "definition": "사용자와 시스템 간의 상호작용 방식. 웹사이트나 앱에서 사용자가 보고 클릭하는 모든 시각적 기능적 요소.",
        "origin": "google-sheet"
    },
    {
        "term": "API(Application Programming Interface)",
        "definition": "소프트웨어(프로그램)와 소프트웨어 사이에서 데이터를 주고받거나 기능을 사용할 수 있도록 정해진 규칙(프로토콜)이나 방법(인터페이스)",
        "origin": "google-sheet"
    },
    {
        "term": "Protocol(프로토콜)",
        "definition": "두 개 이상의 시스템이 서로 통신할 때 반드시 따라야 하는 규칙이나 약속이며 통신의 기본 언어",
        "origin": "google-sheet"
    },
    {
        "term": "MCP(Model Context Protocol)",
        "definition": "AI 애플리케이션이 외부 도구와 데이터 소스에 연결할 때 공통된 방식으로 정보를 주고받도록 정한 개방형 프로토콜",
        "origin": "google-sheet"
    },
    {
        "term": "IDE(Integrated Development Environment)",
        "definition": "소프트웨어 개발에 필요한 다양한 도구를 하나로 통합한 개발 환경",
        "origin": "google-sheet"
    },
    {
        "term": "Vibe Coding(바이브코딩)",
        "definition": "자연어로 원하는 동작을 설명하고 AI가 만든 코드를 실행·확인·수정하며 소프트웨어를 개발하는 방식",
        "origin": "google-sheet"
    },
    {
        "term": "Library(라이브러리)",
        "definition": "개발에 자주 쓰이는 함수나 도구를 모아둔 코드 집합. 개발자가 필요할 때 호출하여 사용",
        "origin": "google-sheet"
    },
    {
        "term": "Framework(프레임워크)",
        "definition": "소프트웨어 개발에서 애플리케이션의 구조와 기본 기능을 미리 구현하여 개발자가 핵심 비즈니스 로직에 집중할 수 있게 해주는 개발 도구",
        "origin": "google-sheet"
    },
    {
        "term": "Ruby on Rails(줄여서 Rails, 레일스)",
        "definition": "Ruby 언어를 기반으로 한 웹 애플리케이션 개발 프레임워크로, 개발자 생산성과 빠른 개발을 강조하는 MVC 아키텍처 프레임워크",
        "aliases": ["Rails", "레일스"],
        "origin": "google-sheet"
    },
    {
        "term": "MVC(Model-View-Controller)",
        "definition": "소프트웨어 디자인 패턴으로, 애플리케이션의 로직을 세 가지 상호 연결된 요소로 분리하여 개발의 효율성과 유지보수성을 높이는 아키텍처",
        "origin": "google-sheet"
    },
    {
        "term": "React Native",
        "definition": "JavaScript와 React를 사용하여 iOS와 Android용 네이티브 모바일 앱을 개발할 수 있게 해주는 크로스 플랫폼 개발 도구",
        "origin": "google-sheet"
    },
    {
        "term": "Native",
        "definition": "특정 운영체제나 기기용 SDK와 기능을 직접 사용해 그 플랫폼에 맞는 앱을 개발하는 방식입니다.",
        "origin": "google-sheet"
    },
    {
        "term": "Flutter(플러터)",
        "definition": "Google에서 개발한 오픈소스 UI 소프트웨어 개발 키트로, 단일 코드베이스로 모바일, 웹, 데스크톱 애플리케이션을 cross-platform으로 개발할 수 있게 해주는 프레임워크. 개발언어는 Dart.",
        "origin": "google-sheet"
    },
    {
        "term": "Vue.js",
        "definition": "사용자 인터페이스(UI)와 단일 페이지 애플리케이션(SPA)을 구축하기 위한 자바스크립트 프레임워크.",
        "origin": "google-sheet"
    },
    {
        "term": "Tailwind CSS",
        "definition": "유틸리티 클래스 기반의 CSS 프레임워크. 즉, 미리 만들어진 다양한 CSS 클래스를 HTML의 class 속성에 직접 붙여서, 별도의 CSS 파일을 작성하지 않고도 웹 요소의 색상, 크기, 여백, 정렬, 그림자 등 다양한 스타일을 빠르게 적용",
        "origin": "google-sheet"
    },
    {
        "term": "HTML",
        "definition": "웹페이지의 구조와 내용을 정의하는 마크업 언어.  제목, 문단, 이미지, 표, 링크 등 콘텐츠의 뼈대를 정의. 정적이고 구조화된 정보를 제공.",
        "origin": "google-sheet"
    },
    {
        "term": "CSS",
        "definition": "HTML로 만들어진 구조에 디자인과 스타일을 입히는 언어. 색상, 글꼴, 레이아웃, 반응형 등 시각적인 요소를 조정해 웹페이지를 아름답게 만듭니다.",
        "origin": "google-sheet"
    },
    {
        "term": "JavaScript(자바스크립트)",
        "definition": "웹페이지에 동적인 기능과 상호작용을 추가하기 위해 만들어진 프로그래밍 언어. 버튼 클릭, 애니메이션, 데이터 갱신 등 사용자의 행동에 반응하는 다양한 기능을 구현할 수 있게 해줍니다.",
        "origin": "google-sheet"
    },
    {
        "term": "React(리액트)",
        "definition": "사용자 인터페이스를 효율적으로 만들기 위한 JavaScript 기반 라이브러리. 웹 애플리케이션의 사용자 인터페이스(UI)를 효율적으로 만들기 위해 사용",
        "origin": "google-sheet"
    },
    {
        "term": "Next.js",
        "definition": "React로 만든 웹 애플리케이션을 더 쉽고 효율적으로 개발할 수 있게 도와주는 프레임워크",
        "origin": "google-sheet"
    },
    {
        "term": "DOM(Document Object Model)",
        "definition": "HTML, XML 문서의 프로그래밍 인터페이스로, 문서의 구조를 트리 형태의 객체로 표현하여 프로그래밍 언어가 문서의 내용, 구조, 스타일을 동적으로 접근하고 수정할 수 있게 해주는 모델",
        "origin": "google-sheet"
    },
    {
        "term": "Virtual DOM",
        "definition": "실제 DOM의 가벼운 복사본을 메모리에 저장하고, 변경 사항을 효율적으로 비교하여 실제 DOM 업데이트를 최소화하는 렌더링 최적화 기술",
        "origin": "google-sheet"
    },
    {
        "term": "Component(컴포넌트)",
        "definition": "UI의 한 부분을 담당하는 작은 코드 조각",
        "origin": "google-sheet"
    },
    {
        "term": "Reactive Component(리액티브 컴포넌트)",
        "definition": "데이터 변경에 따라 자동으로 UI가 업데이트되는 컴포넌트",
        "origin": "google-sheet"
    },
    {
        "term": "Node.js",
        "definition": "자바스크립트를 웹 브라우저 밖, 즉 서버나 컴퓨터의 터미널 등에서 실행할 수 있게 해주는 자바스크립트 런타임 환경. 자바스크립트 코드를 컴퓨터에서 직접 실행할 수 있도록 해줍니다",
        "origin": "google-sheet"
    },
    {
        "term": "Runtime(런타임)",
        "definition": "프로그래밍 언어가 동작하는 실행 공간이자 환경을 뜻하는 개념",
        "origin": "google-sheet"
    },
    {
        "term": "Rendering(렌더링)",
        "definition": "컴퓨터가 데이터나 코드로 작성된 내용을 화면에 시각적으로 표현하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Routing(라우팅)",
        "definition": "URL·API 요청 또는 네트워크 데이터를 알맞은 화면, 처리 함수나 목적지로 보내기 위해 경로를 정하는 과정입니다.",
        "sourceUrl": "https://developer.mozilla.org/en-US/docs/Glossary/Router",
        "origin": "google-sheet"
    },
    {
        "term": "Wireframe(와이어프레임)",
        "definition": "디지털 제품의 구조와 레이아웃을 단순화된 형태로 시각화한 설계도",
        "origin": "google-sheet"
    },
    {
        "term": "Prototype(프로토타입)",
        "definition": "사용자 인터랙션과 화면 전환 등 실제 사용성을 테스트할 수 있도록 구현하여 실제 제품과 유사하게 동작하는 시뮬레이션 버전",
        "origin": "google-sheet"
    },
    {
        "term": "Compile(컴파일)",
        "definition": "소스 코드를 실행 가능한 기계어·바이트코드 또는 다른 형태의 코드로 변환하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Execution(실행)",
        "definition": "컴퓨터나 런타임이 프로그램의 명령을 읽고 실제 동작을 수행하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Hosting(호스팅)",
        "definition": "웹사이트, 애플리케이션 등 다양한 서비스를 인터넷에 공개하고, 외부에서 접근할 수 있도록 서버의 공간이나 기능을 임대해 주는 서비스",
        "origin": "google-sheet"
    },
    {
        "term": "Parsing(파싱)",
        "definition": "입력된 데이터(주로 문자열)를 분석하여 의미 있는 구조(예: 토큰, 트리 등)로 변환하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Crawling(크롤링)",
        "definition": "웹페이지의 링크를 따라가며 여러 페이지를 자동으로 발견하고 방문하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Scraping(스크래핑)",
        "definition": "웹페이지에서 필요한 텍스트나 표 같은 특정 정보를 추출해 구조화하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Object(객체)",
        "definition": "여러 데이터(속성, property, attribute)와 그 데이터를 다루는 기능(메서드, method)을 하나로 묶은 단위",
        "origin": "google-sheet"
    },
    {
        "term": "Refactoring(리팩토링)",
        "definition": "코드의 외부 동작(기능)은 그대로 유지하면서 내부 구조를 개선하는 과정",
        "origin": "google-sheet"
    },
    {
        "term": "Token(토큰)",
        "definition": "언어 모델이 텍스트를 처리하기 위해 나눈 단위로, 글자·단어의 일부·단어·구두점 등이 하나의 토큰이 될 수 있습니다.",
        "sourceUrl": "https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens",
        "origin": "google-sheet"
    },
    {
        "term": "Tree(트리)",
        "definition": "데이터를 계층적(위계적)으로 표현하는 자료구조로, 여러 개의 노드(데이터 단위)가 연결되어 뻗어 있는 구조",
        "origin": "google-sheet"
    },
    {
        "term": "HTTP(Hypertext Transfer Protocol)",
        "definition": "웹에서 데이터를 주고받기 위해 사용되는 대표적인 통신 규약(프로토콜)",
        "origin": "google-sheet"
    },
    {
        "term": "CDN(Content Delivery Network)",
        "definition": "전 세계 여러 지역에 분산된 서버 네트워크를 통해 웹 콘텐츠를 사용자와 가까운 곳에서 빠르고 효율적으로 전달하는 시스템",
        "origin": "google-sheet"
    },
    {
        "term": "PWA(Progressive Web App)",
        "definition": "설치 가능한 앱과 비슷한 사용 경험을 제공하도록 만든 웹 애플리케이션입니다. 오프라인 동작이나 푸시 알림은 구현과 기기 지원 여부에 따라 달라집니다.",
        "origin": "google-sheet"
    },
    {
        "term": "SDK(Software Development Kit)",
        "definition": "특정 플랫폼이나 서비스용 소프트웨어를 개발하는 데 필요한 API, 라이브러리, 문서, 빌드·테스트 도구 등을 모아 제공하는 개발 키트입니다.",
        "sourceUrl": "https://developer.android.com/tools",
        "origin": "google-sheet"
    },
    {
        "term": "CRUD(Create, Read, Update, Delete)",
        "definition": "백엔드 개발에서 데이터를 다루는 네 가지 기본 작업을 의미하는 용어",
        "aliases": ["Create, Read, Update, Delete"],
        "origin": "google-sheet"
    },
    {
        "term": "App.jsx",
        "definition": "React 프로젝트에서 App 컴포넌트를 작성할 때 자주 쓰는 파일명입니다. 필수 표준은 아니며 파일명과 역할은 프로젝트 구성에 따라 달라집니다.",
        "sourceUrl": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started",
        "origin": "google-sheet"
    },
    {
        "term": "MUI(Material UI)",
        "definition": "React 기반의 오픈 소스 UI 컴포넌트 라이브러리",
        "origin": "google-sheet"
    },
    {
        "term": "Hard coding(하드코딩)",
        "definition": "프로그램에서 변할 수 있는 값이나 설정, 데이터 등을 코드 내부에 직접 고정된 값(리터럴)으로 작성하는 것을 의미",
        "origin": "google-sheet"
    },
    {
        "term": "Vite(비트)",
        "definition": "프론트엔드 빌드 도구로, React, Vue, Svelte 등 다양한 프레임워크와 함께 사용할 수 있으며, 빠르고 간결한 모던 웹 프로젝트 개발 경험을 제공",
        "origin": "google-sheet"
    },
    {
        "term": "Console(콘솔)",
        "definition": "컴퓨터 프로그램의 입출력을 처리하는 텍스트 기반 인터페이스로, 개발자들이 프로그램의 상태를 확인하고 디버깅하는 데 사용되는 도구",
        "origin": "google-sheet"
    },
    {
        "term": "포트폴리오",
        "definition": "만든 결과물과 문제 해결 과정을 한곳에 모아, 자신의 경험과 역량을 다른 사람에게 보여주는 자료 모음입니다.",
        "category": "concepts",
        "icon": "📁",
        "origin": "source-glossary"
    },
    {
        "term": "팀 빌딩",
        "definition": "프로젝트를 함께할 사람을 정하고 각자의 강점, 역할, 협업 방식과 일정 원칙을 맞추는 과정입니다.",
        "category": "concepts",
        "icon": "🤝",
        "origin": "source-glossary"
    },
    {
        "term": "생성형 AI",
        "definition": "학습한 패턴을 바탕으로 글, 이미지, 코드, 음성처럼 새로운 콘텐츠를 만들어 내는 인공지능입니다.",
        "category": "concepts",
        "icon": "✨",
        "origin": "source-glossary"
    },
    {
        "term": "GPT",
        "definition": "방대한 텍스트를 미리 학습한 뒤 문맥에 맞는 다음 토큰을 생성하는 OpenAI의 언어 모델 계열입니다.",
        "category": "concepts",
        "icon": "🔠",
        "origin": "source-glossary"
    },
    {
        "term": "프롬프트 엔지니어링",
        "definition": "인공지능이 원하는 형식과 수준의 결과를 내도록 목적, 맥락, 제약 조건과 예시를 명확하게 설계하는 방법입니다.",
        "category": "concepts",
        "icon": "📝",
        "origin": "source-glossary"
    },
    {
        "term": "GitHub",
        "definition": "Git 저장소를 온라인에 보관하고 변경 이력 관리, 협업, 코드 검토와 자동화를 지원하는 서비스입니다.",
        "category": "deployment",
        "icon": "🐙",
        "origin": "source-glossary"
    },
    {
        "term": "GitHub Pages",
        "definition": "GitHub 저장소의 정적 HTML·CSS·JavaScript 파일을 무료 웹사이트로 공개하는 호스팅 기능입니다.",
        "category": "deployment",
        "icon": "🌐",
        "origin": "source-glossary"
    },
    {
        "term": "GitHub Actions",
        "definition": "저장소의 push나 pull request 같은 이벤트에 맞춰 테스트·빌드·배포 작업을 자동 실행하는 기능입니다.",
        "category": "tools",
        "icon": "⚙️",
        "origin": "source-glossary"
    },
    {
        "term": "Cloudflare Pages",
        "definition": "Git 저장소나 업로드한 파일에서 웹사이트를 빌드·배포하고, Pages Functions로 서버 기능도 추가할 수 있는 Cloudflare의 웹 배포 서비스입니다.",
        "category": "deployment",
        "icon": "☁️",
        "sourceUrl": "https://developers.cloudflare.com/pages/",
        "origin": "source-glossary"
    },
    {
        "term": "Vercel",
        "definition": "Git 저장소의 웹 프로젝트를 자동 빌드·배포하고 미리보기 주소를 제공하는 호스팅 플랫폼입니다.",
        "category": "deployment",
        "icon": "▲",
        "origin": "source-glossary"
    },
    {
        "term": "Netlify",
        "definition": "정적 사이트와 프론트엔드 프로젝트의 자동 빌드, 배포, 미리보기와 폼 기능 등을 제공하는 플랫폼입니다.",
        "category": "deployment",
        "icon": "🪂",
        "origin": "source-glossary"
    },
    {
        "term": "크로스플랫폼 개발",
        "definition": "하나의 코드 기반으로 iOS, Android, 웹처럼 서로 다른 운영 환경에서 동작하는 앱을 만드는 방식입니다.",
        "category": "concepts",
        "icon": "🧩",
        "origin": "source-glossary"
    },
    {
        "term": "앱스토어 배포",
        "definition": "완성한 모바일 앱을 심사 기준에 맞춰 등록하고 사용자가 내려받을 수 있도록 공개하는 과정입니다.",
        "category": "deployment",
        "icon": "🏪",
        "origin": "source-glossary"
    },
    {
        "term": "TXT",
        "definition": "글자 정보만 저장하며 글꼴·색상 같은 서식이 없는 가장 단순한 일반 텍스트 파일 형식입니다.",
        "category": "concepts",
        "icon": "📃",
        "origin": "source-glossary"
    },
    {
        "term": "Markdown (MD)",
        "definition": "#, *, - 같은 간단한 기호로 제목·강조·목록·링크 구조를 표현하는 가벼운 문서 작성 형식입니다.",
        "category": "concepts",
        "icon": "📝",
        "origin": "source-glossary"
    },
    {
        "term": ".env 파일",
        "definition": "API 키와 환경별 설정값을 소스 코드와 분리해 이름과 값의 형태로 저장하는 설정 파일입니다.",
        "category": "concepts",
        "icon": "🔑",
        "origin": "source-glossary"
    },
    {
        "term": ".gitignore",
        "definition": "Git이 아직 추적하지 않는 파일 중에서 비밀 설정, 의존성, 빌드 결과물처럼 제외할 파일·폴더 패턴을 지정하는 파일입니다. 이미 추적 중인 파일에는 새 규칙이 자동 적용되지 않습니다.",
        "category": "concepts",
        "icon": "🚫",
        "sourceUrl": "https://git-scm.com/docs/gitignore",
        "origin": "source-glossary"
    },
    {
        "term": "shadcn/ui",
        "definition": "필요한 UI 컴포넌트의 소스 코드를 프로젝트로 복사해 직접 수정하며 사용하는 React 기반 구성요소 모음입니다.",
        "category": "tools",
        "icon": "🧩",
        "origin": "source-glossary"
    },
    {
        "term": "Claude Code",
        "definition": "터미널에서 저장소의 파일을 읽고 수정하며 명령 실행과 검증까지 수행하는 Anthropic의 코딩 에이전트입니다.",
        "category": "tools",
        "icon": "⌨️",
        "origin": "source-glossary"
    },
    {
        "term": "Codex",
        "definition": "저장소를 탐색하고 코드를 작성·수정하며 테스트를 실행할 수 있는 OpenAI의 코딩 에이전트입니다.",
        "category": "tools",
        "icon": "🤖",
        "origin": "source-glossary"
    },
    {
        "term": "Visual Studio Code",
        "definition": "문법 강조, 자동완성, 디버깅과 확장 기능을 제공하는 Microsoft의 무료 코드 편집기입니다.",
        "category": "tools",
        "icon": "🟦",
        "origin": "source-glossary"
    },
    {
        "term": "cmux",
        "definition": "여러 터미널과 코딩 에이전트 작업을 한 화면에서 나누어 관리할 수 있는 macOS용 터미널 환경입니다.",
        "category": "tools",
        "icon": "🖥️",
        "origin": "source-glossary"
    },
    {
        "term": "wmux",
        "definition": "여러 명령줄 작업과 코딩 에이전트를 한 창에서 병렬로 관리할 수 있도록 만든 Windows용 터미널 도구입니다.",
        "category": "tools",
        "icon": "🪟",
        "origin": "source-glossary"
    },
    {
        "term": "Antigravity",
        "definition": "코드 편집 화면에 인공지능 에이전트 기능을 통합해 파일 수정과 실행을 지원하는 Google의 개발 도구입니다.",
        "category": "tools",
        "icon": "🛸",
        "origin": "source-glossary"
    },
    {
        "term": "Streamlit",
        "definition": "Python 코드만으로 입력창, 표, 차트가 있는 데이터·인공지능 웹앱을 빠르게 만드는 프레임워크입니다.",
        "category": "tools",
        "icon": "🎈",
        "origin": "source-glossary"
    },
    {
        "term": "Electron",
        "definition": "HTML·CSS·JavaScript 웹 기술로 Windows, macOS, Linux용 데스크톱 앱을 만드는 프레임워크입니다.",
        "category": "tools",
        "icon": "⚛️",
        "origin": "source-glossary"
    },
    {
        "term": "Tauri",
        "definition": "웹 기술로 화면을 만들고 Rust 기반의 가벼운 실행부를 사용해 데스크톱 앱을 만드는 프레임워크입니다.",
        "category": "tools",
        "icon": "🪶",
        "origin": "source-glossary"
    },
    {
        "term": "커밋 사이클",
        "definition": "변경 상태 확인, 필요한 파일 선택, 변경 기록 생성, 원격 저장소 전송으로 이어지는 Git 작업 흐름입니다.",
        "category": "concepts",
        "icon": "🔄",
        "origin": "source-glossary"
    },
    {
        "term": "브랜치",
        "definition": "다른 작업에 영향을 주지 않고 기능이나 실험을 진행하도록 Git 변경 이력을 독립된 줄기로 나눈 것입니다.",
        "category": "concepts",
        "icon": "🌿",
        "origin": "source-glossary"
    },
    {
        "term": "Fetch",
        "definition": "원격 저장소의 새 커밋과 브랜치 정보를 로컬로 가져오되 현재 작업 파일에는 바로 합치지 않는 명령입니다.",
        "category": "concepts",
        "icon": "📥",
        "origin": "source-glossary"
    },
    {
        "term": "Merge",
        "definition": "서로 다른 Git 변경 이력을 하나의 브랜치에 결합하고 충돌이 있으면 해결하는 작업입니다.",
        "category": "concepts",
        "icon": "🔀",
        "origin": "source-glossary"
    },
    {
        "term": "UX",
        "definition": "사용자가 제품을 발견하고 배우고 사용하는 전체 과정에서 느끼는 편리함, 만족도와 문제 해결 경험입니다.",
        "category": "design",
        "icon": "🙂",
        "origin": "source-glossary"
    },
    {
        "term": "Figma",
        "definition": "브라우저에서 여러 사람이 함께 화면을 설계하고 프로토타입과 디자인 시스템을 관리하는 협업 도구입니다.",
        "category": "design",
        "icon": "🎨",
        "origin": "source-glossary"
    },
    {
        "term": "PNG",
        "definition": "투명 배경과 무손실 압축을 지원해 로고, 아이콘, 화면 캡처에 자주 쓰이는 이미지 파일 형식입니다.",
        "category": "design",
        "icon": "🖼️",
        "origin": "source-glossary"
    },
    {
        "term": "JPG",
        "definition": "사진을 작은 용량으로 저장하는 데 적합하지만 반복 저장 시 품질이 줄어드는 손실 압축 이미지 형식입니다.",
        "category": "design",
        "icon": "📷",
        "origin": "source-glossary"
    },
    {
        "term": "Claude Design",
        "definition": "자연어 설명을 바탕으로 웹 화면의 구조와 시각적 초안을 생성하도록 돕는 Anthropic 계열 디자인 도구입니다.",
        "category": "design",
        "icon": "🟠",
        "origin": "source-glossary"
    },
    {
        "term": "Figma Make",
        "definition": "Figma 안에서 자연어 요청을 바탕으로 동작 가능한 화면 초안과 프로토타입을 만드는 기능입니다.",
        "category": "design",
        "icon": "✨",
        "origin": "source-glossary"
    },
    {
        "term": "사용자 테스트",
        "definition": "목표 사용자가 제품이나 시제품을 직접 사용하게 하고 행동·막힘·반응을 관찰해 문제점을 찾는 검증 방법입니다.",
        "category": "design",
        "icon": "🧪",
        "origin": "source-glossary"
    },
    {
        "term": "랜딩페이지",
        "definition": "광고나 링크를 통해 처음 도착한 방문자에게 핵심 가치와 하나의 주요 행동을 안내하는 웹페이지입니다.",
        "category": "concepts",
        "icon": "🛬",
        "origin": "source-glossary"
    },
    {
        "term": "Lovable",
        "definition": "자연어로 원하는 웹앱을 설명하면 화면과 기능 코드를 생성하고 배포까지 연결하는 개발 도구입니다.",
        "category": "tools",
        "icon": "💜",
        "origin": "source-glossary"
    },
    {
        "term": "V0",
        "definition": "자연어와 이미지를 바탕으로 React 기반 UI 코드를 생성하는 Vercel의 화면 제작 도구입니다.",
        "category": "tools",
        "icon": "▲",
        "origin": "source-glossary"
    },
    {
        "term": "Google AI Studio",
        "definition": "Google의 생성형 인공지능 모델을 브라우저에서 시험하고 프롬프트와 API 코드를 만들 수 있는 도구입니다.",
        "category": "tools",
        "icon": "🧪",
        "origin": "source-glossary"
    },
    {
        "term": "Firebase",
        "definition": "인증, 데이터베이스, 파일 저장, 호스팅과 알림 같은 앱 백엔드 기능을 제공하는 Google 플랫폼입니다.",
        "category": "tools",
        "icon": "🔥",
        "origin": "source-glossary"
    },
    {
        "term": "Supabase",
        "definition": "PostgreSQL 데이터베이스를 중심으로 인증, 파일 저장, 실시간 기능과 API를 제공하는 백엔드 플랫폼입니다.",
        "category": "tools",
        "icon": "⚡",
        "origin": "source-glossary"
    },
    {
        "term": "인증",
        "definition": "사용자가 누구인지 비밀번호, 일회용 코드, 소셜 로그인 등의 방법으로 확인하는 절차입니다.",
        "category": "concepts",
        "icon": "🔐",
        "origin": "source-glossary"
    },
    {
        "term": "클라이언트-서버 구조",
        "definition": "화면과 입력을 담당하는 쪽이 요청을 보내고, 중앙 시스템이 데이터와 기능을 처리해 응답하는 구조입니다.",
        "category": "concepts",
        "icon": "↔️",
        "origin": "source-glossary"
    },
    {
        "term": "프론트엔드 / 백엔드",
        "definition": "사용자에게 보이는 화면 영역과 서버에서 데이터·규칙·보안을 처리하는 영역을 구분한 개념입니다.",
        "category": "concepts",
        "icon": "🧱",
        "origin": "source-glossary"
    },
    {
        "term": "린 스타트업",
        "definition": "작은 가설을 빠르게 만들고 측정한 뒤 학습하여 다음 제품 결정을 반복하는 사업 개발 방식입니다.",
        "category": "concepts",
        "icon": "🔁",
        "origin": "source-glossary"
    },
    {
        "term": "비즈니스 모델 캔버스",
        "definition": "고객, 가치 제안, 채널, 수익과 비용 등 사업의 핵심 요소를 아홉 칸에 정리하는 기획 도구입니다.",
        "category": "concepts",
        "icon": "🗂️",
        "origin": "source-glossary"
    },
    {
        "term": "페르소나",
        "definition": "조사한 사용자 특성을 바탕으로 목표, 행동, 어려움을 대표하도록 만든 구체적인 가상 사용자상입니다.",
        "category": "concepts",
        "icon": "👤",
        "origin": "source-glossary"
    },
    {
        "term": "Google Auth",
        "definition": "Google 계정을 이용해 별도 비밀번호 없이 서비스에 로그인하도록 연결하는 OAuth 기반 인증 방식입니다.",
        "category": "tools",
        "icon": "🔑",
        "origin": "source-glossary"
    },
    {
        "term": "PDF",
        "definition": "운영체제와 프로그램이 달라도 문서의 글꼴과 배치를 거의 동일하게 보여주는 문서 파일 형식입니다.",
        "category": "concepts",
        "icon": "📄",
        "origin": "source-glossary"
    },
    {
        "term": "Python",
        "definition": "읽기 쉬운 문법과 다양한 라이브러리를 갖춰 자동화, 데이터 분석, 인공지능과 웹 개발에 널리 쓰이는 언어입니다.",
        "category": "languages",
        "icon": "🐍",
        "origin": "source-glossary"
    },
    {
        "term": "NumPy",
        "definition": "다차원 숫자 배열과 빠른 수치 계산 기능을 제공하는 Python 라이브러리입니다.",
        "category": "data",
        "icon": "🔢",
        "origin": "source-glossary"
    },
    {
        "term": "pandas",
        "definition": "표 형태의 데이터를 불러오고 정리·변환·집계하는 기능을 제공하는 Python 라이브러리입니다.",
        "category": "data",
        "icon": "🐼",
        "origin": "source-glossary"
    },
    {
        "term": "CSV",
        "definition": "각 행의 값을 쉼표로 구분해 표 형태의 데이터를 단순한 텍스트로 저장하는 파일 형식입니다.",
        "category": "data",
        "icon": "📊",
        "origin": "source-glossary"
    },
    {
        "term": "XLSX (엑셀)",
        "definition": "여러 시트, 수식, 서식과 차트를 담을 수 있는 Microsoft Excel 통합 문서 파일 형식입니다.",
        "category": "data",
        "icon": "📗",
        "origin": "source-glossary"
    },
    {
        "term": "Jupyter Notebook (.ipynb)",
        "definition": "설명 글, 실행 가능한 코드와 결과를 셀 단위로 함께 저장하는 대화형 분석 문서 형식입니다.",
        "category": "data",
        "icon": "📓",
        "origin": "source-glossary"
    },
    {
        "term": "Matplotlib",
        "definition": "선, 막대, 산점도 등 다양한 정적 그래프를 만드는 Python 시각화 라이브러리입니다.",
        "category": "data",
        "icon": "📈",
        "origin": "source-glossary"
    },
    {
        "term": "Plotly",
        "definition": "확대, 이동, 도구 설명 같은 상호작용이 가능한 차트를 만드는 시각화 라이브러리입니다.",
        "category": "data",
        "icon": "📉",
        "origin": "source-glossary"
    },
    {
        "term": "데이터 분석",
        "definition": "자료를 정리·변환·비교하고 패턴과 근거를 찾아 질문에 답하거나 의사결정을 지원하는 과정입니다.",
        "category": "data",
        "icon": "🔎",
        "origin": "source-glossary"
    },
    {
        "term": "머신러닝",
        "definition": "명시적인 규칙을 모두 작성하는 대신 데이터의 패턴을 학습해 분류나 추정 작업을 수행하게 하는 방법입니다.",
        "category": "data",
        "icon": "🤖",
        "origin": "source-glossary"
    },
    {
        "term": "TensorFlow",
        "definition": "신경망과 수치 계산 모델을 만들고 학습·배포하도록 Google이 공개한 머신러닝 프레임워크입니다.",
        "category": "data",
        "icon": "🧠",
        "origin": "source-glossary"
    },
    {
        "term": "PyTorch",
        "definition": "Python 친화적인 사용법과 동적 계산 그래프를 제공하는 오픈소스 머신러닝 프레임워크입니다. 현재 Linux Foundation 산하 재단이 관리합니다.",
        "category": "data",
        "icon": "🔥",
        "origin": "source-glossary"
    },
    {
        "term": "Playwright",
        "definition": "실제 브라우저를 코드로 조작해 웹페이지 동작을 자동으로 검사하거나 데이터를 수집하는 도구입니다.",
        "category": "tools",
        "icon": "🎭",
        "origin": "source-glossary"
    },
    {
        "term": "RSS",
        "definition": "웹사이트의 새 글 제목, 요약과 링크를 표준화된 피드로 배포해 구독 프로그램이 자동으로 받아보게 하는 형식입니다.",
        "category": "concepts",
        "icon": "📡",
        "origin": "source-glossary"
    },
    {
        "term": "공공데이터 Open API",
        "definition": "정부·공공기관의 데이터를 정해진 요청과 응답 형식으로 프로그램에서 받아 사용할 수 있게 공개한 접점입니다.",
        "category": "data",
        "icon": "🏛️",
        "origin": "source-glossary"
    },
    {
        "term": "캐글",
        "definition": "데이터셋 공유, 분석 노트북과 머신러닝 경진대회를 제공하는 데이터 과학 온라인 플랫폼입니다.",
        "category": "data",
        "icon": "🏆",
        "origin": "source-glossary"
    },
    {
        "term": "딥러닝",
        "definition": "여러 층의 인공신경망이 대량의 데이터에서 복잡한 특징과 패턴을 학습하도록 하는 머신러닝 방식입니다.",
        "category": "data",
        "icon": "🕸️",
        "origin": "source-glossary"
    },
    {
        "term": "EDA",
        "definition": "본격적인 모델링 전에 통계와 시각화로 분포, 결측값, 이상값과 변수 관계를 살펴보는 탐색 과정입니다.",
        "category": "data",
        "icon": "🔍",
        "origin": "source-glossary"
    },
    {
        "term": "LLM",
        "definition": "매우 많은 텍스트를 학습해 문맥에 맞는 언어를 생성하고 요약·번역·질문 답변 등을 수행하는 대규모 모델입니다.",
        "category": "concepts",
        "icon": "💡",
        "origin": "source-glossary"
    },
    {
        "term": "컨텍스트 윈도우",
        "definition": "언어 모델이 한 번의 요청에서 참고할 수 있는 입력과 출력의 최대 토큰 범위입니다.",
        "category": "concepts",
        "icon": "🪟",
        "origin": "source-glossary"
    },
    {
        "term": "AI Agent",
        "definition": "목표를 받으면 필요한 단계를 정하고 도구를 호출하며 결과를 확인해 여러 단계의 일을 수행하는 인공지능 시스템입니다.",
        "category": "concepts",
        "icon": "🔁",
        "origin": "source-glossary"
    },
    {
        "term": "서브에이전트",
        "definition": "주 에이전트가 검색, 검토, 구현처럼 범위가 좁은 작업을 따로 맡기기 위해 호출하는 보조 에이전트입니다.",
        "category": "concepts",
        "icon": "🧵",
        "origin": "source-glossary"
    },
    {
        "term": "RAG",
        "definition": "질문과 관련된 외부 문서를 먼저 검색한 뒤 그 내용을 근거로 언어 모델이 답을 생성하게 하는 방식입니다.",
        "category": "concepts",
        "icon": "📖",
        "origin": "source-glossary"
    },
    {
        "term": "벡터DB",
        "definition": "문장이나 이미지의 의미를 숫자 좌표로 저장하고 서로 비슷한 항목을 빠르게 찾는 데 특화된 데이터베이스입니다.",
        "category": "concepts",
        "icon": "🧭",
        "origin": "source-glossary"
    },
    {
        "term": "Tool Calling",
        "definition": "언어 모델이 계산, 검색, 파일 작업 등을 수행하기 위해 정해진 형식으로 외부 함수나 API를 호출하는 방식입니다.",
        "category": "concepts",
        "icon": "🔧",
        "origin": "source-glossary"
    },
    {
        "term": "멀티모달",
        "definition": "텍스트, 이미지, 음성, 영상처럼 서로 다른 형태의 정보를 함께 이해하거나 생성할 수 있는 특성입니다.",
        "category": "concepts",
        "icon": "🌈",
        "origin": "source-glossary"
    },
    {
        "term": "LangChain",
        "definition": "언어 모델, 프롬프트, 검색과 외부 도구를 연결해 인공지능 애플리케이션 흐름을 구성하는 프레임워크입니다.",
        "category": "tools",
        "icon": "⛓️",
        "origin": "source-glossary"
    },
    {
        "term": "Notion MCP",
        "definition": "인공지능이 표준 연결 규격을 통해 Notion 페이지를 읽고 검색하거나 수정하도록 이어 주는 서버입니다.",
        "category": "tools",
        "icon": "🗒️",
        "origin": "source-glossary"
    },
    {
        "term": "MVP",
        "definition": "핵심 가설을 실제 사용자에게 가장 빠르게 검증할 수 있도록 꼭 필요한 기능만 담은 초기 제품입니다.",
        "category": "concepts",
        "icon": "🚀",
        "origin": "source-glossary"
    },
    {
        "term": "캡스톤",
        "definition": "과정에서 배운 여러 지식과 기술을 통합해 실제 문제를 해결하는 최종 종합 프로젝트입니다.",
        "category": "concepts",
        "icon": "🎓",
        "origin": "source-glossary"
    },
    {
        "term": "해커톤",
        "definition": "정해진 짧은 시간 동안 팀이 아이디어를 구현하고 작동하는 결과물을 만들어 발표하는 집중 개발 행사입니다.",
        "category": "concepts",
        "icon": "💡",
        "origin": "source-glossary"
    },
    {
        "term": "Express",
        "definition": "Node.js에서 웹 서버와 API를 쉽게 만들도록 돕는 프레임워크입니다. 주소별 요청을 처리하고, 로그인 검사 같은 공통 작업을 연결할 수 있습니다.",
        "category": "frameworks",
        "icon": "⚙️",
        "origin": "official-document",
        "sourceUrl": "https://expressjs.com/",
        "aliases": ["Express.js", "익스프레스"]
    }
];

    root.IT_QUIZ_BASE_TERMS = terms;
    if (typeof module === 'object' && module.exports) module.exports = terms;
})(typeof globalThis !== 'undefined' ? globalThis : window);
