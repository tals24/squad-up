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

import AddGame from "./AddGame";

import Login from "./Login";

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
    
    AddGame: AddGame,
    
    Login: Login,
    
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
        <Routes>            
            {/* Public routes - no Layout wrapper */}
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            
            {/* Protected routes - wrapped in Layout */}
            <Route path="/Dashboard" element={<Layout currentPageName="Dashboard"><Dashboard /></Layout>} />
            <Route path="/Players" element={<Layout currentPageName="Players"><Players /></Layout>} />
            <Route path="/Player" element={<Layout currentPageName="Player"><Player /></Layout>} />
            <Route path="/SyncStatus" element={<Layout currentPageName="SyncStatus"><SyncStatus /></Layout>} />
            <Route path="/Analytics" element={<Layout currentPageName="Analytics"><Analytics /></Layout>} />
            <Route path="/AddPlayer" element={<Layout currentPageName="AddPlayer"><AddPlayer /></Layout>} />
            <Route path="/AddTeam" element={<Layout currentPageName="AddTeam"><AddTeam /></Layout>} />
            <Route path="/AddReport" element={<Layout currentPageName="AddReport"><AddReport /></Layout>} />
            <Route path="/AddUser" element={<Layout currentPageName="AddUser"><AddUser /></Layout>} />
            <Route path="/AddGame" element={<Layout currentPageName="AddGame"><AddGame /></Layout>} />
            <Route path="/GamesSchedule" element={<Layout currentPageName="GamesSchedule"><GamesSchedule /></Layout>} />
            <Route path="/GameDetails" element={<Layout currentPageName="GameDetails"><GameDetails /></Layout>} />
            <Route path="/AccessDenied" element={<Layout currentPageName="AccessDenied"><AccessDenied /></Layout>} />
            <Route path="/DrillLibrary" element={<Layout currentPageName="DrillLibrary"><DrillLibrary /></Layout>} />
            <Route path="/TacticBoard" element={<Layout currentPageName="TacticBoard"><TacticBoard /></Layout>} />
            <Route path="/TrainingPlanner" element={<Layout currentPageName="TrainingPlanner"><TrainingPlanner /></Layout>} />
            <Route path="/DrillLab" element={<Layout currentPageName="DrillLab"><DrillLab /></Layout>} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}