# Vault 서브커맨드 구현

## 핵심 구조

aeira는 vault 상태를 두 곳에서 관리한다:
- **aeira 레지스트리** (`~/.config/aeira/vaults.json`): `{name, path}` 배열
- **ir collection** (`~/.config/ir/collections/<name>.sqlite`): 문서 인덱스 + aeira 그래프 테이블

모든 vault 변경 조작은 두 곳을 원자적으로 동기화해야 한다. aeira 레지스트리를 먼저 변경하고 ir을 호출하는 순서로, ir 실패 시 레지스트리를 롤백한다.

concept 변경: source concept이 vault로 흡수됨 (0014). vault가 식별/관리 + 문서 수집 경계를 모두 담당한다.

CLI 구조 변경:
- 기존: `aeira init <path> <name>` (최상위)
- 변경: `aeira vault add <path> <name>`, `vault list`, `vault remove <name>`, `vault rename <old> <new>`
- `init` 커맨드 삭제, `vault` 서브커맨드 그룹으로 통합

## 파일 구조

```
src/
  registry.ts          — removeVault, renameVault 함수 추가
  registry.test.ts     — 추가된 함수 테스트
  ir.ts                — removeCollection, renameCollection 함수 추가
  cli.ts               — init 제거, vault 서브커맨드 등록
  commands/
    init.ts            — 삭제
    vault.ts           — vault add/list/remove/rename 서브커맨드
```

## 작업 목록

### 1. registry에 remove/rename 함수 추가

#### 작업 견적

- 로직: 낮음 — loadVaults/saveVaults 패턴의 반복
- 엣지케이스: 낮음 — 존재하지 않는 vault, 중복 이름 검증

#### 작업 순서

- 의존: 없음
- 병렬: 2

#### 세부 작업 목록

- [x] `src/registry.ts` - `removeVault(name, registryPath?)` 추가: vaults에서 name 제거, 없으면 에러
- [x] `src/registry.ts` - `renameVault(oldName, newName, registryPath?)` 추가: name 변경, oldName 없으면 에러, newName 중복이면 에러
- [x] `src/registry.test.ts` - removeVault 테스트: 정상 제거, 존재하지 않는 vault
- [x] `src/registry.test.ts` - renameVault 테스트: 정상 변경, 존재하지 않는 old, 중복 new

### 2. ir에 remove/rename collection 함수 추가

#### 작업 견적

- 로직: 낮음 — execFileSync 호출 패턴이 기존 initCollection/updateCollection과 동일

#### 작업 순서

- 의존: 없음
- 병렬: 1

#### 세부 작업 목록

- [x] `src/ir.ts` - `removeCollection(collection)` 추가: `ir collection rm --purge <collection>` 호출
- [x] `src/ir.ts` - `renameCollection(oldName, newName)` 추가: `ir collection rename <old> <new>` 호출

### 3. vault 서브커맨드 생성 + CLI 구조 변경

#### 작업 견적

- 로직: 낮음 — citty의 defineCommand 패턴이 기존 graph 서브커맨드와 동일
- 통합: 보통 — init 삭제, vault 등록, 기존 init 로직 이동

#### 작업 순서

- 의존: 1, 2
- 병렬: 없음

#### 세부 작업 목록

- [ ] `src/commands/vault.ts` - vault 서브커맨드 그룹 생성 (add, list, remove, rename)
  - `vault add <path> <name>`: 기존 init 로직 이동 (addVault + initCollection)
  - `vault list`: loadVaults 호출, name/path 출력
  - `vault remove <name>`: removeVault + removeCollection
  - `vault rename <old> <new>`: renameVault + renameCollection
- [ ] `src/cli.ts` - init import 제거, vault import 추가, subCommands에 vault 등록
- [ ] `src/commands/init.ts` - 삭제

### 4. 버전업 + 퍼블리시

#### 작업 견적

- 로직: 낮음 — 기계적 작업

#### 작업 순서

- 의존: 3
- 병렬: 없음

#### 세부 작업 목록

- [ ] `package.json` - version을 3.0.0으로 변경
- [ ] 빌드 + npm publish

## 참조

- `src/commands/graph.ts` — citty 서브커맨드 그룹 패턴 참조 (defineCommand + subCommands)
- `src/commands/init.ts` — vault add로 이동할 기존 로직

## 검증

- `aeira vault add <path> <name>`으로 vault 등록 후 `aeira vault list`에 표시되는지
- `aeira vault remove <name>` 후 레지스트리와 ir collection이 모두 삭제되는지
- `aeira vault rename <old> <new>` 후 레지스트리와 ir collection 이름이 모두 변경되는지
- 기존 `aeira sync`, `aeira search`, `aeira graph` 커맨드가 정상 동작하는지
- `aeira init`이 존재하지 않는지 (breaking change 확인)
