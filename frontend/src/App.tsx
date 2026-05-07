import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import { WorkloadManager } from './tabs/WorkloadManager';
import { AnemiaTracker } from './tabs/AnemiaTracker';
import { PPDScreening } from './tabs/PPDScreening';
import { SymptomChecker } from './tabs/SymptomChecker';
import { PregnancyRisk } from './tabs/PregnancyRisk';
import { SyncData } from './tabs/SyncData';
import { Analytics } from './tabs/Analytics';
import { Education } from './tabs/Education';
import { SchemesGuide } from './tabs/SchemesGuide';
import { IncentiveTracker } from './tabs/IncentiveTracker';
import { WellnessCheckin } from './tabs/WellnessCheckin';
import { ReferralMode } from './tabs/ReferralMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WorkloadManager />} />
          <Route path="anemia" element={<AnemiaTracker />} />
          <Route path="ppd" element={<PPDScreening />} />
          <Route path="symptom-check" element={<SymptomChecker />} />
          <Route path="pregnancy-risk" element={<PregnancyRisk />} />
          <Route path="education" element={<Education />} />
          <Route path="schemes" element={<SchemesGuide />} />
          <Route path="incentive" element={<IncentiveTracker />} />
          <Route path="wellness" element={<WellnessCheckin />} />
          <Route path="referral" element={<ReferralMode />} />
          <Route path="sync" element={<SyncData />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
