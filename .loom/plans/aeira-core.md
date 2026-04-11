# aeira 코어 구현

## 핵심 구조

```
[search 질의] → ir CLI 검색 → 결과 문서 ──┐
                                            ├── 그래프 조회 → 결과 출력
[graph 질의] ───────────────────────────────┘
                                            ▲
[source 경로] → 문서 스캔 → 위키링크 파싱 → 그래프 구축 → ir SQLite 저장
```

- 구축: source 하위 문서를 스캔하여 위키링크를 파싱, edges 테이블에 저장
- 조회: search(ir 검색 위임)와 graph(그래프 쿼리)가 같은 ir SQLite를 공유
- 연동: TypeScript에서 ir CLI 호출 + better-sqlite3로 SQLite 직접 접근

## 작업 목록

### 0. 프로젝트 세팅

#### 작업 견적

- 초기 구조: 낮음 — 기계적 작업

#### 작업 순서

- 의존: 없음 (최초 태스크)
- 병렬: 없음

#### 세부 작업 목록

- [x] TypeScript + Node.js 패키지 초기화
- [x] better-sqlite3 의존 추가
- [x] 빌드/테스트 설정
- [x] CLI 엔트리포���트 스캐폴딩

### 1. 위키링크 파서

#### 작업 견적

- 파싱 로직: 낮음 — 정규식 기반, `[[target]]`과 `[[target|alias]]` 두 패턴
- 엣지 케이스: 보통 — 코드블록/인라인코드 내부의 위키링크 무시, 중첩 괄호 등

#### 작업 순서

- 의존: 0
- 병렬: 2

#### 세부 작업 목록

- [x] 위키링크 파싱 함수 — 마크다운 텍스트 → `{ target, alias? }[]` 반환
- [x] 코드블록/인라인코드 내부 위키링크 제외
- [x] 파서 테스트

### 2. 문서 스캐너

#### 작업 견적

- 파일 탐색: 낮음 — 재귀 glob
- 경로 정규화: 보통 — ir의 documents 테이블 경로와 일치하는 식별자 도출

#### 작업 순서

- 의존: 0
- 병렬: 1

#### 세부 작업 목록

- [x] source 경로 하위 `.md` 파일 재귀 탐색
- [x] 경로 정규화 — source root 기준 상대경로 반환. ir의 documents.path와 동일 형식 확인 완료
- [ ] 스캐너 테스트 — 생략 (Node API 래퍼 수준이므로)

### 3. 그래프 구축

#### ��업 견적

- 자료구조: 보통 — adjacency list 기반 방향 그래프, in/out 양방향 조회 지원
- 빌더 조��: 낮음 — 스캐너 + 파서를 순회하며 노드/엣지 추가

#### 작업 순서

- 의존: 1, 2
- 병렬: 없음

#### 세부 작업 목록

- [x] 그래프 자료구조 — 노드 집합, outgoing/incoming adjacency list
- [x] 빌더 — 문서 목록을 순회하며 파싱 → 노드/엣지 생성
- [x] dangling link 처리 — 가상 노드로 추가 (exists=false 구분은 dangling Set으로)
- [x] 그래프 구축 테스트

### 4. ir SQLite ���동

#### 작업 견적

- 스키마 설계: 보통 — ir의 기존 documents/content 테이블과 공존하는 edges 테이블
- 읽기/쓰기: 낮음 — better-sqlite3로 직접 접근
- 변경 감지: 낮음 — ir의 content-addressed storage(SHA-256 해시)에 편승

#### 작업 순서

- 의존: 3
- ��렬: 없음

#### 세부 작업 목록

- [x] edges 테이블 스키마 — aeira_edges (path 기반, FK 없음), aeira_sync_state (해시 추적)
- [x] 그래프 → SQLite 저장 (edges 쓰기)
- [x] SQLite → 그래프 로드 (edges 읽기)
- [x] 변경 감지 — documents.hash vs aeira_sync_state.hash 비교로 added/changed/removed 도출
- [x] 연동 테스트

### 5. CLI sync 명령

#### 작업 견적

- sync 흐름: 낮음 — 기존 모듈 조합

#### 작업 ��서

- 의존: 4
- 병렬: 없음

#### 세부 작�� 목록

- [x] 인덱스 구축 흐름 — ir SQLite content에서 문서 읽기 → 파싱 → ir SQLite에 엣지 저장
- [x] 부분 재구축 — 변경 감지 후 변경 문서만 재파싱하여 엣지 교체
- [ ] ir 런타임 검증 — ir collection 부재 시 적절한 에러 메시지 출력 (decision 0006 후속)

### 6. 그래프 쿼리

> 그래프 쿼리가 필요함은 확정. 구체적 조회 방식은 shape 선행 후 구현한다.

#### 작업 견적

- shape 선행 필요 — 소비자(loom/shulker/search) 관점에서 필요한 쿼리 도출

#### 작업 순서

- 의존: 5
- 병렬: 없음

#### 세부 작업 목록

- [ ] shape: 소비자의 문서 탐색 패턴 분석 → 필요한 그래프 쿼리 도출
- [ ] 출력 포맷 — LLM이 소비하기 좋은 간결한 텍스트 형태
- [ ] 쿼리 구현 및 테스트

### 7. search 연동

#### 작업 견적

- ir CLI 호출: 낮음 — subprocess로 `ir search --json` 호출
- 그래프 연계: 보통 — 검색 결과 path를 그래프 노드에 매핑하여 탐색 확장

#### ��업 순서

- 의존: 4, 6
- 병렬: 없음

#### 세부 작업 목록

- [ ] ir CLI 호출 — 검색 요청 → JSON 결과 수신
- [ ] 검색 결과 → 그래프 진입점 연계 — 결과 문서의 path로 그래프 노드 식별
- [ ] CLI 검색 명령
- [ ] search 연동 테스트

## 검증

- 인덱스 구축 시 ir SQLite의 edges 테이블에 그래프 데이터가 저장된다
- 대상 프로젝트 내부에는 아무 파일도 생기지 않는다
- 문서 변경 후 재구축하면 변경분만 갱신된다
- ir 검색 결과에서 그래프 탐색으로 연계된다
- `.loom/` 디렉토리를 source로 지정하여 loom 문서에서 동작함을 확인한다
