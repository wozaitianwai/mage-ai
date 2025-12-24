I have performed an initial scan of the codebase and identified several key areas that require internationalization. Based on your request for a "complete scan" and "deep adaptation" of buttons/popups, here is the execution plan.

## 1. Immediate Targets (High Visibility)
These components are used globally or on main pages and currently contain many hardcoded English strings.

### **File Browser (`mage_ai/frontend/components/FileBrowser/index.tsx`)**
- **Status**: **Critical**. The context menu (Right-click) is entirely hardcoded.
- **Items to fix**:
  - "New folder", "Rename folder", "Move folder", "Delete folder"
  - "New file", "Upload files", "Download file"
  - "Expand/Collapse all subfolders"
  - "New Mage project"
  - Confirmation dialogs: "Are you sure you want to delete...?"

### **Sidekick / Right Sidebar (`mage_ai/frontend/components/Sidekick/index.tsx`)**
- **Status**: **High**. Contains hardcoded empty states and help text.
- **Items to fix**:
  - "Errors" header.
  - "Select a block for insights"
  - "No data or insights available"
  - "Add a chart by clicking the chart icon..."
  - "Please select a block and then click the settings icon..."

### **Triggers (`mage_ai/frontend/components/Triggers/Table.tsx`)**
- **Status**: **Medium**. Mostly done, but has gaps.
- **Items to fix**:
  - "No triggers available" (Empty state).

## 2. Comprehensive Scan List (To Be Executed Sequentially)
I will process these areas one by one.

### **Group A: Core Components (Popups & Modals)**
- `components/ErrorPopup`: Error messages.
- `components/FileSelectorPopup`: File selection headers/buttons.
- `components/DataIntegrationModal`: Connection settings, stream details.

### **Group B: Feature Pages**
- **Terminal**: `components/Terminal` & `pages/terminal` (Connection status, welcome messages).
- **Compute Management**: `components/ComputeManagement` (Setup steps, status labels).
- **Dependency Graph**: `components/DependencyGraph` (Controls, legends).

## Execution Strategy
1.  **Extract**: Identify strings in the target file.
2.  **Translate**: Add keys to `public/locales/en/common.json` and `public/locales/zh/common.json`.
3.  **Refactor**: Replace strings with `t('namespace.key')` in the React component.
4.  **Verify**: Ensure variable interpolation (e.g., "Delete {filename}?") works correctly.

I will start with **Section 1 (File Browser & Sidekick)** as these are the most visible parts of the UI.
