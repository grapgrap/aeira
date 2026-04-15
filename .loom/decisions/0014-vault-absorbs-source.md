# vault concept이 source를 흡수

## 맥락

vault 생명주기 관리(0013)를 설계하면서 source concept에 vault 관련 책임을 추가했다. review에서 Draw Clear Boundaries 원칙 위반을 발견: source의 핵심 시나리오 6개 중 4개가 vault 관리였고, "그래프 구축의 범위를 정의하는 문서 루트"라는 정의와 괴리가 있었다.

vault를 source에서 분리하려 했으나, source에서 vault를 빼면 "vault.path를 ir에 전달"하는 것 외에 고유 책임이 남지 않았다. source는 "경로가 곧 정체성"이었고, decision 0012에서 레지스트리를 도입한 시점에 이미 실질적으로 vault였다.

## 결정

- source concept을 삭제하고 vault concept으로 교체한다.
- vault가 source의 기존 책임(문서 수집 경계, 그래프 격리)을 계승한다.
- vault는 추가로 식별(이름), 레지스트리, 생명주기 관리를 담당한다.
- 다른 concept(graph, index-store, search)의 `[[source]]` 참조를 `[[vault]]`로 갱신한다.

### 제약 조건

- source를 독립 concept으로 유지하려면 "vault.path를 ir에 전달" 이상의 고유 책임이 필요하나, 현재 코드에도 source 객체/추상화가 존재하지 않는다.

### 전제 조건

- 1 vault = 1 path = 1 ir collection = 1 graph 관계가 유지된다.

## 대안

### vault와 source를 별도 concept으로 병존

- 설명: vault가 source를 소유하는 관계. source는 "문서 수집 메커니즘" 담당
- 트레이드오프: source에 남는 고유 책임이 빈약하여 concept으로서 실체가 부족

## 영향

- [[vault]] - source의 문서 수집 경계 책임을 계승
- [[graph]] - 참조 대상이 source에서 vault로 변경
- [[index-store]] - 참조 대상이 source에서 vault로 변경
- [[search]] - 참조 대상이 source에서 vault로 변경
