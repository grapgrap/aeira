# Index Store

구축된 그래프의 디스크 영속화. ir의 per-collection SQLite에 통합되었다.

## 목적

CLI 호출마다 전체 문서를 재파싱하지 않도록, 구축된 그래프를 프로젝트 외부에 캐싱한다.

### 핵심 시나리오

- 최초 구축 시 그래프를 디스크에 저장하고, 이후 조회 시 디스크에서 로드한다
- 문서가 변경되면 변경된 부분만 갱신한다

## 동작 원리

### 역할

- ir의 per-collection SQLite(`~/.config/ir/collections/<name>.sqlite`)에 edges 테이블로 저장
- 변경 감지는 ir의 content-addressed storage(SHA-256 해시)에 편승

### 핵심 동작

- 저장: [[graph]]의 edges를 ir SQLite의 edges 테이블에 쓰기
- 로드: ir SQLite에서 edges를 읽어 메모리 그래프로 복원
- 무효화: ir의 문서 해시 변경 시 해당 문서의 엣지를 재구축

## 트레이드오프

- 대상 프로젝트 내부에는 아무것도 남기지 않는다 — non-intrusive 원칙 (ir이 외부 저장을 이미 보장)
- ir의 SQLite 스키마(documents, content 테이블)에 결합된다 — ir의 핵심 뼈대이므로 급격한 변경 가능성은 낮음

## 관련 컨셉

- [[graph]] - 영속화 대상인 그래프 자료구조
- [[source]] - ir의 collection에 대응하는 문서 루트
- [[search]] - 같은 ir SQLite를 공유하여 검색 결과를 그래프 노드에 연결
