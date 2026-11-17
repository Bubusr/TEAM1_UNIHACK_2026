# PawVerse design pack

This folder contains implementation-ready product designs for the complete
PawVerse build list. The designs are platform-neutral so the current Expo
preview can be replaced by native or WebView implementations without changing
the product contracts.

## Deliverables

- [Interactive design review](./review.html): static browser view with
  editable per-slice decisions and JSON export.
- [Organic style guide](./organic-style-guide.md): visual direction,
  references, and guardrails against generic dashboard styling.
- [Product design specification](./product-design-spec.md): end-to-end flows,
  screen inventory, data model deltas, API contracts, security controls,
  acceptance criteria, and open questions for Slices 0-6.
- [Wireframe board](./wireframe-board.svg): low-fidelity visual reference for
  the primary mobile, partner, sponsor, admin, and consensus screens.
- [Artifact manifest](./artifact-manifest.json): machine-readable inventory of
  screens, domain objects, services, and ownership boundaries.

## Design principles

1. Keep game state and rewards off-chain; put portable ownership and impact
   proofs on-chain.
2. The API is authoritative for scores, streaks, inventory, custody, and
   payouts.
3. Every reward-bearing action is idempotent, rate-limited, observable, and
   reversible by an authorized moderator where appropriate.
4. Animal welfare, privacy, consent, and clear failure states are first-class
   UI requirements.
5. Ship each slice as a demoable vertical flow, not as an isolated layer.

## Open the review view

The review page is static and does not require the API or Expo:

```powershell
python -m http.server 8090 --directory .\docs\designs
```

Open `http://localhost:8090/review.html`. You can also open `review.html`
directly from the file system, but the local server is recommended so the SVG
wireframe loads consistently. Use **Export review notes** to download a JSON
file with decisions before implementation starts.
