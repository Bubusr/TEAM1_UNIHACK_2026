# AI Judge and Pet Re-identification

## Judge response schema

Request structured JSON only; validate with Pydantic; on invalid output retry once, then fail the photo as `judge_error` (never default to a passing score).

```json
{
  "is_live_capture": {"value": true, "confidence": 0.0, "signals": ["moire","screen_bezel","print_edge","stock_look"]},
  "contains_person_face": false,
  "subject": {"kind": "animal|object|scene|none", "species": "cat", "breed": "", "coat_colors": ["orange","white"], "pose_action": "grooming", "object_type": null},
  "welfare_flag": {"value": false, "reason": null},
  "score": {"sharpness_lighting": 0, "cuteness_action": 0, "theme_match": 0, "total": 0},
  "loot": {"drop": "toy_fragment|food_fragment|accessory_fragment|none", "reason": ""}
}
```

Suggested weights: sharpness/lighting 0-40, cuteness/action 0-35, theme match 0-25. Compute `total` in your backend from the parts; do not trust the model's own sum.

## Prompt rules

- State the rubric with anchor examples per band (what a 45, 65, 85 looks like).
- Tell the model to flag screens, printed photos, collages and AI-generated imagery, and to report confidence rather than guess.
- Tell it to reject photos where an animal appears distressed, restrained or in a dangerous place.
- Keep the prompt versioned (`judge_prompt_v3`) and store the version with every judgment.
- Run a fixed golden set (30-50 photos: good, blurry, screenshots, stock, duplicates) on every prompt or model change and compare score drift before rollout.

## Cost control

Cheap checks first (hash dedupe, attestation, blur variance via Laplacian, size limits); only then call the model. Downscale to the smallest size that keeps the judge accurate. Cache results by perceptual hash.

## Re-identification (same animal or new animal)

1. Embed the photo (image encoder, normalized vector). Optionally crop to the animal with a detector first; background dominates raw embeddings and causes false "same animal" matches for the same location.
2. Query pgvector with cosine distance, scoped to **the user's pets first**, then optionally globally to detect other users photographing the same stray (useful for "community pet" features later).
3. Decide with two thresholds, tuned on labeled data, not guessed:
   - `distance < T_same` and species equal -> same animal: award EXP if the pose/action or day differs, else block as duplicate.
   - `T_same <= distance < T_ambiguous` -> ambiguous: ask the judge a pairwise "same individual?" question using both images; still ambiguous -> treat as new but cap rewards.
   - otherwise -> new animal.
4. Coat pattern is a weak individual identifier. Never claim identity certainty in the UI; call it "looks like Mochi".
5. Store every accepted photo's embedding so a pet's centroid improves over time.

Index: `CREATE INDEX ON pets USING hnsw (embedding vector_cosine_ops);`

## Known failure modes to test

Same cat from a different angle (false new), two similar tabbies (false same), a photo of a photo, a plush toy scored as a pet, dog and owner together, night shots, extreme zoom on fur.
