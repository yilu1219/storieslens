# CCSS Source PDF

Official source: https://www.thecorestandards.org/ELA-Literacy/

The local PDF is preserved as source evidence. Yu uses reviewed, teaching-oriented
maps derived from the standards; it does not claim certification or endorsement.
CCSS defines learning outcomes rather than a complete writing curriculum, so the
standards are paired with StoriesLens craft lessons, age adaptation, and human
evaluation.

Place the original CCSS ELA PDF here as:

```text
resources/source/ccss-ela-standards.pdf
```

Then run:

```text
node scripts/extract-ccss.js
```

The script writes:

```text
resources/ccss/ccss-extracted-text.txt
resources/ccss/ela-standards.draft.json
```
