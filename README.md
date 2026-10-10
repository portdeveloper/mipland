# MIP Land

Interactive explainers for Monad Improvement Proposals and blockchain research. Change the inputs and watch the protocol respond.

**Live:** [mipland.com](https://mipland.com) · **Built by:** [@portdeveloper](https://portdeveloper.github.io)

## Pages

- **MIP-8** - Page-ified Storage: pricing EVM storage by the 4 KB page
- **MIP-3** - Linear Memory: replacing quadratic memory costs
- **MIP-4** - Reserve Balance Introspection: detecting reserve violations mid-execution
- **MIP-7** - Extension Opcodes: safe opcode expansion via 0xAE namespace
- **Asynchronous Execution** - visualizing Monad's consensus/execution pipeline
- **Spam MEV** - Interactive equilibrium model from Category Labs' [Blockspace Under Pressure](https://arxiv.org/abs/2604.00234)

## Stack

Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / Framer Motion

## Development

```bash
npm install
npm run dev
```

## Contributing

Upstream source changes are checked daily and on demand with
`pnpm check:mip-upstream`. See [the review and baseline guide](docs/mip-upstream-review.md).

See [CONTRIBUTING.md](CONTRIBUTING.md). Every PR requires an approved Issue first.

## License

[MIT](LICENSE)
