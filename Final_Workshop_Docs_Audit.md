# Final Workshop Docs Audit

## Audit Scope

This audit checks the participant-facing workshop documents in `final workshop plan`:

- `Workshop_Key_Points_Summary.md`
- The three top-level participant prompt templates
- The ten case folders
- Each case `Case_Brief.md`
- Each case Participant 1, Participant 2, and Participant 3 prompt pack

Generated Clinic project output folders were not treated as participant handouts. They are historical evidence from test runs.

## Overall Status

The active workshop handout documents are ready for workshop use.

The comparison structure is clear: all three participants work on the same selected case, use the same React/Express/Node/MySQL stack, follow the same checkpoints, receive the same change request, and use the same Mid Review and Final Review matrix structure.

## Checks Passed

- All ten case folders exist.
- Each case folder contains one client-style `Case_Brief.md`.
- Each case folder contains three participant prompt packs.
- The three top-level prompt templates exist.
- All prompt packs include Stage 0 through Stage 12.
- All prompt packs include a Mid Review Stage after Stage 7 and before Stage 8.
- All prompt packs include Stage 11 change request handling.
- Mid Review and Final Review both use the same scoring matrix structure, including case-specific feature rows.
- All prompt packs include placeholders for `[MYSQL_HOST]`, `[MYSQL_PORT]`, `[MYSQL_USER]`, `[MYSQL_PASSWORD]`, and `[MYSQL_DATABASE]`.
- No active handout uses a separate test database placeholder.
- Participant 1 and Participant 2 do not allow instruction `.md` documents in the codebase.
- Participant 3 is allowed to keep instruction `.md` documents in the codebase.
- Walkthrough documents and walkthrough references have been removed from the active workshop flow.
- The main workshop summary now includes a distribution warning about generated outputs, `.env` files, node_modules folders, and chat histories.

## Participant Comparison Clarity

The participant differences are clear and comparable:

- Participant 1 uses short casual prompts with minimal technical control.
- Participant 2 uses concise software-engineering prompts.
- Participant 3 uses detailed engineering-led prompts and may keep instruction documents.

The review structure is also comparable:

- Same case.
- Same stack.
- Same stage order.
- Same Mid Review and Final Review matrix, including the same case-specific rows for the selected case.
- Same scoring scale.
- Same Stage 11 change request.

## Important Distribution Risk

The folder still contains old generated Clinic project output folders from previous test runs. These are not part of the participant handouts.

These generated outputs may include:

- `.env` files
- `.env.example` files
- node_modules folders
- chat history files
- previous audit/evidence documents

Before sharing the workshop pack with participants, distribute only the handout documents and exclude generated project output folders.

## Recommended Distribution Set

For participants, share:

- `Workshop_Key_Points_Summary.md`
- The selected case `Case_Brief.md`
- The assigned participant prompt pack for that selected case

For facilitators, keep:

- The three top-level prompt templates
- All ten case folders
- Final audit notes
- Any previous generated project outputs only if they are needed as internal evidence

## Final Conclusion

The active workshop documentation is internally consistent and ready to use. The only remaining concern is packaging: generated test-run outputs should be excluded from participant distribution to avoid exposing credentials or confusing participants with completed projects.
