# Gemini Project Instructions: Emoticon Text Converter

이 파일은 Gemini CLI 에이전트가 이 프로젝트에서 작업할 때 준수해야 할 핵심 지침과 워크플로우를 정의합니다.

## 1. 프로젝트 맥락 및 상태 관리
- **상태 관리의 근거**: 프로젝트의 상세 진행 상황, 이식 이력, 기술적 결정 사항 및 다음 작업 단계는 반드시 root의 `STATUS.md` 파일을 참조한다.
- **자동 업데이트 규칙**:
    - 모든 주요 기능 구현, 버그 수정 또는 전략적 변경이 완료될 때마다 `STATUS.md`를 최신 상태로 갱신해야 한다.
    - 세션 종료 시 또는 큰 마일스톤 달성 시 `STATUS.md`의 `Current Progress`와 `Next Steps`를 업데이트하여 연속성을 유지한다.

## 2. 개발 원칙 (Development Principles)
- **TypeScript & ESM**: 순수 자바스크립트(ESM) 환경을 기반으로 하되, 타입 안전성을 위해 TypeScript로 작성한다.
- **TDD 지향**: 기능 수정 및 추가 시 반드시 관련 테스트(`*.test.ts`)를 수행하고, 필요시 새로운 테스트 케이스를 추가하여 검증한다.
- **커서 무결성**: `contenteditable` 요소를 조작할 때 사용자의 논리적 커서 위치가 깨지지 않도록 `CursorManager`를 적극 활용한다.
- **이벤트 안전성**: 무한 루프 방지 및 표준 이벤트와의 충돌을 막기 위해 DOM 이벤트를 직접 발생시키는 대신 옵션 기반 콜백(`onInput`, `onEnter` 등)을 사용한다.

## 3. 워크플로우 (Workflow)
1. **시작 (Context Loading)**: 세션 시작 시 `STATUS.md`를 읽어 현재 위치와 남은 과제를 파악한다.
2. **구현 및 검증**: 코드 수정 후 `npm test`를 실행하여 기존 기능의 회귀 여부를 확인한다.
3. **데모 확인**: 시각적 확인이 필요한 경우 `index.html`과 `npm run dev`를 활용하여 실제 동작을 검증한다.
4. **마무리 (Status Sync)**: 작업 결과를 커밋하기 전 `STATUS.md`를 업데이트하여 현재 상태를 동기화한다.

## 4. 버전 관리 (Version Management)
- **자율적 마이너 버전 관리**: 마이너 버전(`x.Y.z`) 및 패치 버전(`x.y.Z`) 업데이트는 사용자의 명시적 요청 없이도 에이전트가 기능의 중요도에 따라 판단하여 자율적으로 수행하고 `package.json` 및 Git Tag를 갱신한다.
- **SemVer 준수**: 기능 추가 시 마이너 버전, 버그 수정 시 패치 버전을 올리는 유의적 버전 정책을 따른다.
