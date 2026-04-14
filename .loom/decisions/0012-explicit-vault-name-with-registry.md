# init 시 vault 이름을 명시적으로 지정하고 레지스트리에 저장

## 맥락

source 경로의 basename을 ir collection 이름으로 사용하고 있었다. 서로 다른 경로가 같은 basename을 가지면 (예: `project-a/.loom`과 `project-b/.loom` 모두 `.loom`) collection 이름이 충돌하여 구분할 수 없다.

## 결정

- init 시 vault 이름을 필수 인자로 받는다: `aeira init <path> <name>`
- aeira가 자체 레지스트리를 관리하여 `{name -> path}` 매핑을 저장한다.
- 모든 커맨드는 레지스트리를 통해 vault 이름을 resolve한다 -- basename 파생을 제거한다.
- 비-init 커맨드는 cwd가 등록된 vault 경로의 하위인지 레지스트리에서 조회하여 자동 resolve한다.
- breaking change로 진행한다.

### 제약 조건

- ir은 collection 목록의 구조화된 출력(JSON)이나 경로 기반 역조회를 제공하지 않는다: aeira가 ir의 `config.yml`을 직접 읽으면 내부 구현에 결합된다.

### 전제 조건

- 사용자가 vault를 등록할 때 고유한 이름을 직접 부여하는 것이 자연스럽다: Obsidian의 vault 개념과 유사한 멘탈 모델
- 1인 사용이므로 breaking change의 마이그레이션 비용이 낮다

## 대안

### basename 폴백이 있는 선택적 이름 지정

- 설명: `aeira init <path> [--name <name>]`으로 이름 생략 시 basename 사용
- 트레이드오프: basename 충돌 문제를 사용자가 인지하지 못하면 같은 문제가 반복된다

### ir의 config.yml을 직접 파싱하여 역조회

- 설명: ir이 이미 `{name -> path}` 매핑을 `~/.config/ir/config.yml`에 저장하므로 이를 읽어 사용
- 트레이드오프: ir의 내부 저장 형식에 결합되어, ir 업데이트 시 깨질 수 있다

## 영향

- [[source]] - collection 매핑이 basename 파생에서 레지스트리 기반으로 변경된다
