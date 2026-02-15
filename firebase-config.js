const firebaseConfig = {
    apiKey: "AIzaSyBdIWdGi1jYkwmFmR3wUTIKMQT_dpPm7-I",
    authDomain: "klinik-447c7.firebaseapp.com",
    databaseURL: "https://klinik-447c7-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "klinik-447c7",
    storageBucket: "klinik-447c7.firebasestorage.app",
    messagingSenderId: "418642815577",
    appId: "1:418642815577:web:28e7aeb6f05db29e849f48"
};

// Initialize Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log("✅ Firebase connected");
} catch (e) {
    console.warn("⚠️ Firebase not configured. Using LocalStorage fallback.", e.message);
}

// ============================================
// FIREBASE HELPER FUNCTIONS
// ============================================

// Bandwidth estimation tracker (bytes downloaded this session)
let _sessionBandwidthBytes = 0;
function _trackBandwidth(data) {
    if (data !== null && data !== undefined) {
        _sessionBandwidthBytes += new Blob([JSON.stringify(data)]).size;
    }
}

/**
 * Save data to Firebase (with LocalStorage backup)
 * @param {string} path - Firebase path (e.g. 'inventory', 'roster/rules')
 * @param {*} data - Data to save
 */
function firebaseSave(path, data) {
    localStorage.setItem('fb_' + path.replace(/\//g, '_'), JSON.stringify(data));

    if (db) {
        return db.ref(path).set(data)
            .then(() => console.log(`✅ Saved to Firebase: ${path}`))
            .catch(err => console.warn(`⚠️ Firebase save failed for ${path}:`, err.message));
    }
    return Promise.resolve();
}

/**
 * Load data from Firebase (falls back to LocalStorage if offline)
 * @param {string} path - Firebase path
 * @param {*} fallback - Default value if nothing found
 * @returns {Promise<*>}
 */
function firebaseLoad(path, fallback = null) {
    if (db) {
        return db.ref(path).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data !== null) {
                    localStorage.setItem('fb_' + path.replace(/\//g, '_'), JSON.stringify(data));
                    _trackBandwidth(data);
                    return data;
                }
                return JSON.parse(localStorage.getItem('fb_' + path.replace(/\//g, '_')) || JSON.stringify(fallback));
            })
            .catch(err => {
                console.warn(`⚠️ Firebase load failed for ${path}:`, err.message);
                return JSON.parse(localStorage.getItem('fb_' + path.replace(/\//g, '_')) || JSON.stringify(fallback));
            });
    }
    return Promise.resolve(JSON.parse(localStorage.getItem('fb_' + path.replace(/\//g, '_')) || JSON.stringify(fallback)));
}

/**
 * Listen for real-time changes from Firebase
 * @param {string} path - Firebase path
 * @param {function} callback - Called with new data whenever it changes
 */
function firebaseListen(path, callback) {
    if (db) {
        db.ref(path).on('value', snapshot => {
            const data = snapshot.val();
            if (data !== null) {
                localStorage.setItem('fb_' + path.replace(/\//g, '_'), JSON.stringify(data));
                _trackBandwidth(data);
            }
            callback(data);
        });
    }
}
