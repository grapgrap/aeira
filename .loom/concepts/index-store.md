# Index Store

구축된 그래프의 디스크 영속화. ir의 per-collection SQLite에 통합되었다.

## 목적

CLI 호출마다 전체 문서를 재파싱하지 않도록, 구축된 그래프를 프로젝트 외부에 캐싱한다.

### 핵심 시나리오

- sync 시 변경된 문서만 감지하여 증분 갱신한다
- 조회 시 SQLite에서 전체 그래프를 복원한다

## 동작 원리

### 역할

- ir의 per-collection SQLite(`~/.config/ir/collections/<name>.sqlite`)에 aeira_edges, aeira_sync_state 테이블로 저장
- 변경 감지는 aeira_sync_state의 해시와 ir documents 테이블의 해시를 비교하여 수행

### 핵심 동작

- 변경 감지: ir의 documents 테이블과 aeira_sync_state를 LEFT JOIN하여 added/changed/removed 세 범주를 식별
- 증분 저장: 변경된 문서의 엣지를 purge한 뒤, 새 엣지와 해시를 aeira_edges/aeira_sync_state에 트랜잭션으로 저장
- 복원: aeira_edges 전체를 읽고, documents 테이블의 active 문서를 참조하여 dangling 노드를 식별하며 인메모리 [[graph]]로 복원

## 트레이드오프

- 대상 프로젝트 내부에는 아무것도 남기지 않는다 -- non-intrusive 원칙 (ir이 외부 저장을 이미 보장)
- ir의 SQLite 스키마(documents, content 테이블)에 결합된다 -- ir의 핵심 뼈대이므로 급격한 변경 가능성은 낮음
- 자체 sync state를 관리한다 -- ir의 해시만으로는 "aeira가 이미 처리했는가"를 판단할 수 없으므로

## 관련 컨셉

- [[graph]] - 영속화 대상인 그래프 자료구조
- [[vault]] - ir의 collection에 대응하는 문서 관리 단위
- [[search]] - 같은 ir SQLite를 공유하여 검색 결과를 그래프 노드에 연결
