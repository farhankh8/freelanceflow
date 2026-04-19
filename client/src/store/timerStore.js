import { create } from "zustand"

const LS_TIMER = "freelanceflow_timer"

const getInitialState = () => {
  try {
    const saved = localStorage.getItem(LS_TIMER)
    if (saved) {
      const data = JSON.parse(saved)
      let seconds = data.seconds || 0
      if (data.running && data.startTime) {
        seconds = Math.floor((Date.now() - data.startTime) / 1000)
      }
      return {
        running: data.running || false,
        seconds,
        timerProject: data.timerProject || "",
        timerTask: data.timerTask || "",
        timerRate: data.timerRate || 1500
      }
    }
  } catch {}
  return { running: false, seconds: 0, timerProject: "", timerTask: "", timerRate: 1500 }
}

const useTimerStore = create((set, get) => ({
  ...getInitialState(),

  startTimer: (project, task, rate) => {
    set({ running: true, timerProject: project, timerTask: task, timerRate: rate })
    const data = { running: true, seconds: get().seconds, timerProject: project, timerTask: task, timerRate: rate, startTime: Date.now() - get().seconds * 1000 }
    localStorage.setItem(LS_TIMER, JSON.stringify(data))
  },

  stopTimer: () => {
    const state = get()
    set({ running: false })
    const data = { running: false, seconds: state.seconds, timerProject: state.timerProject, timerTask: state.timerTask, timerRate: state.timerRate }
    localStorage.setItem(LS_TIMER, JSON.stringify(data))
  },

  tick: () => {
    const state = get()
    if (state.running) {
      const newSeconds = state.seconds + 1
      set({ seconds: newSeconds })
      const data = { running: true, seconds: newSeconds, timerProject: state.timerProject, timerTask: state.timerTask, timerRate: state.timerRate, startTime: Date.now() - newSeconds * 1000 }
      localStorage.setItem(LS_TIMER, JSON.stringify(data))
    }
  },

  reset: () => {
    set({ running: false, seconds: 0, timerProject: "", timerTask: "" })
    localStorage.removeItem(LS_TIMER)
  },

  setProject: (project) => set({ timerProject: project }),
  setTask: (task) => set({ timerTask: task }),
  setRate: (rate) => set({ timerRate: rate }),
}))

export default useTimerStore