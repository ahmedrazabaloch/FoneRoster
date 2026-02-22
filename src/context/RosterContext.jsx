import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from './AuthContext';

export const RosterContext = createContext(null);

// ─── Audit logger ──────────────────────────────────────────────────
// Fire-and-forget: logs to `adminActivityLogs` collection.
// Never blocks or throws — audit failure must not break main ops.
async function logActivity({ adminEmail, action, memberId, employeeId, changes }) {
    try {
        await addDoc(collection(db, 'adminActivityLogs'), {
            adminEmail: adminEmail || 'unknown',
            action,
            memberId: memberId || null,
            employeeId: employeeId || null,
            changes: changes || null,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[AuditLog] Failed to write log:', err);
    }
}

export const RosterProvider = ({ children }) => {
    const auth = useContext(AuthContext);
    const adminEmail = auth?.user?.email || 'unknown';

    // ─── State ────────────────────────────────────────────────
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [hotlineConfig, setHotlineConfig] = useState('standard');
    const [hotlineRoster, setHotlineRoster] = useState({
        morning: '',
        evening: '',
        night: '',
        shift1: '',
        shift2: '',
    });
    const [fieldSupervisorRoster, setFieldSupervisorRoster] = useState({
        day: [],
        night: [],
    });
    const [loading, setLoading] = useState(true);

    // ─── Derived alias ────────────────────────────────────────
    const employees = users;
    const setEmployees = setUsers;

    // ─── Real-time listeners ──────────────────────────────────
    useEffect(() => {
        let loadCount = 0;
        const checkLoaded = () => {
            loadCount++;
            if (loadCount >= 3) setLoading(false);
        };

        const unsubUsers = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setUsers(data);
                checkLoaded();
            },
            (error) => { console.error('Users listener error:', error); checkLoaded(); }
        );

        const unsubTeams = onSnapshot(
            collection(db, 'teams'),
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setTeams(data);
                checkLoaded();
            },
            (error) => { console.error('Teams listener error:', error); checkLoaded(); }
        );

        const unsubConfig = onSnapshot(
            doc(db, 'config', 'roster'),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.hotlineConfig) setHotlineConfig(data.hotlineConfig);
                    if (data.hotlineRoster) setHotlineRoster(data.hotlineRoster);
                    if (data.fieldSupervisorRoster) setFieldSupervisorRoster(data.fieldSupervisorRoster);
                }
                checkLoaded();
            },
            (error) => { console.error('Config listener error:', error); checkLoaded(); }
        );

        return () => { unsubUsers(); unsubTeams(); unsubConfig(); };
    }, []);

    // ─── Config save ──────────────────────────────────────────
    const saveConfig = useCallback(async (updates) => {
        try {
            await setDoc(doc(db, 'config', 'roster'), updates, { merge: true });
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }, []);

    // ─── User CRUD (with audit logging) ──────────────────────
    const addEmployee = useCallback(async (userData) => {
        try {
            const docRef = await addDoc(collection(db, 'users'), {
                ...userData,
                createdAt: serverTimestamp(),
            });
            // Audit log — fire and forget
            logActivity({
                adminEmail,
                action: 'ADD_MEMBER',
                memberId: docRef.id,
                employeeId: userData.employeeId || null,
                changes: userData,
            });
            return { id: docRef.id, ...userData };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }, [adminEmail]);

    const updateEmployee = useCallback(async (id, updates) => {
        try {
            await updateDoc(doc(db, 'users', id), updates);
            // Audit log
            logActivity({
                adminEmail,
                action: 'EDIT_MEMBER',
                memberId: id,
                employeeId: updates.employeeId || null,
                changes: updates,
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }, [adminEmail]);

    const deleteEmployee = useCallback(async (id, employeeId) => {
        try {
            // Log before delete so we still have the memberId
            logActivity({
                adminEmail,
                action: 'DELETE_MEMBER',
                memberId: id,
                employeeId: employeeId || null,
                changes: null,
            });
            await deleteDoc(doc(db, 'users', id));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }, [adminEmail]);

    // ─── Team CRUD (with audit logging) ──────────────────────
    const addTeam = useCallback(async (teamData) => {
        try {
            const docRef = await addDoc(collection(db, 'teams'), {
                ...teamData,
                assignments: teamData.assignments || {},
                createdAt: serverTimestamp(),
            });
            logActivity({ adminEmail, action: 'ADD_TEAM', memberId: docRef.id, changes: teamData });
            return { id: docRef.id, ...teamData };
        } catch (error) {
            console.error('Error adding team:', error);
            throw error;
        }
    }, [adminEmail]);

    const updateTeam = useCallback(async (id, updates) => {
        try {
            await updateDoc(doc(db, 'teams', id), updates);
            logActivity({ adminEmail, action: 'EDIT_TEAM', memberId: id, changes: updates });
        } catch (error) {
            console.error('Error updating team:', error);
            throw error;
        }
    }, [adminEmail]);

    const deleteTeam = useCallback(async (id) => {
        try {
            logActivity({ adminEmail, action: 'DELETE_TEAM', memberId: id });
            await deleteDoc(doc(db, 'teams', id));
        } catch (error) {
            console.error('Error deleting team:', error);
            throw error;
        }
    }, [adminEmail]);

    // ─── Context value ────────────────────────────────────────
    const value = {
        users,
        employees,
        teams,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,

        setEmployees,
        setTeams: () => { },
        setAssignments: () => { },
        setHotlineConfig,
        setHotlineRoster,
        setFieldSupervisorRoster,

        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTeam,
        updateTeam,
        deleteTeam,
        saveConfig,
        logActivity: (params) => logActivity({ adminEmail, ...params }),
    };

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
