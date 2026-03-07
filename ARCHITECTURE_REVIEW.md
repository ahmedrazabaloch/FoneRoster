# FoneRoster Architectural Review

**Generated:** June 2025  
**Status:** Pre-Refactor Analysis  
**Scope:** Full system architecture, data model, security, and refactoring recommendations

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Firebase Data Model](#2-firebase-data-model)
3. [Role-Based Permission Map](#3-role-based-permission-map)
4. [Service Dependency Graph](#4-service-dependency-graph)
5. [React Component Hierarchy](#5-react-component-hierarchy)
6. [Firestore Collection Structure](#6-firestore-collection-structure)
7. [Security Risk Map](#7-security-risk-map)
8. [Refactoring Plan](#8-refactoring-plan)

---

## 1. System Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Browser Client"]
        React["React 19.2 SPA"]
        Router["React Router 7"]
        Contexts["Context Providers"]
        Pages["Page Components"]
    end

    subgraph Auth["Authentication Layer"]
        FireAuth["Firebase Auth"]
        Claims["Custom Claims\n(role, teamId)"]
        AuthCtx["AuthContext"]
    end

    subgraph State["State Management"]
        RosterCtx["RosterContext"]
        Subscriptions["Real-time Subscriptions"]
    end

    subgraph Services["Service Layer"]
        FireSvc["firebaseService.js"]
        AdminSvc["adminService.js"]
        AuditSvc["auditService.js"]
        VerifySvc["verifyService.js"]
        CloudSvc["cloudinaryService.js"]
    end

    subgraph Firebase["Firebase Backend"]
        Firestore[(Firestore)]
        Storage[(Cloud Storage)]
    end

    subgraph External["External Services"]
        Cloudinary["Cloudinary CDN"]
    end

    React --> Router
    Router --> Pages
    Pages --> Contexts
    Contexts --> AuthCtx
    Contexts --> RosterCtx
    
    AuthCtx --> FireAuth
    FireAuth --> Claims
    
    RosterCtx --> Subscriptions
    Subscriptions --> FireSvc
    
    FireSvc --> Firestore
    AdminSvc --> FireAuth
    AdminSvc --> Firestore
    AuditSvc --> Firestore
    VerifySvc --> Firestore
    CloudSvc --> Cloudinary
    
    FireSvc --> Storage
```

### Architecture Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Client** | React 19.2, Vite 7 | SPA with lazy-loaded routes |
| **Routing** | React Router 7 | Declarative navigation, protected routes |
| **State** | Context API | AuthContext (auth), RosterContext (data) |
| **Services** | Custom service layer | Firestore abstraction, audit logging |
| **Backend** | Firebase 12.9 | Auth, Firestore, Cloud Storage |
| **CDN** | Cloudinary | Image upload and optimization |
| **Styling** | Tailwind CSS 3.4 | Brutalist design system |

---

## 2. Firebase Data Model

```mermaid
erDiagram
    EMPLOYEES {
        string id PK
        string name
        string roleType
        string designation
        string teamId FK
        string cnic "SENSITIVE"
        string phone
        string drivingLicenseNo "SENSITIVE"
        string photoUrl
        boolean isDeleted
        boolean onLeave
        timestamp createdAt
        timestamp updatedAt
    }
    
    PUBLIC_EMPLOYEES {
        string id PK
        string name
        string roleType
        string designation
        string teamId FK
        string photoUrl
        boolean isDeleted
        boolean onLeave
    }
    
    TEAMS {
        string id PK
        string name
        string color
        string description
        string supervisorId FK
    }
    
    VEHICLES {
        string id PK
        string vehicleId
        string make
        string model
        number year
        string teamId FK
        boolean isDeleted
    }
    
    ADMINS {
        string id PK
        string email
        string phone
        string displayName
        string role
        string teamId FK
        object permissions
        timestamp createdAt
    }
    
    CONFIG {
        string id PK
        array fieldSupervisors
        array hotlineContacts
    }
    
    SYSTEM_CONFIG {
        string id PK
        string authorityName
        string signature
        boolean enabled
    }
    
    ADMIN_ACTIVITY_LOGS {
        string id PK
        string userId FK
        string action
        string targetType
        string targetId
        object details
        timestamp timestamp
    }

    TEAMS ||--o{ EMPLOYEES : contains
    TEAMS ||--o{ PUBLIC_EMPLOYEES : mirrors
    TEAMS ||--o{ VEHICLES : owns
    TEAMS ||--o| ADMINS : manages
    ADMINS ||--o{ ADMIN_ACTIVITY_LOGS : creates
    EMPLOYEES ||--|| PUBLIC_EMPLOYEES : syncs
```

### Data Model Notes

| Collection | Records | Sensitive Fields | Access Level |
|-----------|---------|-----------------|--------------|
| `employees` | Full records | CNIC, license | Team User+ |
| `publicEmployees` | Sanitized | None | Public |
| `teams` | Team definitions | None | Public |
| `vehicles` | Fleet data | None | Public |
| `admins` | User profiles | Phone, permissions | Scoped |
| `config` | App config | None | Public read |
| `systemConfig` | Authority data | Signature | Auth only |
| `adminActivityLogs` | Audit trail | None | Admin read |

---

## 3. Role-Based Permission Map

```mermaid
flowchart TB
    subgraph Roles["Role Hierarchy (Level)"]
        SA["SUPER_ADMIN (3)"]
        AD["ADMIN (2)"]
        TU["TEAM_USER (1)"]
        PB["PUBLIC (0)"]
    end

    subgraph Actions["Permission Actions"]
        subgraph SuperOnly["Superadmin Only"]
            AM["ADMIN_MANAGE"]
            SC["SYSTEM_CONFIG"]
            AC["AUTHORITY_CONFIG"]
            GS["GLOBAL_SETTINGS"]
        end
        
        subgraph AdminPlus["Admin+"]
            CE["CREATE_EMPLOYEE"]
            UE["UPDATE_EMPLOYEE"]
            DE["DELETE_EMPLOYEE"]
            EE["EXPORT_EMPLOYEES"]
            MT["MANAGE_TEAM"]
            MV["MANAGE_VEHICLES"]
            VD["VIEW_DASHBOARD"]
            VL["VIEW_LOGS"]
        end
        
        subgraph TeamPlus["Team User+"]
            VS["VIEW_SENSITIVE"]
            VT["VIEW_TEAM"]
        end
        
        subgraph Public["Public"]
            VP["VIEW_PUBLIC"]
        end
    end

    SA --> AD --> TU --> PB
    
    SA -.-> AM & SC & AC & GS
    SA -.-> CE & UE & DE & EE & MT & MV & VD & VL
    AD -.-> CE & UE & DE & EE & MT & MV & VD & VL
    SA -.-> VS & VT & VP
    AD -.-> VS & VT & VP
    TU -.-> VS & VT & VP
    PB -.-> VP
```

### Permission Matrix

| Action | Public | Team User | Admin | Superadmin |
|--------|--------|-----------|-------|------------|
| VIEW_PUBLIC | ✅ | ✅ | ✅ | ✅ |
| VIEW_TEAM | ❌ | ✅ | ✅ | ✅ |
| VIEW_SENSITIVE | ❌ | ✅ | ✅ | ✅ |
| VIEW_DASHBOARD | ❌ | ❌ | ✅ | ✅ |
| VIEW_LOGS | ❌ | ❌ | ✅ | ✅ |
| CREATE_EMPLOYEE | ❌ | ❌ | ✅ | ✅ |
| UPDATE_EMPLOYEE | ❌ | ❌ | ✅ | ✅ |
| DELETE_EMPLOYEE | ❌ | ❌ | ✅ | ✅ |
| EXPORT_EMPLOYEES | ❌ | ❌ | ✅ | ✅ |
| MANAGE_TEAM | ❌ | ❌ | ✅ | ✅ |
| MANAGE_VEHICLES | ❌ | ❌ | ✅ | ✅ |
| ADMIN_MANAGE | ❌ | ❌ | ❌ | ✅ |
| SYSTEM_CONFIG | ❌ | ❌ | ❌ | ✅ |
| AUTHORITY_CONFIG | ❌ | ❌ | ❌ | ✅ |
| GLOBAL_SETTINGS | ❌ | ❌ | ❌ | ✅ |

---

## 4. Service Dependency Graph

```mermaid
graph LR
    subgraph Pages["Page Components"]
        DP["DashboardPage"]
        AP["AdminPage"]
        TP["TeamPage"]
        VP["VerifyPage"]
        LP["LogsPage"]
    end

    subgraph Contexts["Context Providers"]
        AC["AuthContext"]
        RC["RosterContext"]
    end

    subgraph Services["Service Layer"]
        FS["firebaseService"]
        AS["adminService"]
        AUS["auditService"]
        VS["verifyService"]
        CS["cloudinaryService"]
    end

    subgraph Firebase["Firebase SDK"]
        FB_Auth["firebase/auth"]
        FB_FS["firebase/firestore"]
        FB_ST["firebase/storage"]
    end

    subgraph Config["Configuration"]
        FC["firebase.js"]
    end

    DP --> RC
    AP --> RC & AC
    TP --> RC & AUS
    VP --> VS
    LP --> AUS

    AC --> AS & FB_Auth
    RC --> FS & AUS

    FS --> FC & FB_FS & FB_ST
    AS --> FC & FB_Auth & FB_FS
    AUS --> FC & FB_FS
    VS --> FC & FB_FS
    CS --> Cloudinary["Cloudinary API"]

    FC --> FB_Auth & FB_FS & FB_ST
```

### Service Layer Summary

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `firebaseService.js` | CRUD operations for employees, teams, vehicles, config | Firestore, Storage |
| `adminService.js` | Admin user management, secondary app pattern | Auth, Firestore |
| `auditService.js` | Activity logging, immutable audit trail | Firestore |
| `verifyService.js` | Public employee verification | Firestore |
| `cloudinaryService.js` | Image upload with client-side resize | Cloudinary API |

---

## 5. React Component Hierarchy

```mermaid
graph TB
    subgraph Root["Application Root"]
        App["App.jsx"]
    end

    subgraph Layout["Layout Layer"]
        AppLayout["AppLayout"]
        Header["Header"]
        ProtRoute["ProtectedRoute"]
    end

    subgraph PublicPages["Public Pages"]
        Dashboard["DashboardPage"]
        Search["SearchPage"]
        Login["LoginPage"]
        Verify["VerifyPage"]
    end

    subgraph ProtectedPages["Protected Pages"]
        Team["TeamPage"]
        Admin["AdminPage"]
        Logs["LogsPage"]
    end

    subgraph AdminComponents["Admin Components"]
        Sidebar["AdminSidebar"]
        RosterMgr["RosterManager"]
        TeamDir["TeamDirectory"]
        Exports["ExportsPanel"]
        HotlineCfg["HotlineConfig"]
        FieldCfg["FieldTeamConfig"]
        AuditLogs["AuditLogs"]
        UserMgmt["UserManagementPanel"]
        AuthCfg["AuthorityConfigPanel"]
    end

    subgraph DashboardComponents["Dashboard Components"]
        EmployeeGrid["EmployeeGrid"]
        EmployeeCard["EmployeeCard"]
        TeamFilter["TeamFilter"]
        StatCards["StatCards"]
    end

    subgraph Features["Feature Modules"]
        IdCard["IdCardPreviewModal"]
        LogViewer["LogViewer"]
        ExportPanel["ExportPanel"]
    end

    subgraph UILibrary["UI Component Library"]
        Button["Button/BrutalButton"]
        Card["Card/BrutalCard"]
        Input["Input/BrutalInput"]
        Select["Select"]
        Badge["Badge"]
        Spinner["LoadingSpinner"]
    end

    App --> AppLayout
    AppLayout --> Header & ProtRoute
    ProtRoute --> ProtectedPages
    AppLayout --> PublicPages

    Admin --> Sidebar
    Admin --> RosterMgr & TeamDir & Exports & HotlineCfg & FieldCfg & AuditLogs & UserMgmt & AuthCfg

    Dashboard --> EmployeeGrid & TeamFilter & StatCards
    EmployeeGrid --> EmployeeCard
    
    RosterMgr --> IdCard
    Logs --> LogViewer
    Exports --> ExportPanel

    AdminComponents --> UILibrary
    DashboardComponents --> UILibrary
    Features --> UILibrary
```

### Component Organization Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Duplicate AuthContext | `src/auth/`, `src/context/`, `src/features/auth/` | Confusion, maintenance burden |
| Duplicate LoginForm | `src/auth/`, `src/features/auth/` | Inconsistent behavior |
| Duplicate Header | `src/components/`, `src/components/layout/` | Style drift |
| Legacy pages | `src/pages/` alongside `src/*/pages/` | Unclear ownership |

---

## 6. Firestore Collection Structure

```mermaid
flowchart TB
    subgraph Collections["Firestore Collections"]
        subgraph PublicAccess["Public Read Access"]
            PE["publicEmployees\n━━━━━━━━━━━━━\n• Sanitized employee data\n• No CNIC/license\n• Dashboard display"]
            TM["teams\n━━━━━━━━━━━━━\n• Team definitions\n• Colors & names\n• Supervisor refs"]
            VH["vehicles\n━━━━━━━━━━━━━\n• Fleet inventory\n• Team assignments\n• Soft-delete support"]
            CF["config\n━━━━━━━━━━━━━\n• hotlineContacts\n• fieldSupervisors"]
        end

        subgraph TeamAccess["Team User+ Read"]
            EM["employees\n━━━━━━━━━━━━━\n• Full employee records\n• Sensitive data (CNIC)\n• License numbers\n• Leave status"]
        end

        subgraph AdminAccess["Admin+ Access"]
            AL["adminActivityLogs\n━━━━━━━━━━━━━\n• Immutable audit trail\n• Action tracking\n• Create-only (no update)"]
        end

        subgraph SuperAccess["Scoped Admin Access"]
            AD["admins\n━━━━━━━━━━━━━\n• Admin profiles\n• Team user accounts\n• Module permissions\n• Read: own doc or superadmin"]
        end

        subgraph SuperOnly["Superadmin Only Write"]
            SC["systemConfig\n━━━━━━━━━━━━━\n• Authority signature\n• ID card branding\n• Global settings"]
        end
    end

    subgraph Patterns["Data Patterns"]
        SD["Soft Delete\n(isDeleted flag)"]
        TS["Timestamps\n(createdAt, updatedAt)"]
        MR["Data Mirroring\n(employees → publicEmployees)"]
    end

    EM -.->|mirrors| PE
    EM & VH -.-> SD
    EM & AD & AL -.-> TS
```

### Firestore Security Rules Summary

| Collection | Read | Write | Notes |
|-----------|------|-------|-------|
| `publicEmployees` | Anyone | Admin+ | Sanitized data |
| `employees` | Team User+ | Admin+ | Full records |
| `teams` | Anyone | Admin+ | Team definitions |
| `vehicles` | Anyone | Admin+ | Fleet data |
| `config` | Anyone | Admin+ | App configuration |
| `admins` | Scoped | Superadmin | Own doc or superadmin |
| `systemConfig` | Authenticated | Superadmin | Authority settings |
| `adminActivityLogs` | Admin+ | Create only | Immutable audit |

---

## 7. Security Risk Map

```mermaid
flowchart TB
    subgraph HighRisk["🔴 HIGH RISK"]
        R1["Direct Firestore Imports\nin Feature Components"]
        R2["Audit Log Bypass\n(fire-and-forget pattern)"]
        R3["Client-side Role Check\nwithout Server Validation"]
        R4["Cloudinary Unsigned Upload\n(potentially abusable)"]
    end

    subgraph MediumRisk["🟡 MEDIUM RISK"]
        R5["Duplicate Code Paths\n(auth/, context/, features/)"]
        R6["employees→publicEmployees\nSync Not Transactional"]
        R7["No Rate Limiting on\nFirebase Operations"]
        R8["Module Permissions\nStored in Firestore\n(not claims)"]
    end

    subgraph LowRisk["🟢 LOW RISK / BEST PRACTICE"]
        R9["Migration Scripts\nBypass Service Layer"]
        R10["Multiple AuthContext\nImplementations"]
        R11["Inconsistent Error\nHandling Patterns"]
        R12["No Input Sanitization\nBefore Firestore Writes"]
    end

    subgraph Mitigations["Existing Mitigations"]
        M1["✓ Firestore Rules\nEnforce Role-Based Access"]
        M2["✓ Custom Claims\nfor Role Resolution"]
        M3["✓ Soft Delete Pattern\n(Data Recovery)"]
        M4["✓ Immutable Audit Logs\n(No Updates Allowed)"]
    end

    R1 -.->|violates| SL["Service Layer\nEncapsulation"]
    R2 -.->|mitigated by| M4
    R3 -.->|mitigated by| M1
    R8 -.->|should use| M2
```

### Security Risk Details

#### 🔴 High Risk Issues

| Risk | Description | Recommendation |
|------|-------------|----------------|
| **Direct Firestore Imports** | `features/audit/AuditLogViewer.jsx` imports Firestore directly, bypassing service layer | Route all Firestore access through services |
| **Audit Log Bypass** | Fire-and-forget pattern means failed logs are silently lost | Add retry logic or queue failed logs |
| **Client-side Role Checks** | `hasPermission()` runs client-side without server validation | Always enforce in Firestore rules (already done) |
| **Unsigned Cloudinary Upload** | Public unsigned upload preset could be abused | Consider signed uploads or rate limiting |

#### 🟡 Medium Risk Issues

| Risk | Description | Recommendation |
|------|-------------|----------------|
| **Duplicate Code Paths** | Auth logic scattered across 3+ directories | Consolidate to single source of truth |
| **Non-transactional Sync** | `employees` → `publicEmployees` can fail partially | Use Firestore batch or transaction |
| **No Rate Limiting** | No client-side throttling on Firestore operations | Add debouncing/throttling hooks |
| **Module Permissions in Firestore** | Granular permissions in `admins` doc instead of claims | Consider moving critical permissions to claims |

---

## 8. Refactoring Plan

### Phase 1: Code Consolidation (Low Risk)

**Goal:** Eliminate duplicate code and establish single sources of truth

| Task | Files Affected | Priority |
|------|---------------|----------|
| Consolidate AuthContext | Remove `src/context/AuthContext.jsx`, `src/features/auth/AuthContext.jsx`. Keep `src/auth/AuthContext.jsx` | High |
| Consolidate LoginForm | Remove `src/features/auth/LoginForm.jsx`. Keep `src/auth/LoginForm.jsx` | High |
| Consolidate Header | Remove `src/components/Header.jsx`. Keep `src/components/layout/Header.jsx` | Medium |
| Migrate legacy pages | Move `src/pages/*` to feature-based structure | Medium |
| Remove unused components | Audit and remove dead code in `src/admin/components/` | Low |

**Estimated Impact:** ~15 files, no functionality change

---

### Phase 2: Service Layer Enforcement (Medium Risk)

**Goal:** Route all Firestore access through service layer

| Task | Current State | Target State |
|------|--------------|--------------|
| `AuditLogViewer.jsx` | Direct Firestore import | Use `auditLogService` |
| `migrate_*.js` scripts | Direct Firestore import | Acceptable for one-time migrations |
| Add service layer tests | No tests | Unit tests for critical services |

**Files to Refactor:**
- `src/features/audit/AuditLogViewer.jsx` - Add to `firebaseService.js`

---

### Phase 3: Auth System Improvements (Medium Risk)

**Goal:** Strengthen authentication and authorization

| Task | Description | Benefit |
|------|-------------|---------|
| Add token refresh handling | Implement graceful re-auth on token expiry | Better UX |
| Move module permissions to claims | Currently in Firestore `admins` doc | Faster permission checks |
| Add session timeout | Auto-logout after inactivity | Security |
| Implement MFA (optional) | Firebase supports TOTP and SMS | Enhanced security |

**Implementation Notes:**
- Token refresh requires intercepting 401s and prompting re-auth
- Moving permissions to claims requires Cloud Function to update claims on permission change

---

### Phase 4: Data Layer Improvements (Medium-High Risk)

**Goal:** Improve data consistency and integrity

| Task | Current State | Target State |
|------|--------------|--------------|
| Transactional sync | `employees` → `publicEmployees` can fail partially | Firestore batch writes |
| Input validation | Basic client-side | Add Zod schemas with server validation |
| Audit log reliability | Fire-and-forget | Add retry queue for failed logs |
| Optimistic updates | Full re-fetch after mutations | Local state updates with rollback |

**Service Changes Required:**
```javascript
// firebaseService.js - Example transactional sync
async updateEmployee(id, data) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'employees', id), data);
  batch.update(doc(db, 'publicEmployees', id), sanitize(data));
  await batch.commit();
}
```

---

### Phase 5: Component Architecture (Low-Medium Risk)

**Goal:** Establish clear component hierarchy and patterns

| Task | Description |
|------|-------------|
| Create component index files | Export all public components from `index.js` |
| Standardize prop interfaces | Use TypeScript or PropTypes consistently |
| Extract shared hooks | Move reusable logic to `src/hooks/` |
| Document UI component library | Add Storybook or similar |

**Proposed Directory Structure:**
```
src/
├── app/                    # App shell, routing, layout
├── auth/                   # Single auth source of truth
├── components/
│   ├── ui/                 # Primitive components (Button, Input, etc.)
│   └── layout/             # Layout components (Header, Sidebar)
├── features/
│   ├── admin/              # Admin dashboard features
│   ├── dashboard/          # Public dashboard
│   ├── directory/          # Employee directory
│   └── roster/             # Roster management
├── hooks/                  # Shared custom hooks
├── services/               # All Firestore/API access
├── lib/                    # Utilities, constants, types
└── config/                 # Environment config
```

---

### Phase 6: Performance Optimization (Low Risk)

**Goal:** Improve load times and runtime performance

| Task | Current State | Target State |
|------|--------------|--------------|
| Subscription cleanup | Manual cleanup in useEffect | Custom hook with automatic cleanup |
| Memoization | Inconsistent | Use `useMemo`/`useCallback` for expensive ops |
| Bundle analysis | Not tracked | Add bundle analyzer to build |
| Image optimization | Client-side resize | Consider server-side with Cloudinary transforms |

---

### Refactoring Priority Matrix

```
                    LOW RISK ←→ HIGH RISK
                    ↓                   ↓
HIGH VALUE    [Phase 1]          [Phase 4]
    ↑         Code               Data Layer
    |         Consolidation      Improvements
    |
    |         [Phase 2]          [Phase 3]
    |         Service Layer      Auth System
    ↓         Enforcement        Improvements
LOW VALUE
              [Phase 6]          [Phase 5]
              Performance        Component
              Optimization       Architecture
```

**Recommended Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

### Migration Checklist

Before starting any phase:
- [ ] Create feature branch
- [ ] Run existing tests (if any)
- [ ] Document current behavior

After completing each phase:
- [ ] Manual QA of affected features
- [ ] Update this document
- [ ] Create PR with clear scope

---

## Appendix: File Dependencies

### Files with Direct Firestore Imports (Outside Services)

| File | Import | Should Use |
|------|--------|------------|
| `src/features/audit/AuditLogViewer.jsx` | `firebase/firestore` | `auditLogService` |
| `src/utils/migrate_isDeleted.js` | `firebase/firestore` | OK (migration script) |
| `src/utils/migrateUsersToEmployees.js` | `firebase/firestore` | OK (migration script) |
| `src/utils/migrateEmployeesToPublic.js` | `firebase/firestore` | OK (migration script) |
| `src/scripts/*.js` | `firebase/firestore` | OK (one-time scripts) |

### Duplicate File Map

| Canonical Location | Duplicates to Remove |
|-------------------|---------------------|
| `src/auth/AuthContext.jsx` | `src/context/AuthContext.jsx` |
| `src/auth/LoginForm.jsx` | `src/features/auth/LoginForm.jsx` |
| `src/auth/ProtectedRoute.jsx` | `src/components/layout/ProtectedRoute.jsx` |
| `src/components/layout/Header.jsx` | `src/components/Header.jsx` |

---

*This document should be updated as refactoring progresses.*
