import { app } from './firebase.js';
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore(app);

export async function saveEnquiryToFirestore(formData) {
    try {
        // Convert FormData to a plain object
        const data = Object.fromEntries(formData.entries());
        
        // Add timestamp and status
        const docData = {
            ...data,
            status: 'New', // Default status for new enquiries
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "enquiries"), docData);
        console.log("Enquiry written with ID: ", docRef.id);
        return true;
    } catch (e) {
        console.error("Error adding enquiry to Firestore: ", e);
        return false;
    }
}
