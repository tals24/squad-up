import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Players from "./Players";

import Player from "./Player";

import SyncStatus from "./SyncStatus";

import Analytics from "./Analytics";

import AddPlayer from "./AddPlayer";

import AddTeam from "./AddTeam";

import AddReport from "./AddReport";

import AddUser from "./AddUser";

import GamesSchedule from "./GamesSchedule";

import GameDetails from "./GameDetails";

import AccessDenied from "./AccessDenied";

import DrillLibrary from "./DrillLibrary";

import TacticBoard from "./TacticBoard";

import TrainingPlanner from "./TrainingPlanner";

import DrillLab from "./DrillLab";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Players: Players,
    
    Player: Player,
    
    SyncStatus: SyncStatus,
    
    Analytics: Analytics,
    
    AddPlayer: AddPlayer,
    
    AddTeam: AddTeam,
    
    AddReport: AddReport,
    
    AddUser: AddUser,
    
    GamesSchedule: GamesSchedule,
    
    GameDetails: GameDetails,
    
    AccessDenied: AccessDenied,
    
    DrillLibrary: DrillLibrary,
    
    TacticBoard: TacticBoard,
    
    TrainingPlanner: TrainingPlanner,
    
    DrillLab: DrillLab,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Players" element={<Players />} />
                
                <Route path="/Player" element={<Player />} />
                
                <Route path="/SyncStatus" element={<SyncStatus />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/AddPlayer" element={<AddPlayer />} />
                
                <Route path="/AddTeam" element={<AddTeam />} />
                
                <Route path="/AddReport" element={<AddReport />} />
                
                <Route path="/AddUser" element={<AddUser />} />
                
                <Route path="/GamesSchedule" element={<GamesSchedule />} />
                
                <Route path="/GameDetails" element={<GameDetails />} />
                
                <Route path="/AccessDenied" element={<AccessDenied />} />
                
                <Route path="/DrillLibrary" element={<DrillLibrary />} />
                
                <Route path="/TacticBoard" element={<TacticBoard />} />
                
                <Route path="/TrainingPlanner" element={<TrainingPlanner />} />
                
                <Route path="/DrillLab" element={<DrillLab />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}