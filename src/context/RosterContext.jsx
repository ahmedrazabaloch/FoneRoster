import React, { createContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { INITIAL_EMPLOYEES, INITIAL_TEAMS } from '../lib/constants';

export const RosterContext = createContext(null);

export const RosterProvider = ({ children }) => {
    const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
    const [teams, setTeams] = useState(INITIAL_TEAMS);
    const [assignments, setAssignments] = useState({});
    const [hotlineConfig, setHotlineConfig] = useState('standard');
    const [hotlineRoster, setHotlineRoster] = useState({
        morning: 101,
        evening: 102,
        night: 103,
        shift1: 101,
        shift2: 103,
    });
    const [fieldSupervisorRoster, setFieldSupervisorRoster] = useState({
        day: [501, null],
        night: [null, null],
    });
    const [firestoreAvailable, setFirestoreAvailable] = useState(false);

    // Initialize assignments
    useEffect(() => {
        const drivers = employees.filter(e => e.role === 'Driver');
        const supervisors = employees.filter(e => e.role === 'Supervisor');
        const helpers = employees.filter(e => e.role === 'Helper');

        const initial = {};
        teams.forEach((team, index) => {
            initial[team.id] = {
                Driver: drivers[index % drivers.length]?.id,
                Supervisor: supervisors[index % supervisors.length]?.id,
                Helper: helpers[index % helpers.length]?.id,
            };
        });
        setAssignments(initial);
    }, []);

    // Try to sync with Firestore (if available)
    useEffect(() => {
        const checkFirestore = async () => {
            try {
                await getDocs(collection(db, 'employees'));
                setFirestoreAvailable(true);
            } catch (error) {
                console.log('Firestore not available, using local state:', error.message);
                setFirestoreAvailable(false);
            }
        };

        checkFirestore();
    }, []);

    // Sync employees to/from Firestore
    useEffect(() => {
        if (!firestoreAvailable) return;

        const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (data.length > 0) {
                setEmployees(data);
            }
        });

        return unsubscribe;
    }, [firestoreAvailable]);

    // Sync teams to/from Firestore
    useEffect(() => {
        if (!firestoreAvailable) return;

        const unsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (data.length > 0) {
                setTeams(data);
            }
        });

        return unsubscribe;
    }, [firestoreAvailable]);

    // Helper functions for CRUD operations
    const addEmployee = async (employee) => {
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 101;
        const newEmployee = { ...employee, id: newId };

        setEmployees(prev => [...prev, newEmployee]);

        if (firestoreAvailable) {
            try {
                await setDoc(doc(db, 'employees', String(newId)), newEmployee);
            } catch (error) {
                console.error('Error adding employee to Firestore:', error);
            }
        }

        return newEmployee;
    };

    const updateEmployee = async (id, updates) => {
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));

        if (firestoreAvailable) {
            try {
                await setDoc(doc(db, 'employees', String(id)), { id, ...updates }, { merge: true });
            } catch (error) {
                console.error('Error updating employee in Firestore:', error);
            }
        }
    };

    const deleteEmployee = async (id) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));

        if (firestoreAvailable) {
            try {
                await deleteDoc(doc(db, 'employees', String(id)));
            } catch (error) {
                console.error('Error deleting employee from Firestore:', error);
            }
        }
    };

    const value = {
        employees,
        setEmployees,
        teams,
        setTeams,
        assignments,
        setAssignments,
        hotlineConfig,
        setHotlineConfig,
        hotlineRoster,
        setHotlineRoster,
        fieldSupervisorRoster,
        setFieldSupervisorRoster,
        firestoreAvailable,
        addEmployee,
        updateEmployee,
        deleteEmployee,
    };

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
