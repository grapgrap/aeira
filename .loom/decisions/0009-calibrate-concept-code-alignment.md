# Concept-코드 정합성 교정

## 맥락

전체 구현을 마친 뒤 calibrate를 수행하여 concept과 코드를 대조한 결과, 네 개 concept 모두에서 괴리가 발견되었다. 주된 원인은 ir 통합 구현 과정에서 데이터 흐름이 변경되었으나 concept이 갱신되지 않은 것이다.

## 결정

네 개 concept을 현재 코드의 실제 동작에 맞게 교정한다.

### Source

- 변경 전: "마크다운 파일을 재귀적으로 탐색하여 graph에 전달"
- 변경 후: "ir에 collection으로 등록하고, ir가 문서 탐색/인덱싱을 담당"
- 원인: Decision 0004/0007 구현 시 문서 수집이 ir에 흡수됨. scanner.ts의 scanDocuments()는 런타임에서 사용되지 않는 상태

### Graph

- 변경 전: "source가 제공한 문서들에서 위키링크를 파싱하여 노드와 엣지를 생성" (일괄 구축)
- 변경 후: "sync에서 증분 파싱/저장, 조회 시 SQLite에서 복원" (증분 sync + bulk load)
- 원인: sync 명령이 buildGraph() 대신 문서별 parseWikiLinks() + store.syncDocuments()로 증분 처리. buildGraph()는 런타임에서 사용되지 않는 상태

### Index-store

- 변경 전: "edges 테이블", "ir 해시에 편승"
- 변경 후: "aeira_edges/aeira_sync_state 테이블", "자체 sync state + ir 해시 비교"
- 원인: 구현 과정에서 aeira 고유 테이블 prefix와 자체 sync state 관리가 추가됨

### Search

- 변경 전: 핵심 동작에 "문서 탐색: ir SQLite의 documents 테이블에서 이름/경로 기반 조회" 포함
- 변경 후: 미구현 기능 제거. ir search + graph neighbors 조합만 기술
- 원인: 문서 이름/경로 기반 직접 조회는 구현되지 않음

## 영향

- [[source]] - ir 위임 관계를 정확히 기술
- [[graph]] - 증분 sync와 bulk load 이중 경로를 반영
- [[index-store]] - 실제 테이블 구조와 변경 감지 메커니즘을 반영
- [[search]] - 구현된 기능만 기술
