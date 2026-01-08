import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "mother" | "doctor" | "driver";

// Define the payload structure for registration
export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  // Optional fields based on role
  dueDate?: string;        // For Mothers
  bmdcNumber?: string;     // For Doctors
  licenseNumber?: string;  // For Drivers
}

export const AuthService = {
  
  // 1. REGISTER
  register: async (data: RegistrationData) => {
    try {
      // A. Create Authentication Credential
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // B. Update Display Name
      await updateProfile(user, { displayName: data.fullName });

      // C. Prepare Firestore Data
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: data.fullName,
        phone: data.phone,
        role: data.role,
        createdAt: new Date().toISOString(),
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

      // Fetch Role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { user, role: userData.role };
      }
      return { user, role: "mother" }; // Default fallback
    } catch (error: any) {
      throw error;
    }
  },

  // 3. GOOGLE LOGIN
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }
};