I have completed the fixes for the internationalization issues.

### Summary of Actions
1.  **JSON Cleanup**:
    *   Detected duplicate keys for `run_settings` and `sla` in `mage_ai/frontend/public/locales/en/common.json` and `zh/common.json`.
    *   Consolidated these keys into single objects to prevent parsing errors that were causing the keys to be displayed instead of the translated text.
    *   Added missing keys for `sla_unit_*` (day, hour, minute, second).

2.  **Code Updates in `Edit/index.tsx`**:
    *   Replaced hardcoded text in the **SLA Configuration** section ("Configure trigger SLA", "SLA", "Time", "Select time unit").
    *   Replaced hardcoded text in the **Run Settings** section (Checkboxes for "Skip run..." and "Create initial pipeline run...").
    *   Replaced hardcoded text in the **Payload** and **Headers** sections.
    *   Updated the SLA unit dropdown to use the dynamic keys `triggers.edit.run_settings.sla_unit_${unit}`.

3.  **Code Verification**:
    *   `OverwriteVariables/index.tsx` was already correctly using `t()`. The display issue (showing keys) was caused by the JSON duplicates in `common.json`, which should now be resolved.

### Expected Outcome
*   **Run Settings**: Checkboxes and Timeout status dropdowns will now show translated text.
*   **SLA**: All labels and placeholders will show translated text. The dropdown options (day, hour, etc.) will be translated.
*   **Runtime Variables**: The "Add runtime variable" button and input placeholders will show translated text instead of keys.
*   **Payload/Headers**: Titles and descriptions will be translated.

The user can now verify that all pointed elements are correctly internationalized.