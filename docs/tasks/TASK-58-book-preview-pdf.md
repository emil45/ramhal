# TASK-58 — "Look inside": a reading copy (PDF) per book

Religious books are usually previewed before they are bought. The admin uploads a PDF to a book (a selection of pages, or
the whole book); the book page then shows a "Look inside" button that opens it in a dialog. First book: the Ramhal
Haggadah, whose flipbook on fliphtml5.com was rebuilt as a PDF from its page images.

Constraints: the file lives in the Media collection (R2 in deployed environments, `docs/DECISIONS.md` §16), so the
global 10 MB upload limit applies; no new dependency; production is written by a one-off script following
`docs/RECOVERY.md`.
