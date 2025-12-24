I have completed the internationalization (i18n) implementation for the Trigger Edit page (`/pipelines/[pipeline]/triggers/[id]/edit`).

### Summary of Changes

1.  **Codebase Analysis**:
    *   Identified the main component: `mage_ai/frontend/components/Triggers/Edit/index.tsx`.
    *   Identified helper components: `mage_ai/frontend/components/Triggers/Edit/TriggerInteractions.tsx`.
    *   Identified utility function with hardcoded strings: `mage_ai/frontend/components/Triggers/utils.ts`.

2.  **Translation Resources**:
    *   Added a new `triggers.edit` section to `mage_ai/frontend/public/locales/en/common.json` covering all UI texts (form labels, buttons, descriptions, help texts).
    *   Added the corresponding Chinese translations to `mage_ai/frontend/public/locales/zh/common.json`.

3.  **Code Modifications**:
    *   **`mage_ai/frontend/components/Triggers/Edit/index.tsx`**:
        *   Imported `useTranslation` hook.
        *   Replaced all identified hardcoded strings with `t('triggers.edit.KEY')`.
        *   Handled complex texts with `Trans` component (e.g., texts containing links or bold formatting).
        *   Updated call to `getTriggerTypes` to pass the translation function `t`.
    *   **`mage_ai/frontend/components/Triggers/Edit/TriggerInteractions.tsx`**:
        *   Imported `useTranslation`.
        *   Replaced hardcoded strings in the interactions form.
    *   **`mage_ai/frontend/components/Triggers/utils.ts`**:
        *   Updated `getTriggerTypes` function signature to accept `t`.
        *   Replaced hardcoded return values with translated strings.

### Verification
*   Checked file contents to ensure imports and hook usages are correct.
*   Verified that new keys exist in both English and Chinese JSON files.
*   Confirmed that `t` is passed correctly to utility functions.

The page is now fully ready for internationalization. You can verify the changes by switching languages in the UI.