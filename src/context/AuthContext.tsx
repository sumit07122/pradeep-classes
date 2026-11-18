import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { fetchErpSessionData, fetchInstituteById } from '../erp/authService';
import { hasAnyErpRole, hasErpPermission, selectActiveMembership } from '../erp/rbac';
import type {
  ErpPermission,
  ErpRole,
  ErpUserProfile,
  Institute,
  InstituteMembership,
} from '../erp/types';

const SUPER_ADMIN_EMAILS = [
  'sumitdevthakur@gmail.com',
  'pradeepclasses.in@gmail.com',
];

interface AuthContextType {
  // Existing CMS Admin & Firebase Auth properties (preserved for /admin/*)
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // ERP Email/Password Authentication & Verification methods
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadVerificationStatus: () => Promise<boolean>;
  emailVerificationRequired: boolean;

  // ERP Foundation properties
  userProfile: ErpUserProfile | null;
  memberships: InstituteMembership[];
  activeMembership: InstituteMembership | null;
  activeInstitute: Institute | null;
  erpRole: ErpRole | null;
  erpLoading: boolean;
  erpError: string | null;
  switchInstitute: (instituteId: string) => Promise<void>;
  refreshErpContext: () => Promise<void>;
  hasPermission: (permission: ErpPermission) => boolean;
  hasRole: (roles: ErpRole | readonly ErpRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<ErpUserProfile | null>(null);
  const [memberships, setMemberships] = useState<InstituteMembership[]>([]);
  const [activeMembership, setActiveMembership] = useState<InstituteMembership | null>(null);
  const [activeInstitute, setActiveInstitute] = useState<Institute | null>(null);
  const [erpLoading, setErpLoading] = useState(false);
  const [erpError, setErpError] = useState<string | null>(null);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string | null>(null);

  const clearErpState = useCallback(() => {
    setUserProfile(null);
    setMemberships([]);
    setActiveMembership(null);
    setActiveInstitute(null);
    setErpError(null);
    setErpLoading(false);
  }, []);

  const loadErpContext = useCallback(
    async (currentUser: User | null, preferredId?: string | null) => {
      if (!currentUser) {
        clearErpState();
        return;
      }

      if (!currentUser.emailVerified) {
        clearErpState();
        return;
      }

      setErpLoading(true);
      setErpError(null);
      try {
        const snapshot = await fetchErpSessionData(
          currentUser.uid,
          preferredId ?? selectedInstituteId
        );
        setUserProfile(snapshot.userProfile);
        setMemberships(snapshot.memberships);
        setActiveMembership(snapshot.activeMembership);
        setActiveInstitute(snapshot.activeInstitute);
        if (snapshot.activeMembership) {
          setSelectedInstituteId(snapshot.activeMembership.instituteId);
        }
      } catch (error) {
        console.error('Failed to load ERP session context:', error);
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setActiveInstitute(null);
        setErpError(
          'Unable to verify your institute membership right now. Please try refreshing or contact your institute administrator.'
        );
      } finally {
        setErpLoading(false);
      }
    },
    [clearErpState, selectedInstituteId]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Legacy CMS Admin check (preserved independently for /admin/*)
        const isSuper = Boolean(
          currentUser.email &&
            SUPER_ADMIN_EMAILS.includes(currentUser.email) &&
            currentUser.emailVerified
        );
        setIsSuperAdmin(isSuper);

        let isAdminUser = false;
        if (isSuper) {
          isAdminUser = true;
        } else {
          try {
            if (currentUser.email) {
              const adminDoc = await getDoc(doc(db, 'admins', currentUser.email));
              if (adminDoc.exists()) {
                isAdminUser = true;
              }
            }
          } catch (error) {
            console.error('Error fetching admin status:', error);
          }
        }
        setIsAdmin(isAdminUser);

        // Load ERP profile, memberships, and active institute
        await loadErpContext(currentUser);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setSelectedInstituteId(null);
        clearErpState();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clearErpState, loadErpContext]);

  // Legacy CMS Google OAuth sign-in
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  // ERP Staff Email/Password sign-in (no self-registration)
  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  // ERP Staff Password Reset email
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // ERP Staff Email Verification resend
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('You must be signed in to request a verification email.');
    }
    if (!auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Reload Firebase user verification state and load ERP context once verified
  const reloadVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      return false;
    }
    await auth.currentUser.reload();
    const refreshedUser = auth.currentUser;
    setUser(refreshedUser);
    if (refreshedUser.emailVerified) {
      await loadErpContext(refreshedUser, selectedInstituteId);
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  const refreshErpContext = useCallback(async () => {
    await loadErpContext(user, selectedInstituteId);
  }, [loadErpContext, selectedInstituteId, user]);

  const switchInstitute = useCallback(
    async (instituteId: string) => {
      const nextMembership = selectActiveMembership(memberships, instituteId);
      if (!nextMembership || nextMembership.instituteId !== instituteId) {
        return;
      }
      setErpLoading(true);
      setErpError(null);
      try {
        const institute = await fetchInstituteById(instituteId);
        setSelectedInstituteId(instituteId);
        setActiveMembership(nextMembership);
        setActiveInstitute(institute);
      } catch (error) {
        console.error('Failed to switch institute:', error);
        setErpError('Unable to load the selected institute workspace.');
      } finally {
        setErpLoading(false);
      }
    },
    [memberships]
  );

  const emailVerificationRequired = Boolean(user && !user.emailVerified);

  const erpRole: ErpRole | null = useMemo(() => {
    if (!user || !user.emailVerified) {
      return null;
    }
    if (!activeMembership || activeMembership.status !== 'active') {
      return null;
    }
    if (userProfile && userProfile.status === 'disabled') {
      return null;
    }
    return activeMembership.role;
  }, [activeMembership, user, userProfile]);

  const hasPermission = useCallback(
    (permission: ErpPermission) => {
      return hasErpPermission(erpRole, permission, activeMembership?.status);
    },
    [activeMembership?.status, erpRole]
  );

  const hasRole = useCallback(
    (roles: ErpRole | readonly ErpRole[]) => {
      return hasAnyErpRole(erpRole, roles, activeMembership?.status);
    },
    [activeMembership?.status, erpRole]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        loading,
        signInWithGoogle,
        logout,
        signInWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        reloadVerificationStatus,
        emailVerificationRequired,
        userProfile,
        memberships,
        activeMembership,
        activeInstitute,
        erpRole,
        erpLoading,
        erpError,
        switchInstitute,
        refreshErpContext,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
