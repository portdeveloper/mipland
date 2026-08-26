const en = {
  nav: {
    brand: "MIP Land",
    soon: "soon",
    beta: "beta",
    clearSigning: "Clear Signing",
  },
  home: {
    title: "Monad Improvement Proposals, explained visually",
    subtitle: "Interactive, plain-language guides for Monad builders.",
    subtitleBreak: "Understand MIPs through visualizations, not just specs.",
    aboutTitle: "What is a Monad Improvement Proposal?",
    aboutBody:
      "Monad Improvement Proposals, or MIPs, describe protocol changes and standards for the Monad blockchain. MIP Land turns the technical specifications into interactive explanations for developers, validators, and curious community members.",
    aboutNote:
      "MIP Land is an independent, community-maintained educational project. Always use the published MIP specification as the authoritative source.",
    browseSpecs: "Browse the canonical MIP specifications",
    proposals: "Proposals",
    research: "Research",
    explore: "Explore",
    mip8: {
      title: "Page-ified Storage",
      subtitle: "Aligning EVM storage with hardware reality",
      description:
        "See how 4 KB page-aligned reads cut random I/O and reshape gas costs. Explore the slot-to-page mapping, compare gas schedules, and step through real contract scenarios.",
      miniNote: "Slot access triggers a full 4 KB page read",
    },
    mip3: {
      title: "Linear Memory",
      subtitle: "Replacing quadratic memory costs",
      description:
        "A linear cost model with a shared 8 MB pool. Watch the cost curve flatten as allocations grow.",
    },
    mip4: {
      title: "Reserve Balance Introspection",
      subtitle: "Detecting reserve violations mid-execution",
      description:
        "Letting contracts detect when an account dips below the 10 MON reserve threshold.",
    },
    mip7: {
      title: "Extension Opcodes",
      subtitle: "Safe opcode expansion via 0xAE namespace",
      description:
        "One reserved slot expands to ~220 selectors. Monad adds opcode-level features without risking collision with future Ethereum upgrades.",
    },
    mip12: {
      title: "Decrease Vote Pace",
      subtitle: "Faster consensus, scaled proportionally",
      description:
        "A draft proposal to vote on blocks 25% faster, dropping the pace from 400ms to 300ms, with per-block limits scaled down to match. See what each parameter change actually means.",
    },
  },
  mip8: {
    hero: {
      title1: "What if your storage model",
      titleHighlight: "matched",
      title2: "your hardware?",
      desc1: "The storage engine touches 4,096 bytes for a 32-byte read.",
      desc2: "MIP-8 makes the EVM account for that page-sized reality.",
      sloadSlot: "SLOAD slot",
      waiting: "waiting...",
      pageFetch: "- backend may fetch an entire 4KB page",
      formula: "128 slots \u00d7 32 bytes = 4,096 bytes = 1 page",
      siblingNote: "127 sibling slots stay unused in this example",
    },
    problem: {
      label: "Current EVM",
      title: "Hashing destroys locality",
      desc: "Ethereum's trie/database path hashes storage keys, so logically contiguous slots lose backend locality. In a worst-case pattern like this illustration, four related fields can end up on four different backend pages even though they are adjacent in Solidity.",
      structComment: "// Solidity struct",
      slot: "slot",
      reset: "reset",
      totalGas: "Total gas",
      coldReads: "Cold reads",
      pagesLoaded: "Pages loaded",
      fourFieldsNote: "In this illustration: 4 fields = 4 pages = 4 cold reads",
      moreDataNote: "128x more data touched than returned",
    },
    solution: {
      label: "MIP-8",
      title: "One page touch warms 128 slots",
      desc: "MIP-8 groups 128 consecutive slots into a page. Touch one slot, and the rest of that page becomes warm for the transaction. This demo uses Monad's 8,100/100 cold-vs-warm read constants for illustration.",
      reset: "reset",
      examplePage: "Example page - contiguous fields fit here",
      warm: "WARM",
      allWarmNote:
        "All 128 slots are warm for this transaction - in this example, subsequent reads use the 100-gas warm cost",
      clickNote: "Click a slot, watch the whole page warm up",
      totalGas: "Total gas",
      coldReads: "Cold reads",
      warmReads: "Warm reads",
      currentEvm: "Current EVM",
      mip8Example: "MIP-8 example",
      cheaperHere: "74% cheaper here",
    },
    comparison: {
      title: "Same struct, different cost model",
      desc: "Solidity lays out struct fields at contiguous slots, but trie/backend hashing can scatter them across different physical locations. In this worst-case illustration, each field lands on a separate backend page. MIP-8 groups contiguous slots into one page.",
      clickNote:
        "Click each field to load it and compare the gas cost side by side. Cold read costs 8,100 gas, warm read costs 100 gas on Monad.",
      reset: "reset",
      monadCurrent: "Monad (current)",
      coldRead: "cold read",
      coldReads: "cold reads",
      cold: "cold",
      warm: "warm",
      contiguous: "page 0 (contiguous)",
      fourFields: "4 fields, same struct",
      cheaperWithMip8: "% cheaper with MIP-8",
    },
    takeaways: {
      title: "What this means for you",
      card1Title: "Structs get cheaper",
      card1Desc:
        "Solidity stores struct members and array elements contiguously. Under MIP-8, a contiguous run that fits in one page is typically 1 cold page touch plus N - 1 warm slot accesses instead of N cold slot accesses.",
      card2Title: "Mappings change less",
      card2Desc:
        "Mappings still derive storage locations from keccak256, so unrelated keys almost always land on different pages. MIP-8 rarely helps or hurts truly random access; it mostly rewards contiguous layouts.",
      card3Title: "New optimization patterns",
      card3Desc:
        "Page-aware arrays, careful packing, and low-level layouts that keep related data inside the same 128-slot page open a new optimization space for page-aware gas costs.",
    },
    compatibility: {
      title: "Execution stays compatible",
      desc1:
        "At the opcode level, execution semantics stay the same: SLOAD still returns 32 bytes and SSTORE still writes 32 bytes. What changes is the storage commitment/proof layer and the gas model, which become page-aware. The effective key space narrows from 2\u00b2\u2075\u2076 hashed slots to 2\u00b2\u2074\u2079 page indices.",
      desc2:
        "Contracts that read consecutive storage slots often get cheaper because Solidity stores struct members, fixed arrays, and runs of dynamic-array elements contiguously once their base location is known. Mappings still use hashed locations, so mapping-heavy access patterns tend to change less. The main contracts at risk are those that hardcode opcode-gas assumptions for consecutive storage accesses.",
      blake3Note:
        "Each 4,096-byte page is committed via a fixed binary tree built from the BLAKE3 compression function. 128 slots pair into 64 leaves, which hash through 6 levels into a single 32-byte root. An inclusion proof for any slot is about 257 bytes (1-byte index + target word + sibling word + 6 parent hashes), plus the MPT proof for the page commitment.",
    },
    gasCalc: {
      title: "Compare the cost",
      desc: "Select a scenario to see the gas breakdown under Monad's current model versus MIP-8's page-aware model.",
      note: "The read examples use Monad's gas constants (8,100 cold / 100 warm) and assume the accessed run fits in one page. The write example is qualitative because MIP-8 defines abstract page-write and state-growth parameters instead of fixed numbers.",
      monadCurrent: "Monad (current)",
      gas: "gas",
      gasSavings: "Gas savings",
      cheaper: "cheaper",
      noChange: "No change",
      specOpen: "Spec leaves this open",
      specNote:
        "MIP-8 specifies the shape of the write formula, but not final protocol constants.",
      saved: "Saved",
      scenario1Name: "Read 4 struct fields",
      scenario1Desc:
        "Loading 4 contiguous struct fields that fit in one page",
      scenario2Name: "Read 8 array entries",
      scenario2Desc:
        "Iterating over 8 consecutive array slots (e.g. an order book)",
      scenario3Name: "Read 8 mapping entries",
      scenario3Desc: "Looking up 8 unrelated mapping keys",
      scenario4Name: "Read ERC-20 transfer data",
      scenario4Desc:
        "sender balance, receiver balance, allowance - 3 hashed lookups that usually hit different pages",
    },
    pageMapping: {
      title: "Slot \u2192 Page mapping",
      desc: "Every slot maps deterministically to a page. The math is simple: shift right by 7 bits to get the page, mask the low 7 bits to get the offset within it.",
      storageSlot: "Storage slot",
      page: "Page",
    },
    stepper: {
      title: "Watch storage accesses in real time",
      desc: "Step through real contract code line by line. Each SLOAD/SSTORE lights up the corresponding storage slot and shows whether it's a cold or warm access under MIP-8.",
      uniqueSlots: "unique slots accessed",
      clickNext: 'Click "Next" to start stepping',
      accessLog: "Access log",
      code: "Code",
      pages: "Pages",
      log: "Log",
      prev: "Prev",
      next: "Next",
      start: "Start",
      reset: "Reset",
      keys: "\u2190 \u2192 keys",
      totalGasFor: "Total cold-access gas for",
      cheaperWithMip8: "% cheaper with MIP-8",
      noChangeWithMip8: "No change with MIP-8",
      allSlotsCold: "all slots cold",
      cold: "cold",
      restWarm: "rest warm",
      uniswapDesc:
        "Pair storage slots share one page, but balanceOf() reads execute in two separate token contracts. This simplified trace treats each balance page as untouched, so both token reads start cold; earlier token calls in a full transaction could warm them.",
      erc1155Desc:
        "20 contiguous balance reads from a page-aware array layout",
      erc20Desc:
        "2 mapping lookups on different pages, plus writes. MIP-8 does not help here",
    },
    analyzer: {
      title: "Try your own contract",
      desc: "Paste a GitHub repo URL or Solidity source to see how your contract's storage layout maps to pages.",
      note: "Works best with small-to-medium repos. Large repos with many dependencies (e.g. Aave, Chainlink) may time out.",
      tryLabel: "Try:",
      analyze: "Analyze",
    },
  },
  cherryPicked: {
    title: "Design for pages, get 10X+",
    desc: "MIP-8 doesn't just help existing contracts. It opens a new design space where page-aware storage yields order-of-magnitude improvements.",
    subDesc: "Consider an ERC-1155 multi-token contract. The standard implementation hashes each token balance to a random storage location. A page-aware design stores balances contiguously, so batch operations read one page instead of N scattered slots.",
    standardLayout: "Standard ERC-1155",
    standardComment: "// balances scattered by keccak256",
    standardNote: "Each token ID hashes to a different page",
    pageAwareLayout: "Page-aware design",
    pageAwareComment: "// balances packed contiguously",
    pageAwareMapComment: "// token IDs 0-127 map to one page",
    pageAwareNote: "All token balances in one page",
    batchSize: "Batch size",
    batchDesc: "Number of token balances read in one operation",
    tokens: "tokens",
    threshold: "12 (10X threshold)",
    standardLabel: "Standard layout",
    pageAwareLabel: "Page-aware + MIP-8",
    improvement: "Improvement",
    cheaper: "cheaper",
    gasSaved: "gas saved",
    gasComparison: "Cold-access gas comparison",
    explanation: "This example shows a page-aware ERC-1155 that stores token balances in a contiguous array instead of a double mapping. With MIP-8, batch reads from the same page scale at 100 gas per additional slot instead of 8,100.",
    allCold: "all cold",
  },
  mip3: {
    hero: {
      title1: "What if memory cost",
      titleHighlight: "scaled linearly?",
      desc: "EVM memory has a quadratic cost curve. MIP-3 makes it linear.",
      allocating: "Allocating memory...",
      quadratic: "Quadratic (current)",
      linear: "Linear (MIP-3)",
      expanding: "Expanding to",
      memoryOf: "1 MB of memory",
      cheaper: "x cheaper",
    },
    costCurve: {
      title: "The quadratic wall",
      desc: "Ethereum charges words\u00b2/512 + 3*words for memory. MIP-3 charges words/2. Drag the slider to see how they diverge.",
      memorySize: "Memory allocation size",
      quadraticEth: "Quadratic (ETH)",
      linearMip3: "Linear (MIP-3)",
      improvement: "Improvement",
      gas: "gas",
      impossible: "IMPOSSIBLE",
      exceeds: "exceeds 30M block limit",
      free: "free",
      noExpansion: "no memory expansion cost",
      onlyMip3: "only possible with MIP-3",
      cheaper: "cheaper",
      gasChart: "Gas cost across memory sizes (log scale, capped at 30M for visibility)",
      quadraticLabel: "Quadratic",
      linearLabel: "Linear (MIP-3)",
      blockLimit: "30M gas block limit shown as 100%",
      avgUsage: "avg usage",
      historicalMax: "historical max",
      ethBlockLimit: "ETH block limit",
      mip3Cap: "MIP-3 cap",
    },
    memoryPool: {
      title: "Shared memory pool",
      desc: "Under MIP-3, child calls share the same 8 MB memory pool with their parent. When a call returns, its memory is released back.",
      subDesc:
        "On the current EVM, each call context gets fresh isolated memory. MIP-3 pools it, so nested calls don't waste the budget.",
      transactionPool: "8 MB Transaction Pool",
      free: "MB free",
      mbUsed: "MB used",
      mbFree: "MB free",
      callsDeep: "deep",
      call: "call",
      calls: "calls",
      callStack: "Call stack",
      noActiveCalls: "No active calls",
      prev: "Prev",
      next: "Next",
      start: "Start",
      autoPlay: "Auto-play",
      playing: "Playing...",
      step: "Step",
      step1: "Transaction starts with 8 MB pool",
      step2: "Contract A allocates 1 MB",
      step3: "A calls B. B allocates 3 MB",
      step4: "B calls C. C allocates 2 MB",
      step5: "C returns. Its 2 MB is released back to the pool",
      step6: "B returns. Its 3 MB is released back to the pool",
      step7: "A calls D. D allocates 4 MB (7 MB available)",
    },
    gasCalc: {
      title: "Compare the cost",
      desc: "Select a scenario to see the memory expansion gas under the current quadratic model versus MIP-3's linear model.",
      quadraticEth: "Quadratic (ETH)",
      linearMip3: "Linear (MIP-3)",
      gas: "gas",
      words: "words",
      savings: "Memory expansion savings",
      onlyMip3: "Only possible with MIP-3",
      cheaper: "x cheaper",
      scenario1: "Typical usage (2 KB)",
      scenario1Desc:
        "Average memory usage observed on Ethereum mainnet. ABI encoding a few parameters.",
      scenario2: "ABI-encode a struct (1 KB)",
      scenario2Desc:
        "Encoding a moderately sized struct for a cross-contract call.",
      scenario3: "Batch process 100 txs (100 KB)",
      scenario3Desc:
        "Building a 100 KB buffer to process a batch of transactions in one call.",
      scenario4: "On-chain data processing (1 MB)",
      scenario4Desc:
        "Decompressing, sorting, or transforming a large dataset in a single transaction.",
      scenario5: "Full 8 MB allocation",
      scenario5Desc:
        "Maximum memory under MIP-3. Enables large proof verification buffers, rollup batch processing.",
      scenario5Note: "Exceeds 30M gas block limit",
    },
    takeaways: {
      title: "What this means for developers",
      card1Title: "Predictable costs",
      card1Desc:
        "Linear pricing means doubling your memory doubles your cost. No quadratic surprises. Gas budgeting for memory-intensive operations becomes straightforward.",
      card2Title: "Large buffers are feasible",
      card2Desc:
        "1 MB of working memory costs 16,384 gas. On-chain sorting, decompression, proof verification, and batch processing become practical within a single transaction.",
      card3Title: "Shared memory pool",
      card3Desc:
        "Child calls borrow from the same 8 MB pool instead of getting isolated memory. When a call returns, its memory is released back. Nested calls no longer waste the budget.",
    },
    suggestions: {
      title: "What to write differently",
      desc: "Concrete Solidity patterns that benefit from linear memory pricing, each backed by a real Monad mainnet transaction.",
      s3aTitle: "Stop using SSTORE as a within-tx scratchpad",
      s3aSummary:
        "When a function writes intermediate state to storage just to read it back later in the same call, you're paying state-growth and SLOAD costs for data that could live in memory.",
      s3aExplanation:
        "Measured on Monad mainnet: the storage variant cost 2,420,884 gas; the memory variant cost 57,003 gas, a 97.6% reduction. MIP-3 makes memory effectively free for typical workloads. Anywhere a function currently round-trips intermediate values through storage just to read them back in the same call, swap the storage variable for a memory variable. Both transaction hashes are linked below so you can verify the measurement.",
      s3bTitle: "Allocate memory liberally, 1 MB is cheap",
      s3bSummary:
        "Ethereum's quadratic memory cost trained devs to avoid large in-memory buffers. On Monad, that constraint is gone.",
      s3bExplanation:
        "The 'after' tx allocates a 1 MB memory buffer, fills it with 32,768 keccak256 outputs, and folds them, all in one call, in 13.5 M gas (well within a single block). The same logic on Ethereum L1 would pay quadratic memory expansion costs for the intermediate keccak buffers and likely exceed the 30 M block gas limit, forcing devs to chunk the work across multiple transactions. There is no equivalent 'before' tx to deploy on Monad: the same code runs the same way; the difference is which chain can afford it. Reach for the straight-line algorithm.",
    },
    compatibility: {
      title: "Backwards compatible",
      desc1:
        "All memory opcodes work identically: MLOAD, MSTORE, MSTORE8, MCOPY. What changes: expansion gas becomes linear, an 8 MB hard cap is enforced, and child calls share a memory pool with their parent instead of getting isolated memory.",
      desc2:
        "Existing contracts get cheaper, not broken. Average memory usage is around 2 KB, which drops from 200 gas to 32 gas. The only contracts at risk are those hardcoding gas assumptions about memory expansion costs.",
      desc3:
        "When the 8 MB limit is exceeded, the call fails with an out-of-gas error within the call frame, not a Solidity-level revert, so no return data is produced.",
      opcodeNote: "All memory-expanding opcodes use the new linear cost:",
    },
  },
  mip4: {
    hero: {
      title1: "Detect reserve violations",
      titleHighlight: "mid-execution",
      desc: "Monad reserves 10 MON per EOA to ensure solvency across async execution. MIP-4 lets contracts check if that threshold has been crossed.",
      reserve: "10 MON reserve",
      monBalance: "MON balance",
      step1: "Starting balance",
      step2: "Swap 7 MON for tokens",
      step3: "Transfer 10 MON to pool",
      step4: "dippedIntoReserve() \u2192 true",
      step5: "Revert transfer, restore balance",
      step6: "dippedIntoReserve() \u2192 false",
    },
    asyncPipeline: {
      title: "Why reserve balance exists",
      desc: "Monad separates consensus from execution. When block N is proposed, the leader only has state from block N-3 (~1.2 seconds ago).",
      subDesc:
        "Without protection, a user could appear solvent on stale state but have already spent their funds. The 10 MON reserve ensures EOAs remain solvent across the async execution gap.",
      stateKnown: "State known to consensus",
      aliceSpends: "Alice spends 95 MON",
      processing: "Processing...",
      leaderProposes: "Leader proposes Alice's tx",
      leaderNote: "Leader sees 100 MON, but Alice actually has 5 MON",
      withoutReserve: "Without reserve",
      withoutDesc:
        "Alice submits txs that pass consensus validation (she looks solvent) but fail during execution. Network wastes blockspace processing invalid transactions.",
      withReserve: "With 10 MON reserve",
      withDesc:
        "Alice can only commit 10 MON in gas fees across the 3-block window. The leader rejects transactions that would exceed this budget, even on stale state.",
    },
    bundler: {
      title: "Find the action that breaks the bundle",
      desc: "This spec-derived simulation follows a realistic smart-wallet flow. Alice asks her wallet to do five things at once: swap 2 MON, mint an NFT, bridge 15 MON, stake 1 MON, and make one final swap. Her wallet sends them to a bundler, which packs all five actions into one transaction.",
      subDesc:
        "Alice’s delegated account starts with 22 MON. The first two actions are safe. The bridge in Action #3 also reports success, but it leaves only 7 MON—below Monad’s 10 MON reserve. Without MIP-4, the bundler discovers that only after the whole transaction fails. With MIP-4, the reserve check says no after Actions #1 and #2, then yes immediately after #3. MIP-4 does not name the action; the bundler knows it was #3 because that was the last action completed. It can leave the bridge out and retry the other four in a new transaction.",
      scenario: "What goes wrong",
      scenarioDesc:
        "Action #3 bridges 15 MON out of an account with 22 MON. That leaves 7 MON—below the required 10 MON reserve—even though the bridge call itself succeeds.",
      before: "Before",
      after: "After #3",
      reserveLine: "below 10 MON reserve",
      withoutMip4: "Without MIP-4",
      withMip4: "With MIP-4",
      withoutLaneTitle: "You only find out at the end",
      withoutLaneDesc:
        "Every action looks successful. The reserve problem only appears after all five actions have run.",
      withLaneTitle: "Find the problem as it happens",
      withLaneDesc:
        "Check after each action. The first yes points to the action that just finished.",
      op1: "Swap 2 MON → USDC",
      op2: "Mint an NFT (0.5 MON)",
      op3: "Bridge 15 MON out",
      op4: "Stake 1 MON",
      op5: "Swap 0.1 MON → WETH",
      userOp: "Action #{id}:",
      pending: "waiting",
      executing: "running…",
      subcallSuccess: "finished successfully",
      probeFalse: "reserve check → safe",
      probeTrue: "reserve check → below minimum · action identified",
      notExecuted: "not run after the problem was found",
      rolledBack: "undone when the transaction failed",
      removed: "left out of the retry",
      included: "included in the successful retry",
      processing: "Running...",
      runBoth: "Run both",
      step: "Step",
      reset: "Reset",
      replay: "Replay comparison",
      removeAndRetry: "Remove #3 and retry",
      ready: "Ready · 0 / 6",
      executingOp: "Running action #{id} · {id} / 6",
      finalCheck: "Checking the final reserve · 6 / 6",
      comparisonComplete: "First try complete",
      retryReady: "Retry ready · 0 / 4",
      retryingOp: "Retrying action #{id}",
      retryComplete: "Retry complete · 4 / 4 included",
      withoutOutcomeTitle: "Bundle failed · cause unknown",
      withoutOutcomeDesc:
        "All five actions ran before the final reserve check undid the transaction. The error does not tell the bundler that Action #3 caused it.",
      diagnosedOutcomeTitle: "Stopped early · Action #3 found",
      diagnosedOutcomeDesc:
        "The check changed to yes immediately after Action #3. MIP-4 did not supply the number; the bundler worked it out from where the check was placed.",
      retryOutcomeTitle: "New transaction · Action #3 left out",
      retryOutcomeDesc:
        "The first try has already been undone. The bundler is now sending a new bundle with only the four safe actions.",
      successOutcomeTitle: "4 actions succeeded on the second try",
      successOutcomeDesc:
        "The new bundle succeeds. Action #3 gets a clear error while everyone else can keep moving.",
      detectionLabel: "When the problem appears",
      detectionWithout: "At the very end",
      detectionWith: "Right after Action #3",
      attributionLabel: "What caused it",
      attributionWithout: "Unknown",
      attributionWith: "Action #3",
      nextActionLabel: "What happens next",
      nextActionWithout: "Investigate and try again",
      nextActionWith: "Leave out #3 and retry",
      inspectTrace: "See what happened under the hood",
      boolNote:
        "dippedIntoReserve() only answers yes or no for the whole transaction. The bundler finds the action number by checking immediately after each action; the precompile does not return it.",
    },
    timeline: {
      title: "Watch the reserve in action",
      desc: "Step through a transaction that moves MON between accounts. The 10 MON reserve line shows when an account is in violation. Call dippedIntoReserve() at any point to check.",
      contract: "contract",
      violation: "VIOLATION",
      reserve: "reserve",
      exempt: "exempt",
      prev: "Prev",
      next: "Next",
      start: "Start",
      reset: "Reset",
      keys: "\u2190 \u2192 keys",
      step: "Step",
      checkTrue: "At least one touched account is below the 10 MON reserve",
      checkFalse: "All touched accounts are above the 10 MON reserve",
      step1Action: "Alice swaps 8 MON into Pool",
      step1Detail: "Alice sends MON to the liquidity pool",
      step2Action: "Pool sends 5 MON to Bob",
      step2Detail: "Pool distributes rewards to Bob",
      step3Action: "Alice sends 10 MON to Bob",
      step3Detail: "Alice drops below 10 MON reserve!",
      step4Action: "Bob sends 12 MON to Pool",
      step4Detail: "Bob is still above reserve",
      step5Action: "Pool refunds 5 MON to Alice",
      step5Detail: "Alice is back above reserve!",
    },
    details: {
      title: "Technical details",
      desc1:
        "The precompile lives at 0x1001 with a single method: dippedIntoReserve() (selector 0x3a61584e). It costs 100 gas, equivalent to a transient storage read.",
      desc2:
        "The check is global: it evaluates all accounts touched in the transaction, not just the caller's. It returns true if any account's balance is currently below its reserve threshold; it clears back to false if that balance recovers above the threshold mid-transaction.",
      callRestrictions: "Call restrictions",
      callWorks: "CALL works",
      callReverts: "STATICCALL, DELEGATECALL, CALLCODE revert",
      nonzeroReverts: "Nonzero value reverts",
      extraCalldata: "Extra calldata beyond the 4-byte selector reverts",
      importantBehaviors: "Important behaviors",
      allGas: "Reverts consume all gas (precompile behavior, not Solidity-style refund)",
      exempt: "Smart contracts (non-EIP-7702) are exempt from reserve balance",
      emptying:
        "Emptying exception: an undelegated EOA's first transaction in k blocks may spend below reserve, letting users fully withdraw. EIP-7702-delegated accounts cannot use this exception.",
      o1Cost: "O(1) cost: tracks violations incrementally via a failed-address set",
      usageInSolidity: "Usage in Solidity",
    },
    suggestions: {
      title: "What to write differently",
      desc: "Patterns for integrating the reserve precompile into bundlers and other contracts that orchestrate multi-step MON flows.",
      s4aTitle: "Probe the reserve precompile after risky operations",
      s4aSummary:
        "Without checking, your bundle reverts at tx end with no information about which sub-call dipped the account below reserve. With the precompile, you can blame the right UserOp.",
      s4aExplanation:
        "MIP-4 adds a precompile at 0x1001 that returns whether the current account state violates the 10 MON reserve. Bundlers (ERC-4337 entrypoints, multicall aggregators) should call it after each sub-operation: if it returns true, revert immediately with a structured error naming the offender. Critical detail: the call must be a CALL, not STATICCALL. The spec explicitly disallows STATICCALL. Of the ~340 contracts attempting to use the precompile on mainnet today, every single one is calling it via STATICCALL and reverting. The 'after' tx linked below is, to our knowledge, the first correct integration of 0x1001 on Monad mainnet: a real bundler tx whose trace contains a successful CALL to 0x1001 with selector 0x3a61584e. Use this contract (src linked) as the reference.",
    },
  },
  mip7: {
    hero: {
      title1: "One reserved slot.",
      titleHighlight: "~220 possible functions.",
      desc: "Adding opcodes to an EVM chain risks collision with future Ethereum upgrades. MIP-7 claims one reserved slot as a safe extension namespace.",
      opcodeSpace: "EVM opcode space (0x00\u20130xFF)",
      defined: "defined",
      free: "free",
      reserved: "1 reserved",
      clickToExpand: "Click 0xAE to expand the extension namespace",
      extensionSelectors: "0xAE XX: Monad extension selectors",
      allInvalid: "all INVALID today",
      selectorsFuture: "~220 selectors \u00b7 future MIPs assign specific functionality",
    },
    collision: {
      title: "The collision problem",
      desc: "Ethereum assigns new opcodes with every upgrade. Any slot Monad claims today might be claimed by Ethereum tomorrow, turning the same bytecode into two different programs on two different chains.",
      step1Label: "Monad adds an opcode",
      step2Label: "Ethereum later assigns the same slot",
      step3Label: "Same bytecode, different behavior",
      step1Message:
        "Monad adds opcode 0xAB as FAST_HASH, a Monad-specific optimized hash. Works great on Monad.",
      step2Message:
        "Ethereum's next upgrade assigns 0xAB to SWAP17, a new opcode. The same slot, a completely different function.",
      step3Message:
        "A contract deployed on Monad uses 0xAB. If that bytecode ever runs on Ethereum, 0xAB means something entirely different. No error, just silent wrong behavior.",
      notAssigned: "not yet assigned",
      assignedByMonad: "assigned by Monad",
      assignedByEth: "assigned by Ethereum upgrade",
      mip7Solution: "MIP-7 solution",
      mip7SolutionDesc:
        "Instead of claiming 0xAB, Monad uses 0xAE 0x01. The 0xAE slot is reserved on Ethereum L1 as INVALID forever. No collision is possible.",
    },
    collisionProb: {
      title: "How likely is a collision?",
      desc: "Adding custom opcodes today is a yearly bet against Ethereum claiming the same slot. The probability compounds the longer a chain stays exposed.",
      derivation: "Where the rate comes from",
      step1: "Ethereum execution-layer hard forks since Homestead (excluding BPO, difficulty bomb, and consensus forks)",
      forkRate: "Historical fork rate",
      opPerFork: "Avg new opcodes per fork",
      opcodeRate: "Historical opcode rate",
      perYear: "/yr",
      perFork: "/fork",
      forks: "forks",
      years: "yrs",
      opcodes: "opcodes",
      derivationFootnote:
        "Free opcode space after Fusaka: 256 − 150 defined = 106 unassigned slots. Probability assumes Ethereum picks new opcodes uniformly from the unassigned pool.",
      modeWithout: "Without MIP-7 / EIP-8163",
      modeWith: "With MIP-7 / EIP-8163",
      customOpcodes: "Custom opcodes introduced:",
      eipStages: "EIP-8163 commitment stage",
      stage_a: "Published on the EIPs site and Ethereum Magicians forum",
      stage_b: "Proposed for Hegotá",
      stage_c: "0xAE reserved in ethereum-specs",
      stage_e: "Officially committed",
      currentStage: "current",
      sliderPrompt:
        "How strong do you think the commitment to EIP-8163 is right now?",
      sliderWeak: "No commitment",
      sliderStrong: "Rock solid",
      sliderNote:
        "EIP-8163 is published and proposed, ahead of official inclusion. The attention it already has makes it a reasonable foundation for introducing opcodes today. Use the slider to dial in your confidence in the reservation, and watch how it flows into the collision math.",
      fromSlider: "from your slider",
      yearlyConflict: "Yearly conflict probability",
      formulaIntro: "Probability that any new Ethereum opcode lands on one of the N custom slots:",
      formulaIntroMip7:
        "MIP-7 always contributes a single shared slot (0xAE) regardless of how many extensions live behind it. The remaining risk is whether the EIP-8163 reservation holds.",
      perYearProb: "Per year",
      tenYearProb: "Over 10 years",
      tenYearNote: "Probability of at least one conflict across 10 yearly draws",
      lotteryPrefix: "≈ 1 in ",
      lotterySuffix: " yearly draw",
      zeroChance: "Reservation is set in stone",
      ticketStripLabel: "Cumulative collision risk by year",
      ticketStripFootnote:
        "Each bar shows the cumulative probability of at least one collision by the end of that year. The yearly odds compound over time.",
    },
    namespace: {
      title: "The extension namespace",
      desc: "MIP-7 reserves opcode 0xAE as a gateway. The byte that follows is a selector, giving Monad ~220 safe extension slots under a single top-level opcode.",
      twoByteDispatch: "Two-byte dispatch",
      byte1: "Byte 1: opcode",
      reservedBy: "reserved by EIP-8163 \u00b7 INVALID on Ethereum L1",
      dispatchOnSelector: "dispatch on selector",
      byte2: "Byte 2: selector (0x00\u20130xFF)",
      onEthereumL1: "On Ethereum L1",
      onMonad: "On Monad",
      ethNote: "EIP-8163 permanently reserves 0xAE for non-L1 use. Ethereum will never assign it to anything else.",
      monadNote:
        "When a selector is undefined, behaves as INVALID. Future MIPs assign specific selectors to Monad features.",
      selectorTable: "Extension selector table (first 32 of ~220 shown)",
      statusAll: "status: all unassigned",
      moreSelectors: "+ ~190 more selectors \u00b7 all unassigned \u00b7 future MIPs claim specific slots",
    },
    jumpdest: {
      title: "JUMPDEST analysis",
      desc: "Before execution, the EVM scans bytecode to find valid jump destinations: bytes equal to 0x5B that are not consumed as PUSH immediates. MIP-7 is designed so that 0xAE never alters this analysis.",
      subDesc:
        "This preserves identical jump destination sets across all EVM chains, and it's why extension selectors have strict byte-range restrictions.",
      scanner: "JUMPDEST analysis scanner",
      left: "left",
      right: "right",
      reset: "Reset",
      startScan: "Start scan",
      done: "Done",
      stepArrow: "Step \u2192",
      autoScan: "Auto-scan",
      scanning: "Scanning\u2026",
      bytes: "bytes",
      legend: "Legend",
      extensionGateway: "0xAE: extension gateway",
      validSelector: "valid selector",
      forbiddenHalt: "forbidden selector \u2192 halt",
      validJumpdest: "valid JUMPDEST \u2713",
      pushOpcode: "PUSH opcode",
      pushConsumed: "PUSH-consumed (not JUMPDEST)",
      regularOpcode: "regular opcode/data",
      example1Name: "PUSH consumes 0x5B",
      example2Name: "EXTENSION doesn't eat bytes",
      example3Name: "PUSH-prefix args",
      example4Name: "Forbidden: 0x5B selector",
      example5Name: "Forbidden: PUSH selector",
    },
    encoding: {
      title: "Immediate argument encoding",
      desc: "Extension opcodes have two ways to pass arguments. The choice depends on whether argument bytes need to include values in the restricted range (0x5B or 0x60\u20130x7F).",
      modeA: "Mode A: Restricted-range",
      modeB: "Mode B: PUSH-prefix",
      modeASimple: "Simple.",
      modeASimpleDesc:
        "Argument bytes follow the selector inline. No overhead.",
      modeAConstraint: "Constraint:",
      modeAConstraintDesc:
        "Each argument byte must avoid 0x5B and 0x60\u20130x7F. Using a forbidden value causes an exceptional halt.",
      modeAWhy:
        "Why: JUMPDEST analysis scans arg bytes normally, since 0xAE doesn't eat them. Forbidden bytes would create analysis divergence between chains.",
      modeBFull: "Full range.",
      modeBFullDesc:
        "A PUSHn byte immediately after the selector frames the next n argument bytes. All values 0x00\u20130xFF are safe.",
      modeBWhy: "Why it works:",
      modeBWhyDesc:
        "JUMPDEST analysis encounters the real PUSHn opcode and correctly eats the next n bytes as its immediates, including any 0x5B or PUSH-range bytes. Analysis and execution agree on which bytes are consumed.",
      modeBTradeoff: "Trade-off: one extra byte of overhead (the PUSHn prefix).",
      modeANotAllowed: "Mode A: NOT allowed",
      modeBSafe: "Mode B: safe",
    },
    takeaways: {
      title: "What this means for developers",
      card1Title: "Safe to innovate",
      card1Desc:
        "Monad can add opcode-level features without claiming top-level slots that Ethereum might later assign. The 0xAE namespace is reserved specifically for non-L1 chains by EIP-8163.",
      card2Title: "EVM-portable bytecode",
      card2Desc:
        "Contracts using 0xAE XX on Monad run on Ethereum as INVALID, not as some wrong function. Silent misbehavior is impossible. Bytecode that does work on Monad is predictably inert on Ethereum.",
      card3Title: "~220 slots for future MIPs",
      card3Desc:
        "All ~220 selectors are unassigned today. Each future Monad feature claims its own selector via a new MIP. The encoding format never changes; only the dispatch table grows.",
    },
  },
  mip12: {
    hero: {
      title: "Faster consensus.",
      before: "400",
      after: "300",
      unit: "ms",
      caption: "vote pace",
      delta: "−25%",
      desc: "MIP-12 proposes a 25% shorter vote pace, dropping from 400ms to 300ms. Related per-block parameters scale down to match, so blocks arrive sooner while each one carries a little less.",
    },
    params: {
      title: "What actually changes",
      subtitle:
        "Vote pace leads the change (above). Four more parameters scale down with it. Here's what each one means in plain terms.",
      votePaceName: "Vote pace",
      votePaceMeaning:
        "How often validators vote on a block. Lower means faster confirmations and finality.",
      txName: "Transactions per block",
      txMeaning:
        "The most transactions that can be packed into a single block.",
      gasName: "Compute per block",
      gasMeaning:
        "The total computation a block is allowed to do. “Gas” is the EVM's unit for compute.",
      bytesName: "Data per block",
      bytesMeaning: "The largest a single block can get, measured in bytes.",
      rewardName: "Block reward",
      rewardMeaning:
        "The MON paid to the validator that proposes a block.",
    },
    why: {
      title: "Why turn down every dial?",
      body: "A block every 300ms instead of every 400ms means about 33% more blocks each second. Since each block now holds 25% fewer transactions, less gas, and fewer bytes, the network's per-second capacity stays roughly the same. You're not getting a bigger pipe, just a faster one. The block reward shrinks for the same reason: smaller, more frequent blocks.",
      scopeTitle: "What it touches",
      scopeBody:
        "This is a consensus-layer change only. The execution layer is unaffected and existing contracts behave exactly as before. Activating it requires a hard fork on the consensus client.",
    },
  },
  clearSigning: {
    hero: {
      title: "Clear Signing on Monad",
      description:
        "Your wallet should tell you what you are signing in plain language, not a wall of hex. Clear Signing (ERC-7730) does exactly that, and it works on Monad today. Trigger a real signature on Monad mainnet below and see it for yourself.",
    },
    why: {
      title: "Why this matters",
      blindTitle: "Blind signing drains wallets",
      blindDescription:
        "Most phishing losses start with a user approving a malicious transaction or token permit they could not read. Hex hides the spender and the amount.",
      verifyTitle: "You verify the real action",
      verifyDescription:
        "Clear Signing shows the actual intent: who you are approving, which token, how much, on which network, before you sign. No trust in the dApp UI required.",
      trustTitle: "Trust for a new chain",
      trustDescription:
        "For Monad it means day-one signing safety on par with Ethereum mainnet. Lower the odds users get drained, raise the odds they transact with confidence.",
    },
    demo: {
      title: "Try it live",
      description:
        "This signs a Permit2 token-approval message on Monad. It is a signature only: it is generated locally in your browser and never broadcast, no gas is spent, and no funds move.",
      checkWallet: "Check your wallet…",
      signApproval: "Sign a Permit2 approval on Monad",
      note:
        "MetaMask decodes Permit2 itself, so this readable view shows on any chain, Monad included. That is real, but it is the wallet's built-in decoding, not the ERC-7730 registry. To see what the registry produces for a Monad contract no wallet decodes on its own, look just below.",
    },
    status: {
      noWallet:
        "No EVM wallet detected. Install MetaMask (or another browser wallet) and try again.",
      requestingAccount: "Requesting account access…",
      noAccount: "No account returned by the wallet.",
      switchingNetwork: "Switching to Monad mainnet…",
      reviewRequest: "Open your wallet and review the request…",
      signed:
        "Signed. What did your wallet show, raw hex or a readable summary? That readable view is Clear Signing.",
      requestCancelled: "Request cancelled.",
      providerError: "Wallet error:",
      testNoWallet:
        "No EVM wallet detected. Connect a wallet (a Ledger through MetaMask works) and try again.",
      testReview:
        "Read the confirmation screen now (on your Ledger device if it is connected through MetaMask), then reject it. Nothing needs to be sent.",
      testApproved:
        'You approved it, so the 0.001 MON wrap transaction was submitted and gas will be spent. Check your wallet activity; you can unwrap the WMON later if desired. Either way the screen you saw is the answer: "Wrap MON" with an amount means a registry descriptor is rendering on Monad; raw hex means it is not ingested for chain 143 yet.',
      testRejected:
        'Rejected, nothing was sent. That confirmation screen was the test: "Wrap MON" with an amount means a registry descriptor is rendering on Monad; raw hex means it is not ingested for chain 143 yet.',
    },
    registry: {
      eyebrow: "Proof, not a mock",
      title: "What the registry produces for Monad",
      introBeforeDeposit:
        "Permit2 above renders because MetaMask already knows Permit2. Wrapped MON is the honest test: it is a plain wrapper, so no wallet decodes",
      introOr: "or",
      introAfterWithdraw:
        "on its own. The action names and labels below come from our ERC-7730 descriptor in the registry and nowhere else. This is the resolved output of",
      introAfterCommand:
        "on the WMON descriptor, the same payload a Ledger device loads to render it.",
      actions: {
        wrap: "Wrap MON",
        unwrap: "Unwrap WMON",
        approve: "Approve WMON",
        send: "Send WMON",
        transfer: "Transfer WMON",
      },
      fields: {
        amount: "Amount",
        spender: "Spender",
        to: "To",
        from: "From",
        network: "Network",
      },
      fieldNoteBeforeCommand:
        "Field values are illustrative. The action names and field labels are exactly what the descriptor emits for chain 143. Reproduce it with",
      fieldNoteAfterCommand: ".",
      gotLedger: "Got a Ledger?",
      ledgerBeforeWrap:
        "This is the cleanest way to settle it. Connect through MetaMask and confirm a real Wrap MON transaction on Monad, then reject it: nothing needs to be sent. Any wallet works, but Ledger is the one that reads the registry. If the device shows",
      ledgerAfterWrap:
        "with an amount, a descriptor is rendering on Monad. If it shows raw hex or a generic contract interaction, nothing has ingested it for chain 143 yet.",
      reviewWrap: "Review a WMON wrap on Monad",
      screenshotNote:
        "The page cannot see your device screen, so eyeball it or grab a screenshot. That screenshot is exactly the proof the registry render needs.",
    },
    comparison: {
      title: "Hex versus readable",
      before: "Before: blind signing",
      beforeDescription:
        "Sign and hope. You cannot see the spender or the amount.",
      after: "After: clear signing",
      action: "Action",
      approveUsdc: "Approve USDC",
      uniswapRouter: "Uniswap Router",
      afterDescription: "See exactly what you authorize, then sign.",
    },
    liveDemo: {
      title: "Why a live demo",
      description:
        "Existing preview tools only render against Ethereum mainnet, so they cannot show what signing looks like on Monad. This page signs against Monad directly in your own wallet, the only way to see the real render on chain 143.",
    },
    builders: {
      title: "For builders",
      description:
        "Make your Monad contract clear-signable: publish an ERC-7730 descriptor and open a PR to the registry.",
      spec: "ERC-7730 specification",
      registry: "Clear Signing registry",
      permit2: "Permit2 on Monad (PR #2611)",
      networkInfo: "Monad network info (chainId 143)",
    },
  },
  footer: {
    readSpec: "Read the spec",
    about: "About",
    madeBy: "made by",
    mip8Note:
      "MIP-8's future-directions section points to MIP-9 as a possible follow-on exploring flexible fanout trees for smaller proofs and optimized storage writes.",
    mip3Note:
      "MIP-3 shipped as part of the MONAD_NINE network upgrade. It replaces the quadratic memory cost model with a linear one and introduces a shared 8 MB memory pool.",
    mip4Note:
      "MIP-4 shipped as part of the MONAD_NINE network upgrade. The precompile at 0x1001 lets contracts detect reserve balance violations mid-execution.",
    mip7Note:
      "MIP-7 aligns with EIP-8163, which reserves 0xAE on Ethereum L1 for non-L1 extension use. All ~220 selectors are currently unassigned; future MIPs will claim specific slots.",
    mip12Note:
      "MIP-12 is a draft proposal to reduce the consensus vote pace from 400ms to 300ms, with proportional cuts to per-block limits and reward. It is a consensus-layer change and is not live on mainnet.",
  },
  specDisclaimer: {
    prefix: "The information on this page should not be quoted. Please refer to ",
    suffix: " for the authoritative spec.",
  },
  suggestions: {
    patternLabel: "Pattern",
    before: "Before",
    after: "After",
    beforeBehavior: "Before: naive contract",
    afterBehavior: "After: MIP-4 aware",
    savings: "Savings",
    verifyOnMonadscan: "Verify on Monadscan",
    viewFailingTx: "View tx on Monadscan",
    pendingDeploy: "Pending mainnet deploy",
    pendingMeasurement: "Pending",
    proofDisclaimer:
      "Each suggestion below is backed by a transaction on Monad mainnet. Click any link to verify the gas cost on-chain.",
  },
  discussion: {
    title: "Continue the discussion on Monad Forum",
    desc: "Questions, feedback, or a better idea? Weigh in on the forum thread.",
    openThread: "Open forum thread",
  },
  notFound: {
    label: "Page not found",
    title: "404",
    desc: "This slot doesn't map to any page. The address space here is empty.",
    back: "Back to MIP Land",
  },
  langSwitch: {
    en: "EN",
    zh: "\u4e2d\u6587",
  },
};

export default en;
