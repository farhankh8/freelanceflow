import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyCUo1CRQZuQmeSZkIoKL03WyoP0ptlv6mE",
  authDomain: "freelanceflow-10e41.firebaseapp.com",
  projectId: "freelanceflow-10e41",
  storageBucket: "freelanceflow-10e41.firebasestorage.app",
  messagingSenderId: "797362822688",
  appId: "1:797362822688:web:241af2e1737751978a6645",
  measurementId: "G-00EF5SBPL6"
}

const app = initializeApp(firebaseConfig)

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null
    
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9Q2RQV4N1T2M1G5xwKdX2NQ5Yw"
    })
    return token
  } catch (error) {
    console.error("Notification permission error:", error)
    return null
  }
}

export const onForegroundMessage = (callback) => {
  const messaging = getMessaging(app)
  onMessage(messaging, (payload) => {
    callback(payload)
  })
}

export default app