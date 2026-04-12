# init 외 커맨드에서 source를 named option으로 전환

## 맥락

모든 커맨드가 source 경로를 required positional로 받고 있었다. 사용자가 source 디렉토리 안에서 작업하는 경우가 일반적이므로, 매번 경로를 명시하는 것은 불필요한 마찰이다.

## 결정

- `init`: source를 required positional로 유지한다.
- `sync`, `search`, `graph *`: source를 `--source` / `-s` named option으로 전환하고, 생략 시 cwd를 기본값으로 사용한다.

init만 명시적 경로를 요구하는 이유: 최초 collection 등록은 대상 폴더를 사용자가 확인해야 하지만, 이후 작업은 "여기서 작업한다"가 자연스러운 기본값이다.

### 제약 조건

- positional 인자 간 파싱 모호성을 제거해야 한다: search, graph neighbors 등에서 source와 다른 positional이 공존하면 파서가 구분 불가

### 전제 조건

- 사용자가 source 디렉토리 내에서 CLI를 실행하는 것이 주된 사용 패턴이다: cwd 기본값이 대부분의 경우에 올바른 경로를 가리킴
- basename(cwd)가 collection 이름으로 유효하다: 기존 init에서 등록한 collection과 일치

## 대안

### 모든 커맨드에서 positional 유지, 인자 개수로 분기

- 설명: source를 optional positional로 두고, 인자 수에 따라 source 포함 여부를 판단
- 트레이드오프: 커맨드별 커스텀 파싱 로직이 필요하고, 사용자가 규칙을 학습해야 함

### init도 동일하게 named option으로 전환

- 설명: init 포함 모든 커맨드에서 `--source`를 사용
- 트레이드오프: 최초 등록 시 대상 폴더를 명시적으로 확인하는 의도가 인터페이스에 드러나지 않음

## 영향

- [[source]] - CLI에서 source를 해석하는 방식이 변경되나, concept 자체(문서 루트 역할)는 동일
