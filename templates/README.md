# Case Template Notes

Place the Word template at `templates/case-template.docx`.

Use placeholders with `{{FIELD_NAME}}` format, for example:

- `{{CLIENT_NAME}}`
- `{{CASE_NUMBER}}`
- `{{HEARING_DATE}}`
- `{{JUDGE_NAME}}`
- `{{CASE_SUMMARY}}`

The export route fills missing values with empty strings, ignores unknown fields, and sanitizes control characters before rendering.
