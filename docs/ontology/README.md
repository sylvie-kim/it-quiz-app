# 온톨로지 후보 검토 절차

Graphify 또는 Gemini가 제안한 연결은 사실 데이터가 아니라 검토 대기 후보입니다. 이 절차는 공개 IT 용어 159개의 정본(`terms-data.js`)과 안정 ID 등록부(`ontology-data.js`)를 바꾸지 않은 채 후보 형식을 통일합니다.

## 고정 순서

공개 용어 정의 준비
→ Graphify/Gemini 후보 생성
→ `import-graphify-candidates.js`로 형식 통일
→ 관계 유형·방향·근거 검토
→ REVIEWED만 `ontology-data.js`에 사람이 옮김
→ `node --test`로 무결성 확인
→ 학습 지도에서 연결 이유 확인

`EXTRACTED`도 사실 검증 완료를 뜻하지 않습니다. 후보 파일은 제품이 로드하지 않으며, 출처 없는 관계는 승격하지 않습니다.

## 후보 변환

Graphify의 `{ nodes, links }` JSON이 실제로 준비된 경우에만 아래 명령을 실행합니다.

```bash
cd /private/tmp/it-quiz-app-button-contrast && node scripts/import-graphify-candidates.js graphify-out/it-quiz-relations.json > /tmp/it-quiz-ontology-candidates.json
```

변환기는 용어명과 `terms-data.js`의 별칭을 등록부 ID에 연결합니다. 다음 관계만 이름·방향·의미가 정확히 같을 때 후보가 됩니다: `implements`, `used_with`, `runs_on`, `prerequisite_of`, `produces`, `deploys_to`, `contrasts_with`, `alternative_to`, `is_a`, `part_of`.

`calls`, `references`, `semantically_similar_to`처럼 의미가 더 넓거나 다른 관계는 `runs_on`, `used_with`, `contrasts_with`, `conceptually_related_to`로 추측 변환하지 않습니다. 알 수 없는 용어나 관계는 `rejected`에 남기고, 사람이 원문과 두 용어 정의를 함께 확인합니다.

정규화한 용어명·별칭이 서로 다른 안정 ID에 동시에 연결되면 입력 순서로 하나를 고르지 않습니다. 해당 링크는 `AMBIGUOUS_TERM_OR_ALIAS`로 거절하며, 사람이 정본 용어 또는 별칭 규칙을 바로잡은 뒤 다시 변환합니다.

출력 JSON은 `{ candidates, rejected, stats }`이며 후보마다 `published: false`, `reviewedAt: null`로 시작합니다. 입력 경로가 없거나 JSON 구조가 `{ nodes, links }`가 아니면 명령은 stderr 한 줄과 exit code 1로 종료합니다.

## 검토와 승격 기준

후보 하나씩 다음을 확인합니다.

1. 관계 유형이 용어 정의와 정확히 일치하는가
2. source → target 방향이 관계 사전의 뜻과 맞는가
3. 정본 용어 또는 권위 있는 공식 문서가 그 관계와 방향을 직접 뒷받침하는가
4. 검토 책임자, 검토 기록 ID, 검토일을 남겼는가

이 네 가지가 충족된 `REVIEWED` 관계만 사람이 `ontology-data.js`로 옮깁니다. Task 4의 초기 관계는 Graphify가 만들었다고 가정하지 않습니다. `terms-data.js` 정의 또는 권위 있는 공식 문서를 근거로 별도 작성합니다.
