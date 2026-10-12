"""
파일명: generate_pages.py
기능: TOC.md를 읽어 pages/ 하위에 누락된 마크다운 파일만 자동 생성
      - 대단원 파일(pages/01-web-gradio.md 형태): 대단원 개요 템플릿
      - 소단원 파일(pages/01-1-xxx.md 형태): 5단계 표준 템플릿
      - 이미 존재하는 파일은 절대 덮어쓰지 않음(보존)
사용법: python generate_pages.py [TOC경로]   (기본값: TOC.md)
"""

import re
import sys
from pathlib import Path


def make_chapter_template(title: str, rel_path: str) -> str:
    """대단원 개요 파일(pages/NN-xxx.md) 템플릿"""
    return f"""# {title}

> 이 문서는 대단원 개요입니다. 세부 내용은 각 소단원 문서를 참고하세요.

---

## 1. 🎯 대단원 학습 목표
1. (이 대단원에서 학생이 설명할 수 있게 될 핵심 개념 1)
2. (핵심 개념 2)
3. (핵심 개념 3)

---

## 2. 📚 소단원 구성
| 소단원 | 파일 | 핵심 주제 |
|---|---|---|
| - | `{rel_path}` | (소단원 목록을 TOC.md 기준으로 채우기) |

---

## 3. 🛠️ 사전 준비물
- (이 대단원 실습에 필요한 계정, 도구, 라이브러리 등)

---

## 4. ✅ 확인 문제
1. (대단원 전체를 관통하는 이해 확인 문제)
"""


def make_sub_template(title: str, rel_path: str) -> str:
    """소단원 실습 파일(pages/NN-M-xxx.md) 5단계 표준 템플릿"""
    filename = Path(rel_path).name
    return f"""# {title}

> (이 소단원이 왜 필요한지 학생 눈높이 도입부 2~3문장)

---

## 1. 🎯 학습 목표
1. (이 소단원에서 익힐 핵심 개념 1)
2. (핵심 개념 2)
3. (실습으로 완성할 결과물)

---

## 2. 💡 핵심 개념
### ① (개념 이름)
(그림/표/비유로 설명)

---

## 3. 🛠️ 준비물
- (계정, 도구, 파일 등)

---

## 4. 💻 단계별 실습 코드
```python
# {filename}
# (실습 코드 작성)
```

---

## 5. ✅ 확인 문제

## [문제1] 개념 확인
(문제)
<details>
<summary>정답 확인하기</summary>
<b>모범 답안:</b> (정답)
</details>

## [문제2] 코드 이해
(문제)
<details>
<summary>정답 확인하기</summary>
<b>모범 답안:</b> (정답)
</details>

## [문제3] 서술형 탐구
(문제)
<details>
<summary>정답 확인하기</summary>
<b>모범 답안:</b> (정답)
</details>
"""


def build_pages_from_toc(toc_path: str = "TOC.md", overwrite: bool = False) -> None:
    toc_text = Path(toc_path).read_text(encoding="utf-8")

    # [제목](pages/파일명.md) 패턴 추출 (중복 경로는 1회만)
    entries = re.findall(r"\[([^\]]+)\]\((pages/[^)]+\.md)\)", toc_text)
    seen: dict[str, str] = {}
    for title, rel_path in entries:
        seen.setdefault(rel_path, title.strip())

    created, skipped = [], []
    for rel_path, title in seen.items():
        target = Path(rel_path)
        if target.exists() and not overwrite:
            skipped.append(rel_path)
            continue

        stem = target.stem  # 예: 01-1-python-gradio
        # 소단원 판별: 01-1, 02-3 처럼 '두 자리-한 자리' 번호가 붙은 파일
        is_sub = bool(re.match(r"^\d{2}-\d", stem))
        content = (
            make_sub_template(title, rel_path)
            if is_sub
            else make_chapter_template(title, rel_path)
        )

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        created.append(rel_path)

    print("-" * 65)
    print(f"TOC 기준 전체: {len(seen)}개")
    for p in created:
        print(f"  [신규 생성] {p}")
    for p in skipped:
        print(f"  [기존 보존] {p}")
    print(f"완료! 신규 생성: {len(created)}개 | 기존 보존: {len(skipped)}개")
    print("-" * 65)


if __name__ == "__main__":
    toc_file = sys.argv[1] if len(sys.argv) > 1 else "TOC.md"
    build_pages_from_toc(toc_file, overwrite=False)
