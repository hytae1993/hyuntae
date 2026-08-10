# Hyuntae Choi — Portfolio & Notes

Not Pure Poole 테마를 사용하는 GitHub Pages 포트폴리오입니다.

## 사이트 구성

- `/` — 포트폴리오 메인 페이지
- `/papers/` — task별 논문 정리
- `/mathematics/` — 선형대수, 확률·통계, 기하학, 최적화
- `/coding/` — 별도 하위 분류가 없는 코딩 노트

## 새 글 작성하기

1. `_templates`에서 목적에 맞는 파일을 복사합니다.
2. `_posts` 폴더에 `YYYY-MM-DD-영문-슬러그.md` 형식으로 저장합니다.
3. 상단 설정과 본문을 수정합니다.

논문 정리의 `task` 값이 같으면 Paper Reviews 페이지에서 같은 그룹으로 묶입니다.

수학 노트의 `math_topic`은 다음 중 하나를 사용합니다.

- `linear-algebra`
- `probability-statistics`
- `geometry`
- `optimization`

## 포트폴리오 프로젝트 추가하기

`_data/portfolio.yml`의 `projects`에 프로젝트를 추가하면 메인 페이지에 자동으로 표시됩니다.

```yaml
projects:
  - title: Project title
    summary: 프로젝트를 설명하는 한두 문장
    meta: Research · 2026
    url: /project-url/
```

## GitHub Pages 공개하기

저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다. 이후 `main` 브랜치에 변경사항을 올리면 사이트가 자동으로 빌드됩니다.
