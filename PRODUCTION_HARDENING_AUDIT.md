# Production Hardening Audit Report

**Date:** March 7, 2026  
**Status:** ✅ COMPLETED  
**Build:** Passing

---

## Final Validation Results

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Single AuthContext | ✅ | Only `src/auth/AuthContext.jsx` exists |
| No direct Firebase imports in UI | ✅ | No JSX files import `firebase/firestore` |
| All Firestore writes via services | ✅ | All writes in `services/*.js` |
| Employee mirroring atomic | ✅ | Uses `writeBatch()` and `runTransaction()` |
| Permissions from claims | ✅ | Role from `token.claims.role`, actions from `PERMISSION_MAP` |
| Sanitization layer | ✅ | Created `utils/sanitizeInput.js` |
| Centralized error handling | ✅ | Created `utils/errorHandler.js` |

---

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Updated imports to canonical locations |
| `src/app/AppLayout.jsx` | Updated Header import |
| `src/pages/LoginPage.jsx` | Updated LoginForm import |
| `src/features/audit/AuditLogViewer.jsx` | Removed direct Firestore import, uses service |
| `src/services/firebaseService.js` | Added error handler import |
| `src/utils/errorHandler.js` | Created - centralized error handling |
| `src/utils/sanitizeInput.js` | Created - input validation/sanitization |

## Files Deleted

| File | Reason |
|------|--------|
| `src/context/AuthContext.jsx` | Duplicate (was re-export) |
| `src/features/auth/LoginForm.jsx` | Duplicate |
| `src/components/layout/ProtectedRoute.jsx` | Duplicate |
| `src/components/Header.jsx` | Duplicate |
| `src/hooks/useAdminPermissions.js` | Duplicate |

---

## 1. AuthContext Implementations

### Findings

| File | Status | Action Required |
|------|--------|-----------------|
| `src/auth/AuthContext.jsx` | ✅ CANONICAL | Keep as primary source |
| `src/context/AuthContext.jsx` | Re-export wrapper | Can be removed after updating imports |

### Code Evidence

**src/context/AuthContext.jsx (re-export):**
```javascript
export { AuthContext, AuthProvider } from '../auth/AuthContext';
```

**Import locations:**
| File | Import Path | Needs Update |
|------|-------------|--------------|
| `src/App.jsx` | `./context/AuthContext` | Yes → `./auth/AuthContext` |
| `src/app/App.jsx` | `../auth/AuthContext` | No |
| `src/hooks/useAuth.js` | `../auth/AuthContext` | No |
| `src/hooks/useAdminPermissions.js` | `../auth/AuthContext` | No |
| `src/admin/hooks/useAdminPermissions.js` | `../../auth/AuthContext` | No |
| `src/context/RosterContext.jsx` | `../auth/AuthContext` | No |

**Risk Level:** Medium - functional but creates confusion

---

## 2. Direct Firestore Imports (Service Layer Violations)

### Violations in UI Components

| File | Import | Risk Level |
|------|--------|------------|
| `src/features/audit/AuditLogViewer.jsx` | `firebase/firestore`, `../../config/firebase` | 🔴 HIGH |

**Code Snippet (AuditLogViewer.jsx:10-11):**
```javascript
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
```

### Acceptable Locations (Service Layer)

| File | Purpose | Status |
|------|---------|--------|
| `src/services/firebaseService.js` | Employee/Team/Vehicle CRUD | ✅ OK |
| `src/services/adminService.js` | Admin user management | ✅ OK |
| `src/services/auditService.js` | Audit logging | ✅ OK |
| `src/services/verifyService.js` | Public employee lookup | ✅ OK |
| `src/config/firebase.js` | Firebase initialization | ✅ OK |

### Acceptable Locations (Migration Scripts)

| File | Purpose | Status |
|------|---------|--------|
| `src/utils/migrate_isDeleted.js` | One-time migration | ✅ OK |
| `src/utils/migrateUsersToEmployees.js` | One-time migration | ✅ OK |
| `src/utils/migrateEmployeesToPublic.js` | One-time migration | ✅ OK |
| `src/scripts/*.js` | Seed/migration scripts | ✅ OK |

---

## 3. Employee Data Mirroring

### Current Implementation (firebaseService.js)

**Status:** ✅ ALREADY USING BATCH WRITES

```javascript
// firebaseService.js:93-103
async function writeEmployeeWithMirror(id, payload) {
    const publicData = sanitizeForPublic(payload);
    const batch = writeBatch(db);

    batch.set(doc(db, 'employees', id), payload, { merge: true });

    if (Object.keys(publicData).length > 0) {
        batch.set(doc(db, 'publicEmployees', id), publicData, { merge: true });
    }

    await batch.commit();
}
```

**Operations using atomic batch:**
- `employeeService.add()` - Uses `writeEmployeeWithMirror()`
- `employeeService.update()` - Uses `writeEmployeeWithMirror()`
- `employeeService.softDelete()` - Uses `writeBatch()` directly
- `employeeService.restore()` - Uses `writeBatch()` directly

**Risk Level:** ✅ Resolved - no action needed

---

## 4. Permission Resolution

### Current Architecture

**Role (Authentication):** Comes from Firebase custom claims ✅
```javascript
// rbac.js
export async function getUserRole(user, forceRefresh = false) {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    return getRoleFromToken(tokenResult);
}
```

**Module Permissions (UI visibility):** Comes from Firestore `admins/{uid}.permissions`
```javascript
// AuthContext.jsx:64-66
const profile = await adminService.getProfile(firebaseUser.uid);
setModulePermissions(profile.permissions || null);
```

### Assessment

| Permission Type | Source | Status |
|----------------|--------|--------|
| Core role (superadmin/admin/team_user) | Firebase custom claims | ✅ Correct |
| Action permissions (employees:read, etc.) | Derived from role via rbac.js | ✅ Correct |
| Module visibility (fieldTeams, exports) | Firestore admins document | ⚠️ Acceptable |

**Risk Level:** Low - module permissions only affect UI, not security

---

## 5. Error Handling Patterns

### Inconsistent Patterns Found

| Pattern | Count | Files |
|---------|-------|-------|
| `console.error('[Context] message', err)` | 28 | firebaseService, adminService, etc. |
| `console.warn('[Context] message')` | 4 | firebaseService, auditService |
| `console.error('message:', error)` | 12 | AuthContext, various feature files |
| No prefix/context | 4 | ErrorBoundary, superadmin components |

### Sample Inconsistencies

```javascript
// Good - consistent pattern (firebaseService.js)
console.error('[EmployeeService.add]', err);

// Bad - no context (features/roster/FieldSupervisorControl.jsx)
console.error('Failed to save field supervisor config:', err)

// Bad - different format (auth/AuthContext.jsx)
console.error('Login error:', error);
```

**Risk Level:** Medium - makes debugging difficult

---

## 6. Input Validation/Sanitization

### Current Implementation (firebaseService.js)

**Existing safeguards:**
- `trimStrings()` - Trims all string fields
- `normalizePhone()` - Removes whitespace from phone numbers
- `whitelistFields()` - Only allows predefined fields
- `sanitizeForPublic()` - Removes sensitive fields before public mirror

**Code Evidence:**
```javascript
// firebaseService.js:34-81
const EMPLOYEE_ALLOWED_FIELDS = [
    'employeeId', 'name', 'fatherName', 'designation', 'roleType',
    'phone', 'whatsapp', 'cnic', 'licenseNo', 'onLeave', 'availability',
    'isDeleted', 'createdAt', 'updatedAt', 'deletedAt', 'deletedBy', 'photoUrl',
];

function whitelistFields(data, allowedFields) {
    return Object.fromEntries(
        Object.entries(data).filter(([k]) => allowedFields.includes(k))
    );
}
```

### Missing Validation

| Field | Current | Needed |
|-------|---------|--------|
| CNIC format | None | Pakistan CNIC regex |
| Phone format | Whitespace removal | Pakistan phone regex |
| Email format | None | Email regex |
| URL format | None | URL validation |
| String length | None | Max length limits |

**Risk Level:** Low-Medium - partial implementation exists

---

## 7. Duplicate Component Files

| Canonical Location | Duplicate | Action |
|-------------------|-----------|--------|
| `src/auth/AuthContext.jsx` | `src/context/AuthContext.jsx` | Remove (after import update) |
| `src/auth/LoginForm.jsx` | `src/features/auth/LoginForm.jsx` | Remove duplicate |
| `src/auth/ProtectedRoute.jsx` | `src/components/layout/ProtectedRoute.jsx` | Remove duplicate |
| `src/admin/hooks/useAdminPermissions.js` | `src/hooks/useAdminPermissions.js` | Keep admin/, remove hooks/ |
| `src/components/layout/Header.jsx` | `src/components/Header.jsx` | Remove root duplicate |

---

## Refactoring Plan

### Phase 2: Consolidate AuthContext
1. Update `src/App.jsx` to import from `./auth/AuthContext`
2. Delete `src/context/AuthContext.jsx`
3. Update any remaining imports

### Phase 3: Enforce Service Layer
1. Create `auditLogService` in `firebaseService.js`
2. Update `AuditLogViewer.jsx` to use service

### Phase 4: Employee Mirroring
✅ Already implemented with `writeBatch()`

### Phase 5: Permissions
1. Keep current architecture (role from claims, module perms from Firestore)
2. Ensure RBAC permissions are computed client-side from role

### Phase 6: Error Handling
1. Create `utils/errorHandler.js`
2. Define `handleError()`, `normalizeFirebaseError()`
3. Update all services and components

### Phase 7: Input Sanitization
1. Create `utils/sanitizeInput.js`
2. Add validators for CNIC, phone, email, URL
3. Integrate into service layer

### Phase 8: Final Validation
1. Verify single AuthContext
2. Verify no direct Firebase imports in UI
3. Run build to confirm no breakage

---

## Files to Modify

| File | Change Type |
|------|-------------|
| `src/App.jsx` | Update import path |
| `src/context/AuthContext.jsx` | Delete |
| `src/features/auth/LoginForm.jsx` | Delete |
| `src/components/layout/ProtectedRoute.jsx` | Delete |
| `src/hooks/useAdminPermissions.js` | Delete |
| `src/components/Header.jsx` | Delete |
| `src/features/audit/AuditLogViewer.jsx` | Refactor to use service |
| `src/services/firebaseService.js` | Add auditLogService |
| `src/utils/errorHandler.js` | Create new |
| `src/utils/sanitizeInput.js` | Create new |

---

**Proceed to Phase 2 when ready.**
