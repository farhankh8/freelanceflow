import React,{useState}from"react"
import ReactDOM from"react-dom/client"
import App from"./App.jsx"
import Splash from"./components/Splash.jsx"
import"./index.css"
function Root(){
const[done,setDone]=useState(false)
return done?<App/>:<Splash onDone={()=>setDone(true)}/>
}
ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><Root/></React.StrictMode>)