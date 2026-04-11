# 그래프를 ir SQLite에 통합 저장

## 맥락

aeira의 그래프 데이터를 어디에 저장할지 결정이 필요했다. ir이 검색 백엔드로 결정되면서, ir의 per-collection SQLite와 aeira의 그래프 캐시가 같은 문서를 대상으로 중복 관리되는 상황이 발생했다.

## 결정

그래프(edges 테이블)를 ir의 per-collection SQLite에 함께 저장한다. aeira는 ir의 SQLite 파일을 직접 열어 그래프를 읽고 쓴다.

### 제약 조건

- 별도 저장 시 문서 식별자 매핑 접합부가 필요: 경로 정규화 불일치 위험
- 별도 저장 시 변경 감지를 이중으로 수행: ir와 aeira가 각각 해시/mtime 추적

### 전제 조건

- ir의 documents 테이블(id, path, hash)과 content 테이블(hash, doc)이 안정적: ir 자체도 이 구조에 의존하므로 급격한 변경 가능성이 낮음
- ir의 스키마가 변경되어 호환이 깨지면 ir 의존을 걷어내고 재구축하는 것이 허용 가능한 비용

## 대안

### 별도 파일 저장

- 설명: aeira가 자체 JSON/SQLite 파일에 그래프를 독립적으로 저장
- 트레이드오프: ir 스키마와 무관하지만, 문서 스캔·해싱·변경감지를 중복 수행. 접합부 매핑 필요. 복합 질의 시 두 저장소를 메모리에서 교차해야 함

## 영향

- [[index-store]] - 독립 concept으로서의 역할이 ir에 흡수됨
- [[graph]] - 구축 시 ir의 content 테이블에서 본문을 읽고, documents 테이블로 노드를 식별
- [[search]] - 같은 SQLite 내에서 검색 결과와 그래프를 JOIN할 수 있음
