import React, { createContext, useState, useEffect, useCallback } from 'react';
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

export const RosterContext = createContext(null);

export const RosterProvider = ({ children }) => {
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

    // ─── Derived lists (for backward compat with existing components) ────
    // Components filter by designation/roleType, but we also provide
    // the old "employees" name pointing to users for any legacy references.
    const employees = users;
    const setEmployees = setUsers; // alias

    // ─── Real-time listeners ──────────────────────────────────
    useEffect(() => {
        let loadCount = 0;
        const checkLoaded = () => {
            loadCount++;
            if (loadCount >= 3) setLoading(false);
        };

        // 1) Users collection
        const unsubUsers = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setUsers(data);
                checkLoaded();
            },
            (error) => {
                console.error('Users listener error:', error);
                checkLoaded();
            }
        );

        // 2) Teams collection
        const unsubTeams = onSnapshot(
            collection(db, 'teams'),
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setTeams(data);
                checkLoaded();
            },
            (error) => {
                console.error('Teams listener error:', error);
                checkLoaded();
            }
        );

        // 3) Config document
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
            (error) => {
                console.error('Config listener error:', error);
                checkLoaded();
            }
        );

        return () => {
            unsubUsers();
            unsubTeams();
            unsubConfig();
        };
    }, []);

    // ─── Config save helper ───────────────────────────────────
    const saveConfig = useCallback(async (updates) => {
        try {
            await setDoc(doc(db, 'config', 'roster'), updates, { merge: true });
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }, []);

    // ─── User CRUD ────────────────────────────────────────────
    const addEmployee = useCallback(async (userData) => {
        try {
            const docRef = await addDoc(collection(db, 'users'), {
                ...userData,
                createdAt: serverTimestamp(),
            });
            return { id: docRef.id, ...userData };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }, []);

    const updateEmployee = useCallback(async (id, updates) => {
        try {
            await updateDoc(doc(db, 'users', id), updates);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }, []);

    const deleteEmployee = useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'users', id));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }, []);

    // ─── Team CRUD ────────────────────────────────────────────
    const addTeam = useCallback(async (teamData) => {
        try {
            const docRef = await addDoc(collection(db, 'teams'), {
                ...teamData,
                assignments: teamData.assignments || {},
                createdAt: serverTimestamp(),
            });
            return { id: docRef.id, ...teamData };
        } catch (error) {
            console.error('Error adding team:', error);
            throw error;
        }
    }, []);

    const updateTeam = useCallback(async (id, updates) => {
        try {
            await updateDoc(doc(db, 'teams', id), updates);
        } catch (error) {
            console.error('Error updating team:', error);
            throw error;
        }
    }, []);

    const deleteTeam = useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'teams', id));
        } catch (error) {
            console.error('Error deleting team:', error);
            throw error;
        }
    }, []);

    // ─── Context value ────────────────────────────────────────
    const value = {
        // Data
        users,
        employees,       // alias for backward compat
        teams,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,

        // Setters (for local optimistic updates if needed)
        setEmployees,
        setTeams: () => { }, // no-op: teams are Firestore-driven
        setAssignments: () => { }, // no-op: assignments live inside team docs
        setHotlineConfig,
        setHotlineRoster,
        setFieldSupervisorRoster,

        // Firestore operations
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTeam,
        updateTeam,
        deleteTeam,
        saveConfig,
    };

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
