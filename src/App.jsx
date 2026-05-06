import { useState } from 'react'
import { useSettings } from './hooks/useSettings'
import Onboarding from './components/Onboarding'
import BottomNav from './components/BottomNav'
import Journal from './components/Journal'
import MealEntry from './components/MealEntry'
import Reporting from './components/Reporting'
import Settings from './components/Settings'

export default function App() {
  const [activeTab, setActiveTab] = useState('journal')
  const { settings, loading, updateSettings } = useSettings()

  if (loading) {
    return (
      <div className="min-h-svh max-w-[390px] mx-auto flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!settings?.weight_kg) {
    return <Onboarding onComplete={updateSettings} />
  }

  // Tabs reconstruits à chaque render — settings/updateSettings sont passés
  // aux composants qui en ont besoin pour rester en phase avec App.
  const tabs = {
    journal:   <Journal />,
    meal:      <MealEntry />,
    reporting: <Reporting />,
    settings:  <Settings settings={settings} updateSettings={updateSettings} />,
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
