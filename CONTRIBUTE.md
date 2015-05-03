# Create commit

```
git add -A
git commit -m "fix"
git push
```

# Create tag

## Edit package.json and bump version

```
git tag -a "fix" -m "Version 3.x.y"
git push --tags
```

```
npm publish
```
