# Participant 1 Prompt Pack Template: AI-Dependent

## Purpose

Use this template to create the case-specific prompt pack for Participant 1.

Participant 1 is derived from the Participant 2 prompt pack by removing software engineering concepts and reducing the wording to short casual requests. This participant depends heavily on AI and lets AI decide many details.

The goal is to see what happens when the participant uses AI to build the same selected case with minimal planning, minimal technical language, and little control over the result.

## Template Preparation Notes

Before giving this prompt pack to a participant, replace these placeholders:

```text
[CASE_SHORT_NAME]
[ROLE_1]
[ROLE_2]
[MAIN_ENTITY]
[MAIN_FEATURE]
[SECONDARY_FEATURE]
[PROTECTED_ACTION]
[CHANGE_REQUEST]
[DESCRIBE_PROBLEM]
[PASTE_ERROR]
```

Rules for preparing this pack:

- Keep Stages 0 to 11 short and casual.
- Keep Stage 12 as the shared final review prompt for fair comparison.
- Use the shortest useful case name for `[CASE_SHORT_NAME]`.
- Do not add software engineering terms to Stages 0 to 11.
- Do not add detailed project instructions.
- Do not include the full client case paragraph inside the prompts.
- Do not ask for planning documents or instruction `.md` files.
- Adjust grammar and plural forms when replacing placeholders.
- `[DESCRIBE_PROBLEM]` and `[PASTE_ERROR]` are filled only when something goes wrong during the workshop.

## Participant Instructions

Copy and paste the prompts in order.

Do not rewrite the prompts into longer technical prompts.

If the result is wrong or incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Start The App

```text
I want to build a [CASE_SHORT_NAME] app. Where should I start?
```

### Stage 1: Understand The App

```text
Tell me what this app should do.
```

### Stage 2: Create The Project

```text
Set up the project files so I can run the app.
```

### Stage 3: Save The Main Thing

```text
Make [MAIN_ENTITY] save in Supabase and show again.
```

### Stage 4: Make The Screens

```text
Make simple screens for [ROLE_1] and [ROLE_2].
```

### Stage 5: Add The Main Work

```text
Add [MAIN_FEATURE] for [MAIN_ENTITY].
```

### Stage 6: Add Login

```text
Add login for [ROLE_1] and [ROLE_2].
```

### Stage 7: Add The Extra Part

```text
Add [SECONDARY_FEATURE].
```

### Stage 8: Check The App

```text
Check if the app works and fix broken parts.
```

### Stage 9: Make It Safer

```text
Make the app safer and stop users doing wrong things.
```

### Stage 10: Clean It Up

```text
Clean up the code and keep the app working.
```

### Stage 11: Change Request

Use this only when the facilitator reaches Stage 11.

```text
Change the app: [CHANGE_REQUEST]
```

### Stage 12: Final Review

```text
Prepare a final review for [CASE_SHORT_NAME].

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how [ROLE_1] and [ROLE_2] are handled.
- Explain how [PROTECTED_ACTION] is protected.
- Explain the validation rules.
- Explain the security checks and remaining risks.
- Explain the tests or manual checks completed.
- Explain what changed after Stage 11.
- Identify known limitations.
- Create a short demo script.
- Create viva questions a supervisor could ask.

Output:
1. Final feature summary
2. Demo script
3. Data model explanation
4. Role/access explanation
5. Testing summary
6. Security summary
7. Stage 11 change summary
8. Known limitations
9. Suggested viva questions
```

## Reusable Failure Prompt

Use this at any stage when the AI output is wrong, too big, incomplete, broken, or not matching the selected case.

```text
This is wrong. Make it match [CASE_SHORT_NAME], keep it simple, and fix: [DESCRIBE_PROBLEM]
```

## Error Prompt

Use this when the app fails.

```text
Fix this error: [PASTE_ERROR]
```
