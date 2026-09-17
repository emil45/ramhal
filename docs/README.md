# docs/ — how work is tracked

Three folders, linked by a shared number.

- **`tasks/`** — briefs, written by the architect before work starts. `TASK-NN-short-name.md`.
  States what to build and the decisions already made; genuinely open questions are marked
  **OPEN** rather than guessed at.
- **`reports/`** — what actually happened, written by whoever executed the task.
  `TASK-NN.md`. Short and structured: what was built · what was verified and how · what felt
  wrong · what is still open. Not a narrative, and not written from memory after the fact —
  it is the last step of the task, before reporting back in chat.
- **`reviews/`** — findings on a task's output, and the verdicts that arbitrate them.
  Reviewers write findings only; they never change code, and a finding is not an instruction
  to anyone. A separate verdict file decides what, if anything, gets acted on.

**`NN` is the link.** `TASK-03-migration.md` in `tasks/`, `TASK-03.md` in `reports/`, and
whatever review files exist for it in `reviews/` all refer to the same piece of work. There is
no other index — grep the number.

Everything else about how a task is executed (branch naming, when a report is required) is in
the Workflow protocol section of `AGENTS.md`, not repeated here.
