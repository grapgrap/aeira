# Source

그래프 구축의 범위를 정의하는 문서 루트.

## 목적

aeira가 어디서 문서를 수집할지를 한정한다. source 하나가 ir의 collection 하나에 대응하고, 독립된 그래프 하나를 가진다.

### 핵심 시나리오

- source 경로를 지정하면 ir가 해당 폴더를 collection으로 등록하고 문서를 인덱싱한다
- aeira는 ir의 collection에서 문서를 읽어 위키링크를 파싱하고 그래프를 구축한다
- 서로 다른 source는 독립된 collection과 그래프를 가지며, 교차 참조하지 않는다

## 동작 원리

### 역할

- 문서 수집 경계: 어떤 폴더의 문서들을 그래프에 포함할지 결정
- vault 식별: 사용자가 init 시 지정한 이름으로 source를 식별한다. 레지스트리가 `{name -> path}` 매핑을 관리한다.
- ir collection 매핑: vault 이름이 ir collection 이름이 된다
- 그래프 격리 단위: source 간 그래프가 섞이지 않도록 보장

### 핵심 동작

- vault 이름과 경로를 레지스트리에 등록하고 ir collection으로 초기화 (init)
- ir가 해당 경로의 마크다운 파일을 탐색하고 인덱싱 (update)
- ir의 per-collection SQLite를 통해 문서 내용과 변경 상태를 [[graph]] 구축에 제공
- 비-init 커맨드에서 cwd를 레지스트리의 등록 경로와 매칭하여 vault를 자동 resolve

## 트레이드오프

- 복수 source를 하나의 통합 그래프로 병합하지 않는다 — 그래프 간 독립성을 보장하기 위함
- 문서 탐색을 ir에 전적으로 위임한다 — aeira가 파일시스템을 직접 스캔하지 않음

## 관련 컨셉

- [[graph]] - source의 collection에서 읽은 문서로 그래프를 구축한다
- [[index-store]] - source의 collection에 대응하는 ir SQLite에 그래프를 저장한다
- [[search]] - source의 collection 범위 내에서 검색을 수행한다
