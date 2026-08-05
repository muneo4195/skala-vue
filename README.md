# skala-vue

Vue 3 + OpenWeatherMap API 기반 실습용 가상 날씨 대시보드 진행

## 실행 방법

1. `npm install`
2. 루트에 `.env` 파일을 만들고 OpenWeatherMap API 키를 넣기
   ```
   VITE_OPENWEATHER_API_KEY=발급받은_키
   ```
3. `npm run dev` (개발 서버) 또는 `npm run build && npm run preview` (프로덕션 빌드 확인)
4. 배포: `main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 빌드 후 GitHub Pages에 배포함 (base 경로 `/skala-vue/`는 `vite.config.js`에 설정됨)

## 구현한 기능 목록

### 과제 체크리스트 대응

- **반응형 상태/computed/watch/watchEffect로 검색/필터링**: `WeatherAllCitiesView.vue`의 `searchQuery`/`selectedRegions`/`selectedMoodFilters`/`desiredTempRange`를 `computed`(`filteredWeatherList`, `groupedWeatherList`)로 파생시키고, `watch`로 검색어 변경 시 지역 필터를 자동 전환, `watchEffect`로 검색어 변경 로깅
- **컴포넌트 분리 + props/emit**: `WeatherAllCitiesView.vue`가 부모 역할을 하며 `BaseDashboardCard`(제목+틀), `SearchBar`(`:search-query` / `@update-query`), `WeatherCard`(`:city` / `:is-selected` / `@select-card` / `@click-detail`)를 조합해서 사용
- **Vue Router 목록 ↔ 상세 화면 이동**: `/cities` 목록에서 카드를 클릭하면 `/weather/:cityId`로 이동(상세보기는 배경 화면을 그대로 유지한 채 모달로 겹쳐서 뜨도록 구성)
- **Pinia 전역 상태 분리**: `favoriteStore`(즐겨찾기 대표 도시, localStorage 연동), `weatherStore`(도시 목록/예보/로딩/에러), `journalStore`(일기/할일), `configStore`(°C/°F 단위)
- **Axios 실제 API 연동**: `weatherStore.js`에서 OpenWeatherMap 현재 날씨/5일 예보 API를 axios로 호출하고, `isLoading` / `errorMessage` 상태로 로딩/에러를 화면에 노출
- **UI 라이브러리(Element Plus) 적용**: `el-tooltip`(호버 설명), `el-rate`(일기 별점), `el-slider`(기온 범위 필터)
- **Vite 빌드 후 정상 배포**: `vite.config.js`에 `base: '/skala-vue/'` 설정 완료, GitHub Actions로 push 시 자동 빌드/배포되도록 워크플로 구성

### 추가로 구현한 기능

- 홈: 즐겨찾기 도시 히어로 카드, 실시간 시계, 날씨에 맞는 유튜브 플레이리스트 자동 재생
- 상세보기: 습도/체감/풍향 게이지(커스텀 SVG), 앞으로 5일간의 날씨, 전국 평균 대비 편차 표시
- 전체보기: 지역별 그룹핑, 기본/상세(카드 뒤집기)/차트(도시 비교) 3가지 보기, 라이프스타일/날씨상태/기온범위 다중 필터(같은 줄 선택은 OR, 다른 줄과 함께면 AND)
- 일기/할일: +버튼에서 튀어나오는 팝업, 초안 자동 보존(X로 닫아도 유지되고 초기화 버튼으로만 삭제), 별점 일기, 프리셋 할일, 날짜별 할일 전체 삭제
- 소개(내 기록) 페이지: 날짜별로 일기/할일을 묶어서 표시, 수정/삭제
- 알림 팝업: 앱 곳곳에 숨어있는 동작 방식(즐겨찾기/필터 규칙/초안 저장 등) 안내

## 셀프 코드 리뷰

- **단일 책임**: 날씨 데이터/즐겨찾기/일기/단위 설정을 각각 `weatherStore` / `favoriteStore` / `journalStore` / `configStore`로 일찍 분리해서 대체로 컴포넌트 하나가 한 가지 역할만 담당하게 됐다. 다만 `WeatherAllCitiesView.vue`는 검색/필터/정렬/차트 전환까지 한 파일에 몰려 있어 더 쪼갤 여지가 남아있다.
- **반응형 남용**: 아이콘 SVG, 필터 목록 같은 정적인 데이터는 `ref`/`reactive`로 감싸지 않고 일반 상수로 뒀고, 파생 가능한 값은 전부 `computed`로 처리해서 불필요한 반응형 상태 남발은 피했다.
- **로딩/에러 처리**: `weatherStore`의 `isLoading` / `errorMessage`를 화면에 그대로 노출해서 API 요청 중/실패 상태를 사용자가 바로 알 수 있게 했다.
- **네이밍**: `handleXxx`(이벤트 핸들러) / `toDisplayTemp`(단위 변환) / `resetXxxDraft`(초기화)처럼 동사 접두어로 역할을 구분했지만, `activeMoodFilterGroups`처럼 다소 길어진 이름도 있어 일부는 더 줄일 수 있었다.

## 4일간 어려웠던 점과 해결 과정

- **타임존 오차**: 5일 예보 API의 `dt_txt`가 UTC라 실제 현재 시각과 안 맞았다 → `dt`(유닉스 초)를 `new Date(dt * 1000)`으로 바꿔 로컬 시간 기준으로 재계산해서 해결
- **아이콘/강수확률 불일치**: 하루 중 서로 다른 시각의 값을 각각 뽑다 보니 "구름 아이콘인데 강수 100%" 같은 모순이 생겼다 → 강수확률이 가장 높은 시각 하나를 골라 아이콘과 확률을 그 시점 값으로 통일
- **다중 루트 템플릿에서 props 유실**: 컴포넌트를 `el-tooltip`으로 감싸자 템플릿 루트가 2개가 되면서 부모의 `class` 바인딩이 전달되지 않아 레이아웃이 깨졌다 → 자식 내부에서 `inheritAttrs`로 우회하는 대신, 부모가 wrapper `div`로 크기를 직접 소유하는 방식으로 해결
- **filter가 fixed 위치를 깨뜨림**: 배경을 블러(`filter: blur`) 처리했더니 그 안에 있던 `position: fixed` 플로팅 버튼(+버튼)의 기준이 뷰포트가 아니라 블러 걸린 조상으로 바뀌어버려 버튼이 위로 튀어 보였다 → 플로팅 버튼과 팝업을 blur가 걸리는 영역 밖, App 최상위로 옮겨서 완전히 해결(+ 페이지별로 보여야/숨어야 하는 문제까지 함께 정리됨)
- **한글 조사 처리**: "OO이 선택되었습니다" 같은 문구가 받침 없는 이름(예: 남양주)에서 어색하게 붙는 문제가 있었다 → 완성형 한글 유니코드 범위(U+AC00~U+D7A3)와 받침 유무 공식을 이용한 유틸 함수로 이/가를 자동 판별하도록 해결
