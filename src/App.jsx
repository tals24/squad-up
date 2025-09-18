import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import './api/testConnection' // Load test connection

function App() {
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App 