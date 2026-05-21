# Participant 1: Clinic Appointment System Prompts

## Instructions

Copy and paste the prompts in order.

Do not rewrite them into longer technical prompts.

If the result is wrong or incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message after it.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Start The App

```text
I want to build a clinic appointment app. Where should I start?
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
Make appointments save in Supabase and show again.
```

### Stage 4: Make The Screens

```text
Make simple screens for receptionist and doctor.
```

### Stage 5: Add The Main Work

```text
Add creating, viewing, updating and cancelling appointments.
```

### Stage 6: Add Login

```text
Add login for receptionist and doctor.
```

### Stage 7: Add The Extra Part

```text
Add filtering by doctor, date or status.
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
Change the app: appointments start as pending, doctors can accept or reject them, and accepted appointments become confirmed.
```

### Stage 12: Final Review

```text
Prepare a final review for Clinic Appointment System.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how Receptionist and Doctor are handled.
- Explain how add or edit visit notes is protected.
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
This is wrong. Make it match the clinic appointment app, keep it simple, and fix it.
```

## Error Prompt

Use this when the app fails. Paste the actual error message after the prompt.

```text
Fix this error:
```
