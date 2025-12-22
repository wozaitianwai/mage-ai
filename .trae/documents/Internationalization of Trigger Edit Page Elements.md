I have completed the internationalization for the specified elements on the Trigger Edit page.

### Summary of Changes

1.  **Translation Resources**:
    *   Updated `mage_ai/frontend/public/locales/en/common.json` and `zh/common.json` to include translation keys for:
        *   `triggers.edit.buttons.save_changes`
        *   `triggers.edit.buttons.cancel`
        *   `triggers.edit.triggers_breadcrumb`
        *   `triggers.edit.buttons.save_trigger` (already existed, but verified usage)
        *   `triggers.edit.payload.title` and `triggers.edit.payload.description` (already existed, but verified usage)

2.  **Code Modifications**:
    *   **`mage_ai/frontend/components/Triggers/Edit/index.tsx`**:
        *   Replaced "Triggers" in breadcrumbs with `t('triggers.edit.triggers_breadcrumb')`.
        *   Replaced "Save changes" button text with `t('triggers.edit.buttons.save_changes')`.
        *   Replaced "Cancel" button text with `t('triggers.edit.buttons.cancel')`.
        *   (Note: `Payload` title and description were already replaced in a previous step, but I verified they are using the correct keys).

### Verification
*   The breadcrumb "Triggers" should now be localized.
*   The buttons "Save changes" and "Cancel" at the bottom of the form (when editing an existing trigger) should now be localized.
*   The "Payload" section title and description should be localized.

The page is now fully internationalized for the requested elements.