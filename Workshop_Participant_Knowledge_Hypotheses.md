# Workshop Participant Knowledge Hypotheses

## Purpose

This document lists the minimum knowledge assumptions made about all workshop participants, including Participant 1.

These are hypotheses about the individuals represented in the workshop. They are not guaranteed skills and they are not the same as software engineering competence.

Participant 1 is still treated as AI-dependent during the workshop. However, we assume even Participant 1 has enough basic tool and setup awareness to take part in the activity.

The purpose of these hypotheses is to separate AI-use behaviour from basic environment or prerequisite-knowledge problems.

## General Hypothesis

All participants are assumed to have enough basic technical awareness to copy prompts into Antigravity IDE's AI chat/agent, run the generated project locally, and understand that the application has a frontend, backend, and database.

## Tool And Setup Hypotheses

- Participants can open and use Antigravity IDE.
- Participants can use Antigravity IDE's AI chat/agent.
- Participants can create or open a project folder.
- Participants can view and navigate generated project files.
- Participants can use the built-in terminal or an external terminal.
- Participants can run basic npm commands when instructed.
- Participants understand that local applications usually run through localhost URLs.
- Participants understand that the frontend and backend may need to run as separate local services.

## Stack Hypotheses

- Participants have a basic awareness that PERN means PostgreSQL, Express, React, and Node.js.
- Participants understand that React is used for the frontend interface.
- Participants understand that Node.js and Express are used for the backend API.
- Participants understand that PostgreSQL is used for database storage.
- Participants understand that Supabase is used as the managed PostgreSQL database provider.
- Participants understand that the workshop uses React, Express, and Supabase PostgreSQL for every project.
- Participants understand that the stack should not be changed during the workshop.

## Supabase And Database Hypotheses

- Participants can access a Supabase account or supplied Supabase project.
- Participants understand that a Supabase database connection string is needed for the backend.
- Participants understand that the database password is sensitive.
- Participants understand that database credentials should not be exposed in React/frontend code.
- Participants understand that tables must exist before records can be saved.
- Participants understand that saved records should remain after refreshing the browser.
- Participants understand that starter or demo records may be needed to test the application.
- Participants understand that test/demo data should not be allowed to permanently pollute the database.

## Architecture Hypotheses

- Participants understand that the frontend, backend, and database have different responsibilities.
- Participants understand that React should call Express API routes.
- Participants understand that Express should communicate with Supabase PostgreSQL.
- Participants understand that a React-only app using browser memory is not equivalent to a database-backed application.
- Participants understand that secrets belong in backend environment configuration, not public frontend files.
- Participants understand that generated folders, configuration files, and run commands are part of the evidence needed to judge the project.

## Authentication And Security Hypotheses

- Participants understand that login is different from simply selecting a role in the UI.
- Participants understand that different user roles should have different allowed actions.
- Participants understand that protected actions should be checked by the backend.
- Participants understand that UI-only restrictions can be bypassed.
- Participants understand that users should not be able to access or change records they are not allowed to use.
- Participants understand that invalid or incomplete input should not be saved without validation.
- Participants understand that database passwords and other secrets should not appear in shared reports or screenshots.

## Testing And Review Hypotheses

- Participants understand the basic difference between manually trying the app and running automated tests.
- Participants understand that a visible UI does not prove that persistence, security, or role control works.
- Participants understand that test evidence is part of project quality.
- Participants understand that Mid Review and Final Review files are evidence generated for comparison.
- Participants understand that the review scoring matrix is used to compare outputs, not to help the AI build new features during the review stage.
- Participants understand that review stages should not modify the application.

## AI-Use Hypotheses

- Participants can copy and paste the assigned prompts without rewriting them.
- Participants understand that prompts should be used in the given order.
- Participants understand that the facilitator controls when the next stage begins.
- Participants understand that if the AI starts doing later-stage work early, this should be treated as stage drift.
- Participants understand that the reusable failure prompt is used when the AI output is wrong, incomplete, unsafe, or outside the selected case.
- Participants understand that accepting AI output without checking it may affect the quality of the final project.

## Interpretation Hypothesis

If these assumptions hold, differences between Participant 1, Participant 2, and Participant 3 are more likely to reflect AI-use style, software engineering awareness, and prompt quality.

If these assumptions do not hold, the workshop result may also reflect missing prerequisite knowledge, tool-readiness problems, or environment setup issues.
