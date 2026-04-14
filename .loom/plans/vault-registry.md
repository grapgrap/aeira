# Vault Registry 도입

## 핵심 구조

모든 커맨드에서 `basename(sourcePath)`로 collection 이름을 파생하던 것을 레지스트리 기반으로 전환한다.

데이터 흐름 변경:

```
Before: sourcePath -> basename() -> collection name
After:  init(path, name) -> registry.add(name, path)
        sync/search/graph -> registry.resolve(cwd) -> collection name
```

레지스트리는 `~/.config/aeira/vaults.json`에 저장한다.
ir의 collection 디렉토리(`~/.config/ir/collections/`)와 동일 레벨에 aeira 자체 설정을 둔다.

resolve 규칙:
- cwd가 등록된 vault 경로와 일치하거나 그 하위이면 해당 vault를 선택한다
- 복수 매칭 시 가장 긴 경로(가장 구체적)를 선택한다
- 매칭 없으면 에러를 출력한다

## 파일 구조

```
src/
  registry.ts          (신규) vault 레지스트리 CRUD + resolve
  commands/
    init.ts            (수정) positional name 추가, registry.add 호출
    sync.ts            (수정) basename -> registry.resolve
    search.ts          (수정) basename -> registry.resolve
    graph.ts           (수정) basename -> registry.resolve
```

## 작업 목록

### 1. registry 모듈 구현

#### 작업 견적

- 파일 I/O: 낮음 -- JSON 읽기/쓰기
- resolve 로직: 보통 -- cwd prefix 매칭 + 복수 매칭 시 최장 경로 선택

#### 작업 순서

- 의존: 없음 (최초 태스크)
- 병렬: 없음

#### 세부 작업 목록

- [x] src/registry.ts - vault 레지스트리 모듈 구현
  - `loadVaults()`: vaults.json 읽기, 파일 없으면 빈 배열
  - `saveVaults(vaults)`: vaults.json 쓰기
  - `addVault(name, path)`: vault 등록 (이름 중복 시 에러)
  - `resolveVault(path)`: path에서 가장 가까운 vault를 찾아 `{ name, path }` 반환
- [x] src/registry.test.ts - resolve 로직 테스트 (prefix 매칭, 복수 매칭, 매칭 없음)

### 2. init 커맨드 변경

#### 작업 견적

- 인터페이스 변경: 낮음 -- positional 인자 추가
- 통합: 낮음 -- registry.add + initCollection 호출 순서

#### 작업 순서

- 의존: 1
- 병렬: 없음

#### 세부 작업 목록

- [x] src/commands/init.ts - `aeira init <path> <name>`으로 변경
  - positional name 인자 추가 (required)
  - basename 제거, registry.add(name, resolvedPath) 호출
  - initCollection(name, resolvedPath) 호출 (name이 collection 이름)
  - 이미 등록된 이름이면 에러 메시지 출력

### 3. 비-init 커맨드 전환

#### 작업 견적

- 패턴 반복: 낮음 -- 3개 커맨드 + openGraph 헬퍼가 동일 패턴

#### 작업 순서

- 의존: 1
- 병렬: 2와 병렬 가능

#### 세부 작업 목록

- [x] src/commands/sync.ts - resolveVault로 전환
- [x] src/commands/search.ts - 동일 전환
- [x] src/commands/graph.ts - openGraph 함수 동일 전환

### 4. 기존 basename 참조 제거 및 정리

#### 작업 견적

- 정리: 낮음 -- 기계적 삭제

#### 작업 순서

- 의존: 2, 3
- 병렬: 없음

#### 세부 작업 목록

- [x] basename import 제거 (init.ts, sync.ts, search.ts, graph.ts)
- [x] store/utils.ts - getCollectionDbPath는 유지 (collection name을 받는 것은 동일)

## 검증

- `aeira init /path/to/.loom vault-a` && `aeira init /other/.loom vault-b` -- 같은 basename이어도 다른 vault로 등록됨
- vault 디렉토리 내에서 `aeira sync` 실행 시 레지스트리에서 자동 resolve
- 등록되지 않은 디렉토리에서 `aeira sync` 실행 시 에러 메시지
- 중복 이름으로 init 시 에러 메시지
