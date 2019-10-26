# Issue-to-Jekyll-Post

This action creates a Jekyll post from an issue.
A generated post has the same title and body as the original issue, and its tags are set issue's labels.

Here is an example workflow:
```
on: 
  issues:
    types: [opened, edited, labeled, unlabeled]

jobs:
  two:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v1
      - uses: actions/setup-node@v1
      - env:
          ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
          BRANCH: gh-pages
        run: |
          REPOSITORY_PATH="https://${ACCESS_TOKEN:-"x-access-token:$GITHUB_TOKEN"}@github.com/${GITHUB_REPOSITORY}.git"
          if [ "$(git ls-remote --heads "$REPOSITORY_PATH" "$BRANCH" | wc -l)" -eq 0 ];
          then
            echo "Creating remote branch ${BRANCH} as it doesn't exist..."
            git checkout "${BASE_BRANCH:-master}" && \
            git checkout --orphan $BRANCH && \
            git rm -rf . && \
            touch README.md && \
            git add README.md && \
            git commit -m "Initial ${BRANCH} commit" && \
            git push $REPOSITORY_PATH $BRANCH
          fi
          git checkout $BRANCH
          mkdir -p _posts
      - name: create a jekyll post from an issue
        uses: yoshum/issue-to-jekyll-post@v0
        with:
          post_dir: "_posts"
          update_filename: true
      - env:
          ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
          BRANCH: gh-pages
        run: |
          git config user.name "${GITHUB_ACTOR}"
          git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
          remote_repo="https://${ACCESS_TOKEN:-"x-access-token:$GITHUB_TOKEN"}@github.com/${GITHUB_REPOSITORY}.git"
          git remote set-url origin $remote_repo
          git add .
          git commit -m "add a post"
          git push origin ${BRANCH}
```