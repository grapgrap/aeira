# ir 인터페이스를 aeira가 감싼다

## 맥락

sync 명령의 인자를 ir collection 이름으로 받을지, source 경로로 받을지 결정이 필요했다. ir의 per-collection SQLite에 접근하려면 collection 이름이 필요하지만, 이를 사용자에게 직접 요구하면 ir의 내부 개념이 노출된다.

## 결정

사용자에게는 source 경로만 받고, ir collection 이름은 `basename(sourcePath)`로 내부에서 유도한다. 사용자가 ir을 마주치는 순간은 최초 설치 시뿐이며, 이후 모든 상호작용은 aeira 기준으로 동작한다.

### 제약 조건

- ir이 해당 source를 동일한 basename으로 인덱싱한 상태여야 함
- 사용자가 ir에서 다른 이름으로 collection을 만들면 매핑이 깨짐 — 허용 가능한 제약 (ir 직접 사용을 전제하지 않으므로)

### 전제 조건

- aeira가 ir의 collection 생성/인덱싱까지 대행할 수 있음 — 사용자가 ir CLI를 직접 호출할 필요 없음
- ir은 aeira의 내부 구현 디테일이며, 교체 가능한 백엔드

## 대안

### collection 이름을 직접 받기

- 설명: `aeira sync my-vault` 형태로 ir collection 이름을 인자로 받음
- 트레이드오프: ir의 내부 개념이 사용자 인터페이스에 노출. ir이 없는 환경이나 ir을 교체할 때 인터페이스가 깨짐

## 영향

- sync, search 등 모든 CLI 명령에서 source 경로를 기본 인자로 사용
- collection 이름 유도 로직이 한 곳에서 관리됨
