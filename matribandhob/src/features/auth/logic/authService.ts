import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "mother" | "doctor" | "driver";

// --- 1. DEFINED & EXPORTED USERPROFILE INTERFACE ---
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone?: string;
  role: UserRole;
  createdAt: string;
  photoURL?: string | null;
  // Role specific optional fields
  dueDate?: string;
  bmdcNumber?: string;
  licenseNumber?: string;
}

// Input data for registration
export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  dueDate?: string;        
  bmdcNumber?: string;     
  licenseNumber?: string;  
}

export const AuthService = {
  
  // 1. REGISTER
  register: async (data: RegistrationData) => {
    try {
      // A. Create Authentication Credential
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // B. Update Display Name in Auth
      await updateProfile(user, { displayName: data.fullName });

      // C. Prepare Firestore Data
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: data.fullName,
        phone: data.phone,
        role: data.role,
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || null,
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.bmdcNumber && { bmdcNumber: data.bmdcNumber }),
        ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
      };

      // D. Save to Firestore
      await setDoc(doc(db, "users", user.uid), userProfile);

      return { user, role: data.role };
    } catch (error: any) {
      console.error("Registration Error:", error);
      throw error;
    }
  },

  // 2. LOGIN
  login: async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Fetch Role and Profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        return { user, role: userData.role };
      }
      return { user, role: "mother" as UserRole }; // Default fallback
    } catch (error: any) {
      throw error;
    }
  },

  // 3. GOOGLE LOGIN
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Note: You might want to check if the user exists in Firestore here
    // and create a default profile if they don't exist.
    return result.user;
  },

  // 4. LOGOUT
  logout: async () => {
    await signOut(auth);
  }
};