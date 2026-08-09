# Health Companion AI

AI 보조 모델의 역할

활용 모델 : GPT-4o

 사용자의 음성을 STT로 텍스트 변환한다.

 GPT-4o가 사용자의 건강 관련 질문을 이해한다.

 건강관리 방법 및 복약 정보를 생성한다.

 생성된 답변을 TTS를 통해 음성으로 제공한다.

 응급상황 키워드를 인식하여 도움 요청 기능을 수행한다.

AI 서비스 흐름

음성 입력 → STT → GPT-4o → 답변 생성 → TTS → 음성 출력

선정 이유

 OpenAI API 활용이 가능하다.

 과정 안내서의 교육내용(STT, TTS, GPT, MCP 연동)과 가장 잘 부합한다.

 실제 AI 비서앱 구현 사례와 유사하여 확장성이 높다.

수행평가용으로는 "GPT-4o를 핵심 AI 모델로 사용하고, STT와 TTS를 결합한 음성 건강관리 AI 비서" 
"위의 설계서 대로 웹앱 완성해줘"

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11eb99f7-86bf-4610-92cd-949bad326645).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
