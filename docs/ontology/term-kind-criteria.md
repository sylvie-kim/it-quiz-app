# termKind 판별 기준

`ontology-schema.js`의 `termKind`는 12개 값만 허용한다. 이 문서는 159개 용어에 값을 매길 때 사용한 판별 기준이며, 값이 바뀌면 여기 기준부터 고친다.

## 판정 순서

용어 하나에 여러 값이 걸릴 때는 위에서 아래 순서로 먼저 걸리는 값을 쓴다. 한 용어는 값 하나만 갖는다.

1. **event** — 정해진 기간에 사람들이 모여 진행하는 행사
2. **command** — 터미널에 그대로 입력해 실행하는 명령 문자열
3. **file** — 프로젝트 안에 실제로 존재하는 특정 파일 이름
4. **format** — 데이터·문서를 저장하거나 주고받는 규격. 확장자로 식별되는 것 포함
5. **language** — 사람이 직접 작성하는 프로그래밍·마크업·스타일 언어 자체
6. **framework** — 개발자가 코드에서 불러 쓰는 구체적 제품(프레임워크·라이브러리·UI 키트)
7. **tool** — 사람이 직접 실행해 사용하는 구체적 소프트웨어 제품(편집기·CLI·자동화 도구·디자인 도구)
8. **platform** — 코드를 올려 실행·배포하거나 그 위에서 개발하는 구체적 실행 기반
9. **service** — 계정을 만들어 이용하는 구체적 온라인 제공 기능
10. **process** — 시작과 끝이 있고 단계적으로 진행되는 일의 흐름
11. **method** — 목적을 이루기 위해 선택하는 접근 방식·기법·방법론
12. **concept** — 위 어디에도 해당하지 않는 개념·범주·구조·성질

## 자주 헷갈리는 경계

| 상황 | 규칙 | 예 |
|---|---|---|
| 라이브러리인데 `library` 값이 없음 | `framework`로 매긴다. 코드에서 불러 쓰는 구체적 제품이라는 점이 같다 | React, pandas, NumPy, Matplotlib, MUI |
| 프로토콜인데 `protocol` 값이 없음 | `concept`으로 매긴다. 규칙 자체이지 실행되는 제품이 아니다 | HTTP, MCP, Protocol |
| 도구의 **범주**인지 특정 **제품**인지 | 범주는 `concept`, 제품은 `tool` | IDE는 concept, Visual Studio Code는 tool |
| `platform`과 `service` 구분 | 내 코드를 올려 돌리면 platform, 기능을 갖다 쓰면 service | Vercel은 platform, GitHub Actions는 service |
| `process`와 `method` 구분 | "무엇을 거치는가"는 process, "어떻게 하는가"는 method | 컴파일은 process, TDD는 method |
| 소프트웨어가 아닌 기획 도구 | `tool`로 쓰지 않는다. 정리하는 방식이므로 `method` | 비즈니스 모델 캔버스 |
| 파일 형식이면서 도구 이름 | 저장 규격을 가리키면 `format` | Jupyter Notebook(.ipynb) |

## 이 값이 바꾸지 않는 것

`termKind`는 개체의 종류만 말한다. 용어 사이의 의미 관계는 아니다. 공개 관계는 `docs/ontology/README.md`의 검토 절차를 통과한 `REVIEWED` 상태만 허용한다는 규칙이 그대로 유지된다.
