# Chess Vibe – 완성 현황 정리

## 개요

- **프로젝트명**: Chess Vibe
- **목표**: 로그인/설정 없이 즉시 플레이 가능한 웹 체스 게임
- **기술 스택**: React 19, TypeScript, Vite 7 (체스 외부 라이브러리 없음)

---

## 완성된 기능

### 게임 플레이
- **즉시 플레이**: 페이지 열면 바로 대국 가능 (로그인·회원가입 없음)
- **합법적인 수만 허용**: 말별 이동 규칙, 킹 노출 방지, 캐슬링·앙파상·프로모션(퀸) 포함
- **게임 상태 표시**
  - 턴: "White's turn" / "Black's turn"
  - 체크: "– Check" 문구
  - 체크메이트: "Checkmate – [색] wins"
  - 스테일메이트: "Stalemate – draw"
- **종료 후**: 체크메이트/스테일메이트 시 추가 수 입력 비활성화
- **New Game**: "New Game" 버튼으로 전체 상태 초기화 후 재시작
- **보드 방향(턴 기준)**
  - 흰색 턴: 흰색이 아래(rank 0 아래, rank 7 위), 파일 0~7 왼쪽→오른쪽
  - 검은색 턴: 검은색이 아래(rank 7 아래, rank 0 위), 검은색 기준 왼쪽이 file 7
  - 도메인 좌표는 그대로; UI에서 행·열 순서만 바꿔 렌더

### 도메인 (`src/domain/chess`, UI 무관)
- **타입·상수**: `Color`, `PieceType`, `Piece`, `Square`, `Board`, `Move`, `GamePhase`, `CastlingRights` 등
- **보드**: 초기 배치, 수 적용(불변), 왕 위치 조회, 캐슬링 권한 갱신
- **수 생성**: 말별 이동, 합법 수 필터(킹 안전), 캐슬링·앙파상·프로모션
- **게임 상태**: 체크/체크메이트/스테일메이트 판정
- **진입점**: `createNewGame()` — 새 게임에 필요한 보드·턴·gamePhase·castlingRights·lastMove 반환

### UI
- **App**: 보드·턴·게임 상태·캐슬링 권한·마지막 수·선택 칸 상태 관리, 칸 클릭 시 선택/이동 처리, New Game 버튼 클릭 시 `createNewGame()`로 리셋. 턴에서 `orientation` 유도 후 Board에 전달
- **Board**: 8×8 그리드, `orientation`('white'|'black')에 따라 행·열 표시 순서만 변경(rankOrder/fileOrder), 도메인 `[file, rank]`는 그대로 사용. 칸 클릭 콜백, 선택 칸·합법 이동 칸 하이라이트. 컨테이너에 `board--white`/`board--black` 클래스 적용
- **Piece**: 유니코드 기호로 말 표시 (흰색/검은색 구분)
- **GameStatus**: 턴·체크·체크메이트·스테일메이트 문구 표시

### 스타일
- 보드 칸 색(밝은/어두운), 선택 칸·합법 이동 칸 하이라이트
- 말 기호 크기·색·그림자

### 문서
- **README.md**: 프로젝트 소개, 구현 기능, 실행 방법, 기술 스택, 아키텍처 요약
- **docs/architecture.md**: UI vs 도메인 분리, 디렉터리 구조, 데이터 흐름

---

## 디렉터리·파일 구조

```
src/
  domain/
    chess/                  # 도메인 (React/브라우저 무관)
      types.ts              # 타입, CastlingRights, getInitialCastlingRights, squareEquals
      board.ts              # getInitialBoard, applyMove, getKingSquare, getPiece, updateCastlingRights
      moves.ts              # getLegalMoves, getAllLegalMoves, isSquareAttacked, MoveContext
      gameState.ts          # getGameState (check, checkmate, stalemate)
      index.ts              # re-export, createNewGame()
  components/
    Board.tsx               # 8×8 그리드, orientation별 행·열 순서, 클릭, 하이라이트
    Piece.tsx                # 말 유니코드 표시
    GameStatus.tsx          # 턴/체크/체크메이트/스테일메이트 문구
  App.tsx                   # 상태 + orientation(turn) + 클릭 핸들러 + New Game
  App.css
  index.css
  main.tsx

docs/
  architecture.md           # 아키텍처 상세 (UI vs 도메인, 디렉터리, 데이터 흐름)
```

---

## 실행 방법

```bash
npm install   # 최초 1회
npm run dev   # 개발 서버 실행
```

브라우저에서 표시된 주소(예: http://localhost:5173)로 접속 후 바로 플레이 가능.

---

## 아키텍처 원칙 (적용된 것)

- **도메인은 UI 무관**: `src/domain/chess/`는 React·DOM·브라우저 API를 사용하지 않음.
- **UI는 도메인 export만 사용**: App·컴포넌트는 체스 규칙을 구현하지 않고, `src/domain/chess`의 export만 호출.
- **UI는 상태 구동**: App이 보드·턴·게임 상태를 보유하고, Board/GameStatus는 props만 받아 렌더.
- **합법 수는 도메인에서만**: UI는 `getLegalMoves`/`getAllLegalMoves` 결과에만 의존해 클릭·이동 처리.
- **작은·테스트 가능한 함수**: 보드·수·게임 상태 로직을 순수 함수로 분리.

---

## 선택적으로 추가 가능한 것 (미구현)

- **프로모션 선택**: 폰이 끝 rank 도달 시 퀸 외(룩·비숍·나이트) 선택 UI
- **무승부 규칙**: 3회 반복, 50수 규칙 등

---

*마지막 업데이트: 턴 기준 보드 방향(orientation) 적용 — 흰/검 턴에 따라 보드가 해당 색 기준으로 표시*
