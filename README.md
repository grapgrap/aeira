# aeira

마크다운 위키링크의 관계를 앱 종속 없이 구조화하는 CLI 도구.

[English](README.en.md) [한국어](README.md)

## 왜 만들었는가

마크다운 문서에서 위키링크(`[[]]`)는 문서 간 관계를 표현한다.
하지만 위키링크가 늘어나도 관계의 전체 그림은 보이지 않는다. 어떤 문서가 어떤 문서를 참조하는지, 두 문서가 몇 단계를 거쳐 연결되는지는 직접 따라가 보기 전에는 알 수 없다.

aeira는 이 관계를 방향 그래프로 구축하여 커맨드라인에서 탐색할 수 있게 한다.

## 명령어

aeira는 네 가지 명령으로 동작한다.

### init

source 경로를 지정하여 문서 컬렉션을 등록한다.

```sh
aeira init ./my-docs
```

### sync

위키링크를 파싱하여 그래프를 구축하고 갱신한다. 변경된 문서만 증분 처리한다.

```sh
aeira sync ./my-docs
```

### search

키워드로 문서를 검색하고, 각 결과의 outgoing links를 함께 표시한다.

```sh
aeira search ./my-docs "키워드"
```

### graph

그래프를 탐색하는 세 가지 프리미티브를 제공한다.

```sh
# 1-hop 이웃 조회
aeira graph neighbors ./my-docs node-name

# 두 노드 간 경로 탐색
aeira graph path ./my-docs from-node to-node

# 전체 그래프 출력
aeira graph all ./my-docs
```

모든 조회 명령은 `--json` 플래그로 JSON 출력을 지원한다.

## 시작하기

### 사전 요구

- Node.js >= 22
- [ir](https://github.com/vlwkaos/ir) -- `brew install vlwkaos/tap/ir`

### 설치

```sh
npm install -g aeira
```

### 첫 사용

source 경로를 지정하여 그래프를 구축한다.

```sh
aeira sync ./my-docs
```

sync 이후 그래프를 탐색할 수 있다.

```sh
aeira graph neighbors ./my-docs some-document
aeira search ./my-docs "검색어"
```
