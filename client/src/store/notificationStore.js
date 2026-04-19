import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newNotif = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        }
        set(state => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1
        }))
      },
      
      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      },
      
      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },
      
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      
      notify: (type, title, message) => {
        const colors = {
          success: '#00c853',
          error: '#ff1744',
          warning: '#ff9100',
          info: '#2979ff',
          invoice: '#ff6f00',
          payment: '#00c853',
          project: '#2979ff',
          client: '#aa00ff'
        }
        get().addNotification({
          type,
          title,
          message,
          color: colors[type] || colors.info
        })
      }
    }),
    { name: 'ff-notifications' }
  )
)

export default useNotificationStore