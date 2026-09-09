# 관계 후보 검토 패킷 — 2026-09-05

정의문(`terms-data.js`)이 상대 용어를 직접 언급한 문장만 뽑은 **후보 20건**입니다. 전부 `INFERRED` 상태이며 제품 데이터(`ontology-data.js`)에는 아직 하나도 들어가 있지 않습니다.

## 검토 방법

각 항목의 **판정** 칸에 `승인` / `거절` / `수정: <올바른 관계>` 중 하나를 적습니다. 확인할 것은 네 가지입니다.

1. 관계 유형이 두 용어의 정의와 맞는가
2. 화살표 방향이 맞는가
3. 근거 문장이 그 관계를 직접 뒷받침하는가
4. 애매하면 거절한다 (빈칸으로 두지 않는다)

승인한 것만 사람이 `ontology-data.js`의 `relations`로 옮기며, 그때 `status: REVIEWED`와 검토 기록을 함께 적습니다.

## 관계 유형 사전

| 유형 | 뜻 |
|---|---|
| `is_a` | 종류 |
| `part_of` | 구성 |
| `prerequisite_of` | 먼저 학습 |
| `used_with` | 함께 사용 (양방향) |
| `runs_on` | 실행 환경 |
| `produces` | 결과 생성 |
| `deploys_to` | 배포 |
| `implements` | 구현 |
| `contrasts_with` | 차이 비교 (양방향) |
| `alternative_to` | 대안 (양방향) |

## 검토 결과 — 2026-09-05

콘텐츠 책임자 승인 기준으로 **승인 15건, 수정 1건, 거절 3건, 보류 1건**이다. 승인과 수정 합계 16건만 `ontology-data.js`의 `relations`에 `REVIEWED`로 옮긴다. 보류 1건(TypeScript → JavaScript)은 관계 사전에 상위 집합을 표현할 유형이 없어 다음 사전 확장 때 다시 본다.

## 후보 20건

### 1. authController.js → Node.js

- **관계**: 실행 환경(runs_on)
- **읽는 법**: authController.js은(는) Node.js 위에서 동작한다
- **근거 문장**: 이 파일은 주로 Node.js(Express) 기반 프로젝트에서 사용되며, 인증 로직을 담당하는 함수들이 구현되어 있습니다.
- **근거 출처**: `term-definition` / `term-authcontroller-js`
- **후보 ID**: `cand-authcontroller-js-runs-on-node-js`
- **판정**: 승인 — authController.js는 Node.js(Express) 기반 프로젝트에서 인증 로직을 담당하는 파일입니다.

### 2. Electron → JavaScript

- **관계**: 실행 환경(runs_on)
- **읽는 법**: Electron은(는) JavaScript 위에서 동작한다
- **근거 문장**: HTML·CSS·JavaScript 웹 기술로 Windows, macOS, Linux용 데스크톱 앱을 만드는 프레임워크입니다.
- **근거 출처**: `term-definition` / `term-electron`
- **후보 ID**: `cand-electron-runs-on-javascript`
- **판정**: 승인 — Electron은 HTML·CSS·JavaScript 웹 기술로 데스크톱 앱을 만듭니다.

### 3. Expo → React Native

- **관계**: 실행 환경(runs_on)
- **읽는 법**: Expo은(는) React Native 위에서 동작한다
- **근거 문장**: Facebook(Meta)이 만든 React Native 위에 구축된 플랫폼으로, 복잡한 네이티브 개발 환경 설정 없이도 모바일 앱을 만들 수 있게 해줍니다.
- **근거 출처**: `term-definition` / `term-expo`
- **후보 ID**: `cand-expo-runs-on-react-native`
- **판정**: 승인 — Expo는 React Native 위에 구축된 플랫폼입니다.

### 4. Figma Make → Figma

- **관계**: 결과 생성(produces)
- **읽는 법**: Figma Make은(는) Figma을(를) 만들어 낸다
- **근거 문장**: Figma 안에서 자연어 요청을 바탕으로 동작 가능한 화면 초안과 프로토타입을 만드는 기능입니다.
- **근거 출처**: `term-definition` / `term-figma-make`
- **후보 ID**: `cand-figma-make-produces-figma`
- **판정**: 수정: part_of — Figma Make는 Figma 안에서 동작하는 기능이므로 결과물 생성이 아니라 구성 관계입니다.

### 5. GitHub Pages → JavaScript

- **관계**: 함께 사용(used_with)
- **읽는 법**: GitHub Pages은(는) JavaScript와(과) 함께 쓴다
- **근거 문장**: GitHub 저장소의 정적 HTML·CSS·JavaScript 파일을 무료 웹사이트로 공개하는 호스팅 기능입니다.
- **근거 출처**: `term-definition` / `term-github-pages`
- **후보 ID**: `cand-github-pages-used-with-javascript`
- **판정**: 거절 — 정적 파일을 공개한다는 문장은 GitHub Pages와 JavaScript의 함께 사용 관계를 직접 뒷받침하지 않습니다.

### 6. Markdown → Markup language

- **관계**: 종류(is_a)
- **읽는 법**: Markdown은(는) Markup language의 한 종류다
- **근거 문장**: 태그나 기호를 사용해 문서의 구조와 의미를 표현하는 언어로, HTML·XML·Markdown 등이 대표적입니다.
- **근거 출처**: `term-definition` / `term-markup-language`
- **후보 ID**: `cand-markdown-is-a-markup-language`
- **판정**: 승인 — Markdown은 마크업 언어의 대표 사례로 정의문에 제시됩니다.

### 7. Matplotlib → Python

- **관계**: 실행 환경(runs_on)
- **읽는 법**: Matplotlib은(는) Python 위에서 동작한다
- **근거 문장**: 선, 막대, 산점도 등 다양한 정적 그래프를 만드는 Python 시각화 라이브러리입니다.
- **근거 출처**: `term-definition` / `term-matplotlib`
- **후보 ID**: `cand-matplotlib-runs-on-python`
- **판정**: 승인 — Matplotlib은 Python 시각화 라이브러리입니다.

### 8. MUI → React

- **관계**: 실행 환경(runs_on)
- **읽는 법**: MUI은(는) React 위에서 동작한다
- **근거 문장**: React 기반의 오픈 소스 UI 컴포넌트 라이브러리
- **근거 출처**: `term-definition` / `term-mui`
- **후보 ID**: `cand-mui-runs-on-react`
- **판정**: 승인 — MUI는 React 기반의 UI 컴포넌트 라이브러리입니다.

### 9. React Native → JavaScript

- **관계**: 함께 사용(used_with)
- **읽는 법**: React Native은(는) JavaScript와(과) 함께 쓴다
- **근거 문장**: JavaScript와 React를 사용하여 iOS와 Android용 네이티브 모바일 앱을 개발할 수 있게 해주는 크로스 플랫폼 개발 도구
- **근거 출처**: `term-definition` / `term-react-native`
- **후보 ID**: `cand-react-native-used-with-javascript`
- **판정**: 승인 — React Native는 JavaScript와 React를 사용해 모바일 앱을 개발합니다.

### 10. React → JavaScript

- **관계**: 실행 환경(runs_on)
- **읽는 법**: React은(는) JavaScript 위에서 동작한다
- **근거 문장**: 사용자 인터페이스를 효율적으로 만들기 위한 JavaScript 기반 라이브러리.
- **근거 출처**: `term-definition` / `term-react`
- **후보 ID**: `cand-react-runs-on-javascript`
- **판정**: 승인 — React는 JavaScript 기반 라이브러리입니다.

### 11. Ruby on Rails → MVC

- **관계**: 구현(implements)
- **읽는 법**: Ruby on Rails은(는) MVC을(를) 구현한다
- **근거 문장**: Ruby 언어를 기반으로 한 웹 애플리케이션 개발 프레임워크로, 개발자 생산성과 빠른 개발을 강조하는 MVC 아키텍처 프레임워크
- **근거 출처**: `term-definition` / `term-ruby-on-rails`
- **후보 ID**: `cand-ruby-on-rails-implements-mvc`
- **판정**: 승인 — Ruby on Rails는 MVC 아키텍처를 따르는 웹 애플리케이션 프레임워크입니다.

### 12. 서버사이드 렌더링 → HTML

- **관계**: 결과 생성(produces)
- **읽는 법**: 서버사이드 렌더링은(는) HTML을(를) 만들어 낸다
- **근거 문장**: 서버가 요청에 맞는 HTML을 생성해 브라우저에 전달하는 렌더링 방식입니다.
- **근거 출처**: `term-definition` / `term-server-side-rendering`
- **후보 ID**: `cand-server-side-rendering-produces-html`
- **판정**: 승인 — 서버사이드 렌더링은 서버가 요청에 맞는 HTML을 생성해 브라우저에 전달합니다.

### 13. shadcn/ui → React

- **관계**: 실행 환경(runs_on)
- **읽는 법**: shadcn/ui은(는) React 위에서 동작한다
- **근거 문장**: 필요한 UI 컴포넌트의 소스 코드를 프로젝트로 복사해 직접 수정하며 사용하는 React 기반 구성요소 모음입니다.
- **근거 출처**: `term-definition` / `term-shadcn-ui`
- **후보 ID**: `cand-shadcn-ui-runs-on-react`
- **판정**: 승인 — shadcn/ui는 React 기반 구성요소 모음입니다.

### 14. 정적 렌더링 → HTML

- **관계**: 결과 생성(produces)
- **읽는 법**: 정적 렌더링은(는) HTML을(를) 만들어 낸다
- **근거 문장**: 페이지 내용을 빌드할 때 미리 HTML로 생성해 두고, 요청이 오면 준비된 파일을 전달하는 렌더링 방식입니다.
- **근거 출처**: `term-definition` / `term-static-rendering`
- **후보 ID**: `cand-static-rendering-produces-html`
- **판정**: 승인 — 정적 렌더링은 빌드 시점에 페이지 내용을 미리 HTML로 생성합니다.

### 15. Streamlit → Python

- **관계**: 실행 환경(runs_on)
- **읽는 법**: Streamlit은(는) Python 위에서 동작한다
- **근거 문장**: Python 코드만으로 입력창, 표, 차트가 있는 데이터·인공지능 웹앱을 빠르게 만드는 프레임워크입니다.
- **근거 출처**: `term-definition` / `term-streamlit`
- **후보 ID**: `cand-streamlit-runs-on-python`
- **판정**: 승인 — Streamlit은 Python 코드만으로 데이터·인공지능 웹앱을 만드는 프레임워크입니다.

### 16. Tailwind CSS → CSS

- **관계**: 실행 환경(runs_on)
- **읽는 법**: Tailwind CSS은(는) CSS 위에서 동작한다
- **근거 문장**: 유틸리티 클래스 기반의 CSS 프레임워크.
- **근거 출처**: `term-definition` / `term-tailwind-css`
- **후보 ID**: `cand-tailwind-css-runs-on-css`
- **판정**: 승인 — Tailwind CSS는 유틸리티 클래스 기반의 CSS 프레임워크입니다.

### 17. TypeScript → JavaScript

- **관계**: 종류(is_a)
- **읽는 법**: TypeScript은(는) JavaScript의 한 종류다
- **근거 문장**: 자바스크립트의 상위 집합 (Superset) 프로그래밍 언어로, 자바스크립트의 모든 기능을 그대로 사용하면서, 타입 지정, 인터페이스 등 추가 기능을 통해 대규모 애플리케이션 개발에 적합
- **근거 출처**: `term-definition` / `term-typescript`
- **후보 ID**: `cand-typescript-is-a-javascript`
- **판정**: 보류 — 정의문은 TypeScript를 자바스크립트의 상위 집합이라고 설명합니다. is_a는 하위 개념에서 상위 개념으로 향하므로 방향이 어긋나며, 현재 관계 사전에 상위 집합을 표현할 유형이 없습니다.

### 18. V0 → Vercel

- **관계**: 실행 환경(runs_on)
- **읽는 법**: V0은(는) Vercel 위에서 동작한다
- **근거 문장**: 자연어와 이미지를 바탕으로 React 기반 UI 코드를 생성하는 Vercel의 화면 제작 도구입니다.
- **근거 출처**: `term-definition` / `term-v0`
- **후보 ID**: `cand-v0-runs-on-vercel`
- **판정**: 거절 — Vercel이 만든 도구라는 사실은 실행 환경 관계가 아닙니다.

### 19. Vanilla JS → JavaScript

- **관계**: 차이 비교(contrasts_with)
- **읽는 법**: Vanilla JS은(는) JavaScript와(과) 대비된다
- **근거 문장**: 외부의 라이브러리나 프레임워크(jQuery, React, Vue, Angular 등)를 사용하지 않고, 오직 순수한 자바스크립트만으로 웹 개발을 하는 방식을 의미
- **근거 출처**: `term-definition` / `term-vanilla-js`
- **후보 ID**: `cand-vanilla-js-contrasts-with-javascript`
- **판정**: 거절 — Vanilla JS가 대비되는 대상은 JavaScript 자체가 아니라 React 같은 라이브러리·프레임워크입니다.

### 20. Vite → React

- **관계**: 함께 사용(used_with)
- **읽는 법**: Vite은(는) React와(과) 함께 쓴다
- **근거 문장**: 프론트엔드 빌드 도구로, React, Vue, Svelte 등 다양한 프레임워크와 함께 사용할 수 있으며, 빠르고 간결한 모던 웹 프로젝트 개발 경험을 제공
- **근거 출처**: `term-definition` / `term-vite`
- **후보 ID**: `cand-vite-used-with-react`
- **판정**: 승인 — Vite는 React를 포함한 프론트엔드 프레임워크와 함께 사용하는 빌드 도구입니다.
