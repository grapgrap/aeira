# Vault

이름으로 식별되는 문서 관리 단위. 문서 수집의 경계를 정의하고 생명주기를 관리한다.

## 목적

aeira가 관리하는 문서 집합을 식별하고, 그 생명주기(등록/조회/삭제/이름변경)를 제어한다. vault 하나가 ir의 collection 하나에 대응하고, 독립된 그래프 하나를 가진다.

### 핵심 시나리오

- vault 이름과 경로를 지정하면 레지스트리에 등록되고 ir가 해당 폴더를 collection으로 인덱싱한다
- 등록된 vault 목록을 조회하여 관리 중인 vault를 확인한다
- vault를 제거하면 레지스트리와 ir collection(DB 포함)이 함께 삭제된다
- vault 이름을 변경하면 레지스트리와 ir collection이 함께 갱신된다
- aeira는 vault의 ir collection에서 문서를 읽어 위키링크를 파싱하고 그래프를 구축한다
- 서로 다른 vault는 독립된 collection과 그래프를 가지며, 교차 참조하지 않는다

## 동작 원리

### 역할

- 문서 수집 경계: 어떤 폴더의 문서들을 그래프에 포함할지 결정
- 식별: 사용자가 지정한 이름으로 vault를 식별한다. 레지스트리가 `{name -> path}` 매핑을 관리한다
- ir collection 매핑: vault 이름이 ir collection 이름이 된다
- 그래프 격리: vault 간 그래프가 섞이지 않도록 보장

### 핵심 동작

- vault 이름과 경로를 레지스트리에 등록하고 ir collection으로 초기화 (add)
- 등록된 vault 목록을 조회 (list)
- vault를 레지스트리에서 제거하고 ir collection을 DB 포함 삭제 (remove)
- vault 이름을 레지스트리와 ir collection에서 동시에 변경 (rename)
- ir가 해당 경로의 마크다운 파일을 탐색하고 인덱싱 (update)
- ir의 per-collection SQLite를 통해 문서 내용과 변경 상태를 [[graph]] 구축에 제공
- 비-vault 커맨드에서 cwd를 레지스트리의 등록 경로와 매칭하여 vault를 자동 resolve

## 트레이드오프

- 복수 vault를 하나의 통합 그래프로 병합하지 않는다 -- 그래프 간 독립성을 보장하기 위함
- 문서 탐색을 ir에 전적으로 위임한다 -- aeira가 파일시스템을 직접 스캔하지 않음

## 관련 컨셉

- [[graph]] - vault의 collection에서 읽은 문서로 그래프를 구축한다
- [[index-store]] - vault의 collection에 대응하는 ir SQLite에 그래프를 저장한다
- [[search]] - vault의 collection 범위 내에서 검색을 수행한다
