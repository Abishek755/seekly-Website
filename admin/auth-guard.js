import { auth } from "../src/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Redirect to login page if not logged in
        window.location.href = '/admin/login.html';
    }
});

// Logout function to be used by any page
window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = '/admin/login.html';
    });
};
