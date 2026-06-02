# Workshop Participant Knowledge Hypotheses

## Purpose

This document lists the minimum knowledge we assume all participants may already have before the workshop starts, including Participant 1.

These are hypotheses, not guaranteed skills. If a participant struggles with one of these areas, facilitators should record it because it affects how we interpret the workshop results.

The purpose is to separate AI-coding failure from basic setup or technical-background failure.

These assumptions are not the same as software engineering skill. Participant 1 is still treated as AI-dependent during the workshop, but we assume even Participant 1 has enough basic tool and setup awareness to take part in the activity.

## Main Hypothesis

All participants are expected to have enough basic technical awareness to copy prompts into Antigravity IDE's AI chat/agent, run the generated PERN project locally, and understand the basic difference between frontend, backend, and database responsibilities.

If this assumption is false, the participant may fail because of environment or concept gaps rather than because of their AI-use style.

## Setup Knowledge Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants can open and use Antigravity IDE. | The whole workshop happens inside Antigravity IDE. | Can open a folder, view files, and use the terminal. |
| Participants can use Antigravity IDE's AI chat/agent. | Prompts must be pasted into the AI chat/agent. | Can open the AI panel and submit a prompt. |
| Participants can create or open a project folder. | Each implementation must be separate. | Can choose where the AI-generated project should be created. |
| Participants can run basic terminal commands. | React and Express projects need install and run commands. | Can run `npm install`, `npm run dev`, or similar commands when instructed. |
| Participants understand localhost URLs. | They need to open the frontend and backend locally. | Can open a local app URL in the browser. |

## Stack Knowledge Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants know that PERN means PostgreSQL, Express, React, and Node.js. | The workshop fixes the stack to keep comparison fair. | Can identify which part is database, backend, frontend, and runtime. |
| Participants know React is the frontend. | UI work should happen in the React app. | Can identify the frontend folder and browser-facing code. |
| Participants know Express/Node.js is the backend. | Database access and protected actions should go through the backend. | Can identify backend routes or API files. |
| Participants know PostgreSQL is the database. | Project data must persist in a real database. | Can explain that saved records should remain after refresh. |
| Participants know Supabase is being used as managed PostgreSQL. | Supabase is the database provider, not a reason to bypass Express. | Can distinguish Supabase dashboard/database from the React frontend. |

## Supabase Knowledge Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants can log in to Supabase. | They need access to the supplied project/database. | Can open the Supabase dashboard. |
| Participants know where the Supabase database connection string is used. | The connection string should be used by the Express backend. | Can identify that it belongs in backend `.env`, not React code. |
| Participants know the database password is sensitive. | Secrets must not be exposed in frontend code, screenshots, or reports. | Can avoid pasting the password into public-facing files. |
| Participants understand that tables must exist before data can save. | Many AI-generated apps fail because tables are missing. | Can check whether setup or seed commands create tables. |
| Participants understand seed/demo records. | The app needs usable demo data during testing. | Can run or identify a setup/seed command. |

## Application Architecture Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants understand frontend and backend as separate services. | React and Express usually run separately during development. | Can run both parts and explain which URL is which. |
| Participants understand React should call Express API routes. | Direct database access from React weakens the comparison and security model. | Can identify API calls from React to backend endpoints. |
| Participants understand Express should handle database access. | Authentication, authorization, validation, and database rules need backend control. | Can identify database queries in backend code. |
| Participants understand environment variables. | Database URLs and passwords should be configured outside source code. | Can locate `.env` or `.env.example` without exposing secrets. |

## Security And Access Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants know login is different from selecting a role in the UI. | A role dropdown alone is not real access control. | Can explain how a user identity is decided. |
| Participants know protected actions must be checked by the backend. | UI-only restrictions can be bypassed. | Can identify backend role checks for the protected action. |
| Participants know users should not access records they are not allowed to see. | Ownership and role rules are part of SDP quality. | Can explain which role can see or change which records. |
| Participants know validation should happen before saving bad data. | AI-generated apps often accept invalid or incomplete input. | Can test empty or invalid form input. |

## Testing And Review Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants know the difference between manual checking and automated testing. | The review matrix separates working UI from test evidence. | Can identify whether a test command exists. |
| Participants understand test data should be cleaned up. | Tests using the real Supabase database should not pollute workshop data. | Can find cleanup logic or a cleanup instruction. |
| Participants can read a generated review report. | Mid and Final Review reports are key comparison evidence. | Can locate `MID_REVIEW.md` and `FINAL_REVIEW.md` if generated. |
| Participants can compare evidence, not only appearance. | A polished UI can still hide weak security or persistence. | Can use the scoring matrix to discuss quality. |

## AI-Use Hypotheses

| Hypothesis | Why It Matters | How To Check |
|---|---|---|
| Participants can copy and paste prompts exactly. | The workshop depends on controlled prompt differences. | Can use the assigned prompt pack without rewriting it. |
| Participants understand that prompts must be used in order. | Stage drift affects comparability. | Can wait until the facilitator reaches each stage. |
| Participants can recognize when AI starts doing future work early. | Early implementation can distort stage-based comparison. | Can flag if testing, security, or change-request work appears too early. |
| Participants can use the reusable failure prompt when output is wrong. | This keeps the workshop moving without extra technical coaching. | Can paste the recovery prompt when the AI output fails. |

## Risks If These Hypotheses Are False

If several participants do not meet these assumptions, the workshop may show environment readiness gaps instead of AI-development quality gaps.

Possible effects:

- Participant 1 may fail at setup before meaningful AI-dependency behaviour is visible.
- Participant 2 may not understand the SE terms inside the prompt pack.
- Participant 3 may not benefit from the stronger prompt structure if they cannot inspect the output.
- The comparison may become unfair if one participant receives extra setup help and another does not.
- Staff may misinterpret missing Supabase setup as an AI failure rather than a basic database readiness issue.

## Facilitator Use

Before the build starts, facilitators should quickly confirm:

- Antigravity IDE and AI chat/agent access.
- Node.js and npm availability.
- Supabase account access.
- Supabase database connection string and password availability.
- Basic understanding of React frontend, Express backend, and Supabase PostgreSQL database.
- Understanding that database credentials must not be placed in React code or shared publicly.

During the workshop, facilitators should record which assumptions were true or false for each participant group.

This helps explain whether the final result reflects AI-use style, software engineering understanding, prompt quality, or missing prerequisite knowledge.
