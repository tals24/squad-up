# 🔧 QUICK FIX FOR IMPORT ERRORS

## **INSTRUCTIONS:**

1. **Stop the dev server** (press Ctrl+C in the terminal running `npm run dev`)
2. **Run the fix command below**
3. **Restart the dev server** (`npm run dev`)

---

## **COMMAND TO RUN:**

```powershell
# Stop dev server first (Ctrl+C), then run this:

# Fix 1: GenericAddPage and FormFields imports
(Get-Content 'src\features\game-management\components\AddGamePage\index.jsx' -Raw) -replace 'from "\.\./components/FormFields"', 'from "@/shared/components/FormFields"' | Set-Content 'src\features\game-management\components\AddGamePage\index.jsx' -NoNewline

(Get-Content 'src\features\player-management\components\AddPlayerPage\index.jsx' -Raw) -replace 'from "\.\./components/FormFields"', 'from "@/shared/components/FormFields"' | Set-Content 'src\features\player-management\components\AddPlayerPage\index.jsx' -NoNewline

(Get-Content 'src\features\team-management\components\AddTeamPage\index.jsx' -Raw) -replace 'from "\.\./components/FormFields"', 'from "@/shared/components/FormFields"' | Set-Content 'src\features\team-management\components\AddTeamPage\index.jsx' -NoNewline

(Get-Content 'src\features\user-management\components\AddUserPage\index.jsx' -Raw) -replace 'from "\.\./components/FormFields"', 'from "@/shared/components/FormFields"' | Set-Content 'src\features\user-management\components\AddUserPage\index.jsx' -NoNewline

(Get-Content 'src\features\reporting\components\AddReportPage\index.jsx' -Raw) -replace 'from "\.\./components/FormFields"', 'from "@/shared/components/FormFields"' | Set-Content 'src\features\reporting\components\AddReportPage\index.jsx' -NoNewline

# Fix 2: Player components imports
(Get-Content 'src\features\player-management\components\PlayerDetailPage\index.jsx' -Raw) -replace 'from "\.\./components/player"', 'from "../shared"' | Set-Content 'src\features\player-management\components\PlayerDetailPage\index.jsx' -NoNewline

(Get-Content 'src\features\player-management\components\PlayersPage\index.jsx' -Raw) -replace 'from "@/components/players/', 'from "../shared-players/' | Set-Content 'src\features\player-management\components\PlayersPage\index.jsx' -NoNewline

# Fix 3: Dashboard hooks and components
(Get-Content 'src\features\analytics\components\DashboardPage\index.jsx' -Raw) -replace 'from "\.\./hooks"', 'from "@/shared/hooks"' | Set-Content 'src\features\analytics\components\DashboardPage\index.jsx' -NoNewline

(Get-Content 'src\features\analytics\components\DashboardPage\index.jsx' -Raw) -replace 'from "\.\./components/dashboard"', 'from "../shared"' | Set-Content 'src\features\analytics\components\DashboardPage\index.jsx' -NoNewline

# Fix 4: DrillMenuDropdown and modals
(Get-Content 'src\features\training-management\components\WeeklyCalendar.jsx' -Raw) -replace 'from "\./DrillMenuDropdown"', 'from "@/features/drill-system/components/DrillMenuDropdown"' | Set-Content 'src\features\training-management\components\WeeklyCalendar.jsx' -NoNewline

(Get-Content 'src\features\training-management\components\WeeklyCalendar.jsx' -Raw) -replace 'from "\./DrillDetailModal"', 'from "@/features/drill-system/components/DrillDetailModal"' | Set-Content 'src\features\training-management\components\WeeklyCalendar.jsx' -NoNewline

(Get-Content 'src\features\training-management\components\DrillLibrarySidebar.jsx' -Raw) -replace 'from "\./DrillMenuDropdown"', 'from "@/features/drill-system/components/DrillMenuDropdown"' | Set-Content 'src\features\training-management\components\DrillLibrarySidebar.jsx' -NoNewline

(Get-Content 'src\features\training-management\components\DrillLibrarySidebar.jsx' -Raw) -replace 'from "\./DrillDetailModal"', 'from "@/features/drill-system/components/DrillDetailModal"' | Set-Content 'src\features\training-management\components\DrillLibrarySidebar.jsx' -NoNewline

# Fix 5: DrillDesigner components
(Get-Content 'src\features\drill-system\components\DrillDesignerPage\index.jsx' -Raw) -replace 'from "@/components/drilldesigner"', 'from "../shared"' | Set-Content 'src\features\drill-system\components\DrillDesignerPage\index.jsx' -NoNewline

(Get-Content 'src\features\drill-system\components\DrillDesignerPage\index.jsx' -Raw) -replace 'from "\.\./components/DrillDescriptionModal"', 'from "../DrillDescriptionModal"' | Set-Content 'src\features\drill-system\components\DrillDesignerPage\index.jsx' -NoNewline

# Fix 6: FormationEditorModal
(Get-Content 'src\features\team-management\components\TacticBoardPage\index.jsx' -Raw) -replace 'from "\.\./components/FormationEditorModal"', 'from "@/shared/components/FormationEditorModal"' | Set-Content 'src\features\team-management\components\TacticBoardPage\index.jsx' -NoNewline

Write-Host "✅ All imports fixed!"
```

---

## **OR: INDIVIDUAL FILES TO EDIT**

If you prefer to edit manually, here are the specific changes:

### 1. `src/features/game-management/components/AddGamePage/index.jsx`
**Line 14:** Change:
```javascript
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";
```
To:
```javascript
import { TextInputField, SelectField, FormGrid } from "@/shared/components/FormFields";
```

### 2. `src/features/player-management/components/AddPlayerPage/index.jsx`
**Line ~30:** Change:
```javascript
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";
```
To:
```javascript
import { TextInputField, SelectField, FormGrid } from "@/shared/components/FormFields";
```

### 3. `src/features/team-management/components/AddTeamPage/index.jsx`
**Line ~28:** Change:
```javascript
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";
```
To:
```javascript
import { TextInputField, SelectField, FormGrid } from "@/shared/components/FormFields";
```

### 4. `src/features/user-management/components/AddUserPage/index.jsx`
**Line ~29:** Change:
```javascript
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";
```
To:
```javascript
import { TextInputField, SelectField, FormGrid } from "@/shared/components/FormFields";
```

### 5. `src/features/reporting/components/AddReportPage/index.jsx`
**Line ~35:** Change:
```javascript
import { TextInputField, SelectField, TextareaField, FormGrid } from "../components/FormFields";
```
To:
```javascript
import { TextInputField, SelectField, TextareaField, FormGrid } from "@/shared/components/FormFields";
```

### 6. `src/features/player-management/components/PlayerDetailPage/index.jsx`
**Line ~29:** Change:
```javascript
} from "../components/player";
```
To:
```javascript
} from "../shared";
```

### 7. `src/features/player-management/components/PlayersPage/index.jsx`
**Lines ~68-70:** Change:
```javascript
import PlayersHeader from "@/components/players/PlayersHeader";
import PlayerFilters from "@/components/players/PlayerFilters";
import PlayerGrid from "@/components/players/PlayerGrid";
```
To:
```javascript
import PlayersHeader from "../shared-players/PlayersHeader";
import PlayerFilters from "../shared-players/PlayerFilters";
import PlayerGrid from "../shared-players/PlayerGrid";
```

### 8. `src/features/analytics/components/DashboardPage/index.jsx`
**Line ~54:** Change:
```javascript
import { useDashboardData, useUserRole, useRecentEvents } from "../hooks";
```
To:
```javascript
import { useDashboardData, useUserRole, useRecentEvents } from "@/shared/hooks";
```

**Line ~55:** Change:
```javascript
import { DashboardHeader, GameZone, DashboardStats, RecentActivity } from "../components/dashboard";
```
To:
```javascript
import { DashboardHeader, GameZone, DashboardStats, RecentActivity } from "../shared";
```

### 9. `src/features/training-management/components/WeeklyCalendar.jsx`
**Lines ~22-23:** Change:
```javascript
import DrillMenuDropdown from "./DrillMenuDropdown";
import DrillDetailModal from "./DrillDetailModal";
```
To:
```javascript
import DrillMenuDropdown from "@/features/drill-system/components/DrillMenuDropdown";
import DrillDetailModal from "@/features/drill-system/components/DrillDetailModal";
```

### 10. `src/features/training-management/components/DrillLibrarySidebar.jsx`
**Lines ~25-26:** Change:
```javascript
import DrillMenuDropdown from "./DrillMenuDropdown";
import DrillDetailModal from "./DrillDetailModal";
```
To:
```javascript
import DrillMenuDropdown from "@/features/drill-system/components/DrillMenuDropdown";
import DrillDetailModal from "@/features/drill-system/components/DrillDetailModal";
```

### 11. `src/features/drill-system/components/DrillDesignerPage/index.jsx`
**Line ~21:** Change:
```javascript
import { DrillDesignerHeader, DrillDesignerToolbar, DrillDesignerCanvas } from "@/components/drilldesigner";
```
To:
```javascript
import { DrillDesignerHeader, DrillDesignerToolbar, DrillDesignerCanvas } from "../shared";
```

**Line ~22:** Change:
```javascript
import DrillDescriptionModal from "../components/DrillDescriptionModal";
```
To:
```javascript
import DrillDescriptionModal from "../DrillDescriptionModal";
```

### 12. `src/features/team-management/components/TacticBoardPage/index.jsx`
**Line ~47:** Change:
```javascript
import FormationEditorModal from "../components/FormationEditorModal";
```
To:
```javascript
import FormationEditorModal from "@/shared/components/FormationEditorModal";
```

---

## **AFTER FIXING:**

Run `npm run dev` again and all errors should be resolved! 🎉

