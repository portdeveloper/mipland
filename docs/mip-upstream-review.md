# Reviewing upstream MIP changes

Run `pnpm check:mip-upstream` with Node 22. The command checks the five MIPs
covered by the Markdown knowledge bundle against `monad-crypto/MIPs`.
`GITHUB_TOKEN` is optional locally and avoids the unauthenticated API rate limit.

The checker resolves upstream `main` once, then checks each canonical file at
that immutable commit. Each request has a 10-second deadline, including its
response body. The report links the recorded baseline and current source.

Exit codes: **0** means all file hashes match, **1** means an explainer review
is needed, **2** means a check failed (including missing files, malformed data
and API failures). Errors take precedence when some files also changed.

The daily/manual **MIP upstream review** workflow publishes the same report in
its job summary, uses read-only permissions and fails on either review or error.
It does not edit knowledge, move baselines or open issues. Ordinary PR tests
stay offline; they also check manifest coverage against `MARKDOWN_MIP_SLUGS`.
The existing required CI job remains `test`.

## Initial baseline

`content/mips/upstream-sources.json` starts with a **conservative historical
source snapshot**, commit `d2fe40811999387de9ac371692198bb8f72c10fb` (June 15,
2026), rather than certifying a new review of today's explainers.
At that revision MIP-12 is Draft, matching the legacy local copy; upstream
changed it to Final on August 12 in `2a7e18894f1e55fb043080cb8cef15c7f5647768`.
The first live run should therefore request review, including that change.
The other covered files also changed since this snapshot, so they are reported
for review too. This check does not make the content corrections tracked in
issue #51 or the chat-instruction changes in #52.

## Record a reviewed baseline

1. Follow the report's source links and review the change against the HTML
   explainer and `content/mips/mip-N.md`. Interpret its impact and update the
   affected explanation through the usual reviewed PR process.
2. Copy the report's full **current specification revision**. For each reviewed
   file, get its blob hash at that exact revision:

   ```bash
   gh api "repos/monad-crypto/MIPs/contents/MIPs/MIP-12.md?ref=<full-commit>" --jq .sha
   ```

3. Update that entry's `reviewedCommit` and `reviewedBlobSha` together.
   `reviewedCommit` is the immutable commit used by the source link;
   `reviewedBlobSha` is the Contents API's file-content hash, not a commit.
   Keep unreviewed entries at their earlier baselines.
4. Run `pnpm test` and the checker, then include the review rationale in the PR.
   Changes after the inspected revision will still be detected.

These baselines track **specifications only**. An unchanged spec does not mean
unchanged rollout or network activation. Establish activation separately from
dated, network-specific evidence; do not infer it from a Final status or a
matching source hash.
