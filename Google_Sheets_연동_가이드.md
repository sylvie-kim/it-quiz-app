# 📊 Google Sheets 연동 가이드

IT 퀴즈 앱에서 Google Sheets를 통해 용어 데이터를 실시간으로 관리하는 방법을 설명합니다.
앱에는 기본 용어 164개가 포함되어 있으며, 외부 데이터는 이 목록을 지우지 않고 중복 용어는 갱신하고 새 용어만 추가합니다.

## 🚀 빠른 시작

### 1단계: Google Sheets 문서 준비

1. [Google Sheets](https://sheets.google.com) 접속
2. 새 스프레드시트 생성
3. 사용할 시트 이름을 정한 뒤 `google-sheets-integration.js`의 `SHEET_NAME`과 같게 설정
4. 다음과 같이 헤더 행 작성:

| A열 (용어) | B열 (정의) |
|-----------|-----------|
| API | 애플리케이션 프로그래밍 인터페이스 |
| React | 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리 |

### 2단계: Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > 라이브러리** 이동
4. "Google Sheets API" 검색 후 활성화
5. **API 및 서비스 > 사용자 인증 정보** 이동
6. **사용자 인증 정보 만들기 > API 키** 선택
7. 생성된 API 키 복사

### 3단계: API 키 제한 설정 (보안)

1. 생성한 API 키 클릭
2. **API 제한사항** 선택
3. **키 제한** 체크
4. "Google Sheets API" 선택
5. 저장

### 4단계: Google Sheets 공유 설정

1. 스프레드시트에서 **공유** 버튼 클릭
2. **일반 액세스** 변경
3. **링크가 있는 모든 사용자** 선택
4. 권한: **뷰어** 유지
5. **완료** 클릭

### 5단계: 스프레드시트 ID 추출

스프레드시트 URL에서 ID 찾기:
```
https://docs.google.com/spreadsheets/d/[스프레드시트_ID]/edit#gid=0
```

예시:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
```
→ 스프레드시트 ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 6단계: 앱 설정

1. `google-sheets-integration.js` 파일 열기
2. 다음 값들 수정:

```javascript
const GOOGLE_SHEETS_CONFIG = {
    API_KEY: 'YOUR_GOOGLE_SHEETS_API_KEY',      // 2단계에서 생성한 API 키
    SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',           // 5단계에서 추출한 ID
    SHEET_NAME: 'IT용어데이터',                  // 실제 시트 이름과 동일하게 설정
    RANGE: 'A:B'                                // 현재 앱이 읽는 데이터 범위
};
```

## 📚 현재 데이터 기준과 병합 규칙

- 기본 목록은 **164개**입니다: 기존 Google Sheet 용어 76개와 새로 선별·재작성한 용어 88개입니다.
- Google Sheets, 브라우저 저장 데이터, CSV는 기본 목록을 통째로 교체하지 않습니다.
- 같은 용어 또는 등록된 한글·영문 별칭은 기존 항목의 정의를 갱신합니다.
- 처음 보는 용어는 새 항목으로 추가되므로 전체 개수가 164개보다 늘어날 수 있습니다.
- Google Sheets 업데이트 데이터는 브라우저에 저장되며, 다음 방문 때 기본 목록과 다시 병합됩니다.
- CSV 업로드 결과는 현재 열린 페이지에서만 적용됩니다. 새로고침 후에도 유지하려면 Google Sheets 방식으로 갱신하세요.
- 관리자 패널의 **원본 데이터로 복구**를 실행하면 브라우저에 저장된 외부 데이터를 지우고 기본 164개로 돌아갑니다.

## 📝 스프레드시트 형식

### 필수 컬럼

| 컬럼 | 설명 | 예시 | 필수여부 |
|------|------|------|----------|
| A열 | 용어 | API, React, HTML | ✅ 필수 |
| B열 | 정의 | 애플리케이션 프로그래밍 인터페이스 | ✅ 필수 |
| C열 이후 | 현재 앱에서 읽지 않음 | 카테고리, 난이도 등 | ❌ 미지원 |

### 카테고리 참고값

카테고리와 난이도는 기본 용어 데이터에 들어 있지만, 현재 Google Sheets·CSV 가져오기는 A열과 B열만 읽습니다.
아래 값은 향후 직접 기본 데이터를 관리할 때 참고할 수 있습니다.

- **개념**: 기본적인 IT 개념
- **언어**: 프로그래밍 언어
- **프레임워크**: 개발 프레임워크
- **도구**: 개발 도구
- **플랫폼**: 플랫폼 서비스
- **디자인**: 디자인 관련
- **배포**: 배포/운영 관련

### 난이도 설정

- **easy**: 쉬움 (초급)
- **medium**: 보통 (중급) - 기본값
- **hard**: 어려움 (고급)

## 🔧 사용 방법

### 웹 앱에서 업데이트

1. 오른쪽 하단 🔧 버튼 클릭
2. "📥 Google Sheets에서 업데이트" 버튼 클릭
3. 성공 메시지 확인

### 자동 업데이트 설정

```javascript
// 30분마다 자동 업데이트 (선택사항)
GoogleSheetsIntegration.setupAutoUpdate(30);
```

### 수동 업데이트

```javascript
// 수동으로 업데이트 실행
GoogleSheetsIntegration.updateTermsFromGoogleSheets();
```

## 📂 CSV 대안 방법

Google Sheets API 설정이 복잡하다면 CSV 파일 방식을 사용할 수 있습니다:

### CSV 파일 형식

```csv
용어,정의
API,"애플리케이션 프로그래밍 인터페이스"
React,"사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리"
```

### 사용 방법

1. 🔧 관리자 패널 열기
2. "📄 템플릿 다운로드"로 기본 형식 받기
3. Excel/Google Sheets에서 편집
4. CSV 형식으로 저장
5. "📁 CSV 파일 업로드"로 업로드

정의 안에 쉼표나 줄바꿈이 있으면 셀 전체를 큰따옴표로 감싸세요. 정의 안의 큰따옴표는 `""`처럼 두 번 적으면 그대로 보존됩니다.

## ⚠️ 문제 해결

### API 키 오류

**문제**: "API key not valid" 오류
**해결**: 
- API 키가 올바른지 확인
- Google Sheets API가 활성화되었는지 확인
- API 키 제한 설정 확인

### 스프레드시트 접근 오류

**문제**: "Unable to parse range" 오류
**해결**:
- 스프레드시트가 공개되어 있는지 확인
- 스프레드시트 ID가 올바른지 확인
- 시트 이름이 정확한지 확인

### 데이터 형식 오류

**문제**: 일부 용어가 로드되지 않음
**해결**:
- A열(용어)과 B열(정의)가 비어있지 않은지 확인
- CSV의 큰따옴표가 짝을 이루는지 확인
- 쉼표·줄바꿈이 있는 CSV 셀은 큰따옴표로 감쌌는지 확인

## 🔒 보안 고려사항

1. **API 키 보호**: API 키를 공개 저장소에 업로드하지 마세요
2. **최소 권한**: API 키는 Google Sheets API만 허용하도록 제한
3. **스프레드시트 권한**: 뷰어 권한만 부여 (편집 권한 불필요)
4. **정기 갱신**: API 키를 정기적으로 갱신

## 📈 고급 기능

### 여러 시트 관리

현재 앱은 `SHEET_NAME`에 지정한 시트 한 개만 읽습니다. 다른 시트를 사용하려면 `SHEET_NAME`을 바꾸고,
여러 시트를 한 번에 합치려면 각 시트를 순서대로 가져오는 코드 확장이 필요합니다.

### 캐시 기능

```javascript
// Google Sheets에서 가져온 데이터를 앱의 형식으로 저장
GoogleSheetsIntegration.saveTermsToLocalStorage(importedTerms);
```

저장 키는 `quizTermsData`이며, 앱 시작 시 저장된 데이터와 기본 164개를 중복 없이 병합합니다.

## 📞 지원

문제가 발생하면 다음을 확인해보세요:

1. 브라우저 개발자 도구 콘솔 확인
2. Google Cloud Console에서 API 사용량 확인
3. 스프레드시트 권한 설정 재확인

## 🎯 팁

- **테스트 환경**: 프로덕션 전에 작은 테스트 시트로 먼저 테스트
- **백업**: 중요한 데이터는 정기적으로 백업
- **버전 관리**: 스프레드시트 버전 히스토리 활용
- **협업**: 여러 사람이 동시에 편집할 수 있음
