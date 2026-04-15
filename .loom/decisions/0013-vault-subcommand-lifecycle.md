# vault 서브커맨드로 생명주기 관리 통합

## 맥락

vault 레지스트리(0012)를 도입한 후, 등록(init)만 가능하고 조회/삭제/이름 변경이 없어 관리할 수 없었다. ir은 `collection` 서브커맨드 그룹으로 add/rm/rename/ls/set-path를 제공하고 있다.

## 결정

- `aeira vault` 서브커맨드 그룹을 도입하여 vault의 전체 생명주기를 관리한다.
- 제공하는 커맨드: `vault add`, `vault list`, `vault remove`, `vault rename`
- 기존 `init` 커맨드를 `vault add`로 이동하고 삭제한다.
- `vault remove`는 항상 ir collection을 DB 포함 삭제한다 (`ir collection rm --purge`).
- `vault rename`은 aeira 레지스트리와 ir collection 이름을 동시에 변경한다.
- `set-path`는 scope에서 제외한다.
- breaking change이므로 v3.0.0으로 진행한다.

### 제약 조건

- aeira 레지스트리와 ir collection을 이중 관리하므로, 모든 변경 조작은 두 곳을 동기화해야 한다.

### 전제 조건

- 1인 사용이므로 breaking change의 마이그레이션 비용이 낮다.
- ir의 `collection` 서브커맨드가 rm/rename을 CLI로 제공하므로 aeira가 위임할 수 있다.

## 대안

### remove 시 ir DB를 선택적으로 보존 (--purge 옵션)

- 설명: ir과 동일하게 기본은 DB 유지, --purge로 완전 삭제
- 트레이드오프: aeira 레지스트리에서 빠진 뒤 orphan DB에 접근할 경로가 없어 실질적 의미 없음

### init을 최상위 커맨드로 유지

- 설명: vault add를 별도로 두지 않고 init은 그대로, 나머지만 vault 하위에 배치
- 트레이드오프: 같은 도메인(vault)의 조작이 두 계층에 분산되어 일관성이 떨어짐

## 영향

- [[vault]] - vault 핵심 동작에 list/remove/rename이 추가된다
