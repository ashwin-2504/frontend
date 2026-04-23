import React, { createContext, useEffect, useRef, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../../../FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import apiService from '../services/apiService';
import { hasMovedSignificantly } from '../utils/geoUtils';
import { normalizeRole } from '../utils/roleUtils';

const AuthContext = createContext();
const AUTH_PROFILE_KEY_PREFIX = '@bharatmandi_auth_profile:';

export const useAuth = () => useContext(AuthContext);

const getProfileKey = (uid) => `${AUTH_PROFILE_KEY_PREFIX}${uid}`;

const readCachedProfile = async (uid) => {
  try {
    const cached = await AsyncStorage.getItem(getProfileKey(uid));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to read cached auth profile:', error);
    return null;
  }
};

const saveCachedProfile = async (uid, profile) => {
  try {
    await AsyncStorage.setItem(getProfileKey(uid), JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to save cached auth profile:', error);
  }
};

const clearCachedProfile = async (uid) => {
  try {
    await AsyncStorage.removeItem(getProfileKey(uid));
  } catch (error) {
    console.warn('Failed to clear cached auth profile:', error);
  }
};

const normalizeFirebaseAuthError = (error) => {
  const code = error?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/network-request-failed':
      return 'Firebase is unreachable right now. Check your connection and try again.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingProfileRef = useRef(null);

  const fetchFreshProfile = async (uid) => {
    try {
      const docRef = doc(db, 'userProfiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.warn('Error fetching Firestore profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          // 1. Parallel fetch from Server & Cache
          const [idTokenResult, firestoreData, cachedProfile] = await Promise.all([
            firebaseUser.getIdTokenResult(true).catch(() => null),
            fetchFreshProfile(firebaseUser.uid),
            readCachedProfile(firebaseUser.uid)
          ]);

          // 2. Consolidate profile (Server is source of truth, Cache is fallback)
          const profile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firestoreData?.name || firebaseUser.displayName || cachedProfile?.name || 'Unknown',
            role: normalizeRole(
              idTokenResult?.claims?.role || firestoreData?.role || cachedProfile?.role
            ) || 'customer',
            phone: firestoreData?.phone || cachedProfile?.phone || '',
            address: firestoreData?.address || cachedProfile?.address || '',
            addressLine: firestoreData?.addressLine || cachedProfile?.addressLine || '',
            city: firestoreData?.city || cachedProfile?.city || '',
            pincode: firestoreData?.pincode || cachedProfile?.pincode || '',
            defaultAddressId: firestoreData?.defaultAddressId || cachedProfile?.defaultAddressId || '',
            lastKnownLocation: firestoreData?.lastKnownLocation || cachedProfile?.lastKnownLocation || null,
            farmLocation: firestoreData?.farmLocation || cachedProfile?.farmLocation || null,
          };

          // 3. Self-Healing Migration (Keep existing logic)
          if (profile.role === 'seller' && !profile.farmLocation && profile.lastKnownLocation) {
            const acc = profile.lastKnownLocation.accuracy || 999;
            if (acc < 100) {
                console.log("Auto-migrating seller location to static farm location...");
                apiService.updateFarmLocation(profile.lastKnownLocation).catch(err => console.warn("Auto-migration failed:", err));
                profile.farmLocation = { 
                    ...profile.lastKnownLocation, 
                    setAt: new Date().toISOString(),
                    accuracy: acc 
                };
            }
          }

          await saveCachedProfile(firebaseUser.uid, profile);
          setUser(profile);
        } catch (error) {
          console.warn('Error hydrating auth state:', error);
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Unknown',
            role: 'customer',
            email: firebaseUser.email || '',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
;

    return () => unsubscribe();
  }, []);

  const login = async (email, password, roleHint) => {
    if (roleHint) {
      pendingProfileRef.current = {
        uid: null,
        name: '',
        role: roleHint,
        email,
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const [tokenResult, cachedProfile] = await Promise.all([
        firebaseUser.getIdTokenResult().catch(() => null),
        readCachedProfile(firebaseUser.uid),
      ]);

      const firestoreData = await fetchFreshProfile(firebaseUser.uid);
      const inferredRole = normalizeRole(
        tokenResult?.claims?.role ||
        firestoreData?.role ||
        cachedProfile?.role
      );
      const resolvedRole = inferredRole || 'customer';
      const requestedRole = normalizeRole(roleHint);

      if (
        requestedRole &&
        inferredRole &&
        resolvedRole !== requestedRole
      ) {
        await firebaseSignOut(auth).catch(() => null);
        pendingProfileRef.current = null;
        throw new Error(`This account is registered as ${resolvedRole}. Use the ${resolvedRole} sign-in path.`);
      }

      // Rely on onAuthStateChanged to handle profile merge, or manually trigger it here if needed
      // For immediate response, we fetch once more or wait for hydration

      const profile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: firestoreData?.name || firebaseUser.displayName || cachedProfile?.name || 'Unknown',
        role: inferredRole || 'customer',
        phone: firestoreData?.phone || cachedProfile?.phone || '',
        address: firestoreData?.address || cachedProfile?.address || '',
        addressLine: firestoreData?.addressLine || cachedProfile?.addressLine || '',
        city: firestoreData?.city || cachedProfile?.city || '',
        pincode: firestoreData?.pincode || cachedProfile?.pincode || '',
        defaultAddressId: firestoreData?.defaultAddressId || cachedProfile?.defaultAddressId || '',
        lastKnownLocation: firestoreData?.lastKnownLocation || cachedProfile?.lastKnownLocation || null,
        farmLocation: firestoreData?.farmLocation || cachedProfile?.farmLocation || null,
      };

      await saveCachedProfile(firebaseUser.uid, profile);
      setUser(profile);
      pendingProfileRef.current = null;

      return profile;
    } catch (error) {
      pendingProfileRef.current = null;
      throw new Error(normalizeFirebaseAuthError(error));
    }
  };

  const register = async (email, password, role, name, phone, addressData) => {
    const { address, addressLine, city, pincode } = addressData || {};
    const normalizedRole = normalizeRole(role) || 'customer';
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      pendingProfileRef.current = {
        uid: firebaseUser.uid,
        name,
        role: normalizedRole,
        email,
        phone,
        address,
        addressLine,
        city,
        pincode,
      };

      await updateProfile(firebaseUser, { displayName: name });

      const profile = {
        id: firebaseUser.uid,
        name,
        role: normalizedRole,
        email: firebaseUser.email || email,
        phone,
        address,
        addressLine,
        state: addressData?.state || '',
        pincode,
        defaultAddressId: '',
        farmLocation: null,
      };

      await saveCachedProfile(firebaseUser.uid, profile);
      setUser(profile);

      const idToken = await firebaseUser.getIdToken(true);
      await apiService.syncUserProfile(idToken, {
        name,
        role: normalizedRole,
        phone,
        address,
        addressLine,
        city,
        pincode,
        email: firebaseUser.email || email,
        farmName: normalizedRole === 'seller' ? `${name}'s Farm` : '',
        deliveryCharge: normalizedRole === 'seller' ? 30 : 0
      });
      await firebaseUser.getIdToken(true);
    } catch (error) {
      // ATOMIC CLEANUP: If profile sync fails, we must rollback the Auth user 
      // to avoid "Ghost Users" (Auth exists, but Firestore/Backend doesn't)
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.delete();
        } catch (deleteError) {
          console.error("Cleanup failed after sync error:", deleteError);
        }
      }
      
      setUser(null);
      pendingProfileRef.current = null;
      
      if (error?.code) {
        throw new Error(normalizeFirebaseAuthError(error));
      }
      throw error;
    } finally {
      pendingProfileRef.current = null;
    }

    return auth.currentUser;
  };

  const logout = async () => {
    try {
      const currentUid = auth.currentUser?.uid || user?.id;
      setUser(null);
      pendingProfileRef.current = null;
      if (currentUid) {
        await clearCachedProfile(currentUid);
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Force clear state even if Firebase fails
    }
  };
  
  const updateUser = async (newData) => {
    if (!user) return;
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    await saveCachedProfile(user.id, updatedUser);
  };

  const updateUserLocation = async (location) => {
    if (!user) return;
    
    // 1. Update UI state immediately
    const updatedUser = { ...user, lastKnownLocation: location };
    setUser(updatedUser);
    
    // 2. Local cache update
    await saveCachedProfile(user.id, updatedUser);

    // 3. Throttled Backend Sync (> 500m)
    if (hasMovedSignificantly(user.lastKnownLocation, location, 0.5)) {
        await apiService.updateUserLocation(location);
    }
  };

  const confirmFarmLocation = async (location) => {
    if (!user) return;
    try {
      const response = await apiService.updateFarmLocation(location);
      if (response.success) {
        // Immediate local update to avoid re-fetch cycle
        const updatedUser = { 
          ...user, 
          farmLocation: response.data 
        };
        setUser(updatedUser);
        await saveCachedProfile(user.id, updatedUser);
        return response.data;
      }
    } catch (error) {
      console.error('Error setting farm location:', error);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUser, 
      updateUserLocation,
      confirmFarmLocation,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
