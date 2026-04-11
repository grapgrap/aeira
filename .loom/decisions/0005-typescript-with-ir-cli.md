# TypeScript 구현 + ir CLI 연동

## 맥락

aeira를 ir의 Rust crate으로 의존할지, 별도 바이너리로 ir CLI를 호출할지 결정이 필요했다. ir이 Rust로 작성되어 있어 crate 의존 시 aeira도 Rust로 구현해야 한다.

## 결정

aeira를 TypeScript + Node.js로 구현한다. ir와의 연동은 CLI 호출(`ir search --json`, `ir update` 등)과 ir의 SQLite 파일 직접 접근(`better-sqlite3`)을 조합한다.

### 제약 조건

- 유지보수자가 Rust를 다루지 않음: Rust로 작성하면 코드 이해·수정·디버깅을 자력으로 할 수 없음
- 유지보수할 수 없는 코드베이스는 장기적 부담: 코드 작성을 위임할 수 있지만, 판단과 유지보수는 본인 몫

### 전제 조건

- SQLite는 언어 중립: TypeScript에서 `better-sqlite3`로 ir의 SQLite를 열어 edges 테이블을 읽고 쓸 수 있음
- aeira가 ir에서 필요한 것은 CLI 명령과 SQLite 파일 접근뿐: crate 내부 API가 필수적이지 않음

## 대안

### Rust (ir crate 의존)

- 설명: aeira도 Rust로 구현하고 ir를 crate으로 의존
- 트레이드오프: 통합이 자연스럽고 타입 안전하지만, 유지보수자가 코드를 직접 다룰 수 없음

## 영향

- [[graph]] - TypeScript로 위키링크 파서와 그래프 순회 로직 구현
- [[search]] - ir CLI를 subprocess로 호출하여 검색 결과를 JSON으로 수신
