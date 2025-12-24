I will fix the remaining internationalization issues where the translation keys are being displayed instead of the values, and apply missing translations.

### Problem Analysis
1.  **`Edit/index.tsx`**:
    *   The SLA section (lines 1565, 1580) still has hardcoded text: "Configure trigger SLA" and "SLA".
    *   The `TextInput` placeholder for SLA amount (line 1596) is hardcoded "Time".
    *   The `Select` placeholder for SLA unit (line 1612) is hardcoded "Select time unit".
    *   The `Select` options for SLA unit (lines 1616-1620) are iterating over keys but not using `t()`.
    *   The `Run Settings` (lines 1648, 1660) still has hardcoded labels "Skip run if previous run still in progress" and "Create initial pipeline run...".
    *   The `Payload` section (from previous context, not in recent read but user complained) likely needs verification.

2.  **`OverwriteVariables/index.tsx`**:
    *   The component is using `useTranslation('common')`, but it seems the `t` function is not resolving keys correctly, or the keys in `common.json` are nested in a way that `t` isn't accessing (e.g., if namespace isn't loaded).
    *   However, `Edit/index.tsx` is passing `t` as a prop to `OverwriteVariables` (line 1704 in `Edit/index.tsx` read output).
    *   In `OverwriteVariables/index.tsx` (lines 40-43), it tries to use `tProp` or `tHook`.
    *   If `tProp` is passed, it should work assuming `Edit` has the correct `t`.
    *   The issue might be that `common.json` has duplicate keys or structure issues.
    *   In `common.json` (lines 411-419), `runtime_variables` is defined under `triggers.edit`.
    *   In `OverwriteVariables`, the code uses `t('triggers.edit.runtime_variables.key_placeholder')`. This path looks correct matching the JSON structure.
    *   Why did it show the key? Maybe `Edit` passed a `t` that is not initialized with `common` namespace? `Edit` uses `useTranslation('common')`? (Need to verify `Edit`'s imports and setup, but usually `t` from `useTranslation` works).
    *   **Crucial Observation**: In `common.json`, I see `triggers.edit.run_settings` defined TWICE! Once at line 400 and again at line 462. This invalid JSON or duplicate key might be causing parsing issues, leading to fallback behavior (showing keys).
    *   I also see `triggers.edit.sla` defined twice (line 420 and line 466 check `common.json` read output carefully).
    *   **FIX**: I must clean up `common.json` to remove duplicate keys. The duplicates were likely introduced by my previous `SearchReplace` appending instead of replacing correctly, or appending to a section that already had similar keys.

### Plan
1.  **Fix `common.json` (en & zh)**:
    *   Remove duplicate `run_settings`, `sla` keys in `triggers.edit`. Consolidate them.
    *   Ensure valid JSON structure.

2.  **Fix `Edit/index.tsx`**:
    *   Apply the missing replacements for SLA text, placeholders, and unit options.
    *   Apply the missing replacements for Run Settings checkboxes.
    *   Verify `Payload` section code.

3.  **Fix `OverwriteVariables/index.tsx`**:
    *   The code looks correct (`t` usage), so fixing `common.json` should resolve the key display issue.

### Verification
*   Check `common.json` for validity.
*   Verify all UI elements show translated text.