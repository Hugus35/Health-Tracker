import { useState } from 'react'
import BottomNav from './components/BottomNav'
import Journal from './components/Journal'
import MealEntry from './components/MealEntry'
import Reporting from './components/Reporting'
import Settings from './components/Settings'

export default function App() {
  const [activeTab, setActiveTab] = useState('journal')

  const tabs = {
    journal: <Journal />,
    meal: <MealEntry />,
    reporting: <Reporting />,
    settings: <Settings />,
  }

  return (
    <div className="flex flex-col min-h-svh max-w-[390px] mx-auto bg-white">
      <main className="flex-1 overflow-y-auto pb-20">
        {tabs[activeTab]}
      </main>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}
